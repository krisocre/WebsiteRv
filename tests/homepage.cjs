const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),puppeteer=require('puppeteer'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),output=path.join(root,'.seo-private/visual-restore-2026-11-02');fs.mkdirSync(output,{recursive:true});
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
   if([1440,390].includes(width)){await page.screenshot({path:path.join(output,'final-'+width+'.png')});}
   await page.click('.hero-actions a[href="#review-count"]');await page.waitForFunction(()=>{const r=document.querySelector('#review-count').getBoundingClientRect();return r.top>=50&&r.top<innerHeight;});assert.equal(await page.$('#orderModal.open'),null,'Original hero action leads to quantity selection');
   await page.click('.calculator .open-order');await page.waitForSelector('#orderModal.open');assert.equal(await page.$eval('#businessUrl',e=>e===document.activeElement),true);
   await page.keyboard.press('Escape');assert.equal(await page.$eval('.calculator .open-order',e=>e===document.activeElement),true);
   if(width===390){await page.click('.mobile-cta a[href="#review-count"]');assert.equal(await page.$('#orderModal.open'),null);}
   if(width<700){await page.click('#hamburger');assert.equal(await page.$eval('#hamburger',e=>e.getAttribute('aria-expanded')),'true');await page.click('#hamburger');}
  }
  await page.$eval('#reviewQuantity',e=>{e.value=3;e.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.$eval('#combinedTotal',e=>e.textContent),'$225');assert.equal(await page.$eval('#upfrontTotal',e=>e.textContent),'$75');assert.equal(await page.$eval('#successTotal',e=>e.textContent),'$150');
  await page.setJavaScriptEnabled(false);await page.goto(base,{waitUntil:'load'});assert.ok(await page.$eval('noscript .no-script-request',e=>e.getClientRects().length>0));
  assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);fs.writeFileSync(path.join(output,'layout-results.json'),JSON.stringify(layouts,null,2));
  console.log('PASS: five homepage widths, original quantity-first hero/mobile actions, existing modal/focus, pricing arithmetic, no-JavaScript email fallback, unchanged form fields and homepage canonical. No real submissions.');
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
