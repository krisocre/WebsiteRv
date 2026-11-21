// Provider scripts and submissions are intercepted: no real leads or Google collection.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),puppeteer=require('puppeteer');
const {fixture,isApi,completePuppeteer}=require('./turnstile-fixture.cjs');
const root=path.resolve(__dirname,'..'),installer=require('../install-measurement.cjs');
const pages=fs.readdirSync(root).filter(file=>file.endsWith('.html'));
for(const file of pages){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 for(const asset of ['measurement-config.js','lead-source.js','measurement.js','measurement.css'])assert.equal((html.match(new RegExp('(?:src|href)="[^"\\s]*'+asset.replace('.','\\.')+'(?:\\?v=[A-Za-z0-9-]+)?"','g'))||[]).length,1,file+': one '+asset);
 assert.ok(/<head>\s*<!-- ReviewsBoost measurement start -->/.test(html),file+': bootstrap first in head');
 assert.ok(/measurement-config\.js\?v=20261121-lead-funnel/.test(html)&&/measurement\.js\?v=20261121-lead-funnel/.test(html)&&/measurement\.css\?v=20261112-cookie-banner/.test(html),file+': versioned scripts');
 assert.ok(!/googletagmanager\.com\/(?:gtm\.js|gtag\/js|ns\.html)/.test(html),file+': no consent bypass');
 assert.ok(!html.includes('www.clarity.ms/tag/'),file+': no replay consent bypass');
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
 const productionOrigin = 'https://reviewsboost.ca/';
 const clarityTag = 'https://www.clarity.ms/tag/zh8w7u4689';
 const clarityFixture = `
 (() => {
  window.__clarityCalls = [];
  const queued = Array.from(window.clarity.q || []);
  let metadataCallback;
  window.clarity = (command, ...args) => {
    __clarityCalls.push([command, ...args]);
    if (command === 'metadata') { metadataCallback = args[0]; metadataCallback(); }
  };
  queued.forEach(args => window.clarity(...args));
 })();
 `;
 async function open({query='',gpc=false,production=false,legacyChoice=false,waitForReplay=false,file=''}={}){
  const context=await browser.createBrowserContext(),page=await context.newPage(),loads=[],replayLoads=[];
  const origin=production?productionOrigin:base;
  let releaseReplay;
  await page.setViewport({width:390,height:844});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.setRequestInterception(true);page.on('pageerror',e=>errors.push(e.message));page.on('request',request=>{
   if(isApi(request.url()))return request.respond({status:200,contentType:'text/javascript',body:fixture});
   if(request.url().startsWith('https://www.googletagmanager.com/')){loads.push(request.url());return request.respond({status:200,contentType:'text/javascript',body:'/* mocked Google library */'});}
   if(request.url()===clarityTag){
    replayLoads.push(request.url());
    const deliver=()=>request.respond({status:200,contentType:'text/javascript',body:clarityFixture});
    if(waitForReplay){releaseReplay=deliver;return;}
    return deliver();
   }
   if(production&&request.url().startsWith(productionOrigin)&&request.method()==='GET'){
    const pathname=new URL(request.url()).pathname;
    const local=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(local.startsWith(root+path.sep)&&fs.existsSync(local)&&fs.statSync(local).isFile()){
     const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'};
     return request.respond({status:200,contentType:mime[path.extname(local)]||'application/octet-stream',body:fs.readFileSync(local)});
    }
   }
   if(request.url().startsWith(base)&&request.method()==='GET')return request.continue();request.abort();
  });
  if(gpc)await page.evaluateOnNewDocument(()=>Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true}));
  if(legacyChoice)await page.evaluateOnNewDocument(()=>{
   if(!localStorage.getItem('reviewsboost.measurement.v1'))localStorage.setItem('reviewsboost.measurement.v1',JSON.stringify({version:1,analytics:true,advertising:true,expires:Date.now()+3600000}));
  });
  await page.goto(origin+file+query,{waitUntil:'load'});await page.waitForFunction(()=>!!window.ReviewsBoostMeasurement);
  return {context,page,loads,replayLoads,finishReplay:()=>releaseReplay()};
 }
 const layer=page=>page.evaluate(()=>dataLayer.map(entry=>entry.event?entry:Array.from(entry)));
 const status=page=>page.evaluate(()=>ReviewsBoostMeasurement.status());
 const choose=async(page,choice)=>{
  if(await page.$eval('#measurement-preferences',panel=>panel.hidden)){
   await page.$eval('.measurement-settings',button=>button.scrollIntoView({block:'center',behavior:'instant'}));
   await page.click('.measurement-settings');
   await page.waitForSelector('#measurement-preferences:not([hidden])',{timeout:3000});
  }
  await page.click('#measurement-preferences [data-choice="'+choice+'"]');
 };
 async function lead(page,outcome='success'){
  await page.evaluate(()=>{const form=document.getElementById('removalForm');for(const [name,value]of Object.entries({full_name:'PRIVATE_PERSON',business_name:'PRIVATE_BUSINESS',email_address:'private.person@example.invalid',business_url:'PRIVATE_PROFILE',reason:'PRIVATE_REVIEW_TEXT'}))form.elements[name].value=value;form.dispatchEvent(new Event('input',{bubbles:true}));});
  await completePuppeteer(page);
  await page.evaluate(outcome=>{
   window.fetch=async(url,options)=>{window.__requestId=options.body.get('request_id');window.__leadSource=options.body.get('traffic_source');return {ok:true,json:async()=>outcome==='success'?{result:'success',notification_sent:true}:{result:'error',error:'storage unavailable'}};};
   document.getElementById('removalForm').requestSubmit();
  },outcome);
  await page.waitForSelector(outcome==='success'?'#removalSuccess:not([hidden])':'#formStatus.error');
 }
 let t=await open();assert.equal(t.loads.length,0);await choose(t.page,'reject');await lead(t.page);
 assert.equal(t.loads.length,0);assert.equal((await layer(t.page)).filter(e=>e.event==='reviewsboost_generate_lead').length,0);await t.context.close();
 for(const purpose of ['analytics','advertising']){
  t=await open();await choose(t.page,'customize');await t.page.click('[data-purpose="'+purpose+'"]');await choose(t.page,'save');
  await t.page.waitForSelector(purpose==='analytics'?'#reviewsboost-tag-manager':'#reviewsboost-google-tag');
  assert.equal(t.loads.length,1,purpose+'-only consent');
  assert.ok(t.loads[0].includes(purpose==='analytics'?'/gtm.js?id=GTM-WDPZNW9T':'/gtag/js?id=AW-18568327970'));
  await lead(t.page);let data=await layer(t.page);
  assert.equal(data.filter(e=>e.event==='reviewsboost_generate_lead').length,purpose==='analytics'?1:0);
  const conversions=data.filter(e=>e[0]==='event'&&e[1]==='conversion');
  assert.equal(conversions.length,purpose==='advertising'?1:0,'Ads consent required for the supplied lead label');
  if(purpose==='advertising'){
   assert.equal(conversions[0][2].send_to,'AW-18568327970/XARtCKC2grYdEKLmiJZF');
   assert.equal(conversions[0][2].value,1);assert.equal(conversions[0][2].currency,'CAD');assert.ok(conversions[0][2].transaction_id);
   assert.equal(conversions[0][2].user_data,'');assert.ok(!/PRIVATE_|private\.person|RB-/.test(JSON.stringify(conversions)));
  }
  if(purpose==='analytics'){
   const event=data.find(e=>e.event==='reviewsboost_generate_lead');assert.equal(event.user_data,'');
   assert.ok(!/PRIVATE_|private\.person|RB-/.test(JSON.stringify(event)));
   await t.page.reload({waitUntil:'load'});await t.page.waitForSelector('#reviewsboost-tag-manager');assert.equal(t.loads.length,2,'One container per reload with restored consent');
  }
  await t.context.close();
 }
 t=await open();await choose(t.page,'accept');await t.page.waitForSelector('#reviewsboost-tag-manager');
 assert.equal(await t.page.$eval('#reviewsboost-tag-manager',script=>script===document.head.firstChild),true,'Container script is first in head after consent');
 assert.deepEqual(t.loads,['https://www.googletagmanager.com/gtm.js?id=GTM-WDPZNW9T'],'Use the published container for its linked destinations');
 assert.ok(!(await layer(t.page)).some(e=>e[0]==='config'&&/^G-|^AW-/.test(e[1])),'Container-owned destinations must not be configured a second time');
 assert.equal(await t.page.$('#reviewsboost-google-tag'),null,'No redundant standalone Ads loader when both purposes use the container');
 assert.equal(await t.page.evaluate(()=>window['ga-disable-G-HBMLS9LBV0']),false,'Verified Analytics destination is enabled after consent');
 const unconfirmed=await t.page.evaluate(()=>({helper:typeof window.gtag_report_conversion,before:location.href,result:window.gtag_report_conversion('#assessment'),after:location.href}));
 assert.equal(unconfirmed.helper,'function','Google event helper is available');
 assert.equal(unconfirmed.result,false);assert.equal(unconfirmed.before,unconfirmed.after,'Raw helper calls cannot navigate or fabricate a saved lead');
 assert.equal((await layer(t.page)).filter(e=>e[0]==='event'&&e[1]==='conversion').length,0,'No conversion without confirmed submission');
 await lead(t.page,'error');assert.equal((await layer(t.page)).filter(e=>e.event==='reviewsboost_generate_lead').length,0);
 assert.equal((await layer(t.page)).filter(e=>e[0]==='event'&&e[1]==='conversion').length,0,'Failed form is not a conversion');
 await lead(t.page);let data=await layer(t.page);assert.equal(data.filter(e=>e.event==='reviewsboost_generate_lead').length,1);
 const reference=await t.page.evaluate(()=>__requestId);
 await t.page.evaluate(reference=>ReviewsBoostMeasurement.confirmedLead(document.getElementById('removalForm'),reference),reference);
 assert.equal((await layer(t.page)).filter(e=>e.event==='reviewsboost_generate_lead').length,1);
 assert.equal((await layer(t.page)).filter(e=>e[0]==='event'&&e[1]==='conversion').length,1,'One conversion per confirmed request');
 assert.equal(await t.page.evaluate(()=>{const entry=dataLayer.find(item=>item[0]==='event'&&item[1]==='conversion');return typeof entry[2].event_callback;}),'function','Supplied event callback is present');
 assert.equal(await t.page.evaluate(()=>{const before=location.href;dataLayer.find(item=>item[0]==='event'&&item[1]==='conversion')[2].event_callback();return location.href===before;}),true,'Inline form confirmation does not navigate');
 await t.page.evaluate(()=>window.gtag_report_conversion());
 assert.equal((await layer(t.page)).filter(e=>e[0]==='event'&&e[1]==='conversion').length,1,'Helper cannot replay an already confirmed request');
 assert.equal(data.filter(e=>e.event==='gtm.js').length,1);assert.equal(data.filter(e=>e[0]==='js').length,1);
 const setIndex=data.findIndex(e=>e[0]==='set'&&e[1]==='user_data'&&e[2]==='');
 assert.ok(setIndex>=0&&setIndex<data.findIndex(e=>e.event==='gtm.js'),'Empty user_data precedes container startup');
 await t.page.click('.measurement-settings');await choose(t.page,'customize');
 await t.page.click('[data-purpose="analytics"]');await choose(t.page,'save');
 assert.equal((await status(t.page)).analyticsConsent,false);
 assert.equal((await status(t.page)).advertisingConsent,true);
 await t.page.waitForSelector('#reviewsboost-google-tag');
 assert.equal(t.loads.filter(url=>url.includes('/gtag/js?id=AW-18568327970')).length,1,'Advertising continues through the fallback after analytics withdrawal');
 assert.equal(await t.page.evaluate(()=>window['ga-disable-G-HBMLS9LBV0']),true);
 await t.page.click('.measurement-settings');await choose(t.page,'accept');
 assert.equal(t.loads.filter(url=>url.includes('/gtm.js')).length,1,'Restoring analytics must not add a second container');
 await t.page.click('.measurement-settings');await choose(t.page,'reject');
 await t.page.evaluate(()=>ReviewsBoostMeasurement.confirmedLead(document.getElementById('removalForm'),'RB-ANOTHER_TEST'));
 assert.equal((await layer(t.page)).filter(e=>e.event==='reviewsboost_generate_lead').length,1,'No lead event after withdrawal');
 assert.equal((await layer(t.page)).filter(e=>e[0]==='event'&&e[1]==='conversion').length,1,'No conversion after withdrawal');
 assert.equal((await status(t.page)).advertisingConsent,false);
 assert.equal((await status(t.page)).analyticsConsent,false,'Analytics consent is withdrawn');
 assert.equal(await t.page.evaluate(()=>window['ga-disable-G-HBMLS9LBV0']),true,'Withdrawing analytics disables the verified destination');
 await t.context.close();
 t=await open({gpc:true});await choose(t.page,'accept');await t.page.waitForSelector('#reviewsboost-tag-manager');assert.equal(t.loads.length,1);assert.ok(t.loads[0].includes('GTM-WDPZNW9T'));assert.equal((await status(t.page)).advertisingConsent,false);await t.context.close();
 for(const query of ['?_dbg=1','?gtm_debug=1770000000000','?utm_source=google&utm_medium=cpc&utm_campaign=123&gclid=LOCAL_TEST']){
  t=await open({query});await choose(t.page,'accept');await t.page.waitForSelector('#reviewsboost-tag-manager');assert.equal(t.loads.length,1);await t.context.close();
 }
 for(const query of ['?email=PRIVATE_EMAIL','?_dbg=PRIVATE_VALUE','?gtm_debug=PRIVATE_VALUE','?utm_source=google&utm_medium=cpc&utm_campaign=PRIVATE_NAME','?utm_source=google&utm_source=google&utm_medium=cpc']){
  t=await open({query});await choose(t.page,'accept');assert.equal(t.loads.length,0);assert.equal((await status(t.page)).urlEligible,false);await t.context.close();
 }
 // Same-tab consented carryover through the checker into a mocked assessment.
 t=await open({production:true,query:'?utm_source=google&utm_medium=cpc&gclid=LOCAL_TEST'});
 assert.equal(await t.page.evaluate(()=>sessionStorage.getItem('reviewsboost.lead-source.v1')),null);
 await choose(t.page,'accept');
 const storedSource=await t.page.evaluate(()=>JSON.parse(sessionStorage.getItem('reviewsboost.lead-source.v1')));
 assert.deepEqual(Object.keys(storedSource).sort(),['expires','source']);
 assert.equal(storedSource.source,'paid_google');
 for(const destination of ['/google-review-removal-checker.html','/']){
  await Promise.all([
   t.page.waitForNavigation({waitUntil:'load'}),
   t.page.evaluate(pathname=>location.assign(pathname),destination)
  ]);
  assert.equal(await t.page.evaluate(()=>ReviewsBoostLeadSource.details().source),'paid_google');
 }
 await lead(t.page);
 assert.equal(await t.page.evaluate(()=>__leadSource),'paid_google');
 await choose(t.page,'reject');
 assert.equal(await t.page.evaluate(()=>sessionStorage.getItem('reviewsboost.lead-source.v1')),null);
 assert.equal(await t.page.evaluate(()=>ReviewsBoostLeadSource.details().source),'unknown');
 await t.context.close();

 // The production origin is served from local files by interception, including the recorder stub.
 t=await open({production:true,query:'?gad_source=1&gclid=LOCAL_TEST'});
 assert.equal(await t.page.$eval('#measurement-preferences',panel=>panel.hidden),true);
 assert.equal(t.replayLoads.length,0,'A first visit does not load replay');
 await choose(t.page,'customize');
 await t.page.click('[data-purpose="replay"]');
 await choose(t.page,'save');
 await t.page.waitForFunction(()=>window.__clarityCalls?.some(call=>call[0]==='consentv2'));
 assert.deepEqual(t.replayLoads,[clarityTag]);
 assert.deepEqual(t.loads,[],'Session replay only must not load any Google tag');
 assert.deepEqual(await t.page.evaluate(()=>__clarityCalls.find(call=>call[0]==='consentv2')),
  ['consentv2',{analytics_Storage:'granted',ad_Storage:'denied'}]);
 assert.equal(await t.page.$eval('#removalForm',form=>form.getAttribute('data-clarity-mask')),'true');
 assert.equal(await t.page.$eval('#removalSuccess',panel=>panel.getAttribute('data-clarity-mask')),'true');
 await t.page.reload({waitUntil:'load'});
 await t.page.waitForFunction(()=>window.__clarityCalls?.some(call=>call[0]==='consentv2'));
 assert.equal(t.replayLoads.length,2,'Replay consent persists on the next page view');
 await t.page.evaluate(()=>{document.cookie='_clck=fixture; path=/';sessionStorage.setItem('_cltk','fixture');});
 await choose(t.page,'reject');
 assert.equal((await status(t.page)).sessionReplayConsent,false);
 assert.equal(await t.page.evaluate(()=>__clarityCalls.some(call=>call[0]==='stop')&&!document.cookie.includes('_clck=')&&sessionStorage.getItem('_cltk')===null),true);
 assert.equal(await t.page.$('#reviewsboost-clarity-tag'),null,'The stopped tag is removed');
 await t.page.evaluate(()=>{window.__clarityCalls=[];});
 await choose(t.page,'accept');
 await t.page.waitForFunction(()=>window.__clarityCalls?.some(call=>call[0]==='consentv2'));
 assert.equal(t.replayLoads.length,3,'Fresh permission opens a new replay session');
 assert.equal(await t.page.$$eval('#reviewsboost-clarity-tag',scripts=>scripts.length),1,'One active Clarity tag after opt-in');
 await t.context.close();

 t=await open({production:true,legacyChoice:true});
 assert.equal((await status(t.page)).sessionReplayConsent,false,'Existing Google choice is not replay consent');
 assert.equal(t.replayLoads.length,0);
 await t.context.close();

 for(const options of [{gpc:true},{query:'?email=PRIVATE_EMAIL'},{file:'404.html'}]){
  t=await open({production:true,...options});
  await choose(t.page,'accept');
  assert.equal(t.replayLoads.length,0,'No replay on restricted visits');
  await t.context.close();
 }
 t=await open({production:true,waitForReplay:true});
 await choose(t.page,'accept');
 await t.page.waitForSelector('#reviewsboost-clarity-tag');
 await choose(t.page,'reject');
 await t.finishReplay();
 await t.page.waitForFunction(()=>window.__clarityCalls?.some(call=>call[0]==='stop'));
 assert.equal(await t.page.evaluate(()=>__clarityCalls.some(call=>call[0]==='consentv2')),false,'No consent grant after pending download is revoked');
 await t.context.close();

 assert.deepEqual(errors,[]);console.log('PASS: '+pages.length+' page bootstraps, only GTM-WDPZNW9T for the verified Analytics destination, no redundant linked Ads base loader, advertising-only fallback, reject/restore/withdrawal/GPC, safe debug URLs, masked opt-in Clarity replay and withdrawal, unchanged supplied lead conversion once after confirmed success and no form data. No real provider collection or leads.');
}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}})().catch(error=>{console.error(error);process.exitCode=1;});
