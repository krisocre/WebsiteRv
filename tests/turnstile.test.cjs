const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'google-apps-script.gs'),'utf8');
function app(options={}){
 const state=options.state||{props:{TURNSTILE_SECRET:'LOCAL_SECRET',TURNSTILE_HOSTNAMES:'reviewsboost.ca,www.reviewsboost.ca',SPREADSHEET_ID:'LOCAL_SHEET',SHEET_NAME:'Leads',NOTIFICATION_EMAIL:'support@reviewsboost.ca'},locked:false};
 const rows=[],mails=[],calls=[];let sheets=0;
 const headers=['Timestamp','Selected Plan','Full Name','Business Name','Email','Phone','Preferred Contact','Contact Detail','Profile URL','Review Count','Review Links','Reason'];
 const sheet={getLastRow:()=>rows.length+1,appendRow:r=>rows.push(r),getRange:()=>({getValues:()=>[options.badHeaders?['Wrong header']:headers],createTextFinder:text=>{const f={matchCase:()=>f,useRegularExpression:()=>f,findNext:()=>rows.find(r=>r[11].includes(text))};return f;}})};
 const context={console:{log(){},error(){}},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>state.props[k]||null,getProperties:()=>({...state.props}),setProperty:(k,v)=>{assert.equal(state.locked,true);if(options.persistenceError)throw Error('unavailable');state.props[k]=v;},deleteProperty:k=>{delete state.props[k];}})},
  LockService:{getScriptLock:()=>({tryLock(){if(options.lockError||state.locked)return false;state.locked=true;return true;},waitLock(){assert.equal(state.locked,false);state.locked=true;},releaseLock(){assert.equal(state.locked,true);state.locked=false;}})},
  Utilities:{DigestAlgorithm:{SHA_256:'sha'},Charset:{UTF_8:'utf-8'},computeDigest:(_,v)=>[...crypto.createHash('sha256').update(v).digest()],getUuid:()=>crypto.randomUUID()},
  UrlFetchApp:{fetch:(url,config)=>{
   calls.push({url,config});assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');assert.deepEqual(Object.keys(config.payload).sort(),['response','secret']);assert.equal(config.followRedirects,false);
   if(options.networkError)throw Error('provider unavailable');
   return {getResponseCode:()=>options.httpCode||200,getContentText:()=>options.malformed?'not JSON':JSON.stringify(options.result===undefined?{success:true,hostname:'reviewsboost.ca',action:'quote_request'}:options.result)};
  }},
  SpreadsheetApp:{openById:id=>{sheets++;assert.equal(id,'LOCAL_SHEET');return {getSheetByName:name=>{assert.equal(name,'Leads');return options.missingSheet?null:sheet;}};},getActiveSpreadsheet:()=>{throw Error('No bound/shared fallback allowed');},flush(){}},
  Session:{getEffectiveUser:()=>({getEmail:()=>''})},MailApp:{sendEmail:(...args)=>mails.push(args),getRemainingDailyQuota:()=>0},
  ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})}};
 vm.runInNewContext(source,context);context.SEND_CUSTOMER_RECEIPTS=false;
 const data={'cf-turnstile-response':'LOCAL_TOKEN',form_type:'remove_reviews',full_name:'Local Test',business_name:'Test Business',email_address:'test@example.invalid',review_count:'1',selected_plan:'Google assessment',request_id:'RB-00000000-0000-4000-8000-000000000001'};
 return {state,context,rows,mails,calls,sheets:()=>sheets,post:override=>JSON.parse(context.doPost({parameter:{...data,...override}}).text)};
}
function rejected(options,data){const a=app(options),r=a.post(data);assert.equal(r.result,'error');assert.equal(r.code,'verification_failed');assert.equal(a.sheets(),0);assert.equal(a.rows.length,0);assert.equal(a.mails.length,0);assert.ok(!JSON.stringify(r).includes('LOCAL_SECRET'));return a;}
test('standalone guard and full bundle have identical security functions',()=>{
 const block=s=>s.replace(/\r\n/g,'\n').match(/\/\/ BEGIN REVIEWSBOOST TURNSTILE[\s\S]*?\/\/ END REVIEWSBOOST TURNSTILE/)[0];
 assert.equal(block(source),block(fs.readFileSync(path.join(root,'apps-script-turnstile.gs'),'utf8')));
});
test('missing, malformed and oversized tokens stop before providers/storage/mail',()=>{
 for(const token of [undefined,null,'',' ',42,{},['token'],'x'.repeat(2049)])assert.equal(rejected({}, {'cf-turnstile-response':token}).calls.length,0);
});
test('only production ReviewsBoost hostnames and private credentials are accepted',()=>{
 for(const props of [{},{TURNSTILE_SECRET:'LOCAL_SECRET'},{TURNSTILE_SECRET:'LOCAL_SECRET',TURNSTILE_HOSTNAMES:'reviewremoval.ca'},
   {TURNSTILE_SECRET:'LOCAL_SECRET',TURNSTILE_HOSTNAMES:'localhost'},
   {TURNSTILE_SECRET:'LOCAL_SECRET',TURNSTILE_HOSTNAMES:'reviewsboost.ca.attacker.invalid'},
   {TURNSTILE_SECRET:'1x0000000000000000000000000000000AA',TURNSTILE_HOSTNAMES:'reviewsboost.ca'}]){
  assert.equal(rejected({state:{props,locked:false}}).calls.length,0);
 }
});
test('provider errors, malformed responses, false success and wrong context are rejected',()=>{
 for(const options of [{networkError:true},{httpCode:503},{malformed:true},...[
  null,{}, {success:false,'error-codes':['timeout-or-duplicate']},{success:'true',hostname:'reviewsboost.ca',action:'quote_request'},
  {success:true,hostname:'reviewsboost.ca',action:'login'},
  ...['reviewremoval.ca','localhost','reviewsboost.ca.attacker.invalid'].map(hostname=>({success:true,hostname,action:'quote_request'}))
 ].map(result=>({result}))])rejected(options);
});
test('fresh token saves one original 12-column row and owner notification',()=>{
 const a=app();const result=a.post();assert.equal(result.result,'success');assert.equal(result.notification_sent,true);assert.equal(a.rows.length,1);assert.equal(a.rows[0].length,12);assert.equal(a.mails.length,1);
 assert.equal(a.calls[0].config.payload.secret,'LOCAL_SECRET');assert.equal(a.calls[0].config.payload.response,'LOCAL_TOKEN');assert.equal(a.state.locked,false);
 assert.ok(!JSON.stringify(a.state.props).includes('LOCAL_TOKEN'));assert.ok(!JSON.stringify(a.rows).includes('LOCAL_TOKEN'));assert.ok(!JSON.stringify(a.mails).includes('LOCAL_TOKEN'));
});
test('standalone defaults preserve owner-only notification behaviour',()=>{
 const a=app();vm.runInNewContext(source,a.context);
 assert.equal(a.context.SEND_CUSTOMER_RECEIPTS,false);
 const result=a.post();assert.equal(result.notification_sent,true);assert.equal(a.mails.length,1);
});

test('replayed token is rejected even if the mocked provider repeats success',()=>{
 const a=app();a.post();const r=a.post();assert.equal(r.code,'verification_failed');assert.equal(a.rows.length,1);assert.equal(a.mails.length,1);
 const another=app({state:a.state});assert.equal(another.post().code,'verification_failed');assert.equal(another.sheets(),0);
});
test('lock/persistence failures cannot save and replay lock is released',()=>{
 rejected({lockError:true});const a=rejected({persistenceError:true});assert.equal(a.state.locked,false);
});
test('setup probe does not write leads or send notifications and reports real validation pending',()=>{
 const a=app({result:{success:false,'error-codes':['invalid-input-response']}});
 const summary=a.context.checkReviewsBoostTurnstileSetup();assert.equal(summary.real_token_validation,'pending');assert.equal(a.sheets(),0);assert.equal(a.mails.length,0);
 assert.throws(()=>app({result:{success:false,'error-codes':['invalid-input-secret']}}).context.checkReviewsBoostTurnstileSetup(),/probe failed/);
});

test('standalone setup checks headers and secret without writing leads or sending mail',()=>{
 const a=app({result:{success:false,'error-codes':['invalid-input-response']}});
 const result=a.context.checkReviewsBoostSetup();
 assert.equal(result.spreadsheet_headers,'matched');assert.equal(result.secret_probe,'passed');
 assert.equal(result.real_token_validation,'pending');assert.equal(result.email_delivery,'not tested');
 assert.equal(a.rows.length,0);assert.equal(a.mails.length,0);
});

test('standalone setup rejects a missing tab, incorrect headers and incomplete storage settings',()=>{
 assert.throws(()=>app({missingSheet:true}).context.checkReviewsBoostSetup(),/tab was not found/);
 assert.throws(()=>app({badHeaders:true}).context.checkReviewsBoostSetup(),/12 headers/);
 for(const name of ['SPREADSHEET_ID','SHEET_NAME','NOTIFICATION_EMAIL']){
  const a=app();delete a.state.props[name];
  assert.throws(()=>a.context.checkReviewsBoostSetup(),/Set SPREADSHEET_ID/);assert.equal(a.sheets(),0);
 }
});

test('separate projects have independent credentials and replay ledgers',()=>{
 const first=app(),second=app();first.post();
 assert.equal(second.post().result,'success');
 assert.notEqual(first.state.props,second.state.props);
 assert.equal(first.rows.length,1);assert.equal(second.rows.length,1);
 assert.equal(source.includes('getActiveSpreadsheet'),false);
 assert.equal(source.includes('Session.getEffectiveUser'),false);
});
test('additive integration guards an existing handler without replacing its work',()=>{
 const a=app();vm.runInNewContext(fs.readFileSync(path.join(root,'apps-script-turnstile.gs'),'utf8'),a.context);
 let previousHandlerCalls=0;
 const handler=e=>a.context.rejectUnverifiedReviewsBoostRequest(e)||++previousHandlerCalls;
 assert.equal(handler({parameter:{}}).text.includes('verification_failed'),true);assert.equal(previousHandlerCalls,0);
 assert.equal(handler({parameter:{'cf-turnstile-response':'ADDON_TOKEN'}}),1);assert.equal(previousHandlerCalls,1);
});
