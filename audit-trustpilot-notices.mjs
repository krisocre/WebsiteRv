import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const D=JSON.parse(fs.readFileSync(path.join(root,'trustpilot-notices-2025.json'),'utf8'));
const sum=(rows,key)=>rows.reduce((value,row)=>value+(row[key]??0),0);
const categories=D.rows.filter(r=>r.row_type==='category');
const total=D.rows.find(r=>r.row_type==='total');
assert.equal(D.rows.length,92); assert.equal(categories.length,15);
assert.equal(total.notices,423762); assert.equal(total.items,397199); assert.equal(total.terms_actions,160359);
assert.equal(sum(categories,'notices'),total.notices);
assert.equal(sum(categories,'terms_actions'),total.terms_actions);
assert.equal(total.items-sum(categories,'items'),1639);
for(const ledger of D.reconciliation){
 const parent=categories.find(r=>r.category_code===ledger.category_code);
 const children=D.rows.filter(r=>r.parent_category===ledger.category_code);
 assert.equal(ledger.category_items,parent.items);
 assert.equal(ledger.subcategory_items_sum,sum(children,'items'));
 assert.equal(ledger.subcategory_minus_category_items,sum(children,'items')-(parent.items??0));
 assert.equal(ledger.category_notices,ledger.subcategory_notices_sum);
 assert.equal(ledger.category_terms_actions,ledger.subcategory_terms_actions_sum);
}
const mismatches=D.reconciliation.filter(r=>r.subcategory_minus_category_items!==0);
assert.equal(mismatches.length,2);
assert.deepEqual(mismatches.map(r=>r.subcategory_minus_category_items).sort((a,b)=>a-b),[258,1381]);
assert.equal(sum(mismatches,'subcategory_minus_category_items'),1639);
const terminal=D.rows.filter(r=>r.row_type==='subcategory' || r.row_type==='category' && !D.rows.some(c=>c.parent_category===r.category_code));
assert.equal(sum(terminal,'items'),total.items);
assert.equal(sum(terminal,'notices'),total.notices);
assert.equal(sum(terminal,'terms_actions'),total.terms_actions);
assert.equal(total.trusted_notices,1); assert.equal(sum(categories,'trusted_notices'),1);
assert.equal(total.trusted_items,0); assert.equal(sum(categories,'trusted_items'),1);
assert.equal(total.trusted_terms_actions,0); assert.equal(sum(categories,'trusted_terms_actions'),1);
assert.equal(D.summary.notices_minus_items,26563);
assert.equal(D.summary.actions_per_100_notices,total.terms_actions/total.notices*100);
assert.equal(D.summary.actions_per_100_reported_items,total.terms_actions/total.items*100);
const fake=D.rows.find(r=>r.category_code==='KEYWORD_INAUTHENTIC_USER_REVIEWS');
assert.equal(fake.notices,268444); assert.equal(fake.items,258664); assert.equal(fake.terms_actions,118056);
assert.equal(D.summary.inauthentic_review_notice_share_percent,fake.notices/total.notices*100);
assert.equal(D.summary.inauthentic_review_terms_action_share_percent,fake.terms_actions/total.terms_actions*100);
const invalidDate=D.rows.filter(r=>r.reporting_period_original.endsWith('2025-12-32'));
assert.equal(invalidDate.length,1); assert.equal(invalidDate[0].subcategory_description,'Harmful and ilegal content');
assert.equal(invalidDate[0].median_hours,null);
assert.ok(D.rows.some(r=>r.notices===null && r.items===null));
for(const row of D.rows) for(const field of D.numeric_fields) assert.ok(row[field]===null || Number.isSafeInteger(row[field]) && row[field]>=0);
// Check the public CSV independently, including blank cells and hierarchy labels.
function parseCsv(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted && text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(c===',' && !quoted){row.push(cell);cell='';}
  else if(c==='\n' && !quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}
  else cell+=c;
 }
 assert.equal(quoted,false); return rows;
}
const [headers,...records]=parseCsv(fs.readFileSync(path.join(root,'trustpilot-notices-2025.csv'),'utf8'));
assert.equal(records.length,D.rows.length);
records.forEach((cells,i)=>{assert.equal(cells.length,headers.length); headers.forEach((key,j)=>assert.equal(cells[j],D.rows[i][key]===null?'':String(D.rows[i][key])));});
const rawPath=path.join(root,'research-sources',D.source_filename);
if(fs.existsSync(rawPath)) assert.equal(createHash('sha256').update(fs.readFileSync(rawPath)).digest('hex'),D.source_sha256);
console.log('PASS: 92 source records, CSV parity, three terminal totals, 1,639-item reconciliation, trusted-flagger discrepancies and preserved blanks/date anomaly');
