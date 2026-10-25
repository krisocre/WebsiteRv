import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const D=JSON.parse(fs.readFileSync(path.join(root,'google-removal-time-analysis.json'),'utf8'));
const I=JSON.parse(fs.readFileSync(path.join(root,'google-removal-time-source-values.json'),'utf8'));
const days=(a,b)=>(Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000;
assert.equal(D.cohorts.length,7);assert.equal(D.periods.length,6);assert.equal(D.synthetic_scenarios.length,2);
assert.deepEqual(D.cohorts.map(r=>r.conditional_lifespan_lower_days),[2130,1400,669,0,0,0,0]);
assert.deepEqual(D.cohorts.map(r=>r.conditional_lifespan_upper_days),[3318,2588,1857,1127,762,396,31]);
assert.equal(D.cohorts.reduce((n,c)=>n+c.count,0),50901);
for(const [i,c] of D.cohorts.entries()){
 for(const key of ['year','count','median_lifespan_days','removed_within_30_days_percent'])assert.equal(c[key],I.cohorts[i][key]);
 assert.equal(c.conditional_lifespan_lower_days,Math.max(0,days(c.creation_end_exclusive,c.assumed_observation_start_inclusive)));
 assert.equal(c.conditional_lifespan_upper_days,days(c.creation_start_inclusive,c.assumed_observation_end_exclusive));
 assert.equal(c.upper_inclusive,false);assert.equal(c.lower_inclusive,c.conditional_lifespan_lower_days===0);
 assert.ok(c.median_lifespan_days>=c.conditional_lifespan_lower_days&&c.median_lifespan_days<c.conditional_lifespan_upper_days);
}
assert.ok(D.cohorts.slice(0,3).every(r=>r.endpoint_31_days==='impossible_within_31_days'));
assert.equal(D.cohorts.at(-1).endpoint_31_days,'necessarily_under_31_days');
for(const p of D.periods){assert.equal(p.implied_deletions_from_displayed_mean,p.displayed_average_monthly_deletions*p.months);assert.equal(p.months,(Number(p.end_exclusive.slice(0,4))-Number(p.start.slice(0,4)))*12+Number(p.end_exclusive.slice(5,7))-Number(p.start.slice(5,7)));}
assert.equal(D.periods.reduce((n,p)=>n+p.months,0),27);
assert.equal(D.periods.reduce((n,p)=>n+p.implied_deletions_from_displayed_mean,0),335513);
assert.equal(D.summary.reported_total_minus_implied_total,7);
assert.equal(D.summary.nearest_integer_mean_model_total_lower_inclusive,335499.5);
assert.equal(D.summary.nearest_integer_mean_model_total_upper_exclusive,335526.5);
assert.equal(D.summary.nearest_integer_mean_model_compatible_with_reported_total,true);
for(const s of D.synthetic_scenarios){
 assert.equal(s.record_type,'synthetic_illustration_not_google_observations');assert.equal(s.source_url,null);
 assert.equal(s.deleted_count+s.still_visible_at_day_30,s.starting_reviews);
 // Independently build the observed event set and calculate its median.
 const events=Array(s.deleted_count).fill(s.deleted_on_day).sort((a,b)=>a-b);
 const median=events.length%2?events[Math.floor(events.length/2)]:(events[events.length/2-1]+events[events.length/2])/2;
 assert.equal(median,s.deleted_only_median_days);assert.equal(median,5);
 assert.equal(s.population_median_deletion_day,s.deleted_count>=s.starting_reviews/2?5:null);
}
function parseCsv(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}assert.equal(quoted,false);return rows;}
for(const [file,rows] of [['google-removal-time-cohorts.csv',D.cohorts],['google-removal-time-periods.csv',D.periods],['google-removal-time-scenarios.csv',D.synthetic_scenarios]]){
 const [headers,...values]=parseCsv(fs.readFileSync(path.join(root,file),'utf8'));assert.equal(values.length,rows.length);
 values.forEach((cells,i)=>{assert.equal(cells.length,headers.length);headers.forEach((key,j)=>{
  if(typeof rows[i][key]==='number'){assert.notEqual(cells[j],'');assert.equal(Number(cells[j]),rows[i][key]);}
  else assert.equal(cells[j],rows[i][key]==null?'':String(rows[i][key]));
 });});
}
const raw=path.join(root,'research-sources','removal-time','localo-body.txt');
if(fs.existsSync(raw))assert.equal(createHash('sha256').update(fs.readFileSync(raw)).digest('hex'),I.source_capture_sha256);
const tablesPath=path.join(root,'research-sources','removal-time','localo-tables.json');
if(fs.existsSync(tablesPath)){
 const T=JSON.parse(fs.readFileSync(tablesPath,'utf8'));
 for(const [i,c] of I.cohorts.entries()){
  assert.equal(Number(T.cohorts[i+1][1].replaceAll(',','')),c.count);
  assert.equal(Number(T.cohorts[i+1][2].replaceAll(',','').replace(' days','')),c.median_lifespan_days);
  assert.equal(Number(T.cohorts[i+1][3].replace('%','')),c.removed_within_30_days_percent);
 }
 for(const [i,p] of I.periods.entries())assert.equal(Number(T.periods[i+1][1].replaceAll(',','')),p.displayed_average_monthly_deletions);
}
console.log('PASS: seven source cohorts, six weighted periods, calendar bounds, separate synthetic medians, three CSVs and source capture when available.');
