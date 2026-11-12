const {fixture:turnstileFixture,isApi,completePuppeteer}=require('./turnstile-fixture.cjs');
// Synthetic IDs are isolated test fixtures. Google and form requests never reach providers.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),puppeteer=require('puppeteer'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const fixtures={ga4MeasurementId:'G-FIXTURE123',googleAdsId:'AW-000000001',googleAdsLeadConversionLabel:'TEST_ONLY'};
const server=http.createServer((req,res)=>{if(req.method!=='GET'){res.writeHead(405).end();return;}const file=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://localhost').pathname)));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':({'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});res.end(bytes);});});
// Test both installer branches without modifying production configuration or HTML.
if(!require('../install-measurement.cjs').enabled)assert.equal(require('../install-measurement.cjs').applyToHtml('<head></head>','index.html'),'<head></head>');
const moduleFixture={exports:{}},scopedRequire=name=>name==='node:fs'?{...fs,readFileSync:(file,...args)=>String(file).endsWith('measurement-config.js')?'window.ReviewsBoostMeasurementConfig='+JSON.stringify(fixtures):fs.readFileSync(file,...args)}:require(name);
vm.runInNewContext(fs.readFileSync(path.join(root,'install-measurement.cjs'),'utf8'),{require:scopedRequire,module:moduleFixture,__dirname:root,console});
const install=moduleFixture.exports.applyToHtml,html=fs.readFileSync(path.join(root,'index.html'),'utf8'),tagged=install(html,'index.html');
const digest=value=>require('node:crypto').createHash('sha256').update(value).digest('hex');
assert.equal(digest(install(tagged,'index.html')),digest(tagged),'Measurement installer must be repeatable across Windows line endings');assert.throws(()=>install(html.replace('</head>','<script src="https://www.googletagmanager.com/gtag/js?id=G-EXISTING"></script></head>'),'index.html'),/refusing duplication/);
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';let browser;const google=[],posts=[],errors=[];
 try{
  browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  async function open({config=fixtures,query='',gpc=false,blockedStorage=false,language='en-CA'}={}){
   const context=await browser.createBrowserContext(),page=await context.newPage();await page.setViewport({width:390,height:844});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await page.setRequestInterception(true);page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(isApi(r.url())){r.respond({status:200,contentType:'text/javascript',body:turnstileFixture});return;}
    if(r.method()!=='GET'){posts.push(r.url());r.abort();return;}
    if(r.url().includes('googletagmanager.com/gtag/js')){google.push(r.url());r.respond({status:200,contentType:'text/javascript',body:'/* test loader: no collection */'});return;}
    if(r.resourceType()==='document'&&r.url().startsWith(base)){r.respond({status:200,contentType:'text/html;charset=utf-8',body:tagged});return;}
    if(new URL(r.url()).pathname==='/measurement-config.js'){r.respond({status:200,contentType:'text/javascript',body:'window.ReviewsBoostMeasurementConfig='+JSON.stringify(config)+';'});return;}
    if(r.url().startsWith(base)||r.url().startsWith('data:'))r.continue();else r.abort();
   });
   await page.evaluateOnNewDocument((gpc,blockedStorage,language)=>{
    Object.defineProperty(navigator,'language',{get:()=>language});if(gpc)Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true});if(blockedStorage)Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}});
   },gpc,blockedStorage,language);
   await page.goto(base+query,{waitUntil:'load'});await page.waitForFunction(()=>!!window.ReviewsBoostMeasurement);return {context,page};
  }
  const commands=p=>p.evaluate(()=>Array.from(window.dataLayer||[],x=>Array.from(x)));
  async function events(p){return (await commands(p)).filter(x=>x[0]==='event');}
  async function choose(p,choice){await p.click('#measurement-preferences [data-choice="'+choice+'"]');}
  async function submit(p,outcome='success'){
   if(await p.$('#removalForm[data-inline-enquiry]')){
    await p.$eval('[name=business_url]',e=>{e.value='https://example.ca/PRIVATE_PROFILE';});
    await p.type('[name=business_url]','x');await p.select('[name=concern_category]','Unsure — please assess');
   }else if(!await p.$('#orderModal.open'))await p.click('.calculator .open-order');
   if(await p.$eval('.enquiry-actions [type=submit]',e=>e.hidden)){
    await p.$eval('[name=business_url]',e=>{e.value='https://example.ca/PRIVATE_PROFILE';});await p.type('[name=business_url]','x');await p.select('[name=concern_category]','Unsure — please assess');
    await p.click('.enquiry-actions button:not(.enquiry-back):not([type=submit])');
   }
   await completePuppeteer(p);
   await p.evaluate(outcome=>{
    const f=document.getElementById('removalForm');for(const [key,value]of Object.entries({full_name:'PRIVATE_PERSON',business_name:'PRIVATE_BUSINESS',email_address:'private.person@example.ca',review_links:'https://example.ca/PRIVATE_REVIEW',reason:'PRIVATE_REVIEW_TEXT'}))f.elements[key].value=value;
    window.fetch=async(endpoint,options)=>{window.__submittedRequestId=options.body.get('request_id');if(outcome==='network')throw Error('test network');return {ok:outcome!=='http',json:async()=>{if(outcome==='json')throw Error('not JSON');return outcome==='legacy'?{result:'error',error:'Failed to send email: no recipient'}:outcome==='error'?{result:'error',error:'storage unavailable'}:{result:'success',notification_sent:outcome!=='notification'};}};};f.requestSubmit();
   },outcome);
   if(['network','error','http','json'].includes(outcome))await p.waitForSelector('#formStatus.error');else await p.waitForSelector('#removalSuccess:not([hidden])');
  }
  let test=await open({config:{ga4MeasurementId:null,googleAdsId:null,googleAdsLeadConversionLabel:null}}),page=test.page;
  assert.equal(await page.$('#measurement-preferences'),null);assert.equal((await commands(page)).length,0);await submit(page);assert.equal((await events(page)).length,0);await test.context.close();
  test=await open();page=test.page;let start=google.length;assert.equal((await commands(page)).filter(x=>x[0]==='config').length,0);await choose(page,'reject');await submit(page);assert.equal(google.length,start);assert.equal((await events(page)).length,0);await test.context.close();
  test=await open();page=test.page;start=google.length;await choose(page,'accept');await page.waitForFunction(()=>document.getElementById('reviewsboost-google-tag'));
  assert.equal(google.length-start,1);assert.equal((await events(page)).filter(x=>x[1]==='page_view').length,1);
  await page.click('.hero-actions a[href="#review-count"]');assert.equal((await events(page)).filter(x=>x[1]==='quote_cta_click').length,1);assert.equal((await events(page)).find(x=>x[1]==='quote_cta_click')[2].cta_location,'hero');assert.equal(await page.$('#orderModal.open'),null);assert.equal((await events(page)).filter(x=>x[1]==='quote_form_start').length,0);
  await submit(page,'error');assert.equal((await events(page)).filter(x=>x[1]==='quote_form_start').length,1);assert.equal((await events(page)).filter(x=>x[1]==='generate_lead').length,0);
  await submit(page);let all=await events(page);assert.equal(all.filter(x=>x[1]==='generate_lead').length,1);assert.equal(all.filter(x=>x[1]==='conversion').length,1);
  const reference=await page.evaluate(()=>window.__submittedRequestId);
  assert.match(reference,/^RB-/);assert.equal(await page.$('#removalSuccess .enquiry-receipt'),null,'References stay out of the simple confirmation UI');
  await page.evaluate(key=>window.ReviewsBoostMeasurement.confirmedLead(document.getElementById('removalForm'),key),reference);assert.equal((await events(page)).filter(x=>x[1]==='generate_lead').length,1);
  assert.equal(all.find(x=>x[1]==='generate_lead')[2].send_to,fixtures.ga4MeasurementId);assert.equal(all.find(x=>x[1]==='conversion')[2].send_to,'AW-000000001/TEST_ONLY');assert.ok(!JSON.stringify(all).includes(reference));assert.ok(!/PRIVATE_|private\.person|example\.ca/.test(JSON.stringify(all)));
  await page.click('#removalSuccessClose');await submit(page);assert.equal((await events(page)).filter(x=>x[1]==='generate_lead').length,2,'A distinct enquiry on the same form is a new lead');await page.click('#removalSuccessClose');
  await page.evaluate(()=>{for(const [id,href]of [['test-mail','mailto:PRIVATE_EMAIL@example.ca?body=PRIVATE_BODY'],['test-phone','tel:+15551234567']]){const a=document.createElement('a');a.id=id;a.href=href;a.textContent=id;a.onclick=e=>e.preventDefault();document.body.appendChild(a);}});await page.click('#test-mail');await page.click('#test-phone');all=await events(page);assert.equal(all.filter(x=>x[1]==='email_click').length,1);assert.equal(all.filter(x=>x[1]==='phone_click').length,1);assert.ok(!/PRIVATE_|15551234567/.test(JSON.stringify(all)));
  await page.click('.measurement-settings');await choose(page,'reject');const count=(await events(page)).length;await page.click('.calculator .open-order');assert.equal((await events(page)).length,count);await page.keyboard.press('Escape');await page.reload({waitUntil:'load'});assert.equal((await events(page)).length,0);assert.equal(await page.$eval('#measurement-preferences',e=>e.hidden),true);await test.context.close();
  for(const outcome of ['network','http','json','legacy','notification']){test=await open();page=test.page;await choose(page,'accept');await submit(page,outcome);assert.equal((await events(page)).filter(x=>x[1]==='generate_lead').length,outcome==='notification'?1:0,outcome);await test.context.close();}
  for(const purpose of ['analytics','advertising']){test=await open();page=test.page;await choose(page,'customize');await page.click('[data-purpose="'+purpose+'"]');assert.equal(await page.$eval('[data-purpose="'+purpose+'"]',e=>e.checked),true,purpose+' checkbox must toggle');await choose(page,'save');assert.equal((await page.evaluate(()=>ReviewsBoostMeasurement.status()))[purpose+'Consent'],true,purpose+' choice must save');await submit(page);all=await events(page);assert.equal(all.filter(x=>x[1]==='generate_lead').length,purpose==='analytics'?1:0,purpose+' lead route');assert.equal(all.filter(x=>x[1]==='conversion').length,purpose==='advertising'?1:0,purpose+' Ads route');await test.context.close();}
  test=await open({gpc:true});page=test.page;await choose(page,'accept');assert.equal((await page.evaluate(()=>ReviewsBoostMeasurement.status())).advertisingConsent,false);assert.ok(!(await commands(page)).some(x=>x[0]==='config'&&x[1]===fixtures.googleAdsId));await test.context.close();
  test=await open({query:'?email=PRIVATE_EMAIL#PRIVATE_HASH'});page=test.page;start=google.length;await choose(page,'accept');await submit(page);assert.equal(google.length,start);assert.equal((await events(page)).length,0);assert.ok(page.url().includes('PRIVATE_EMAIL'));await test.context.close();
  test=await open({blockedStorage:true,language:'fr-CA'});page=test.page;assert.equal(await page.$eval('#measurement-preferences',e=>e.lang),'fr-CA');await page.click('.measurement-language');assert.equal(await page.$eval('#measurement-preferences',e=>e.lang),'en-CA');await choose(page,'reject');await submit(page);await test.context.close();
  assert.deepEqual(posts,[]);assert.deepEqual(errors,[]);console.log('PASS: unconfigured fixtures stay disabled; installer duplication guard; consent/withdrawal/GPC; safe CTA/start/contact events; explicit-success-only GA4/Ads leads; request deduplication and distinct new enquiries; legacy/error exclusion; no personal data; blocked storage and bilingual controls. No real Google collection or form POST.');
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
