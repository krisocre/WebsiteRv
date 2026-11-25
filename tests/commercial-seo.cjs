const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),{services,metadata,updateHead,correctPricingNumbers}=require('../apply-commercial-seo.cjs');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const structured=html=>[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const flatten=node=>!node||typeof node!=='object'?[]:[node,...Object.values(node).flatMap(v=>Array.isArray(v)?v.flatMap(flatten):flatten(v))];
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&#39;',"'");
const active=services.filter(s=>s.enabled);
const retired=/yelp|facebook|trustpilot|tripadvisor|glassdoor|sitejabber|booking[.-]com|remove-indeed|\bplatforms\.html|review removal services by platform|review.removal services across major platforms/i;
assert.deepEqual(active.map(s=>s.name),['Google']);
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
  assert.ok(!data.some(s=>s['@type']==='ItemList'&&s.name==='Review removal services by platform'));
  assert.equal(data.find(s=>s['@type']==='WebPage').mainEntity['@id'],'https://reviewsboost.ca/#service');
 }
 if(['index.html','suppression-avis-google.html'].includes(file)){
  assert.equal(service.offers.price,'45');assert.equal(service.offers.priceCurrency,'CAD');assert.match(service.offers.description,/95/);
 }
 if(file==='suppression-avis-google.html')assert.ok(html.includes('coûtent 225 $ au départ. Si trois avis sont supprimés, les frais de réussite ajoutent 285 $, pour un total de 510 $ CA.'));
}
for(const file of fs.readdirSync(root).filter(file=>file.endsWith('.html'))){
 assert.ok(!retired.test(file),file+': retired page published');
 assert.ok(!retired.test(read(file)),file+': retired platform reference');
}
for(const file of ['sitemap.xml','feed.xml','llms.txt'])assert.ok(!retired.test(read(file)),file+': retired entry');
assert.ok(!/id="(?:other-platforms|servicesMenu)"/.test(read('index.html')),'Homepage retired-platform section and menu removed');
console.log('PASS: Google-only public copy, metadata, schema, links, sitemap and feed; Canadian prices and canonical URLs.');
