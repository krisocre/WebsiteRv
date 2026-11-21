const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'reviewsboost-lead-pipeline.gs'), 'utf8');

function fixture({ timeHeader = 'Timestamp', reportTitle } = {}) {
  const cells = new Map();
  const leadName = "Leads 'Canada'";
  const stageRule = {};
  const headers = [timeHeader, 'Plan', 'Name', 'Business', 'Email', 'Phone', 'Method', 'Contact',
    'Profile', 'Count', 'Links', 'Reason', 'Owner notes'];
  let changes = 0;
  let releases = 0;
  let rule;

  function range(key) {
    return {
      getValue: () => cells.get(key) || '',
      setValue(value) { changes++; cells.set(key, value); return this; },
      setValues(values) { changes++; cells.set(key, values); return this; },
      setFormulas(values) { changes++; cells.set(key, values); return this; },
      setNumberFormat() { return this; },
      setFontWeight() { return this; }
    };
  }
  const report = {
    getRange: range,
    setColumnWidth() {},
    setColumnWidths() {},
    getName: () => 'ReviewsBoost Lead Funnel'
  };
  let existing = reportTitle ? report : null;
  if (reportTitle) cells.set('A1', reportTitle);
  const spreadsheet = {
    getSheetByName: () => existing,
    insertSheet() { existing = report; return report; }
  };
  const leads = {
    getName: () => leadName,
    getParent: () => spreadsheet,
    getLastColumn: () => headers.length,
    getMaxColumns: () => 26,
    getMaxRows: () => 100,
    getRange(row, column, rows) {
      if (row === 1 && column === 1) return { getValues: () => [headers] };
      if (row === 1) return { setValue(value) { changes++; headers[column - 1] = value; } };
      if (rows) return { setDataValidation(value) { assert.equal(rows, 99); rule = value; } };
      return { getA1Notation: () => String.fromCharCode(64 + column) + row };
    }
  };
  const context = {
    reviewsBoostFormSettings: () => ({}),
    reviewsBoostSubmissionSheet: () => leads,
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() { releases++; } }) },
    SpreadsheetApp: { newDataValidation: () => ({
      requireValueInList(stages) {
        assert.equal(stages.join(','), 'New,Qualified,Paid,Not qualified');
        return this;
      },
      setAllowInvalid(metric) { assert.equal(metric, false); return this; },
      build: () => stageRule
    }) }
  };
  vm.runInNewContext(source, context);
  return {
    setup: context.setupReviewsBoostLeadPipeline, cells, headers,
    changes: () => changes, releases: () => releases, rule: () => rule
  };
}

test('uses a separate stage column and preserves report inputs when rerun', () => {
  const f = fixture();
  assert.equal(f.setup().stageColumn, 14);
  assert.equal(f.headers[12], 'Owner notes');
  assert.equal(f.headers[13], 'ReviewsBoost Stage');
  assert.ok(f.rule());
  const rows = f.cells.get('A6:D9');
  assert.match(rows[2][1], /Request reference: RB-/);
  assert.match(rows[2][1], /Traffic Source: Paid - Google Ads/);
  assert.ok(rows[2][2].includes("'Leads ''Canada'''!N2:N"));
  assert.match(rows[2][2], /Qualified.*Paid/);
  assert.match(f.cells.get('B11:B12')[0][0], /B4\/C8/);
  assert.match(f.cells.get('B11:B12')[1][0], /B4\/D8/);
  f.cells.set('B4', 250);
  f.cells.set('B2:B3', 'owner date range');
  assert.equal(f.setup().stageColumn, 14);
  assert.equal(f.headers.length, 14);
  assert.equal(f.cells.get('B4'), 250);
  assert.equal(f.cells.get('B2:B3'), 'owner date range');
  assert.equal(f.releases(), 2);
});

test('leaves unrelated tabs and unexpected lead headers alone', () => {
  for (const f of [fixture({ timeHeader: 'Different sheet' }), fixture({ reportTitle: 'My private notes' })]) {
    assert.throws(f.setup);
    assert.equal(f.changes(), 0);
    assert.equal(f.releases(), 1);
  }
});
