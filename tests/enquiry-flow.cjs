const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', ...['facebook','yelp','tripadvisor','trustpilot','glassdoor'].map(p=>'remove-'+p+'-reviews.html'), 'suppression-avis-google.html', 'online-reputation-management.html'];
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
    await form.locator('[name="business_url"]').fill('https://example.ca/profile');
    if (file==='online-reputation-management.html') {
      await form.locator('[name="selected_plan"]').selectOption({index:1});
      await form.locator('[name="reason"]').fill('Review concern in Montréal');
    } else {
      await form.locator('[name="review_count"]').fill('3');
      await form.locator('[name="concern_category"]').selectOption({index:7});
    }
    await form.locator('.enquiry-actions button').filter({hasText:/Continue|Continuer/}).click();
    await form.locator('[name="full_name"]').fill('Élodie Test');
    await form.locator('[name="business_name"]').fill('Example Business — Montréal, QC');
    await form.locator('[name="email_address"]').fill('test+case@example.ca');
    return form;
  }
  try {
    for (const width of [1440,390]) for (const file of pages) {
      const page=await browser.newPage({viewport:{width,height:950},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const requests=[];
      await page.route('https://script.google.com/**',async route=>{
        requests.push(new URLSearchParams(route.request().postData()));
        await new Promise(r=>setTimeout(r,120));
        await route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"result":"success"}'});
      });
      const form=await prepare(page,file);
      await form.locator('.enquiry-back').click();
      assert.equal(await form.locator('[name="business_url"]').inputValue(),'https://example.ca/profile');
      await form.locator('.enquiry-actions button').filter({hasText:/Continue|Continuer/}).click();
      if (file!=='online-reputation-management.html') {
        const fee=await page.evaluate(()=>Number(document.body.dataset.successFee||40));
        assert.match(await page.locator('#combinedTotal').textContent(),new RegExp(String(3*(30+fee))));
      }
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,file+' overflow');
      await page.screenshot({path:path.join(os.tmpdir(),'conversion-'+file+'-'+width+'.png')});
      await form.evaluate(n=>{n.requestSubmit();n.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
      await page.waitForFunction(()=>document.querySelector('.submission-success:not([hidden]), .platform-success:not([hidden])'));
      assert.equal(requests.length,1,file+' duplicate POST');
      assert.equal(requests[0].get('full_name'),'Élodie Test');
      assert.equal(requests[0].get('contact_detail'),'test+case@example.ca');
      assert.match(requests[0].get('reason'),/Request reference: RB-/);
      if (file!=='online-reputation-management.html') assert.equal(requests[0].get('review_count'),'3');
      const success=page.locator('.submission-success:not([hidden]), .platform-success:not([hidden])');
      assert.match(await success.textContent(),/RB-/);
      const dl=page.waitForEvent('download');
      await success.locator('button').filter({hasText:/Save My Request|Enregistrer ma demande/}).click();
      assert.match((await dl).suggestedFilename(),/RB-/);
      assert.deepEqual(errors,[],file+' JS errors');
      await page.close();
    }
    for (const mode of ['offline','network','server-error','invalid-json']) {
      const page=await browser.newPage({reducedMotion:'reduce'}); let posts=0;
      await page.route('https://script.google.com/**',async route=>{
        posts++;
        if(mode==='network') return route.abort();
        await route.fulfill({headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:mode==='invalid-json'?'not-json':'{"result":"error"}'});
      });
      const form=await prepare(page,'index.html');
      if(mode==='offline') await page.context().setOffline(true);
      await form.evaluate(n=>n.requestSubmit());
      await page.waitForFunction(()=>document.querySelector('.form-status.error:not([hidden])'));
      assert.equal(await form.locator('[role="status"]').isVisible(),true,'Error message must be visible');
      assert.equal(await form.locator('[name="full_name"]').inputValue(),'Élodie Test');
      assert.equal(await page.locator('#removalSuccess').isVisible(),false);
      if(mode==='offline') { assert.equal(posts,0); assert.equal(await form.locator('[type="submit"]').isDisabled(),false); }
      else {
        assert.equal(posts,1);
        assert.equal(await form.locator('[type="submit"]').isDisabled(),mode==='server-error'?false:true);
      }
      await page.keyboard.press('Escape');
      await page.locator('.open-order').first().click();
      assert.equal(await form.locator('[role="status"]').isVisible(),true,'Reopening must preserve error explanation');
      await form.locator('.enquiry-back').click();
      await form.locator('.enquiry-actions button').filter({hasText:'Continue to My Details'}).click();
      assert.equal(await form.locator('[name="full_name"]').isVisible(),true,'Answers must remain reachable after failure');
      await page.close();
    }
    {
      const page=await browser.newPage({reducedMotion:'reduce'}); let posts=0;
      await page.route('https://script.google.com/**',async route=>{
        posts++;
        await route.fulfill({headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"result":"error","error":"Exception: Failed to send email: no recipient"}'});
      });
      const form=await prepare(page,'index.html');
      await form.evaluate(n=>n.requestSubmit());
      await page.waitForFunction(()=>!document.querySelector('#removalSuccess').hidden);
      assert.equal(posts,1,'Legacy notification failure sent more than once');
      assert.match(await page.locator('#removalSuccess').textContent(),/request was saved/i);
      await page.close();
    }
    const page=await browser.newPage({reducedMotion:'reduce'});
    await page.goto(base+'/index.html'); await page.locator('.open-order').first().click();
    await page.locator('.enquiry-actions button').filter({hasText:'Continue to My Details'}).click();
    assert.equal(await page.locator('#fullName').isVisible(),false,'Empty first stage advanced');
    await page.locator('#modalClose').focus(); await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.closest('#orderModal')!==null),true,'Focus left dialog');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.open-order').first().evaluate(n=>n===document.activeElement),true,'Closing must restore focus to trigger');
    await page.close();
    console.log('PASS: 8 forms at desktop/mobile, quantity scroll, totals, preserved back navigation, Unicode payloads, one POST, saved receipts, failure retention and keyboard validation.');
  } finally { await browser.close();server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
