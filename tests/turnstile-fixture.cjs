// Test-only provider fixtures. Never include this file in production pages.
const crypto=require('node:crypto');
const fixture=`(function(){
 var records=[],counter=0;
 window.__turnstileWidgets=records;
 window.turnstile={ready:function(fn){fn();},render:function(container,options){
  if(typeof container==='string')container=document.querySelector(container);
  var id=String(counter++),item={id:id,options:options,container:container,token:'',removed:false};records.push(item);
  var button=document.createElement('button');button.type='button';button.textContent='LOCAL SECURITY FIXTURE';button.dataset.testTurnstile=id;
  button.style.width=options.size==='compact'?'150px':'300px';button.style.height=options.size==='compact'?'140px':'65px';
  button.onclick=function(){item.token='LOCAL_TOKEN_'+id+'_'+Date.now();options.callback(item.token);};container.appendChild(button);return id;
 },reset:function(id){var item=records.find(function(x){return x.id===id;});if(item){item.token='';item.resets=(item.resets||0)+1;}},
 remove:function(id){var item=records.find(function(x){return x.id===id;});if(item){item.removed=true;item.token='';item.container.replaceChildren();}},
 getResponse:function(id){var item=records.find(function(x){return x.id===id;});return item?item.token:'';}};
})();`;
function isApi(url){return url.startsWith('https://challenges.cloudflare.com/turnstile/v0/api.js');}
async function complete(page){
 const form=page.locator('.enquiry-form');
 await form.locator('.enquiry-challenge').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>window.__turnstileWidgets?.some(x=>!x.removed));
 await form.locator('[data-test-turnstile]').click();
}
async function completePuppeteer(page){
 await page.$eval('.enquiry-challenge',el=>el.scrollIntoView({behavior:'instant',block:'center'}));
 await page.waitForFunction(()=>window.__turnstileWidgets?.some(x=>!x.removed));
 await page.click('.enquiry-challenge [data-test-turnstile]');
}
// Unit-test server calls are deterministic mocks, not real Siteverify traffic.
function backendServices(){
 const props={TURNSTILE_SECRET:'LOCAL_TEST_SECRET',TURNSTILE_HOSTNAMES:'reviewsboost.ca,www.reviewsboost.ca',SPREADSHEET_ID:'LOCAL_SHEET',SHEET_NAME:'Leads',NOTIFICATION_EMAIL:'support@reviewsboost.ca'};
 return {
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,getProperties:()=>({...props}),setProperty:(k,v)=>{props[k]=v;},deleteProperty:k=>{delete props[k];}})},
  UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify({success:true,action:'quote_request',hostname:'reviewsboost.ca'})})},
  computeDigest:(_,value)=>[...crypto.createHash('sha256').update(String(value)).digest()].map(b=>b>127?b-256:b)
 };
}
module.exports={fixture,isApi,complete,completePuppeteer,backendServices};
