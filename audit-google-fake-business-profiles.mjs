import fs from 'node:fs';
import assert from 'node:assert/strict';
const data = JSON.parse(fs.readFileSync(new URL('./google-fake-business-profile-data.json', import.meta.url), 'utf8'));
assert.equal(data.rows.length, 21);
assert.equal(new Set(data.rows.map(r => `${r.activity_year}:${r.metric}`)).size, 21);
for (const r of data.rows) {
  assert.equal(r.reported_number === null, r.qualifier === 'not_disclosed');
  assert.equal(r.unit, r.metric === 'fake_profile_actions' ? 'profiles' : 'attempts');
  if (r.reported_number !== null) assert.ok(Number.isInteger(r.reported_number) && r.reported_number > 0);
}
const profiles = data.rows.filter(r => r.metric === 'fake_profile_actions');
assert.equal(profiles.find(r => r.activity_year === 2022).reported_number, null);
assert.equal(data.rows.find(r => r.activity_year === 2022 && r.metric === 'fake_profile_creation_attempts').reported_number, 20000000);
const csv = fs.readFileSync(new URL('./google-fake-business-profile-data.csv', import.meta.url), 'utf8').trim().split(/\r?\n/);
assert.equal(csv.length, 22);
data.rows.forEach((r, i) => {
  const fields = csv[i + 1].split(',');
  assert.equal(fields[0], String(r.activity_year));
  assert.equal(fields[1], r.metric);
  assert.equal(fields[2], r.reported_number === null ? '' : String(r.reported_number));
  assert.equal(fields[3], r.qualifier);
  assert.equal(fields[4], r.action);
  assert.equal(fields[5], r.unit);
});
console.log(JSON.stringify({years: profiles.length, disclosed_profile_years: profiles.filter(r => r.reported_number !== null).length, disclosed_creation_years: data.rows.filter(r => r.metric === 'fake_profile_creation_attempts' && r.reported_number !== null).length, disclosed_ownership_years: data.rows.filter(r => r.metric === 'unauthorized_ownership_attempts' && r.reported_number !== null).length, missing_profile_years: profiles.filter(r => r.reported_number === null).map(r => r.activity_year)}, null, 2));
