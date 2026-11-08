const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'enquiry-flow.js'),'utf8').match(/\/\/ BEGIN LEAD TRAFFIC SOURCE[\s\S]*?\/\/ END LEAD TRAFFIC SOURCE/)[0];
function classify({query='',referrer='',consent,gpc=false}={}){
 let storageReads=0;
 const window={location:{href:'https://reviewsboost.ca/'+query},navigator:{globalPrivacyControl:gpc}};
 Object.defineProperty(window,'sessionStorage',{get(){storageReads++;throw Error('No tracking storage permitted');}});
 Object.defineProperty(window,'localStorage',{get(){storageReads++;throw Error('No tracking storage permitted');}});
 if(consent)window.ReviewsBoostMeasurement={status:()=>consent};
 const context={window,document:{referrer},URL};vm.runInNewContext(source,context);
 const result=context.leadSourceDetails();assert.equal(storageReads,0);
 assert.deepEqual(Object.keys(result).sort(),['label','source']);
 assert.ok(!/PRIVATE|LOCAL_CLICK|https:|@/.test(JSON.stringify(result)));
 return result;
}
test('private form source distinguishes tagged ads, search referrers and other visits without storing IDs',()=>{
 for(const [query,referrer,want] of [
  ['?gclid=LOCAL_CLICK','https://www.google.ca/','paid_google'],['?gbraid=LOCAL_CLICK','','paid_google'],['?wbraid=LOCAL_CLICK','','paid_google'],['?dclid=LOCAL_CLICK','','paid_other'],
  ['?utm_source=google&utm_medium=cpc','','paid_google'],['?utm_source=bing&utm_medium=ppc','','paid_other'],
  ['?utm_source=google&utm_medium=organic','','organic_google'],['?utm_source=bing&utm_medium=organic','','organic_bing'],
  ['','https://www.google.ca/search?q=PRIVATE_QUERY','organic_google'],['','https://www.bing.com/search?q=PRIVATE_QUERY','organic_bing'],
  ['','https://duckduckgo.com/','organic_other'],['','https://www.googleadservices.com/','paid_google'],
  ['','https://google.com.attacker.invalid/','referral'],['','https://example.ca/?email=PRIVATE_EMAIL','referral']
 ])assert.equal(classify({query,referrer}).source,want);
});
test('ambiguous, internal and untagged direct entries are unknown rather than guessed organic',()=>{
 for(const [query,referrer] of [
  ['',''],['','https://reviewsboost.ca/blog.html'],['','https://www.reviewsboost.ca/'],
  ['?gclid=','https://www.google.com/'],['?gclid=bad%20id','https://www.google.com/'],
  ['?utm_source=google','https://www.google.com/'],['?gad_campaignid=123','https://www.google.com/'],
  ['?utm_source=PRIVATE_EMAIL&utm_medium=organic',''],['','file:///PRIVATE_PATH']
 ])assert.equal(classify({query,referrer}).label,'Direct / unknown');
});
test('existing consent choices and Global Privacy Control suppress classification where applicable',()=>{
 assert.equal(classify({query:'?gclid=LOCAL_CLICK',consent:{analyticsConsent:true,advertisingConsent:false}}).source,'unknown');
 assert.equal(classify({referrer:'https://google.ca/',consent:{analyticsConsent:false,advertisingConsent:true}}).source,'unknown');
 assert.equal(classify({query:'?gclid=LOCAL_CLICK',gpc:true}).source,'unknown');
 assert.equal(classify({query:'?gclid=LOCAL_CLICK',consent:{advertisingConsent:true}}).label,'Paid - Google Ads');
 assert.equal(classify({referrer:'https://google.ca/',consent:{analyticsConsent:true}}).label,'Organic - Google');
});
