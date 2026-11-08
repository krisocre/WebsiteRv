// End-to-end payload checks with a legacy-compatible mocked receiver. No live mail.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const {fixture,isApi,completePuppeteer}=require('./turnstile-fixture.cjs');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':({'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});res.end(data);});
});
(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const sample of [
  {query:'?gclid=LOCAL_CLICK',source:'paid_google',label:'Paid - Google Ads'},
  {query:'',referer:'https://www.google.ca/',source:'organic_google',label:'Organic - Google'},
  {query:'?gclid=LOCAL_CLICK',consent:{analyticsConsent:false,advertisingConsent:false},source:'unknown',label:'Direct / unknown'}
 ]){
  const context=await browser.createBrowserContext(),page=await context.newPage(),posts=[],errors=[];
  // Local HTTP pages otherwise lose an HTTPS search referrer on downgrade.
  await page.evaluateOnNewDocument(referrer=>{Object.defineProperty(document,'referrer',{get:()=>referrer});},sample.referer||'');
  page.on('pageerror',error=>errors.push(error.message));await page.setRequestInterception(true);
  page.on('request',r=>{
   if(isApi(r.url()))return r.respond({status:200,contentType:'text/javascript',body:fixture});
   if(r.url().startsWith('https://script.google.com/')&&r.method()==='POST'){
    posts.push(new URLSearchParams(r.postData()));return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"result":"success"}'});
   }
   if(r.url().startsWith(base)&&r.method()==='GET')return r.continue();return r.abort();
  });
  await page.goto(base+'/'+sample.query,{waitUntil:'load',referer:sample.referer});
  if(sample.consent)await page.evaluate(consent=>{window.ReviewsBoostMeasurement={status:()=>consent,confirmedLead:()=>{}};},sample.consent);
  await page.evaluate(()=>{
   const form=document.getElementById('removalForm');
   for(const [name,value]of Object.entries({full_name:'Local Test',business_name:'Example Shop',email_address:'local@example.invalid',business_url:'Find our shop on King Street',reason:'Keep this customer context'}))form.elements[name].value=value;
   form.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.focus('[name=full_name]');await completePuppeteer(page);
  await page.$eval('#removalForm',form=>form.requestSubmit());await page.waitForSelector('#removalSuccess:not([hidden])');
  assert.equal(posts.length,1);const payload=posts[0];assert.equal(payload.get('traffic_source'),sample.source);
  const legacyOwnerEmail='Reason: '+payload.get('reason');
  assert.ok(legacyOwnerEmail.includes('[Traffic Source: '+sample.label+']'));
  assert.ok(legacyOwnerEmail.includes('Keep this customer context'));
  assert.equal((payload.get('reason').match(/\[Traffic Source:/g)||[]).length,1);
  assert.ok(!payload.toString().includes('LOCAL_CLICK'),'Click identifier must not enter the lead record');
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS: paid Google, organic Google and consent-denied form submissions expose fixed source labels in legacy Reason/email; one POST, customer context preserved, no click ID forwarded. All submissions mocked.');
}finally{if(browser)await browser.close();server.closeAllConnections();server.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
