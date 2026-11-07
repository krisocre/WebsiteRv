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

test('browser and backend use identical input rules',()=>{
  const extract=value=>value.match(/\/\/ BEGIN LEAD INPUT RULES[\s\S]*?\/\/ END LEAD INPUT RULES/)[0];
  assert.equal(extract(fs.readFileSync(path.join(root,'enquiry-flow.js'),'utf8')),extract(fs.readFileSync(path.join(root,'google-apps-script.gs'),'utf8')));
  assert.equal(extract(fs.readFileSync(path.join(root,'apps-script-input-validation.gs'),'utf8')),extract(fs.readFileSync(path.join(root,'google-apps-script.gs'),'utf8')));
});

test('the additive backend guard works without replacing an existing submit handler',()=>{
  const api={ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'apps-script-input-validation.gs'),'utf8'),api);
  const data=backend().data;
  assert.equal(api.rejectInvalidLeadInput({parameter:data}),null);
  assert.equal(JSON.parse(api.rejectInvalidLeadInput({parameter:{...data,email_address:'bot@fldubai.com'}}).text).code,'invalid_input');
  assert.equal(api.rejectInvalidLeadInput({parameter:{...data,form_type:'quote_request',review_count:''}}),null);
  assert.equal(JSON.parse(api.rejectInvalidLeadInput({parameter:{...data,form_type:'',review_count:'rbka80'}}).text).field,'review_count');
});

test('spam patterns and malformed input are rejected before saving or emailing',()=>{
  const cases=[
    [{full_name:'$4,000 PROMO https://www.google.com/share.google?q=TEST'},'full_name'],
    [{full_name:'\uFF04 Bonus'},'full_name'], [{full_name:'\uFE69 Bonus'},'full_name'],
    [{full_name:'https://example.invalid'},'full_name'], [{full_name:'www.example.invalid'},'full_name'],
    [{full_name:'John\nSmith'},'full_name'], [{full_name:'12345'},'full_name'],
    [{full_name:'A'.repeat(151)},'full_name'], [{full_name:' '},'full_name'],
    [{business_name:'https://example.invalid'},'business_name'], [{business_name:'Shop\nName'},'business_name'],
    [{business_name:' '},'business_name'], [{business_name:'A'.repeat(251)},'business_name'],
    [{email_address:'bot@fldubai.com'},'email_address'], [{email_address:' BOT@FLDUBAI.COM '},'email_address'],
    [{email_address:'bot@sub.fldubai.com'},'email_address'], [{contact_detail:'bot@fldubai.com'},'email_address'],
    [{email_address:'a\u0000b@example.ca'},'email_address'], [{email_address:'invalid-email'},'email_address'],
    ...['rbka80','2.5','0','51',''].map(review_count=>[{review_count},'review_count']),
    [{business_url:'https://www.google.com/share.google?q=TEST'},'business_url'],
    [{business_url:'https://google.com/%73hare.google?q=TEST'},'business_url'],
    [{business_url:'javascript:alert(1)'},'business_url'], [{business_url:'https://user:pass@example.ca'},'business_url'],
    [{business_url:'https://example.ca/'+ 'a'.repeat(2048)},'business_url'],
    [{reason:'a'.repeat(20001)},'reason'], [{review_links:'a'.repeat(12001)},'review_links'],
    [{phone_number:'1'.repeat(81)},'phone_number']
  ];
  for(const [values,field]of cases){
    const b=backend(),result=b.run(values);assert.equal(result.code,'invalid_input',JSON.stringify(values));assert.equal(result.field,field);assert.equal(b.rows.length,0);assert.equal(b.mails.length,0);
  }
});

test('normal international names, company punctuation and quoted spam evidence remain valid',()=>{
  for(const full_name of ["\u00c9lodie O'Neill",'Jean-Luc St. Pierre','\u674e','\u9648\u4f1f','\u0645\u062d\u0645\u062f \u0639\u0644\u064a','\u0906\u0930\u0935 \u0936\u0930\u094d\u092e\u093e','A. Com']){
    const b=backend();assert.equal(b.run({full_name,business_name:'$5 Pizza & Caf\u00e9 Inc.',email_address:'owner+quote@gmail.com',business_url:'',review_links:'',reason:'The review contains $4,000 casino bonus text and https://www.google.com/share.google?q=EVIDENCE'}).result,'success',full_name);assert.equal(b.rows.length,1);
  }
  for(const email_address of ['owner@notfldubai.com','owner@fldubai.com.example.ca','owner+case@outlook.com'])assert.equal(backend().run({email_address,business_url:'https://share.google/real-profile'}).result,'success');
});
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

test('terms record keeps client notes, policy version and snapshot without duplicating or saving URL queries',()=>{
  const sandbox={window:{location:{origin:'https://reviewsboost.ca',pathname:'/index.html',search:'?email=private@example.ca'}},Date};
  vm.runInNewContext(fs.readFileSync(path.join(root,'submission-terms.js'),'utf8'),sandbox);
  const data=new FormData();
  for(const [key,value] of Object.entries({reason:'Client context',terms_version:'2026-10-27',terms_url:'https://reviewsboost.ca/terms-of-service.html',terms_snapshot_url:'https://reviewsboost.ca/legal-versions/policies-2026-10-27.json',privacy_version:'2026-10-27',privacy_url:'https://reviewsboost.ca/privacy-policy.html',terms_language:'en-CA',terms_acknowledgement:'By submitting, you agree to the Terms of Service.'}))data.set(key,value);
  sandbox.window.SubmissionTerms.prepare(data);sandbox.window.SubmissionTerms.prepare(data);
  assert.ok(data.get('reason').startsWith('Client context'));
  assert.equal((data.get('reason').match(/\[Submission acknowledgement\]/g)||[]).length,1);
  assert.ok(data.get('reason').includes('policies-2026-10-27.json'));
  assert.equal(data.get('submission_page'),'https://reviewsboost.ca/index.html');
  assert.equal(data.get('reason').includes('private@example.ca'),false);
});
test('sender requires explicit server success and keeps encoded fields',async()=>{
  let calls=0;
  const send=sender(async(_,opts)=>{calls++;assert.equal(opts.mode,'cors');assert.equal(opts.body.get('email_address'),'test+one@example.ca');return {ok:true,json:async()=>({result:'success'})};});
  assert.equal((await send()).result,'success');assert.equal(calls,1);
});

test('a definitive input rejection stays correctable rather than becoming an ambiguous send',async()=>{
  let calls=0;const send=sender(async()=>{calls++;return {ok:true,json:async()=>({result:'error',code:'invalid_input',field:'email_address'})};});
  await assert.rejects(send(),{code:'invalid_input',field:'email_address'});assert.equal(calls,1);
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
