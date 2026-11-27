const {fixture:turnstileFixture,isApi}=require('./turnstile-fixture.cjs');
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
  let blockedFormScript;
  await page.setRequestInterception(true);page.on('request',r=>{if(blockedFormScript && new URL(r.url()).pathname==='/'+blockedFormScript){r.abort();return;}if(isApi(r.url())){r.respond({status:200,contentType:'text/javascript',body:turnstileFixture});return;}if(r.method()!=='GET'){posts.push(r.url());r.abort();}else if(r.url().startsWith(base)||r.url().startsWith('data:'))r.continue();else r.abort();});page.on('pageerror',e=>errors.push(e.message));
  const layouts=[];
  const waitForAssessment=()=>page.waitForFunction(()=>{
   const header=document.querySelector('#navbar').getBoundingClientRect().bottom;
   const heading=document.querySelector('.assessment-heading').getBoundingClientRect().top;
   return Math.abs(heading-header-12)<3&&document.activeElement.id==='assessment-title';
  });
  for(const width of [1440,1024,768,390,320]){
   await page.setViewport({width,height:width<700?844:900});await page.goto(base,{waitUntil:'networkidle0'});
   const rejectCookies=await page.$('#measurement-preferences:not([hidden]) [data-choice="reject"]');
   if(rejectCookies)await rejectCookies.click();
   const layout=await page.evaluate(()=>{const r=document.querySelector('.hero-actions a[href="#assessment"]').getBoundingClientRect();return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,ctaTop:r.top,ctaBottom:r.bottom,viewport:innerHeight,height:document.documentElement.scrollHeight};});
   assert.equal(layout.overflow,false);assert.ok(layout.ctaTop>0&&layout.ctaBottom<layout.viewport);layouts.push(layout);
   assert.equal(await page.$$eval('h1',e=>e.length),1);assert.equal(await page.$$eval('title',e=>e.length),1);assert.equal(await page.$$eval('link[rel=canonical]',e=>e.length),1);
   assert.equal(await page.$$eval('.steps-grid>article',e=>e.length),3);assert.equal(await page.$eval('.hero-actions a[href="#assessment"]',e=>e.getBoundingClientRect().height>=44),true);
   assert.ok(await page.$eval('.hero-points',e=>e.textContent.includes('No account password needed')));
   assert.equal(await page.evaluate(()=>Array.from(document.scripts).some(script=>new URL(script.src,location.href).pathname.endsWith('/measurement.js'))),require('../install-measurement.cjs').enabled,'Measurement bootstrap matches real configuration');
   assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
   assert.deepEqual(await page.$$eval('main>section',e=>e.slice(0,5).map(n=>n.id||n.classList[0])),['hero','trust-strip','press-mentions','pricing','assessment'],'Press mentions precede pricing and the assessment');
   assert.deepEqual(await page.$$eval('.press-track > ul:not([aria-hidden]) li',items=>items.map(item=>item.textContent.trim())),['Financial Post','Toronto Times','ProMark Business Solutions','Profit Parrot']);
   assert.equal(await page.$('.press-mentions a'),null,'Publication names are unlinked');
   assert.equal(await page.$('.press-mentions button'),null,'Press names have no separate playback button');
   assert.equal(await page.$eval('.press-track>[aria-hidden]',copy=>copy.getClientRects().length),0,'Reduced motion shows each publication once');
   assert.equal(await page.$$eval('[role="dialog"],.modal-overlay',e=>e.length),0,'Homepage form is part of the page');
   if([1440,390].includes(width)){
    await page.evaluate(()=>document.activeElement?.blur());
    await page.screenshot({path:path.join(output,'hero-'+width+'.png')});
    const cleanPreview=await page.addStyleTag({content:'.navbar,.mobile-cta,.skip-link{visibility:hidden!important}'});
    await (await page.$('#pricing')).screenshot({path:path.join(output,'pricing-'+width+'.png')});
    await (await page.$('#assessment')).screenshot({path:path.join(output,'assessment-'+width+'.png')});
    await cleanPreview.evaluate(element=>element.remove());
   }
   await page.click('.hero-actions a[href="#assessment"]');await waitForAssessment();
   await page.click('.calculator .open-order');await waitForAssessment();
   assert.equal(await page.evaluate(()=>document.activeElement.id),'assessment-title','The in-page CTA focuses the assessment heading at '+width+'px');
   for(const id of ['businessUrl','formReviewQuantity','fullName','businessName','email'])assert.equal(await page.$eval('#'+id,e=>e.getClientRects().length>0),true,id+' is visible without an extra step');
   const profileSize=await page.$eval('#businessUrl',e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,group:e.closest('.enquiry-grid').getBoundingClientRect().width}));
   assert.ok(Math.abs(profileSize.width-profileSize.group)<2,'Profile input spans the form row at '+width+'px');
   assert.ok(profileSize.height>=46,'Profile input matches the other input heights');
   assert.equal(await page.$$eval('#removalForm .enquiry-extra',e=>e.length),1,'Optional details share one disclosure');
   assert.equal(await page.$eval('#enquiryCategory',e=>e.required),false,'An assessment does not require choosing a policy category');
   assert.equal(await page.$eval('.enquiry-extra',e=>e.open),false,'Optional fields are initially collapsed');
   await page.focus('#fullName');await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');assert.equal(await page.evaluate(()=>document.activeElement.closest('#removalForm')),null,'Keyboard users can leave the inline form');
   if(width===390){
    // Observe a fresh entry into the form after the prior focus and scroll checks.
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.mobile-cta')).visibility==='visible');
    await page.$eval('#assessment',e=>window.scrollTo({top:window.scrollY+e.getBoundingClientRect().top-82,behavior:'instant'}));
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.mobile-cta')).visibility==='hidden');
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.mobile-cta')).visibility==='visible');
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
    await page.$eval('.press-mentions',section=>section.scrollIntoView({block:'center',behavior:'instant'}));
    await page.mouse.move(0,0);
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.press-track')).animationPlayState==='running');
    const tickerPosition=()=>page.$eval('.press-track',track=>track.getBoundingClientRect().left);
    const startingPosition=await tickerPosition();
    await page.waitForFunction(start=>document.querySelector('.press-track').getBoundingClientRect().left<start-1,{},startingPosition);
    const copyPoint=await page.$eval('.press-window',container=>{
     const view=container.getBoundingClientRect();
     for(const item of container.querySelectorAll('li')){
      const text=item.firstChild;
      const word=text.textContent.split(' ')[0];
      const range=document.createRange();
      range.setStart(text,0);
      range.setEnd(text,word.length);
      const bounds=range.getBoundingClientRect();
      if(bounds.left>view.left+12&&bounds.right<view.right-12){
       return {x:bounds.left+bounds.width/2,y:bounds.top+bounds.height/2};
      }
     }
     return null;
    });
    assert.ok(copyPoint,'A visible publication word can be selected');
    await page.mouse.click(copyPoint.x,copyPoint.y,{clickCount:2});
    assert.ok(await page.evaluate(()=>window.getSelection().toString().trim()),'Double-click selects publication text');
    assert.equal(await page.$eval('.press-window',container=>getComputedStyle(container).overflowX),'clip');
    assert.equal(await page.$eval('.press-track',track=>getComputedStyle(track).animationPlayState),'running');
    const afterSelection=await tickerPosition();
    await page.waitForFunction(start=>document.querySelector('.press-track').getBoundingClientRect().left<start-1,{},afterSelection);
    await page.focus('.hero-note a');
    await page.keyboard.press('Tab');
    assert.equal(await page.$eval('.press-window',container=>container.matches(':focus-visible')),true);
    assert.equal(await page.$eval('.press-track',track=>getComputedStyle(track).animationName),'none');
    assert.equal(await page.$eval('.press-track>[aria-hidden]',copy=>copy.getClientRects().length),0);
    await page.keyboard.press('Tab');
    assert.equal(await page.$eval('.press-track',track=>getComputedStyle(track).animationName),'reviewsboost-press-scroll');
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.evaluate(()=>{
     const focus=HTMLElement.prototype.focus;
     HTMLElement.prototype.focus=function(options){
      focus.call(this,options);
      if(this.id==='assessment-title') {
       // Reproduce the viewport change in browsers that scroll when focus moves.
       const top=scrollY+this.getBoundingClientRect().top;
       window.scrollTo({top,behavior:'instant'});
      }
     };
    });
    const scrollPositions=await page.$eval('.mobile-cta a[href="#assessment"]',async link=>{
     const start=scrollY;
     const heading=document.querySelector('.assessment-heading');
     const navbar=document.querySelector('#navbar');
     const distance=heading.getBoundingClientRect().top-navbar.getBoundingClientRect().bottom-12;
     link.click();
     const positions=[scrollY-start];
     for(let frame=0;frame<16;frame++){
      await new Promise(resolve=>requestAnimationFrame(resolve));
      positions.push(scrollY-start);
     }
     return {positions,distance};
    });
    assert.equal(scrollPositions.positions[0],0,'Focusing the assessment does not jump the viewport');
    assert.ok(scrollPositions.positions.some(position=>position>8&&position<scrollPositions.distance-8),'Scroll passes through intermediate positions');
    await waitForAssessment();
    assert.equal(await page.$('#orderModal.open'),null);
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
   }
   if(width<700){await page.click('#hamburger');assert.equal(await page.$eval('#hamburger',e=>e.getAttribute('aria-expanded')),'true');await page.click('#hamburger');}
  }
  await page.$eval('#reviewQuantity',e=>e.scrollIntoView({block:'center',behavior:'instant'}));
  assert.equal(await page.$eval('#decreaseQty',e=>e.disabled),true);
  assert.deepEqual(await page.$$eval('.calculator button',els=>els.map(el=>el.id)),['decreaseQty','increaseQty']);
  for(let count=1;count<6;count++)await page.click('#increaseQty');
  await page.click('#decreaseQty');
  assert.equal(await page.$eval('#formReviewQuantity',e=>e.value),'5');
  await page.click('#increaseQty');
  assert.equal(await page.$eval('#reviewQuantity',e=>e.value),'6');
  await page.focus('#reviewQuantity');
  await page.keyboard.down('Control');await page.keyboard.press('a');await page.keyboard.up('Control');await page.keyboard.press('Backspace');
  assert.equal(await page.$eval('#reviewQuantity',e=>e.value),'','Deleting the previous count leaves room for typing');
  assert.equal(await page.$eval('#formReviewQuantity',e=>e.value),'6','A partial edit does not change the form');
  assert.equal(await page.$eval('#combinedTotal',e=>e.textContent),'$840','A partial edit keeps the last valid estimate');
  await page.keyboard.type('12');
  assert.equal(await page.$eval('#formReviewQuantity',e=>e.value),'12');
  assert.equal(await page.$eval('#combinedTotal',e=>e.textContent),'$1,680');
  await page.$eval('#reviewQuantity',e=>{e.value='51';e.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(await page.$eval('#reviewQuantity',e=>e.value),'50');
  assert.equal(await page.$eval('#increaseQty',e=>e.disabled),true);
  await page.focus('#reviewQuantity');
  await page.keyboard.down('Control');await page.keyboard.press('a');await page.keyboard.up('Control');await page.keyboard.type('3');
  assert.equal(await page.$eval('#combinedTotal',e=>e.textContent),'$420');assert.equal(await page.$eval('#upfrontTotal',e=>e.textContent),'$135');assert.equal(await page.$eval('#successTotal',e=>e.textContent),'$285');
  assert.equal(await page.$eval('#formReviewQuantity',e=>e.value),'3');
  assert.equal(await page.$eval('[data-estimate="total"]',e=>e.textContent),'$420');
  await page.$eval('#formReviewQuantity',e=>{e.value=4;e.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.$eval('#reviewQuantity',e=>e.value),'4');
  assert.equal(await page.$eval('[data-estimate="total"]',e=>e.textContent),'$560');
  assert.match(await page.$eval('#selectedPlan',e=>e.value),/\$180 upfront \+ \$95 per successfully removed review/);
  await page.goto(base+'google-review-removal-cost-canada.html',{waitUntil:'load'});
  const feeTotals=()=>page.$$eval('[data-cost="upfront"],[data-cost="success"],[data-cost="total"]',els=>els.map(e=>e.textContent));
  assert.deepEqual(await feeTotals(),['$135','$190','$325']);
  await page.$eval('#fee-calculator',tool=>{
   const ordered=tool.querySelector('#cost-review-count'),removed=tool.querySelector('#cost-removed-count');
   ordered.value='5';ordered.dispatchEvent(new Event('change',{bubbles:true}));
   removed.value='3';removed.dispatchEvent(new Event('change',{bubbles:true}));
  });
  assert.deepEqual(await feeTotals(),['$225','$285','$510']);
  await page.$eval('#cost-removed-count',e=>{e.value='0';e.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.deepEqual(await feeTotals(),['$225','$0','$225']);
  await page.goto(base+'suppression-avis-google.html',{waitUntil:'load'});
  await page.$eval('#reviewQuantity',e=>{e.value='5';e.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.$eval('#upfrontTotal',e=>e.textContent),'225 $');
  assert.equal(await page.$eval('#successTotal',e=>e.textContent),'475 $');
  assert.match(await page.$eval('#selectedPlan',e=>e.value),/\$225 upfront \+ \$95 per successfully removed review/);
  await page.setViewport({width:320,height:650});
  await page.goto(base,{waitUntil:'load'});
  await page.focus('.skip-link');await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'main','Skip link moves keyboard focus into main content');
  await page.keyboard.press('Tab');
  assert.equal(await page.$eval('.hero-actions a',link=>link===document.activeElement),true);
  await page.focus('#hamburger');await page.keyboard.press('Enter');
  assert.equal(await page.$eval('#navLinks a',link=>link===document.activeElement),true,'Opening the mobile menu by keyboard focuses the first link');
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.$eval('#navLinks li:nth-child(2) a',link=>link===document.activeElement),true,'Arrow keys navigate on devices that skip links when tabbing');
  await page.focus('#navLinks a[href="#pricing"]');await page.keyboard.press('Enter');
  assert.equal(await page.$eval('#pricing h2',heading=>heading===document.activeElement),true,'Following a menu link moves focus to its content');
  const firstQuestion=await page.$('.faq-question');
  await firstQuestion.focus();await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>Boolean(document.activeElement.closest('.faq-item:not(.open) .faq-answer'))),false,'Collapsed FAQ answers cannot receive keyboard focus');
  await firstQuestion.click();await page.addStyleTag({content:'.faq-answer p{font-size:200%}'});
  assert.equal(await page.$eval('.faq-item.open .faq-answer',answer=>answer.scrollHeight<=answer.clientHeight+1),true,'Enlarged text remains readable in the expanded FAQ');
  for(const dependency of ['enquiry-flow.js','form-submission.js']){
   blockedFormScript=dependency;
   await page.goto(base,{waitUntil:'load'});
   assert.equal(await page.$eval('#submitButton',button=>button.disabled),true,'Submit waits for '+dependency);
   assert.match(await page.$eval('#formStatus',node=>node.innerText),/reload/i,'Visible recovery instruction for '+dependency);
   await page.$eval('#removalForm',form=>{
    form.elements.full_name.value='Local Test';form.elements.business_name.value='Test Business';form.elements.email_address.value='local@example.invalid';
   });
   await page.focus('#email');await page.keyboard.press('Enter');
   assert.equal(page.url(),base);
   assert.equal(await page.$eval('#removalForm',form=>form.getAttribute('aria-busy')),null);
  }
  blockedFormScript=undefined;
  await page.setJavaScriptEnabled(false);
  await page.goto(base+'google-review-removal-cost-canada.html',{waitUntil:'load'});
  assert.deepEqual(await feeTotals(),['$135','$190','$325']);
  assert.match(await page.$eval('#fee-calculator noscript',e=>e.textContent),/CAD \$325/);
  await page.goto(base,{waitUntil:'load'});assert.ok(await page.$eval('noscript .no-script-request',e=>e.getClientRects().length>0));
  assert.match(await page.$eval('noscript .turnstile-noscript',e=>e.textContent),/Enable JavaScript to complete the security check/);
  assert.equal(await page.$eval('#submitButton',button=>button.disabled),true,'Secure submission requires JavaScript');
  assert.doesNotMatch(await page.$eval('#removalForm',e=>e.textContent),/You can send this form without JavaScript/);
  assert.equal(await page.$eval('#removalForm',e=>e.getClientRects().length>0&&e.method==='post'),true,'Native form remains visible and never sends personal details with GET');
  assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);fs.writeFileSync(path.join(output,'layout-results.json'),JSON.stringify(layouts,null,2));
  console.log('PASS: five homepage widths, accessible assessment, synchronized English and French estimates and quote values, partial and zero-removal totals, static pricing fallback, unchanged form fields and canonical. No real submissions.');
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
