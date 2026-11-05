const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),{services,metadata,updateHead,correctPricingNumbers}=require('../apply-commercial-seo.cjs');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const structured=html=>[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const flatten=node=>!node||typeof node!=='object'?[]:[node,...Object.values(node).flatMap(v=>Array.isArray(v)?v.flatMap(flatten):flatten(v))];
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&#39;',"'");
const active=services.filter(s=>s.enabled),inactive=services.filter(s=>!s.enabled),sitemap=read('sitemap.xml');
assert.deepEqual(active.map(s=>s.name),['Google','Yelp']);
for(const [file,m] of Object.entries(metadata)){
 const html=read(file),head=html.split('</head>')[0];assert.equal(updateHead(file,html),html,file+' metadata idempotence');
 assert.equal((head.match(/rel="canonical"/g)||[]).length,1,file+' canonical count');
 assert.equal(decode(head.match(/<title>([^<]+)<\/title>/)[1]),m.title);
 for(const key of ['description','og:description','twitter:description','og:title','twitter:title']){
  const value=head.match(new RegExp(`<meta\\b(?=[^>]*(?:name|property)="${key}")[^>]*content="([^"]*)"`))?.[1];
  assert.equal(decode(value||''),key.endsWith('title')?m.title:m.description,file+' '+key);
 }
 assert.ok(!/name="keywords"/.test(head));assert.ok(!/name="robots"[^>]*noindex/.test(head));
 const data=structured(html).flatMap(flatten),service=data.find(s=>s['@type']==='Service');
 if(file==='index.html'){
  const list=data.find(s=>s['@type']==='ItemList');assert.deepEqual(list.itemListElement.map(x=>x.name),['Google review removal','Yelp review removal']);
  assert.equal(data.find(s=>s['@type']==='WebPage').mainEntity['@id'],'https://reviewsboost.ca/#service');
 }
 if(['index.html','remove-yelp-reviews.html','suppression-avis-google.html'].includes(file)){
  assert.equal(service.offers.price,'45');assert.equal(service.offers.priceCurrency,'CAD');assert.match(service.offers.description,/95/);
 }
 if(file==='remove-yelp-reviews.html')assert.equal(service.serviceType,'Yelp review removal assistance');
 if(file==='remove-yelp-reviews.html')assert.ok(html.includes('starting fee is $225. If three reviews are removed, the success fees add $285, for a total of $510 CAD.'));
 if(file==='suppression-avis-google.html')assert.ok(html.includes('coûtent 225 $ au départ. Si trois avis sont supprimés, les frais de réussite ajoutent 285 $, pour un total de 510 $ CA.'));
}
const archive=JSON.parse(read('_retired/platform-services-2026-11-05/manifest.json'));
for(const service of inactive){
 const html=read(service.file),nodes=structured(html).flatMap(flatten);
 assert.match(html,/<meta name="robots" content="noindex,follow">/);
 assert.ok(html.includes(service.name+' review removal is no longer offered'));
 assert.ok(!nodes.some(s=>['Service','Offer','FAQPage','Product'].includes(s['@type'])));
 assert.ok(!/<form\b/.test(html),'No new-order form on a discontinued service');
 assert.ok(!/src="(?:platform-removal|enquiry-flow)\.js/.test(html));
 assert.ok(!sitemap.includes('<loc>https://reviewsboost.ca/'+service.file+'</loc>'));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,archive[service.file].archive))).digest('hex'),archive[service.file].sha256);
 assert.equal(archive[service.file].enabled,false);
}
assert.match(read('_config.yml'),/\n\s*- _retired\s*\r?\n/);
assert.ok(!/^- \[(?:Facebook|Tripadvisor|Trustpilot|Glassdoor) review removal\]/m.test(read('llms.txt')));
assert.ok(read('llms.txt').includes('CAD $45 upfront per accepted review plus $95'));
assert.ok(!/typical 1[–-]2 week removal timeline/.test(read('llms.txt')));
if(process.env.COMMERCIAL_SEO_BASELINE){
 const base=path.resolve(process.env.COMMERCIAL_SEO_BASELINE),manifest=JSON.parse(fs.readFileSync(path.join(base,'before-hashes.json'),'utf8'));
 const editable=new Set(['_config.yml','index.html','remove-yelp-reviews.html','suppression-avis-google.html','about.html','online-reputation-management.html','llms.txt','sitemap.xml','tests/build.cjs','tests/enquiry-flow.cjs',...inactive.map(s=>s.file)]);
 for(const [file,hash] of Object.entries(manifest)){
  if(!editable.has(file))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,file+' protected bytes changed');
  if(file.endsWith('.html')){
   const before=fs.readFileSync(path.join(base,'before',file),'utf8'),after=read(file);
   const canonical=html=>html.match(/<link\b(?=[^>]*rel="canonical")[^>]*href="([^"]+)"/)?.[1];
   assert.equal(canonical(after),canonical(before),file+' canonical value changed');
  }
 }
 for(const file of ['index.html','remove-yelp-reviews.html','suppression-avis-google.html']){
  const before=fs.readFileSync(path.join(base,'before',file),'utf8'),after=read(file);
  assert.equal(after.slice(after.indexOf('</head>')+7),correctPricingNumbers(file,before.slice(before.indexOf('</head>')+7)),file+' protected body changed beyond approved pricing figures');
 }
 for(const file of ['index.html','remove-yelp-reviews.html','suppression-avis-google.html','online-reputation-management.html']){
  const before=fs.readFileSync(path.join(base,'before',file),'utf8'),after=read(file);
  assert.deepEqual(after.match(/<form\b[\s\S]*?<\/form>/g),before.match(/<form\b[\s\S]*?<\/form>/g),file+' active form changed');
 }
 const beforeSitemap=fs.readFileSync(path.join(base,'before','sitemap.xml'),'utf8');
 const beforeUrls=[...beforeSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 const afterUrls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.deepEqual(afterUrls,beforeUrls.filter(url=>!inactive.some(s=>url==='https://reviewsboost.ca/'+s.file)));
 console.log('PASS: baseline protects all blog/articles/data, CSS, runtime JS, active forms, active-page bodies, redirect/canonical rules, tracking and prior work.');
}
console.log('PASS: commercial titles/descriptions/social metadata, factual Google/Yelp schema/prices, four archived/noindex services and sitemap/guide consistency.');
