// Aggregate integrity and browser QA. No third-party collection or lead submissions.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),cp=require('node:child_process'),crypto=require('node:crypto'),puppeteer=require('puppeteer');
const root=path.resolve(__dirname,'..'),file='google-review-extortion-canada-data-study.html';
const d=JSON.parse(fs.readFileSync(path.join(root,'google-review-extortion-study.json'),'utf8'));
assert.equal(d.filters.selected_records,22801);assert.equal(d.findings.zero_recorded_loss,20636);
assert.equal(d.annual.reduce((n,row)=>n+row.report_records,0),22801);
assert.equal(d.annual.reduce((n,row)=>n+row.zero_recorded_loss,0),20636);
assert.equal(d.status_loss.reduce((n,row)=>n+row.report_records,0),22801);
assert.equal(d.status_loss.find(row=>row.complaint_status==='Victim'&&row.loss_class==='Zero recorded loss').report_records,4328);
for(const field of ['Solicitation Method','Complaint Received Type'])assert.equal(d.channels.filter(row=>row.source_field===field).reduce((n,row)=>n+row.report_records,0),22801);
assert.equal(d.annual.length+d.status_loss.length+d.channels.length,31);
assert.equal(d.annual.find(row=>row.year===2025).period,'January-September only');
for(const [name,n]of [['annual',5],['status-loss',6],['channels',20]])assert.equal(fs.readFileSync(path.join(root,'google-review-extortion-'+name+'.csv'),'utf8').trim().split(/\r?\n/).length,n+1);
const html=fs.readFileSync(path.join(root,file),'utf8');
const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(schema['@graph'].find(node=>node['@type']==='Dataset').name,d.title);
assert.ok(html.includes('not 22,801 Google review attacks'));assert.ok(!/reviewremoval\.ca|reviewsresolve\.com/.test(html));
const blog=fs.readFileSync(path.join(root,'blog.html'),'utf8');
assert.equal((blog.match(/<!-- extortion research card start -->/g)||[]).length,1);
const blogSchema=JSON.parse(blog.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.ok(blogSchema['@graph'].some(node=>node['@type']==='ItemList'&&node.itemListElement.some(item=>item.url===d.article_url)));
const publicFiles=[file,'blog.html','feed.xml','sitemap.xml'];
const hash=name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');
const before=publicFiles.map(hash);cp.execFileSync('python',['build-google-extortion-article.py'],{cwd:root});cp.execFileSync(process.execPath,['install-measurement.cjs'],{cwd:root});assert.deepEqual(publicFiles.map(hash),before,'Repeat generation must preserve output and prevent duplicate discovery entries');
const output=path.join(root,'.seo-private/extortion-article-20261113');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local'),target=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
 if(req.method!=='GET'||!target.startsWith(root+path.sep)||!fs.existsSync(target)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',({'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.csv':'text/csv','.json':'application/json','.txt':'text/plain','.py':'text/plain'})[path.extname(target)]||'application/octet-stream');res.end(fs.readFileSync(target));
});
(async()=>{let browser;try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
 browser=await puppeteer.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const page=await browser.newPage(),errors=[],posts=[],layouts=[];
 page.on('pageerror',error=>errors.push(error.message));await page.setRequestInterception(true);page.on('request',request=>{if(request.method()!=='GET')posts.push(request.url());if(request.method()==='GET'&&(request.url().startsWith(base)||request.url().startsWith('data:')))return request.continue();return request.abort();});
 for(const name of [file,'blog.html'])for(const width of [1440,768,390,320]){
  await page.setViewport({width,height:1000});assert.equal((await page.goto(base+name,{waitUntil:'networkidle0'})).status(),200);
  assert.equal(await page.$$eval('h1',nodes=>nodes.length),1);assert.equal(await page.$$eval('title',nodes=>nodes.length),1);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,name+' overflow at '+width);layouts.push({file:name,width,overflow});
  assert.equal(await page.$eval('#measurement-preferences',node=>node.hidden),true,'The new article does not restore an automatic cookie banner');
  if(name===file){
   assert.equal(await page.$eval('.toc details',node=>node.open),false,'Contents disclosure does not displace the opening text on mobile');
   await page.click('.toc summary');assert.equal(await page.$eval('.toc details',node=>node.open),true);
   await page.keyboard.press('Space');assert.equal(await page.$eval('.toc details',node=>node.open),false);
   await page.$$eval('.data-figure img',nodes=>nodes.forEach(node=>node.loading='eager'));await page.waitForFunction(()=>Array.from(document.querySelectorAll('.data-figure img')).every(node=>node.complete&&node.naturalWidth>0));
   assert.equal(await page.$$eval('.data-figure',nodes=>nodes.length),3);
   if([1440,390].includes(width)){await page.screenshot({path:path.join(output,'article-'+width+'.png')});await(await page.$('.data-figure')).screenshot({path:path.join(output,'figure-'+width+'.png')});}
  }
 }
 await page.goto(base+'blog.html',{waitUntil:'networkidle0'});await page.click('a[href="'+file+'"]');assert.ok(page.url().endsWith(file));
 await page.setJavaScriptEnabled(false);await page.reload({waitUntil:'networkidle0'});assert.equal(await page.$$eval('.comparison tbody tr',nodes=>nodes.length),9,'Both result tables remain complete without JS');
 for(const name of ['annual.csv','status-loss.csv','channels.csv','study.json','analysis.py','evidence-worksheet.txt','study.bib'])assert.equal((await fetch(base+'google-review-extortion-'+name)).status,200);
 assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);fs.writeFileSync(path.join(output,'browser-checks.json'),JSON.stringify({layouts,errors,realPostRequests:posts.length,aggregateRows:31,noJsTables:true},null,2));
 console.log('PASS: 31 aggregate rows, scope/denominators, stable generation, schema/blog discovery, eight layouts, chart loading, no-JS tables and seven downloads. Zero real submissions.');
}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}})().catch(error=>{console.error(error);process.exitCode=1;});
