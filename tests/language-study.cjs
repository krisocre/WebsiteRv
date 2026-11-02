const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto'),puppeteer=require('puppeteer');
const root=path.resolve(__dirname,'..'),output=path.join(root,'.seo-private/language-study-2026-11-02');fs.mkdirSync(output,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'reviewsboost-language-'));
try{
 const sourceHashes=new Map();
 for(const file of files){const source=path.resolve(root,file),target=path.resolve(temp,file);assert.ok(source.startsWith(root+path.sep)&&target.startsWith(temp+path.sep));const bytes=fs.readFileSync(source);sourceHashes.set(file,hash(bytes));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
 const run=file=>{const r=cp.spawnSync('python',[file],{cwd:temp,encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||r.stdout);};
 const scripts=['build-google-maps-language-data.py','audit-google-maps-language-data.py','plot-google-maps-language-study.py','build-google-maps-language-article.py'];
 for(const file of scripts)run(file);
 const generated=fs.readdirSync(temp).filter(f=>/^(?:google-maps-language|google-review-removal-language-study)/.test(f)&&!f.endsWith('.py'));
 const checkFiles=[...generated,'blog.html','index.html','google-review-policy-canada.html','sitemap.xml','feed.xml'],first=new Map(checkFiles.map(f=>[f,hash(fs.readFileSync(path.join(temp,f)))]));
 for(const file of scripts)run(file);
 for(const file of checkFiles)assert.equal(hash(fs.readFileSync(path.join(temp,file))),first.get(file),'Repeatable generation: '+file);
 for(const [file,value]of sourceHashes)assert.equal(hash(fs.readFileSync(path.join(root,file))),value,'Source changed by isolated build: '+file);
}finally{const resolved=fs.realpathSync(temp);assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(resolved).startsWith('reviewsboost-language-'));fs.rmSync(resolved,{recursive:true,force:true});}
const article=fs.readFileSync(path.join(root,'google-review-removal-language-study.html'),'utf8'),release=JSON.parse(fs.readFileSync(path.join(root,'google-maps-language-study.json'),'utf8'));
assert.equal(release.estimates.length,52);assert.equal(release.changes.length,26);assert.equal(release.within_period_pairs.length,650);
const schemas=JSON.parse(article.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const dataset=schemas.find(s=>s['@type']==='Dataset');assert.equal(dataset.spatialCoverage.name,'European Economic Area');assert.equal(dataset.temporalCoverage,'2024-07-01/2025-06-30');assert.equal(dataset.datePublished,'2026-11-02');
for(const d of dataset.distribution)assert.ok(fs.existsSync(path.join(root,new URL(d.contentUrl).pathname.slice(1))));
for(const img of schemas.filter(s=>s['@type']==='ImageObject')){const png=fs.readFileSync(path.join(root,new URL(img.contentUrl).pathname.slice(1)));assert.equal(png.readUInt32BE(16),img.width);assert.equal(png.readUInt32BE(20),img.height);}
for(const file of ['sitemap.xml','feed.xml'])assert.equal((fs.readFileSync(path.join(root,file),'utf8').match(/<loc>https:\/\/reviewsboost\.ca\/google-review-removal-language-study\.html<\/loc>|<item><title>Google review removal and language/g)||[]).length,1,'One discovery record: '+file);
const blog=fs.readFileSync(path.join(root,'blog.html'),'utf8'),list=JSON.parse(blog.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'].find(s=>s['@type']==='ItemList');assert.equal(list.itemListElement.filter(s=>s.url===release.article_url).length,1);assert.equal(list.numberOfItems,list.itemListElement.length);
const server=http.createServer((req,res)=>{if(req.method!=='GET'){res.writeHead(405).end();return;}const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':({'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});res.end(b);});});
(async()=>{let browser;await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;const errors=[],posts=[],layouts=[];
 try{browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const page=await browser.newPage();await page.setRequestInterception(true);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET'){posts.push(r.url());r.abort();}else if(r.url().startsWith(base)||r.url().startsWith('data:'))r.continue();else r.abort();});
  for(const width of [1440,768,390,320])for(const file of ['google-review-removal-language-study.html','blog.html']){
   await page.setViewport({width,height:900});await page.goto(base+'/'+file,{waitUntil:'networkidle0'});await page.$$eval('img',imgs=>imgs.forEach(i=>{i.loading='eager';}));await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
   assert.equal(await page.$$eval('h1',n=>n.length),1);assert.equal(await page.$$eval('title',n=>n.length),1);assert.equal(await page.$$eval('link[rel=canonical]',n=>n.length),1);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file+' overflow at '+width);
   if(file.startsWith('google-review-removal-language')){assert.equal(await page.$$eval('.data-figure',n=>n.length),3);await page.$eval('article details',d=>{d.open=true;});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Expanded table stays in its scroll region');}
   layouts.push({file,width});if(width===1440||width===390)await page.screenshot({path:path.join(output,file+'-'+width+'.png')});
  }
  await page.setJavaScriptEnabled(false);await page.goto(base+'/google-review-removal-language-study.html',{waitUntil:'load'});assert.equal(await page.$$eval('article .data-figure',n=>n.length),3);assert.ok((await page.$eval('article',n=>n.textContent)).includes('650'));
  assert.deepEqual(posts,[]);assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'layout-check.json'),JSON.stringify(layouts,null,2));console.log('PASS: repeatable isolated data/plot/article/discovery build; source remains unchanged; Dataset/ImageObject dimensions and downloads; unique blog/RSS/sitemap discovery; article/blog at four widths, expanded tables and no-JavaScript content. No live collection or submissions.');
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
