// Exercise the actual static-site generator in a copy; never rebuild the source tree.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'reviewsboost-build-'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/),sourceHashes=new Map();
try{
 for(const file of files){const source=path.resolve(root,file),target=path.resolve(out,file);if(!source.startsWith(root+path.sep)||!target.startsWith(out+path.sep))throw Error('Unsafe build path');const bytes=fs.readFileSync(source);sourceHashes.set(file,hash(bytes));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
 const run=(file,args=[])=>{const result=cp.spawnSync(process.execPath,[file,...args],{cwd:out,encoding:'utf8'});if(result.status!==0)throw Error(result.stderr||result.stdout);return result.stdout;};
 run('apply-commercial-seo.cjs');run('build-legal-pages.cjs');run('install-measurement.cjs');
 const outputFiles=files.filter(f=>f.endsWith('.html')||['sitemap.xml','robots.txt','feed.xml'].includes(f)),first=new Map(outputFiles.map(f=>[f,hash(fs.readFileSync(path.join(out,f)))]));
 run('apply-commercial-seo.cjs');run('build-legal-pages.cjs');run('install-measurement.cjs');
 for(const file of outputFiles)assert.equal(hash(fs.readFileSync(path.join(out,file))),first.get(file),'Repeated builds must preserve '+file);
 assert.equal(fs.readFileSync(path.join(out,'index.html'),'utf8'),fs.readFileSync(path.join(root,'index.html'),'utf8'),'Generator must preserve homepage implementation/metadata');
 run('seo-audit.mjs');
 for(const [file,value]of sourceHashes)assert.equal(hash(fs.readFileSync(path.join(root,file))),value,'Source changed during build: '+file);
 console.log('PASS: isolated production legal/form generation and conditional measurement install, twice; identical output, preserved homepage, generated-site SEO audit, unchanged source.');
}finally{
 const resolved=fs.realpathSync(out);if(!resolved.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(resolved).startsWith('reviewsboost-build-'))throw Error('Unsafe temporary cleanup');fs.rmSync(resolved,{recursive:true,force:true});
}
