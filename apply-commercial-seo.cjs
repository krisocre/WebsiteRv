// Build-time SEO policy only. No CSS, runtime scripts, active forms or blog edits.
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname,origin='https://reviewsboost.ca';
const services=Object.freeze([
 {name:'Google',file:'index.html',enabled:true,primary:true},
 {name:'Yelp',file:'remove-yelp-reviews.html',enabled:true,primary:false},
 // INACTIVE SERVICES: originals are preserved under the excluded _retired directory.
 // Keep these flags false until a deliberate business decision to restore a service.
 {name:'Facebook',file:'remove-facebook-reviews.html',enabled:false},
 {name:'Tripadvisor',file:'remove-tripadvisor-reviews.html',enabled:false},
 {name:'Trustpilot',file:'remove-trustpilot-reviews.html',enabled:false},
 {name:'Glassdoor',file:'remove-glassdoor-reviews.html',enabled:false}
]);
const active=services.filter(s=>s.enabled),inactive=services.filter(s=>!s.enabled);
const metadata={
 'index.html':{title:'Google Review Removal Service Canada | ReviewsBoost.ca',description:'Professional Google review removal assistance for Canadian businesses. Help with fake, spam and policy-violating reviews. Request a free assessment.'},
 'remove-yelp-reviews.html':{title:'Yelp Review Removal Assistance Canada | ReviewsBoost',description:'Professional help reporting Yelp reviews that may violate policy. CAD $45 upfront per review + $95 if removed. For Canadian businesses.'},
 'suppression-avis-google.html':{title:'Suppression d’avis Google au Canada | ReviewsBoost',description:'Service de suppression d’avis Google pour entreprises canadiennes : analyse et signalement. 45 $ CA au départ, puis 95 $ par avis supprimé.'},
 'about.html':{title:'About ReviewsBoost | Google Review Removal Canada',description:'Learn how ReviewsBoost helps Canadian businesses assess and report Google reviews, with Yelp support, clear CAD fees and independent reputation resources.'},
 'online-reputation-management.html':{title:'Online Reputation Management Toronto & Canada | ReviewsBoost',description:'Google and Yelp review reporting, response planning and reputation support for Canadian businesses. Discuss your situation and request a tailored quote.'}
};
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Owner approved these numeric corrections separately; all other protected copy stays intact.
function correctPricingNumbers(file,html){
 if(file==='remove-yelp-reviews.html')return html.replace('The starting fee is $150. If three reviews are removed, the success fees add $165, for a total of $315 CAD.','The starting fee is $225. If three reviews are removed, the success fees add $285, for a total of $510 CAD.');
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
  function walk(node){
   if(!node||typeof node!=='object')return;
   if(node['@type']==='Organization'&&node.name==='ReviewsBoost')node.description='Google review removal assistance for Canadian businesses, with Yelp as the only secondary review removal service. Independent of the review platforms.';
   if(['WebPage','AboutPage'].includes(node['@type'])){
    node.name=m.title;node.description=m.description;
    if(file==='index.html')node.mainEntity={'@id':origin+'/#service'};
   }
   if(node['@type']==='Service'){
    if(file==='index.html')node.description='Professional assessment, supporting evidence, report preparation and eligible follow-up for Google reviews that may violate policy. For Canadian businesses; removal is not guaranteed.';
    if(file==='remove-yelp-reviews.html'){
     node.serviceType='Yelp review removal assistance';
     node.description='Assistance assessing and reporting Yelp reviews that may violate its Content Guidelines, for Canadian businesses. Yelp makes the moderation decision; removal is not guaranteed.';
    }
    if(file==='suppression-avis-google.html'){
     node.serviceType='Aide à la suppression d’avis Google';
     node.description='Analyse des violations potentielles, préparation des éléments pertinents et aide au signalement des avis Google pour entreprises canadiennes. La suppression n’est pas garantie.';
    }
    if(file==='online-reputation-management.html')node.description=m.description;
   }
   if(file==='index.html'&&node['@type']==='ItemList'&&node.name==='Review removal services by platform'){
    node.itemListElement=active.map((s,i)=>({'@type':'ListItem',position:i+1,name:s.name+' review removal',url:origin+(s.file==='index.html'?'/':'/'+s.file)}));
   }
   for(const value of Object.values(node))if(value&&typeof value==='object')Array.isArray(value)?value.forEach(walk):walk(value);
  }walk(schema);
  return `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`;
 });
 if(file==='about.html')head=head.replace(/\n[ \t]+\r?\n(?=  <meta name="twitter:)/g,'\n\n');
 return head+body;
}
function retirePage(service){
 const about=fs.readFileSync(path.join(root,'about.html'),'utf8');
 const header=about.match(/<header class="site-header">[\s\S]*?<\/header>/)[0].replace(/ aria-current="page"/g,'');
 const footer=about.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0];
 const name=service.name,url=origin+'/'+service.file,title=`${name} Service No Longer Offered | ReviewsBoost`;
 const description=`ReviewsBoost no longer accepts new ${name} review removal requests. Google review removal is our primary service, with Yelp as our only secondary service.`;
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'WebPage','@id':url+'#webpage',url,name:title,description,inLanguage:'en-CA',dateModified:'2026-11-05'},
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:origin+'/'},{'@type':'ListItem',position:2,name:name+' service availability',item:url}]}
 ]};
 return `<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${url}"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="content.css"><meta property="og:type" content="website"><meta property="og:site_name" content="ReviewsBoost"><meta property="og:locale" content="en_CA"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${origin}/social-card.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${origin}/social-card.png"><script type="application/ld+json">${JSON.stringify(schema)}</script></head><body><a class="skip-link" href="#main">Skip to main content</a>${header}<main id="main"><header class="hero"><div class="container"><p class="eyebrow">Service availability</p><h1>${esc(name)} review removal is no longer offered</h1><p class="lede">We no longer accept new ${esc(name)} review removal requests. Our primary service is Google review removal assistance for Canadian businesses. Yelp is our only secondary removal service.</p></div></header><div class="container prose"><section id="request"><h2>Choose an available service</h2><p><a href="/#review-count">Google review removal assistance in Canada</a> · <a href="remove-yelp-reviews.html">Yelp review removal assistance</a></p><p>We assess potential policy violations and help prepare and manage the available reporting process. Each platform decides whether a review is removed; removal is not guaranteed.</p></section><section id="pricing"><h2>Current Google and Yelp fees</h2><p>CAD $45 upfront per accepted review, plus CAD $95 only for each successfully removed review. Requesting an assessment is free; scope, terms and applicable taxes are confirmed before paid work.</p></section><section id="process"><h2>Following up on a previous request?</h2><p id="faq">Use our <a href="online-reputation-management.html#contact">contact process</a> and identify your earlier request. Existing written agreements remain subject to their accepted terms.</p><span id="review-count"></span></section></div></main>${footer}</body></html>\n`;
}
function apply(){
 for(const file of Object.keys(metadata)){
  const target=path.join(root,file),before=fs.readFileSync(target,'utf8');let after=correctPricingNumbers(file,updateHead(file,before));
  // Only obsolete service-scope statements outside the protected Google/Yelp pages change.
  if(file==='about.html')after=after.replace(/professional review\s+removal assistance for Google, Facebook, Yelp, Tripadvisor,\s+Trustpilot and Glassdoor/,'professional Google review removal assistance as our primary service and Yelp reporting support as our only secondary removal service');
  if(file==='online-reputation-management.html')after=after.replace('Compare Google, Facebook, Yelp, Tripadvisor, Trustpilot and Glassdoor processes with difficulty-adjusted success fees.','Compare Google review removal assistance and Yelp reporting support, with the same CAD fees confirmed before paid work.');
  if(after!==before)fs.writeFileSync(target,after);
 }
 for(const service of inactive){
  const archived=path.join(root,'_retired','platform-services-2026-11-05',service.file+'.txt');
  if(!fs.existsSync(archived))throw Error('Archive original service source before retiring '+service.file);
  const target=path.join(root,service.file),after=retirePage(service);if(fs.readFileSync(target,'utf8')!==after)fs.writeFileSync(target,after);
 }
 const sitemapFile=path.join(root,'sitemap.xml'),sitemap=fs.readFileSync(sitemapFile,'utf8');
 const retiredUrls=new Set(inactive.map(s=>origin+'/'+s.file));
 const updatedSitemap=sitemap.replace(/(?:^[ \t]*)?<url>[\s\S]*?<\/url>(?:\r?\n)?/gm,entry=>retiredUrls.has(entry.match(/<loc>([^<]+)<\/loc>/)?.[1])?'':entry);
 if(updatedSitemap!==sitemap)fs.writeFileSync(sitemapFile,updatedSitemap);
 const llmsFile=path.join(root,'llms.txt'),llms=fs.readFileSync(llmsFile,'utf8');
 let guide=llms.replace('ReviewsBoost provides online reputation management and Google review removal assistance for Canadian businesses, alongside practical public resources.','ReviewsBoost specialises in Google review removal assistance for Canadian businesses, with Yelp as its only secondary review removal service, alongside reputation support and practical public resources.');
 const notes={Google:'Professional policy-based assessment, evidence preparation, reporting and eligible follow-up for Canadian businesses. CAD $45 upfront per accepted review plus $95 for each successfully removed review; removal is not guaranteed.',Yelp:'Assistance assessing and reporting potential Yelp guideline violations for Canadian businesses. CAD $45 upfront per accepted review plus $95 if removed; Yelp decides the outcome.'};
 guide=guide.replace(/^- \[([^\]]+) review removal\]\(([^)]+)\):[^\r\n]*/gm,(line,name,url)=>inactive.some(s=>s.name===name)?'':notes[name]?`- [${name} review removal](${url}): ${notes[name]}`:line);
 guide=guide.replace('Bad-review removal, monitoring, response planning and recovery for Toronto, Montreal, Vancouver and businesses across Canada.','Google/Yelp review concerns, monitoring, response planning and recovery for Canadian businesses.');
 if(guide!==llms)fs.writeFileSync(llmsFile,guide);
 console.log('Applied Google-primary/Yelp-secondary SEO and approved pricing corrections; four archived-service availability pages; homepage body, blogs and runtime assets untouched.');
}
module.exports={services,metadata,updateHead,correctPricingNumbers,apply};
if(require.main===module)apply();
