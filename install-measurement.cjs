// Enable only after configuring this brand's real IDs and reviewing its privacy notice.
const fs=require('node:fs'),path=require('node:path');
const scope={};
require('node:vm').runInNewContext(fs.readFileSync(path.join(__dirname,'measurement-config.js'),'utf8'),{window:scope});
const config=scope.ReviewsBoostMeasurementConfig;
const enabled=/^GTM-[A-Z0-9]+$/.test(config.googleTagManagerId||'')||/^G-[A-Z0-9]+$/.test(config.ga4MeasurementId||'')||/^AW-\d+$/.test(config.googleAdsId||'');
const marker=/\s*<!-- ReviewsBoost measurement start -->[\s\S]*?<!-- ReviewsBoost measurement end -->/g;
function applyToHtml(html,file){
 if(!enabled)return html; // No production placeholders or tag assets while unconfigured.
 const stripped=html.replace(/\r\n?/g,'\n').replace(marker,'');
 if(/googletagmanager\.com\/(?:gtag\/js|gtm\.js)/.test(stripped.split('</head>')[0]))throw Error(file+': existing Google install requires a deliberate migration; refusing duplication');
 const prefix=file==='404.html'?'/':'';
 const version='20261111-pwqps7hj';
 const container=/^GTM-[A-Z0-9]+$/.test(config.googleTagManagerId||'')?`\n<!-- Google Tag Manager ${config.googleTagManagerId}: loaded once after analytics consent. -->`:'';
 const block=`\n<!-- ReviewsBoost measurement start -->${container}\n<script src="${prefix}measurement-config.js?v=${version}" defer></script>\n<script src="${prefix}measurement.js?v=${version}" defer></script>\n<link rel="stylesheet" href="${prefix}measurement.css">\n<!-- ReviewsBoost measurement end -->`;
 // Put the shared loader first in the head, without bypassing cookie choices.
 return stripped.replace(/(<head\b[^>]*>)[ \t]*\n*/i,(_,head)=>head+block+'\n');
}
function install(){
 if(!enabled){console.log('ReviewsBoost measurement remains disabled: no real account ID configured. No HTML changed.');return;}
 for(const file of fs.readdirSync(__dirname).filter(f=>f.endsWith('.html'))){const p=path.join(__dirname,file),before=fs.readFileSync(p,'utf8'),after=applyToHtml(before,file);if(after!==before)fs.writeFileSync(p,after,'utf8');}
 console.log('Installed one consent-controlled ReviewsBoost bootstrap per HTML page.');
}
module.exports={applyToHtml,install,enabled};if(require.main===module)install();
