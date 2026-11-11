// Provider scripts and submissions are intercepted: no real leads or Google collection.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const {fixture,isApi,completePuppeteer}=require('./turnstile-fixture.cjs');
const root=path.resolve(__dirname,'..'),installer=require('../install-measurement.cjs');
const pages=fs.readdirSync(root).filter(file=>file.endsWith('.html'));
for(const file of pages){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 for(const asset of ['measurement-config.js','measurement.js','measurement.css'])assert.equal((html.match(new RegExp('(?:src|href)="[^"\\s]*'+asset.replace('.','\\.')+'"','g'))||[]).length,1,file+': one '+asset);
 assert.ok(!/googletagmanager\.com\/(?:gtm\.js|gtag\/js|ns\.html)/.test(html),file+': no consent bypass');
 assert.equal(installer.applyToHtml(html,file),html,file+': repeatable installer');
}
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(req.method!=='GET'||!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',({'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const errors=[];
 async function open({query='',gpc=false}={}){
  const context=await browser.createBrowserContext(),page=await context.newPage(),loads=[];
  await page.setViewport({width:390,height:844});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.setRequestInterception(true);page.on('pageerror',e=>errors.push(e.message));page.on('request',request=>{
   if(isApi(request.url()))return request.respond({status:200,contentType:'text/javascript',body:fixture});
   if(request.url().startsWith('https://www.googletagmanager.com/')){loads.push(request.url());return request.respond({status:200,contentType:'text/javascript',body:'/* mocked Google library */'});}
   if(request.url().startsWith(base)&&request.method()==='GET')return request.continue();request.abort();
  });
  if(gpc)await page.evaluateOnNewDocument(()=>Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true}));
  await page.goto(base+query,{waitUntil:'load'});await page.waitForFunction(()=>!!window.ReviewsBoostMeasurement);
  return {context,page,loads};
 }
 const layer=page=>page.evaluate(()=>dataLayer.map(entry=>entry.event?entry:Array.from(entry)));
 const status=page=>page.evaluate(()=>ReviewsBoostMeasurement.status());
 const choose=(page,choice)=>page.click('#measurement-preferences [data-choice="'+choice+'"]');
 async function lead(page,outcome='success'){
  await page.evaluate(()=>{const form=document.getElementById('removalForm');for(const [name,value]of Object.entries({full_name:'PRIVATE_PERSON',business_name:'PRIVATE_BUSINESS',email_address:'private.person@example.invalid',business_url:'PRIVATE_PROFILE',reason:'PRIVATE_REVIEW_TEXT'}))form.elements[name].value=value;form.dispatchEvent(new Event('input',{bubbles:true}));});
  await completePuppeteer(page);
  await page.evaluate(outcome=>{
   window.fetch=async(url,options)=>{window.__requestId=options.body.get('request_id');return {ok:true,json:async()=>outcome==='success'?{result:'success',notification_sent:true}:{result:'error',error:'storage unavailable'}};};
   document.getElementById('removalForm').requestSubmit();
  },outcome);
  await page.waitForSelector(outcome==='success'?'#removalSuccess:not([hidden])':'#formStatus.error');
 }
 let t=await open();assert.equal(t.loads.length,0);await choose(t.page,'reject');await lead(t.page);
 assert.equal(t.loads.length,0);assert.equal((await layer(t.page)).filter(e=>e.event==='reviewsboost_generate_lead').length,0);await t.context.close();
 for(const purpose of ['analytics','advertising']){
  t=await open();await choose(t.page,'customize');await t.page.click('[data-purpose="'+purpose+'"]');await choose(t.page,'save');
  if(purpose==='advertising')await t.page.waitForSelector('#reviewsboost-tag-manager');
  assert.equal(t.loads.length,purpose==='advertising'?1:0,purpose+'-only consent');
  await lead(t.page);let data=await layer(t.page);
  assert.equal(data.filter(e=>e.event==='reviewsboost_generate_lead').length,purpose==='advertising'?1:0);
  assert.equal(data.filter(e=>e[0]==='event'&&e[1]==='conversion').length,0,'No invented native Ads label');
  if(purpose==='advertising'){
   const event=data.find(e=>e.event==='reviewsboost_generate_lead');assert.equal(event.user_data,'');
   assert.ok(!/PRIVATE_|private\.person|RB-/.test(JSON.stringify(event)));
   await t.page.reload({waitUntil:'load'});await t.page.waitForSelector('#reviewsboost-tag-manager');assert.equal(t.loads.length,2,'One loader per reload with restored consent');
  }
  await t.context.close();
 }
 t=await open();await choose(t.page,'accept');await t.page.waitForSelector('#reviewsboost-tag-manager');
 assert.deepEqual(t.loads,['https://www.googletagmanager.com/gtm.js?id=GTM-WQSPSM5Z']);
 await lead(t.page,'error');assert.equal((await layer(t.page)).filter(e=>e.event==='reviewsboost_generate_lead').length,0);
 await lead(t.page);let data=await layer(t.page);assert.equal(data.filter(e=>e.event==='reviewsboost_generate_lead').length,1);
 const reference=await t.page.evaluate(()=>__requestId);
 await t.page.evaluate(reference=>ReviewsBoostMeasurement.confirmedLead(document.getElementById('removalForm'),reference),reference);
 assert.equal((await layer(t.page)).filter(e=>e.event==='reviewsboost_generate_lead').length,1);
 assert.equal(data.filter(e=>e.event==='gtm.js').length,1);assert.equal(data.filter(e=>e[0]==='js').length,1);
 const setIndex=data.findIndex(e=>e[0]==='set'&&e[1]==='user_data'&&e[2]==='');
 assert.ok(setIndex>=0&&setIndex<data.findIndex(e=>e.event==='gtm.js'),'Empty user_data precedes container startup');
 await t.page.click('.measurement-settings');await choose(t.page,'reject');
 await t.page.evaluate(()=>ReviewsBoostMeasurement.confirmedLead(document.getElementById('removalForm'),'RB-ANOTHER_TEST'));
 assert.equal((await layer(t.page)).filter(e=>e.event==='reviewsboost_generate_lead').length,1,'No lead event after withdrawal');
 assert.equal((await status(t.page)).advertisingConsent,false);await t.context.close();
 t=await open({gpc:true});await choose(t.page,'accept');assert.equal(t.loads.length,0);assert.equal((await status(t.page)).advertisingConsent,false);await t.context.close();
 for(const query of ['?_dbg=1','?gtm_debug=1770000000000']){
  t=await open({query});await choose(t.page,'accept');await t.page.waitForSelector('#reviewsboost-tag-manager');assert.equal(t.loads.length,1);await t.context.close();
 }
 for(const query of ['?email=PRIVATE_EMAIL','?_dbg=PRIVATE_VALUE','?gtm_debug=PRIVATE_VALUE']){
  t=await open({query});await choose(t.page,'accept');assert.equal(t.loads.length,0);assert.equal((await status(t.page)).urlEligible,false);await t.context.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS: '+pages.length+' page bootstraps, existing GTM-WQSPSM5Z once after advertising consent, reject/restore/withdrawal/GPC, safe debug URLs, no direct destinations invented, confirmed-only deduplicated lead bridge, empty user_data and no form data. No real provider collection or leads.');
}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}})().catch(error=>{console.error(error);process.exitCode=1;});
