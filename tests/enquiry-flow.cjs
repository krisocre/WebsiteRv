const {fixture:turnstileFixture,complete}=require('./turnstile-fixture.cjs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const testedEndpoint='https://script.google.com/macros/s/AKfycbzKrckb1hj0Poq3NUiywydhkTl5B8CNfGNB_8wgIcCaCKaVKNv4yQdIxHgtEq9EtEtBTQ/exec';
const profileText='Find our shop on King Street, Toronto. '+ 'x'.repeat(2200);
const pages = require('../apply-commercial-seo.cjs').services.filter(s=>s.enabled).map(s=>s.file).concat('suppression-avis-google.html','online-reputation-management.html');
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url,'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'}[path.extname(file)];
  res.setHeader('Content-Type',mime||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || 'chrome'});
  async function newTestPage(options){
    const page=await browser.newPage(options);
    page.on('request',request=>{if(request.url().startsWith('https://script.google.com/')&&request.method()==='POST')assert.equal(request.url(),testedEndpoint,'Every active form must use the tested ReviewsBoost-only endpoint');});
    await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*',route=>route.fulfill({status:200,contentType:'text/javascript',body:turnstileFixture}));
    return page;
  }
  async function prepare(page, file) {
    await page.goto(base+'/'+file);
    if (file==='index.html') await page.locator('.open-order').first().click();
    else if (file.startsWith('remove-')) {
      await page.getByRole('link',{name:'Choose Number of Reviews',exact:true}).click();
      assert.equal(await page.locator('#request').evaluate(n=>n.classList.contains('open')),false);
      assert.equal(await page.locator('#review-count').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=50&&r.top<innerHeight;}),true);
      await page.locator('.pricing-calc [data-focus-form]').click();
    }
    const form=page.locator('.enquiry-form');
    await form.locator('[name="business_url"]').fill(profileText);
    assert.deepEqual(await form.locator('[name="business_url"]').evaluate(n=>({type:n.type,required:n.required,maxLength:n.maxLength,valid:n.checkValidity()})),{type:'text',required:false,maxLength:-1,valid:true});
    if (file==='online-reputation-management.html') {
      await form.locator('[name="selected_plan"]').selectOption({index:1});
      await form.locator('[name="reason"]').fill('Review concern in Montréal');
    } else {
      await form.locator('[name="review_count"]').fill('3');
      if(!await form.evaluate(n=>n.hasAttribute('data-inline-enquiry')))await form.locator('[name="concern_category"]').selectOption({index:7});
    }
    if(!await form.evaluate(n=>n.hasAttribute('data-inline-enquiry')))await form.locator('.enquiry-actions button').filter({hasText:/Continue|Continuer/}).click();
    await form.locator('[name="full_name"]').fill('Élodie Test');
    await form.locator('[name="business_name"]').fill('Example Business — Montréal, QC');
    await form.locator('[name="email_address"]').fill('test+case@example.ca');
    await complete(page);
    return form;
  }
  try {
    for (const width of [1440,390]) for (const file of pages) {
      const page=await newTestPage({viewport:{width,height:950},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const requests=[];
      await page.route('https://script.google.com/**',async route=>{
        requests.push(new URLSearchParams(route.request().postData()));
        await new Promise(r=>setTimeout(r,120));
        await route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"result":"success"}'});
      });
      const form=await prepare(page,file);
      if(width===1440){
        for(const [name,bad]of [['full_name','$4,000 PROMO https://example.invalid'],['email_address','bot@sub.fldubai.com']]){
          const input=form.locator('[name="'+name+'"]'),original=await input.inputValue();
          await input.fill(bad);await complete(page);await form.evaluate(n=>n.requestSubmit());
          assert.equal(requests.length,0,file+' blocked input must not send a request');
          assert.equal(await input.evaluate(n=>n.checkValidity()),false);
          assert.equal(await input.inputValue(),bad,'Keep answers available to correct');
          if(name==='email_address')assert.match(await input.evaluate(n=>n.validationMessage),/different email|autre adresse courriel/);
          await input.fill(original);
        }
      }
      const inline=await form.evaluate(n=>n.hasAttribute('data-inline-enquiry'));
      if(!inline)await form.locator('.enquiry-back').click();
      assert.equal(await form.locator('[name="business_url"]').inputValue(),profileText);
      if(!inline)await form.locator('.enquiry-actions button').filter({hasText:/Continue|Continuer/}).click();
      if (file!=='online-reputation-management.html') {
        const fee=await page.evaluate(()=>Number(document.body.dataset.successFee||95));
        assert.equal(fee,95,'The success fee is CAD $95 for every platform');
        assert.match(await page.locator('#combinedTotal').textContent(),new RegExp(String(3*(45+fee))));
      }
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,file+' overflow');
      const legal=form.locator('.submission-legal');
      assert.equal(await legal.isVisible(),true,file+' terms must be visible before submitting');
      assert.equal(await legal.locator('a').count(),2);
      assert.equal(await form.locator('[type="checkbox"]').count(),0);
      assert.equal(await legal.evaluate(node=>node.getBoundingClientRect().bottom<=node.parentElement.querySelector('.enquiry-actions').getBoundingClientRect().top),true,'Terms notice must precede the final action');
      await page.screenshot({path:path.join(os.tmpdir(),'conversion-'+file+'-'+width+'.png')});
      await complete(page);await form.evaluate(n=>{n.requestSubmit();n.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
      await page.waitForFunction(()=>document.querySelector('.submission-success:not([hidden]), .platform-success:not([hidden])'));
      assert.equal(requests.length,1,file+' duplicate POST');
      assert.equal(requests[0].get('full_name'),'Élodie Test');
      assert.equal(requests[0].get('contact_detail'),'test+case@example.ca');
      assert.equal(requests[0].get('business_url'),profileText,'Free text survives each active form unchanged');
      assert.equal(requests[0].get('traffic_source'),'unknown');
      assert.ok(requests[0].get('reason').startsWith('[Traffic Source: Direct / unknown]\n'));
      assert.match(requests[0].get('reason'),/Request reference: RB-/);
      assert.equal(requests[0].get('terms_version'),'2026-11-07-lead-source');
      assert.match(requests[0].get('reason'),/\[Submission acknowledgement\]/);
      assert.match(requests[0].get('reason'),/https:\/\/reviewsboost.ca\/terms-of-service.html/);
      assert.equal((requests[0].get('reason').match(/\[Submission acknowledgement\]/g)||[]).length,1,'Record terms once');
      assert.equal(requests[0].get('terms_language'),file==='suppression-avis-google.html'?'fr-CA':'en-CA');
      assert.match(requests[0].get('terms_acknowledged_at_client'),/^\d{4}-\d\d-\d\dT/);
      if (file!=='online-reputation-management.html') {
        assert.equal(requests[0].get('review_count'),'3');
        assert.match(requests[0].get('selected_plan'),/\$135 upfront \+ \$95 per successfully removed review/,'Submitted quote uses the updated per-review fees');
      }
      const success=page.locator('.submission-success:not([hidden]), .platform-success:not([hidden])');
      assert.equal(await success.locator('h2').textContent(),file==='suppression-avis-google.html'?'Demande envoyée':'Request sent');
      assert.equal(await success.locator('button').count(),1);
      assert.equal(await success.locator('a, p, .enquiry-receipt').count(),0,'Confirmed state contains only its title, check and restart action');
      assert.ok(!/RB-|notification|Save My Request/.test(await success.textContent()));
      assert.equal(await success.evaluate(n=>n===document.activeElement),true,'Confirmation receives keyboard focus');
      if(file==='remove-yelp-reviews.html'&&width===1440){
        await page.locator('.platform-modal-close').click();
        await page.locator('.pricing-calc [data-focus-form]').click();
        assert.equal(await page.locator('#request').getAttribute('aria-labelledby'),'platformModalTitle','Reopening a closed confirmation restores its dialog label');
      }else await success.locator('button').click();
      assert.equal(await form.isVisible(),true,'Another request restores the form in place');
      assert.equal(await form.locator('[name="full_name"]').inputValue(),'');
      assert.equal(await page.evaluate(()=>document.querySelector('.is-submitted')===null),true,'The initial layout is restored');
      assert.deepEqual(errors,[],file+' JS errors');
      await page.close();
    }
    {
      const page=await newTestPage({viewport:{width:320,height:844},reducedMotion:'reduce'});
      let received;
      await page.route('https://script.google.com/**',async route=>{
        received=new URLSearchParams(route.request().postData());
        await route.fulfill({headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"result":"success"}'});
      });
      const form=await prepare(page,'index.html');
      await form.locator('.enquiry-extra>summary').click();
      await form.locator('[name="concern_category"]').selectOption('Off-topic content');
      await form.locator('[name="review_links"]').fill('https://example.ca/review');
      await form.locator('[name="reason"]').fill('Additional test context');
      await form.locator('[name="phone_number"]').fill('416-555-0100');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Expanded optional fields fit at 320px');
      await complete(page);await form.locator('[type="submit"]').click();
      await page.waitForFunction(()=>!document.querySelector('#removalSuccess').hidden);
      assert.equal(received.get('phone_number'),'416-555-0100');
      assert.equal(received.get('review_links'),'https://example.ca/review');
      assert.match(received.get('reason'),/Off-topic content\nAdditional test context/);
      await page.locator('#removalSuccessClose').click();
      assert.equal(await form.isVisible(),true,'Another request restores the inline form');
      assert.equal(await page.locator('#fullName').evaluate(n=>n===document.activeElement),true);
      await page.close();
    }
    {
      const page=await newTestPage({reducedMotion:'reduce'});let posts=0;
      await page.route('https://script.google.com/**',async route=>{
        posts++;await route.fulfill({headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:posts===1?'{"result":"error","code":"invalid_input","field":"email_address"}':'{"result":"success"}'});
      });
      const form=await prepare(page,'index.html');await complete(page);await form.evaluate(n=>n.requestSubmit());
      await page.waitForFunction(()=>document.querySelector('#email').validationMessage.length>0&&!document.querySelector('#submitButton').disabled);
      assert.equal(posts,1);assert.equal(await form.isVisible(),true);
      assert.equal(await page.locator('.enquiry-receipt').count(),0,'A definitive input rejection needs correction, not recovery details');
      assert.equal(await page.locator('#removalSuccess').isVisible(),false);
      await form.locator('[name="email_address"]').fill('corrected@example.ca');
      await complete(page);await form.evaluate(n=>n.requestSubmit());await page.waitForFunction(()=>!document.querySelector('#removalSuccess').hidden);
      assert.equal(posts,2,'A corrected rejection can be submitted once');await page.close();
    }
    for (const mode of ['offline','network','server-error','invalid-json']) {
      const page=await newTestPage({reducedMotion:'reduce'}); let posts=0;
      await page.route('https://script.google.com/**',async route=>{
        posts++;
        if(mode==='network') return route.abort();
        await route.fulfill({headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:mode==='invalid-json'?'not-json':'{"result":"error"}'});
      });
      const form=await prepare(page,'index.html');
      if(mode==='offline') await page.context().setOffline(true);
      await complete(page);await form.evaluate(n=>n.requestSubmit());
      await page.waitForFunction(()=>document.querySelector('.form-status.error:not([hidden])'));
      assert.equal(await form.locator('[role="status"]:not(.enquiry-security-status)').isVisible(),true,'Error message must be visible');
      assert.equal(await form.locator('[name="full_name"]').inputValue(),'Élodie Test');
      assert.equal(await page.locator('#removalSuccess').isVisible(),false);
      assert.equal(await page.locator('.enquiry-receipt').count(),1,'Unconfirmed requests retain recovery details');
      if(mode==='offline') { assert.equal(posts,0); assert.equal(await form.locator('[type="submit"]').isDisabled(),false); }
      else {
        assert.equal(posts,1);
        assert.equal(await form.locator('[type="submit"]').isDisabled(),mode==='server-error'?false:true);
      }
      await page.keyboard.press('Escape');
      await page.locator('.open-order').first().click();
      assert.equal(await form.locator('[role="status"]:not(.enquiry-security-status)').isVisible(),true,'Reopening must preserve error explanation');
      assert.equal(await form.locator('[name="full_name"]').isVisible(),true,'Answers must remain reachable after failure');
      await page.close();
    }
    {
      const page=await newTestPage({reducedMotion:'reduce'}); let posts=0;
      await page.route('https://script.google.com/**',async route=>{
        posts++;
        await route.fulfill({headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"result":"error","error":"Exception: Failed to send email: no recipient"}'});
      });
      const form=await prepare(page,'index.html');
      await complete(page);await form.evaluate(n=>n.requestSubmit());
      await page.waitForFunction(()=>!document.querySelector('#removalSuccess').hidden);
      assert.equal(posts,1,'Legacy notification failure sent more than once');
      assert.equal(await page.locator('#removalSuccess h2').textContent(),'Request sent');
      assert.equal(await page.locator('#removalSuccess .enquiry-receipt').count(),0);
      await page.close();
    }
    const page=await newTestPage({reducedMotion:'reduce'});
    await page.goto(base+'/index.html'); await page.locator('.open-order').first().click();
    await page.locator('#submitButton').click();
    assert.equal(await page.locator('#fullName').evaluate(n=>n===document.activeElement),true,'First missing field receives focus');
    assert.equal(await page.locator('#fullName').isVisible(),true,'Both inline form groups remain visible');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.closest('#removalForm')===null),true,'Inline form does not trap focus');
    await page.close();
    console.log(`PASS: ${pages.length} active forms at desktop/mobile, concise success/reset states, quantity totals, Unicode payloads, one POST, unconfirmed-request recovery and keyboard validation.`);
  } finally { await browser.close();server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
