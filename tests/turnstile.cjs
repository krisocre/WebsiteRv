// Browser security regression tests: providers and submissions are intercepted.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const {fixture,isApi,completePuppeteer}=require('./turnstile-fixture.cjs');
const root=path.resolve(__dirname,'..');
const testedEndpoint='https://script.google.com/macros/s/AKfycbx9nM4hs4qVE6pzwMFsQcFE_pgJC0FRp0KqTbozzNuL5m-77RHj7kZtK1FSuQBhHqT5UA/exec';
const server=http.createServer((req,res)=>{
 if(req.method!=='GET'){res.writeHead(405).end();return;}
 const relative=new URL(req.url,'http://local').pathname;
 const file=path.resolve(root,'.'+(relative==='/'?'/index.html':decodeURIComponent(relative)));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.writeHead(200,{'Content-Type':({'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 async function open(file='index.html',failFirst=false){
  const context=await browser.createBrowserContext(),page=await context.newPage(),calls=[],posts=[],errors=[];
  let result={result:'error',code:'verification_failed'};
  await page.setViewport({width:320,height:850});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);
  page.on('request',r=>{
   if(isApi(r.url())){calls.push(r.url());if(failFirst&&calls.length===1)return r.abort();return r.respond({status:200,contentType:'text/javascript',body:fixture});}
   if(r.url().startsWith('https://script.google.com/')&&r.method()==='POST'){
    assert.equal(r.url(),testedEndpoint,'Only the tested ReviewsBoost backend may receive the token');
    posts.push(r.postData());return r.respond({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(result)});
   }
   if(r.url().startsWith(base)&&r.method()==='GET')return r.continue();r.abort();
  });
  await page.goto(base+'/'+file,{waitUntil:'networkidle0'});
  return {context,page,calls,posts,errors,result:value=>{result=value;}};
 }
 async function fill(page){
  await page.evaluate(()=>{
   const f=document.querySelector('.enquiry-form');
   for(const [key,value] of Object.entries({full_name:'Local Test',business_name:'Example Shop',email_address:'local@example.invalid',review_count:'1'}))if(f.elements[key])f.elements[key].value=value;
   const category=f.elements.concern_category;if(category)category.selectedIndex=1;
   f.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.focus('[name=full_name]');
 }
 const submit=page=>page.$eval('.enquiry-form',f=>f.requestSubmit());
 let t=await open('blog.html');assert.equal(t.calls.length,0);assert.deepEqual(t.errors,[]);await t.context.close();
 t=await open();let page=t.page;assert.equal(t.calls.length,0,'No first-screen challenge load');await fill(page);
 await page.waitForFunction(()=>window.__turnstileWidgets?.length);
 let options=await page.evaluate(()=>{const o=__turnstileWidgets.at(-1).options;return {key:o.sitekey,action:o.action,size:o.size,language:o.language};});
 assert.deepEqual(options,{key:'0x4AAAAAAFy2a5sutqdFxytB',action:'quote_request',size:'compact',language:'en'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await submit(page);assert.equal(t.posts.length,0,'Missing token never posts');
 await completePuppeteer(page);await page.evaluate(()=>__turnstileWidgets.at(-1).options['expired-callback']());await submit(page);assert.equal(t.posts.length,0,'Expired token never posts');
 await page.click('.enquiry-security-retry');await completePuppeteer(page);
 await page.evaluate(()=>__turnstileWidgets.at(-1).options['error-callback']());await submit(page);assert.equal(t.posts.length,0,'Provider error clears token');
 await page.click('.enquiry-security-retry');await completePuppeteer(page);await submit(page);
 await page.waitForFunction(()=>!document.querySelector('.enquiry-form').hasAttribute('aria-busy'));
 assert.equal(t.posts.length,1);assert.equal(await page.$eval('#removalSuccess',el=>el.hidden),true);
 assert.equal(await page.$eval('[name=full_name]',el=>el.value),'Local Test');
 assert.equal(await page.$eval('.enquiry-actions [type=submit]',el=>el.disabled),false);
 await submit(page);assert.equal(t.posts.length,1,'Definitive rejection needs a fresh token');
 t.result({result:'success'});await completePuppeteer(page);await submit(page);
 await page.waitForSelector('#removalSuccess:not([hidden])');assert.equal(t.posts.length,2);
 const first=new URLSearchParams(t.posts[0]),second=new URLSearchParams(t.posts[1]);
 assert.ok(first.get('cf-turnstile-response'));assert.notEqual(first.get('cf-turnstile-response'),second.get('cf-turnstile-response'));
 assert.equal(first.get('request_id'),second.get('request_id'),'Correctable rejection retains request reference');
 await page.click('#removalSuccess button');await fill(page);await completePuppeteer(page);
 await page.setViewport({width:1440,height:950});
 await page.waitForFunction(()=>__turnstileWidgets.at(-1).options.size==='flexible');
 await submit(page);assert.equal(t.posts.length,2,'Resize cannot reuse a removed widget token');
 assert.equal(t.calls.length,1,'One provider loader across reset/restart/resize');assert.deepEqual(t.errors,[]);await t.context.close();

 t=await open('index.html',true);page=t.page;await fill(page);
 await page.waitForSelector('.enquiry-security-retry:not([hidden])');assert.equal(t.posts.length,0);
 await page.click('.enquiry-security-retry');await completePuppeteer(page);assert.equal(t.calls.length,2,'Failed loader is retryable');
 // A recovery download must never contain a reusable challenge token.
 await page.evaluate(()=>{const original=URL.createObjectURL;URL.createObjectURL=b=>{window.__savedRequest=b;return original(b);};HTMLAnchorElement.prototype.click=function(){};window.fetch=async()=>{throw Error('LOCAL_NETWORK_FAILURE');};});
 await submit(page);await page.waitForSelector('.enquiry-receipt button');await page.click('.enquiry-receipt button');
 const saved=await page.evaluate(()=>__savedRequest.text());assert.ok(saved.includes('Local Test'));assert.ok(!saved.includes('cf-turnstile-response'));assert.ok(!saved.includes('LOCAL_TOKEN'));
 assert.equal(await page.$eval('.enquiry-actions [type=submit]',el=>el.disabled),true,'Unknown result retains duplicate-prevention lock');assert.deepEqual(t.errors,[]);await t.context.close();

 t=await open('suppression-avis-google.html');page=t.page;
 await page.evaluate(()=>{
  const f=document.querySelector('.enquiry-form');for(const [key,value]of Object.entries({full_name:'Local Test',business_name:'Example Shop',email_address:'local@example.invalid',review_count:'1'}))if(f.elements[key])f.elements[key].value=value;
  f.elements.concern_category.selectedIndex=1;f.requestSubmit();
 });
 await completePuppeteer(page);assert.equal(await page.evaluate(()=>__turnstileWidgets.at(-1).options.language),'fr');assert.equal(t.posts.length,0);assert.deepEqual(t.errors,[]);await t.context.close();
 console.log('PASS: lazy/no-form loading; exact existing key/action; narrow/resized layouts; missing/expired/error token gates; server rejection and fresh-token retry; one loader; restart; failed-loader recovery; private download token exclusion; ambiguous-send locking; French widget. No real provider, leads or emails.');
}finally{if(browser)await browser.close();server.closeAllConnections();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
