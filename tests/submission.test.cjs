const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const {backendServices}=require('./turnstile-fixture.cjs');
const {workbookFixture}=require('./acknowledgement-sheet-fixture.cjs');
const testedEndpoint='https://script.google.com/macros/s/AKfycbzKrckb1hj0Poq3NUiywydhkTl5B8CNfGNB_8wgIcCaCKaVKNv4yQdIxHgtEq9EtEtBTQ/exec';
function backend(options = {}) {
  const security=backendServices();let tokenNumber=0;
  Object.entries(options.properties||{}).forEach(([key,value])=>security.PropertiesService.getScriptProperties().setProperty(key,value));
  const rows = [], mails = [], cache = new Map(); let released = 0;
  const book=workbookFixture({brand:'ReviewsBoost',rows,options});
  const api = {
    console: { error() {} },
    SpreadsheetApp: { openById: id => {assert.equal(id,'LOCAL_SHEET');return book.spreadsheet;}, getActiveSpreadsheet: () => {throw Error('Standalone handlers must never use active spreadsheets');}, flush() {} },
    LockService: { getScriptLock: () => {let business=false;return {waitLock() {business=true;},tryLock(){return true;},releaseLock() {if(business)released++;}};} },
    MailApp: { sendEmail(...args) { if(options.mailError) throw Error('quota'); mails.push(args); }, getRemainingDailyQuota: () => 10 },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'owner@example.ca' }) },
    CacheService: { getScriptCache: () => ({ get: key => cache.get(key), put: (key,value) => cache.set(key,value) }) },
    Utilities: { getUuid: () => '00000000-0000-4000-8000-000000000000', DigestAlgorithm: {SHA_256:'sha'}, Charset:{UTF_8:'utf-8'},computeDigest: security.computeDigest, base64EncodeWebSafe: value => Buffer.from(value).toString('base64') },
    PropertiesService:security.PropertiesService,UrlFetchApp:security.UrlFetchApp,
    ContentService: { MimeType:{JSON:'json'}, createTextOutput: text => ({text,setMimeType(){return this;}}) }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root,'google-apps-script.gs'),'utf8'),api);
  api.SEND_CUSTOMER_RECEIPTS=options.customerReceipts!==false;
  const data={form_type:'remove_reviews',full_name:'Élodie',business_name:'=HYPERLINK("bad")',email_address:'test@example.ca',phone_number:'514-555-0100',selected_plan:'Yelp Review Removal - 3 reviews',review_count:'3',business_url:'https://example.ca',reason:'Unsure',request_id:'RB-00000000-0000-4000-8000-000000000001',locale:'fr-CA','cf-turnstile-response':'LOCAL_TOKEN'};
  return {rows,mails,data,book,run: override => JSON.parse(api.doPost({parameter:{...data,'cf-turnstile-response':'LOCAL_TOKEN_'+tokenNumber++,...override}}).text),released:()=>released};
}

test('all active forms use the tested separate ReviewsBoost endpoint without shared fallback',()=>{
  const runtime=fs.readFileSync(path.join(root,'form-submission.js'),'utf8');
  assert.ok(runtime.includes("var endpoint = '"+testedEndpoint+"';"));
  const retired='AKfycby4mQu0BJFu8Jmbw_zZPzrBb9TF_YRw4j0Ayu3PFvwgicSN5vtzynX0ASet2utzxtlnMw';
  const otherBrand='AKfycbzK_hATDZaXApgEUITdZ1kgF6VirBLCpcK1q3tmiFoWhG2AZpy_B6uOy5CFjTejVo8T';
  assert.ok(!runtime.includes(retired)&&!runtime.includes(otherBrand));
  for(const file of ['index.html','suppression-avis-google.html','remove-yelp-reviews.html','online-reputation-management.html']){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.deepEqual([...html.matchAll(/<script\b[^>]*\bsrc="(form-submission\.js(?:\?[^"]*)?)"/g)].map(x=>x[1]),['form-submission.js?v=20261107-turnstile-endpoint'],file);
    assert.ok(!html.includes(retired)&&!html.includes(otherBrand),file);
    const profile=html.match(/<input\b[^>]*\bname="business_url"[^>]*>/)[0];
    assert.match(profile,/\btype="text"/);
    assert.doesNotMatch(profile,/\brequired\b|\b(?:maxlength|minlength|pattern)=/);
    if(file==='index.html')assert.ok(html.includes('method="post" action="'+testedEndpoint+'"'));
  }
});

test('browser and backend use identical input rules',()=>{
  const extract=value=>value.replace(/\r\n/g,'\n').match(/\/\/ BEGIN LEAD INPUT RULES[\s\S]*?\/\/ END LEAD INPUT RULES/)[0];
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
    [{reason:'a'.repeat(20001)},'reason'], [{review_links:'a'.repeat(12001)},'review_links'],
    [{phone_number:'1'.repeat(81)},'phone_number']
  ];
  for(const [values,field]of cases){
    const b=backend(),result=b.run(values);assert.equal(result.code,'invalid_input',JSON.stringify(values));assert.equal(result.field,field);assert.equal(b.rows.length,0);assert.equal(b.mails.length,0);
  }
});

test('profile accepts blank values, free text, any URL format and long text without executing formulas',()=>{
  for(const business_url of ['', 'Find our shop on King Street, Toronto', 'www.example.ca', 'https://www.google.com/share.google?q=TEST', 'https://google.com/%73hare.google?q=TEST', 'javascript:void(0)', 'https://user:pass@example.ca', 'x'.repeat(2500), '=not a link']){
    const b=backend(),result=b.run({business_url});
    assert.equal(result.result,'success');assert.equal(b.rows.length,1);
    assert.equal(b.rows[0][8],business_url.startsWith('=')?"'"+business_url:business_url||'N/A');
  }
});

test('owner email shows only fixed source labels and the existing Reason retains the compatible source note',()=>{
  for(const [traffic_source,label] of [['paid_google','Paid - Google Ads'],['organic_google','Organic - Google'],['organic_bing','Organic - Bing'],['PRIVATE_EMAIL','Direct / unknown'],['toString','Direct / unknown']]){
    const b=backend();const reason='[Traffic Source: '+label+']\nCustomer context';
    assert.equal(b.run({traffic_source,reason}).result,'success');
    assert.ok(b.mails[0][2].includes('Traffic Source: '+label+'\n'));
    assert.equal(b.rows[0].length,12);assert.ok(b.rows[0][11].startsWith(reason));
    assert.ok(!b.mails[0][2].includes('PRIVATE_EMAIL'));
  }
});

test('email and main sheet notes exclude generated acknowledgement; hidden audit retains it and references still deduplicate',()=>{
  const record=['[Submission acknowledgement]','Notice: By submitting, you agree to the Terms of Service.','Terms: https://reviewsboost.ca/terms-of-service.html | version 2026-10-27','Policy snapshot: https://reviewsboost.ca/legal-versions/policies-2026-10-27.json','Privacy: https://reviewsboost.ca/privacy-policy.html | version 2026-10-27','Language: en-CA','Method: submission after linked notice; not a claim of document reading','Client-device time: 2026-10-28T03:32:44.853Z'].join('\n');
  const reason='[Traffic Source: Paid - Google Ads]\nKeep all customer notes.\n\n'+record+'\nSubmission page: https://reviewsboost.ca/\nKeep this trailing customer detail.';
  const b=backend();const result=b.run({reason,traffic_source:'paid_google'});
  assert.equal(result.result,'success');assert.equal(result.acknowledgement_archived,true);
  assert.ok(!b.rows[0][11].includes(record),'Main sheet notes exclude generated metadata');
  assert.equal(b.book.audit().hidden,true);assert.ok(b.book.audit().rows[0][5].includes(record));
  const body=b.mails[0][2];assert.ok(!body.includes('[Submission acknowledgement]'));assert.ok(!body.includes('Client-device time:'));
  for(const text of ['Keep all customer notes.','Keep this trailing customer detail.','Traffic Source: Paid - Google Ads','Request reference: RB-']){
    assert.ok(body.includes(text),text);assert.ok(b.rows[0][11].includes(text),text);
  }
  const emailCount=b.mails.length;assert.equal(b.run({reason}).result,'success');
  assert.equal(b.rows.length,1);assert.equal(b.mails.length,emailCount);assert.equal(b.book.audit().rows.length,1);
  const scope={};vm.runInNewContext(fs.readFileSync(path.join(root,'google-apps-script.gs'),'utf8'),scope);
  const clean=scope.notificationBodyWithoutAcknowledgement;
  assert.equal(clean('before\n'+record+'\nafter'),'before\n\nafter','Legacy record without Submission page');
  assert.equal(clean('Reason: '+record.replace(/\n/g,'\r\n')),'Reason: ','CRLF and an inline Reason prefix');
  assert.equal(clean(record+'\n'+record),'\n','Multiple complete legacy blocks');
  const literal='Customer wrote [Submission acknowledgement] but supplied no generated metadata. Keep this.';
  assert.equal(clean(literal),literal,'Do not delete unrelated customer wording');
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
test('standalone storage and notification settings are mandatory; no shared or active fallback',()=>{
  for(const key of ['SPREADSHEET_ID','SHEET_NAME','NOTIFICATION_EMAIL']){
    const b=backend({properties:{[key]:''}});
    assert.equal(b.run().result,'error');assert.equal(b.rows.length,0);assert.equal(b.mails.length,0);
  }
  const b=backend({properties:{NOTIFICATION_EMAIL:'not an email'}});
  assert.equal(b.run().result,'error');assert.equal(b.rows.length,0);assert.equal(b.mails.length,0);
});
function sender(fetch, online=true, timers={setTimeout,clearTimeout}) {
  const sandbox={window:timers, navigator:{onLine:online},URLSearchParams,Blob,AbortController,Promise,fetch:(url,options)=>{assert.equal(url,testedEndpoint);return fetch(url,options);}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'form-submission.js'),'utf8'),sandbox);
  const payload=new FormData();payload.set('full_name','Élodie');payload.set('email_address','test+one@example.ca');payload.set('cf-turnstile-response','LOCAL_TOKEN');
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

test('verification rejection is explicit and retryable, not an ambiguous send',async()=>{
  const send=sender(async()=>({ok:true,json:async()=>({result:'error',code:'verification_failed'})}));
  await assert.rejects(send(),{code:'verification_failed'});
});

test('sender never posts a missing verification token',async()=>{
  let calls=0;
  const sandbox={window:{setTimeout,clearTimeout},navigator:{onLine:true},URLSearchParams,Blob,AbortController,Promise,fetch:()=>{calls++;}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'form-submission.js'),'utf8'),sandbox);
  await assert.rejects(sandbox.window.ReviewSubmission.send(new FormData()),{code:'verification_failed'});
  assert.equal(calls,0);
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
