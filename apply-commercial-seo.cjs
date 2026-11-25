// Build-time search, social and structured metadata for the public pages.
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname,origin='https://reviewsboost.ca';
const services=Object.freeze([{name:'Google',file:'index.html',enabled:true,primary:true}]);
const servicePages=new Set(['index.html','suppression-avis-google.html','about.html','paid-google-review-removal.html','online-reputation-management.html']);
const metadata={
 'index.html':{title:'Google Review Removal Service Canada | ReviewsBoost.ca',description:'Google review removal service for Canadian businesses. CAD $45 upfront per accepted review, plus $95 if removed. Request a free assessment.'},
 'suppression-avis-google.html':{title:'Suppression d’avis Google au Canada | ReviewsBoost',description:'Service de suppression d’avis Google pour entreprises canadiennes : analyse et signalement. 45 $ CA au départ, puis 95 $ par avis supprimé.'},
 'about.html':{title:'About ReviewsBoost | How We Handle Google Reviews',description:'Learn what our team checks, what we handle on your behalf and how the free assessment works. ReviewsBoost serves Canadian businesses.'},
 'paid-google-review-removal.html':{title:'How Paid Google Review Removal Works in Canada',description:'ReviewsBoost starts with a free assessment and a written CAD quote for each review. See what we handle from evidence preparation to follow-up.'},
 'online-reputation-management.html':{title:'Online Reputation Management – Toronto & Canada',description:'Google review removal, monitoring and reply planning for businesses in Toronto and across Canada. Get a free assessment from ReviewsBoost.'},
 'blog.html':{title:'Google Review Guides & Tools | ReviewsBoost',description:'Practical Google review guides for Canadian businesses. Find price and policy answers, free tools and original research with downloadable data.'},
 'google-review-calculator.html':{title:'Free Google Review Calculator: How Many 5-Star Reviews?',description:'Enter your rating, review count and target to see how many more 5-star Google reviews you may need. Free, instant and private in your browser.'},
 'fake-review-statistics.html':{title:'Google Fake Review Statistics: 2019–2025 Moderation Data',description:'Google reported over 292 million Maps reviews blocked or removed for policy violations in 2025. See the 2019–2025 chart, download the CSV and check what counts.'},
 'google-review-rating-resilience-study.html':{title:'How Much Does a 1-Star Google Review Affect Your Rating?',description:'With 10 ratings averaging exactly 4.8, one new 1-star review drops the average by at least 0.1. Compare 420 modelled scenarios and download the data.'},
 'google-review-policy-canada.html':{title:'Google Review Policy Canada: Rules & Removal',description:'Which Google reviews break policy? Check rules on fake reviews, incentives and conflicts of interest, and see how Canadian businesses can report them.'},
 'google-review-removal-cost-canada.html':{title:'Google Review Removal Cost in Canada – $45 Upfront',description:'Pay CAD $45 upfront per accepted review and $95 per successful removal. Calculate your cost if all, some or none are removed. Start with a free assessment.'},
 'google-reviews-not-showing.html':{title:'Google Reviews Not Showing? What to Check First',description:'If a Google review is missing, check for a delay, a listing mix-up or a policy removal. See what to verify and when to contact Google support.'},
 'respond-to-google-reviews.html':{title:'How to Respond to Google Reviews: 30 Examples (2026)',description:'Find a reply for the situation you’re facing. Adapt 30 examples for Google reviews and learn what to acknowledge, keep private or take offline.'},
 'remove-fake-google-review.html':{title:'How to Remove a Fake Google Review in Canada',description:'Learn what evidence supports a fake Google review report and when an appeal is available. Get reporting steps and request a free assessment.'},
 'google-reviews-faq.html':{title:'ReviewsBoost FAQ | Google Review Removal in Canada',description:'What does ReviewsBoost charge? See when the CAD $45 upfront and $95 success fees apply, what to send and how the free assessment works.'},
 'google-review-removal-checker.html':{title:'Free Google Review Removal Checker',description:'Check a Google review for policy concerns using a link or excerpt. Answer up to two questions and get a case brief and evidence checklist.'},
 'google-review-removal-time-study.html':{title:'Google Review Removal Time: What a 5-Day Median Misses',description:'See what a five-day median among removed reviews can tell you. Compare seven published groups and download the data, charts and methods.'},
 'google-reviews-staff-names-study.html':{title:'Can You Ask Customers to Name Staff in Google Reviews?',description:'See how Google’s staff-name rule applies to review requests and what 15 source estimates tell us. Download the charts and data for the study.'}
};
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Owner approved these numeric corrections separately; all other protected copy stays intact.
function correctPricingNumbers(file,html){
 if(file==='suppression-avis-google.html')return html.replace('cinq avis pris en charge coûtent 150 $ au départ. Si trois avis sont supprimés, les frais de réussite ajoutent 120 $, pour un total de 270 $ CA.','cinq avis pris en charge coûtent 225 $ au départ. Si trois avis sont supprimés, les frais de réussite ajoutent 285 $, pour un total de 510 $ CA.');
 return html;
}
function updateHead(file,html){
 const m=metadata[file];if(!m)return html;
 const boundary=html.indexOf('</head>');if(boundary<0)throw Error('Missing head: '+file);
 let head=html.slice(0,boundary);const body=html.slice(boundary);
 head=head.replace(/<title>[^<]*<\/title>/,`<title>${esc(m.title)}</title>`);
 for(const key of ['description','og:title','og:description','twitter:title','twitter:description']){
  const value=key.endsWith('title')?m.title:m.description;
  const pattern=new RegExp(`(<meta\\b(?=[^>]*(?:name|property)="${key}")[^>]*?content=")[^"]*`,'g');
  if(head.search(pattern)>=0)head=head.replace(pattern,(_,start)=>start+esc(value));
  else head=head.trimEnd()+`\n  <meta ${key.startsWith('og:')?'property':'name'}="${key}" content="${esc(value)}">\n`;
 }
 head=head.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,(tag,json)=>{
  const schema=JSON.parse(json);
  const before=JSON.stringify(schema);
  if(file==='index.html'&&Array.isArray(schema['@graph']))schema['@graph']=schema['@graph'].filter(node=>node['@type']!=='ItemList'||node.name!=='Review removal services by platform');
  function walk(node){
   if(!node||typeof node!=='object')return;
   if(servicePages.has(file)&&node['@type']==='Organization'&&node.name==='ReviewsBoost')node.description='Professional Google review removal assistance for Canadian businesses. Independent from Google.';
   if(servicePages.has(file)&&['WebPage','AboutPage'].includes(node['@type'])){
    node.name=m.title;node.description=m.description;
    if(file==='index.html')node.mainEntity={'@id':origin+'/#service'};
   }
   if(file==='blog.html'&&node['@type']==='ItemList'&&node['@id']===origin+'/blog.html#guide-list'){
    node.numberOfItems=node.itemListElement.length;
    node.itemListElement.forEach((item,index)=>{ item.position=index+1; });
   }
   if(node['@type']==='Service'){
    if(file==='index.html')node.description='Professional assessment, supporting evidence, report preparation and eligible follow-up for Google reviews that may violate policy. For Canadian businesses; removal is not guaranteed.';
    if(file==='suppression-avis-google.html'){
     node.serviceType='Aide à la suppression d’avis Google';
     node.description='Analyse des violations potentielles, préparation des éléments pertinents et aide au signalement des avis Google pour entreprises canadiennes. La suppression n’est pas garantie.';
    }
    if(file==='online-reputation-management.html')node.description=m.description;
   }
   for(const value of Object.values(node))if(value&&typeof value==='object')Array.isArray(value)?value.forEach(walk):walk(value);
  }walk(schema);
  const after=JSON.stringify(schema);
  return before===after?tag:`<script type="application/ld+json">${after.replaceAll('<','\\u003c')}</script>`;
 });
 if(file==='about.html')head=head.replace(/\n[ \t]+\r?\n(?=  <meta name="twitter:)/g,'\n\n');
 return head+body;
}
function apply(){
 for(const file of Object.keys(metadata)){
  const target=path.join(root,file),before=fs.readFileSync(target,'utf8');
  const after=correctPricingNumbers(file,updateHead(file,before));
  if(after!==before)fs.writeFileSync(target,after);
 }
 console.log('Applied ReviewsBoost search metadata and verified service pricing.');
}
module.exports={services,metadata,updateHead,correctPricingNumbers,apply};
if(require.main===module)apply();
