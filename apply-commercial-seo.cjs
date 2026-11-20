// Build-time SEO policy only. No CSS, runtime scripts, active forms or blog edits.
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname,origin='https://reviewsboost.ca';
const services=Object.freeze([{name:'Google',file:'index.html',enabled:true,primary:true}]);
const metadata={
 'index.html':{title:'Google Review Removal Service Canada | ReviewsBoost.ca',description:'Professional Google review removal assistance for Canadian businesses. Help with fake, spam and policy-violating reviews. Request a free assessment.'},
 'suppression-avis-google.html':{title:'Suppression d’avis Google au Canada | ReviewsBoost',description:'Service de suppression d’avis Google pour entreprises canadiennes : analyse et signalement. 45 $ CA au départ, puis 95 $ par avis supprimé.'},
 'about.html':{title:'About ReviewsBoost | Google Review Removal Canada',description:'Learn how ReviewsBoost helps Canadian businesses assess and report Google reviews, with clear CAD fees and practical guidance.'},
 'online-reputation-management.html':{title:'Online Reputation Management Toronto & Canada | ReviewsBoost',description:'Google review reporting, response planning and reputation support for Canadian businesses. Discuss your situation and request an assessment.'}
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
  if(file==='index.html'&&Array.isArray(schema['@graph']))schema['@graph']=schema['@graph'].filter(node=>node['@type']!=='ItemList'||node.name!=='Review removal services by platform');
  function walk(node){
   if(!node||typeof node!=='object')return;
   if(node['@type']==='Organization'&&node.name==='ReviewsBoost')node.description='Professional Google review removal assistance for Canadian businesses. Independent from Google.';
   if(['WebPage','AboutPage'].includes(node['@type'])){
    node.name=m.title;node.description=m.description;
    if(file==='index.html')node.mainEntity={'@id':origin+'/#service'};
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
  return `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`;
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
 console.log('Applied Google review removal metadata and pricing for the Canadian service pages.');
}
module.exports={services,metadata,updateHead,correctPricingNumbers,apply};
if(require.main===module)apply();
