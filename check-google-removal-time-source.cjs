/* Optional live table check. Requires Puppeteer and Chrome, no sign-in.
   Download beside google-removal-time-source-values.json or run in this repo.
   Live captures stay in the ignored research-sources folder. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const puppeteer=require('puppeteer');
const I=require('./google-removal-time-source-values.json');
(async()=>{
  const chrome=process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
  const browser=await puppeteer.launch({headless:true,executablePath:chrome});
  try{
    const page=await browser.newPage();await page.setRequestInterception(true);
    page.on('request',r=>/googletagmanager|google-analytics/.test(r.url())?r.abort():r.continue());
    await page.goto(I.source_url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('table',{timeout:15000});
    const tables=await page.$$eval('table',es=>es.map(e=>[...e.rows].map(r=>[...r.cells].map(c=>c.innerText.trim()))));
    const cohorts=tables.find(t=>t[0].some(c=>/Year created/.test(c)));
    const periods=tables.find(t=>t[0].some(c=>/Avg monthly deletions/.test(c)));
    assert.ok(cohorts&&periods,'Source tables changed; recheck the study before updating the dataset.');
    assert.equal(cohorts.length-1,I.cohorts.length);assert.equal(periods.length-1,I.periods.length);
    const numeric=s=>Number(s.replaceAll(',','').replace(' days','').replace('%',''));
    for(const [i,c] of I.cohorts.entries()){
      assert.equal(cohorts[i+1][0],c.source_year_label);assert.equal(numeric(cohorts[i+1][1]),c.count);
      assert.equal(numeric(cohorts[i+1][2]),c.median_lifespan_days);assert.equal(numeric(cohorts[i+1][3]),c.removed_within_30_days_percent);
    }
    for(const [i,p] of I.periods.entries())assert.equal(numeric(periods[i+1][1]),p.displayed_average_monthly_deletions);
    const text=await page.$eval('body',e=>e.innerText);
    const cache=path.join(__dirname,'research-sources','removal-time');fs.mkdirSync(cache,{recursive:true});
    fs.writeFileSync(path.join(cache,'localo-body-live-check.txt'),text);
    fs.writeFileSync(path.join(cache,'localo-tables-live-check.json'),JSON.stringify({cohorts,periods},null,2));
    console.log('PASS: seven cohort rows and six period means match published inputs. Live body SHA-256:',createHash('sha256').update(text).digest('hex'));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
