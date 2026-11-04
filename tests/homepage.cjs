const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),puppeteer=require('puppeteer'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),output=path.join(root,'.seo-private/inline-assessment-2026-11-03');fs.mkdirSync(output,{recursive:true});
const original=cp.execFileSync('git',['show','HEAD:index.html'],{cwd:root,encoding:'utf8'}),home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const fieldNames=s=>[...s.match(/<form\b[^>]*id="removalForm"[\s\S]*?<\/form>/)[0].matchAll(/\bname="([^"]+)"/g)].map(m=>m[1]).sort();assert.deepEqual(fieldNames(home),fieldNames(original));
// Site-wide metadata is covered by seo-audit.mjs. Homepage checks must not freeze
// the learning centre or fail when a legitimate new research page is published.
assert.deepEqual(home.match(/<link rel="canonical"[^>]*>/g),original.match(/<link rel="canonical"[^>]*>/g),'Homepage canonical preserved');
const server=http.createServer((req,res)=>{
 if(req.method!=='GET'){res.writeHead(405).end();return;}
 const file=path.resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://localhost').pathname)));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':({'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream'});res.end(bytes);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';let browser;
 try{
  browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const page=await browser.newPage(),errors=[],posts=[];
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.setRequestInterception(true);page.on('request',r=>{if(r.method()!=='GET'){posts.push(r.url());r.abort();}else if(r.url().startsWith(base)||r.url().startsWith('data:'))r.continue();else r.abort();});page.on('pageerror',e=>errors.push(e.message));
  const layouts=[];
  for(const width of [1440,1024,768,390,320]){
   await page.setViewport({width,height:width<700?844:900});await page.goto(base,{waitUntil:'networkidle0'});
   const layout=await page.evaluate(()=>{const r=document.querySelector('.hero-actions a[href="#review-count"]').getBoundingClientRect();return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,ctaTop:r.top,ctaBottom:r.bottom,viewport:innerHeight,height:document.documentElement.scrollHeight};});
   assert.equal(layout.overflow,false);assert.ok(layout.ctaTop>0&&layout.ctaBottom<layout.viewport);layouts.push(layout);
   assert.equal(await page.$$eval('h1',e=>e.length),1);assert.equal(await page.$$eval('title',e=>e.length),1);assert.equal(await page.$$eval('link[rel=canonical]',e=>e.length),1);
   assert.equal(await page.$$eval('.steps-grid>article',e=>e.length),3);assert.equal(await page.$eval('.hero-actions a[href="#review-count"]',e=>e.getBoundingClientRect().height>=44),true);
   assert.ok(await page.$eval('.hero-points',e=>e.textContent.includes('No account password needed')));
   assert.equal(await page.evaluate(()=>!!document.querySelector('script[src="measurement.js"]')),require('../install-measurement.cjs').enabled,'Measurement bootstrap matches real configuration');
   assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
   assert.deepEqual(await page.$$eval('main>section',e=>e.slice(0,4).map(n=>n.id||n.classList[0])),['hero','trust-strip','pricing','assessment'],'Pricing then the form follows the existing hero');
   assert.equal(await page.$$eval('[role="dialog"],.modal-overlay',e=>e.length),0,'Homepage form is part of the page');
   if([1440,390].includes(width)){
    await page.evaluate(()=>document.activeElement?.blur());
    await page.screenshot({path:path.join(output,'hero-'+width+'.png')});
    const cleanPreview=await page.addStyleTag({content:'.navbar,.mobile-cta,.skip-link{visibility:hidden!important}'});
    await (await page.$('#pricing')).screenshot({path:path.join(output,'pricing-'+width+'.png')});
    await (await page.$('#assessment')).screenshot({path:path.join(output,'assessment-'+width+'.png')});
    await cleanPreview.evaluate(element=>element.remove());
   }
   await page.click('.hero-actions a[href="#review-count"]');await page.waitForFunction(()=>{const r=document.querySelector('#review-count').getBoundingClientRect();return r.top>=50&&r.top<innerHeight;});
   await page.click('.calculator .open-order');await page.waitForFunction(()=>{const r=document.querySelector('#assessment').getBoundingClientRect();return r.top>=50&&r.top<innerHeight;});
   assert.equal(await page.evaluate(()=>document.activeElement.id),'assessment-title','The in-page CTA focuses the assessment heading at '+width+'px');
   for(const id of ['businessUrl','formReviewQuantity','enquiryCategory','fullName','businessName','email'])assert.equal(await page.$eval('#'+id,e=>e.getClientRects().length>0),true,id+' is visible without an extra step');
   await page.focus('#businessUrl');await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');assert.equal(await page.evaluate(()=>document.activeElement.closest('#removalForm')),null,'Keyboard users can leave the inline form');
   if(width===390){
    await page.$eval('#assessment',e=>e.scrollIntoView({behavior:'instant',block:'start'}));
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.mobile-cta')).visibility==='hidden');
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.mobile-cta')).visibility==='visible');
    await page.click('.mobile-cta a[href="#review-count"]');assert.equal(await page.$('#orderModal.open'),null);
   }
   if(width<700){await page.click('#hamburger');assert.equal(await page.$eval('#hamburger',e=>e.getAttribute('aria-expanded')),'true');await page.click('#hamburger');}
  }
  await page.$eval('#reviewQuantity',e=>{e.value=3;e.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.$eval('#combinedTotal',e=>e.textContent),'$225');assert.equal(await page.$eval('#upfrontTotal',e=>e.textContent),'$75');assert.equal(await page.$eval('#successTotal',e=>e.textContent),'$150');
  assert.equal(await page.$eval('#formReviewQuantity',e=>e.value),'3');
  assert.equal(await page.$eval('[data-estimate="total"]',e=>e.textContent),'$225');
  await page.$eval('#formReviewQuantity',e=>{e.value=4;e.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.$eval('#reviewQuantity',e=>e.value),'4');
  assert.equal(await page.$eval('[data-estimate="total"]',e=>e.textContent),'$300');
  assert.match(await page.$eval('#selectedPlan',e=>e.value),/\$100 upfront \+ \$50 per successfully removed review/);
  await page.setJavaScriptEnabled(false);await page.goto(base,{waitUntil:'load'});assert.ok(await page.$eval('noscript .no-script-request',e=>e.getClientRects().length>0));
  assert.equal(await page.$eval('#removalForm',e=>e.getClientRects().length>0&&e.method==='post'),true,'Native form remains visible and never sends personal details with GET');
  assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);fs.writeFileSync(path.join(output,'layout-results.json'),JSON.stringify(layouts,null,2));
  console.log('PASS: five homepage widths, pricing/inline form section order, quantity-first hero/mobile actions, accessible in-page CTA, visible form groups, no focus trap, synchronized estimates, native POST/email fallback, unchanged form fields and canonical. No real submissions.');
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
