const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function backend(options = {}) {
  const rows = [], mails = [], cache = new Map(); let released = 0;
  const sheet = {
    getLastRow: () => rows.length + 1,
    getRange: () => ({ createTextFinder: text => {
      const finder = { matchCase: () => finder, useRegularExpression: () => finder, findNext: () => rows.find(r=>r[11].includes(text)) };
      return finder;
    }}),
    appendRow: row => { if(options.saveError) throw Error('storage unavailable'); rows.push(row); }
  };
  const api = {
    console: { error() {} },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), getActiveSpreadsheet: () => ({getActiveSheet:()=>sheet}), flush() {} },
    LockService: { getScriptLock: () => ({waitLock() {},releaseLock() {released++;}}) },
    MailApp: { sendEmail(...args) { if(options.mailError) throw Error('quota'); mails.push(args); }, getRemainingDailyQuota: () => 10 },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'owner@example.ca' }) },
    CacheService: { getScriptCache: () => ({ get: key => cache.get(key), put: (key,value) => cache.set(key,value) }) },
    Utilities: { getUuid: () => '00000000-0000-4000-8000-000000000000', DigestAlgorithm: {SHA_256:'sha'}, computeDigest: (_,value) => value, base64EncodeWebSafe: value => Buffer.from(value).toString('base64') },
    ContentService: { MimeType:{JSON:'json'}, createTextOutput: text => ({text,setMimeType(){return this;}}) }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root,'google-apps-script.gs'),'utf8'),api);
  api.SPREADSHEET_ID='test'; api.SHEET_NAME='test'; api.NOTIFICATION_EMAIL='support@reviewsboost.ca';
  const data={form_type:'remove_reviews',full_name:'Élodie',business_name:'=HYPERLINK("bad")',email_address:'test@example.ca',phone_number:'514-555-0100',selected_plan:'Yelp Review Removal - 3 reviews',review_count:'3',business_url:'https://example.ca',reason:'Unsure',request_id:'RB-00000000-0000-4000-8000-000000000001',locale:'fr-CA'};
  return {rows,mails,data,run: override => JSON.parse(api.doPost({parameter:{...data,...override}}).text),released:()=>released};
}
test('saves all 12 original columns and acknowledges a French request without echoing submitted URLs',()=>{
  const b=backend(); assert.equal(b.run().result,'success');
  assert.equal(b.rows[0].length,12); assert.equal(b.rows[0][4],'test@example.ca'); assert.equal(b.rows[0][5],'514-555-0100');
  assert.equal(b.rows[0][9],'3'); assert.ok(b.rows[0][3].startsWith("'=")); assert.match(b.rows[0][11],/Request reference: RB-/);
  assert.equal(b.mails.length,2); assert.match(b.mails[1][0].subject,/Votre demande/);
  assert.equal(b.mails[1][0].body.includes('https://example.ca'),false); assert.equal(b.released(),1);
});
test('same request ID cannot append or notify twice',()=>{
  const b=backend(); b.run(); b.run(); assert.equal(b.rows.length,1); assert.equal(b.mails.length,2); assert.equal(b.released(),2);
});
test('failed notifications do not hide a successfully stored enquiry',()=>{
  const b=backend({mailError:true}); assert.equal(b.run().result,'success'); assert.equal(b.rows.length,1);
});
test('failed storage never sends confirmation emails',()=>{
  const b=backend({saveError:true}); assert.equal(b.run().result,'error'); assert.equal(b.mails.length,0); assert.equal(b.released(),1);
});
test('rate limit applies to customer acknowledgements, not storage',()=>{
  const b=backend(); b.run(); b.run({request_id:'RB-00000000-0000-4000-8000-000000000002'});
  assert.equal(b.rows.length,2); assert.equal(b.mails.length,3);
});
test('every service creates the correct owner email and a customer acknowledgement',()=>{
  const services = [
    ['Google Review Removal - 1 review','New Google Review Removal Request',false],
    ['Facebook Review Removal - 1 review','New Facebook Review Removal Request',false],
    ['Yelp Review Removal - 1 review','New Yelp Review Removal Request',false],
    ['Tripadvisor Review Removal - 1 review','New Tripadvisor Review Removal Request',false],
    ['Trustpilot Review Removal - 1 review','New Trustpilot Review Removal Request',false],
    ['Glassdoor Review Removal - 1 review','New Glassdoor Review Removal Request',false],
    ['Google Review Removal - 1 review','New Google Review Removal Request',true]
  ];
  services.forEach(([plan, subject, french], index)=>{
    const b=backend();
    assert.equal(b.run({selected_plan:plan,locale:french?'fr-CA':'en-CA',request_id:'RB-00000000-0000-4000-8000-'+String(index).padStart(12,'0')}).result,'success');
    assert.equal(b.mails.length,2);
    assert.equal(b.mails[0][0],'support@reviewsboost.ca');
    assert.match(b.mails[0][1],new RegExp('^'+subject));
    assert.equal(b.mails[1][0].to,'test@example.ca');
    assert.match(b.mails[1][0].subject,french?/Votre demande/:/Your ReviewsBoost request/);
  });
  const reputation=backend();
  assert.equal(reputation.run({form_type:'quote_request',selected_plan:'Monitoring and recovery plan',review_count:'',request_id:'RB-00000000-0000-4000-8000-999999999999'}).result,'success');
  assert.equal(reputation.mails[0][0],'support@reviewsboost.ca');
  assert.match(reputation.mails[0][1],/^New Reputation Assessment Request/);
  assert.equal(reputation.mails[1][0].to,'test@example.ca');
});
test('unsupported forms are rejected before saving',()=>{
  const b=backend(); assert.equal(b.run({form_type:'retired'}).result,'error'); assert.equal(b.rows.length,0);
});
test('bound spreadsheet fallback works when IDs are left blank',()=>{
  const b=backend();
  // The production constants can remain blank in a spreadsheet-bound project.
  const source=fs.readFileSync(path.join(root,'google-apps-script.gs'),'utf8');
  const rows=[],sheet={getLastRow:()=>1,appendRow:r=>rows.push(r)};
  const api={console:{error(){}},SpreadsheetApp:{getActiveSpreadsheet:()=>({getActiveSheet:()=>sheet}),flush(){}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},MailApp:{sendEmail(){},getRemainingDailyQuota:()=>0},Session:{getEffectiveUser:()=>({getEmail:()=>''})},CacheService:{getScriptCache:()=>({get:()=>null,put(){}})},Utilities:{getUuid:()=> '00000000-0000-4000-8000-000000000000'},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})}};
  vm.runInNewContext(source,api);
  assert.equal(JSON.parse(api.doPost({parameter:b.data}).text).result,'success');
  assert.equal(rows.length,1);
});
function sender(fetch, online=true, timers={setTimeout,clearTimeout}) {
  const sandbox={window:timers, navigator:{onLine:online},URLSearchParams,Blob,AbortController,Promise,fetch};
  vm.runInNewContext(fs.readFileSync(path.join(root,'form-submission.js'),'utf8'),sandbox);
  const payload=new FormData();payload.set('full_name','Élodie');payload.set('email_address','test+one@example.ca');
  return ()=>sandbox.window.ReviewSubmission.send(payload);
}
test('sender requires explicit server success and keeps encoded fields',async()=>{
  let calls=0;
  const send=sender(async(_,opts)=>{calls++;assert.equal(opts.mode,'cors');assert.equal(opts.body.get('email_address'),'test+one@example.ca');return {ok:true,json:async()=>({result:'success'})};});
  assert.equal((await send()).result,'success');assert.equal(calls,1);
});
test('sender does not resubmit network errors or declare opaque errors successful',async()=>{
  for(const fetch of [async()=>{throw Error('network');},async()=>({ok:false})]) {
    let calls=0;const send=sender((...args)=>{calls++;return fetch(...args);});
    await assert.rejects(send(),{code:'unconfirmed'});assert.equal(calls,1);
  }
});
test('offline submit sends no request',async()=>{
  const send=sender(()=>{throw Error('must not send');},false); await assert.rejects(send(),{code:'offline'});
});
test('timeout aborts the request without a second POST and clears the timer',async()=>{
  let expire, calls=0, cleared=false;
  const send=sender((_,options)=>new Promise((resolve,reject)=>{
    calls++;options.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')));
  }),true,{setTimeout(callback,delay){assert.equal(delay,60000);expire=callback;return 123;},clearTimeout(id){assert.equal(id,123);cleared=true;}});
  const request=send();expire();await assert.rejects(request,{code:'unconfirmed'});
  assert.equal(calls,1);assert.equal(cleared,true);
});
test('legacy empty-recipient response is recognized as stored',async()=>{
  const send=sender(async()=>({ok:true,json:async()=>({result:'error',error:'Exception: Failed to send email: no recipient'})}));
  assert.equal((await send()).warning,'owner_notification_failed');
});
test('explicit server rejection is retryable and distinct from an unknown network result',async()=>{
  const send=sender(async()=>({ok:true,json:async()=>({result:'error',error:'configured sheet missing'})}));
  await assert.rejects(send(),{code:'server_rejected'});
});
