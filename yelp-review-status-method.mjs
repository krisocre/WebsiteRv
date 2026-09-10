// ReviewsBoost original calculations, CC BY 4.0.
// Inputs: Yelp Inc., 2025 Trust & Safety Report announcement, February 25, 2026.
// Global contributions during 2025. These inputs are rounded disclosures, not raw observations.
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const source = 'https://blog.yelp.com/news/2025-trust-and-safety-report/';
export const roundedContributions = 22000000;
export const shares = [
  { status: 'Recommended', percent: 70 },
  { status: 'Not recommended', percent: 17 },
  { status: 'Removed by Yelp', percent: 11 },
  { status: 'Removed by reviewers', percent: 2 }
];

export function analysisCsv() {
  const header = 'reporting_year,geographic_scope,status,reported_share_percent,illustrative_per_10000,approximate_implied_volume,source_url';
  return [header, ...shares.map(({ status, percent }) =>
    [2025, 'Global', status, percent, percent * 100, roundedContributions * percent / 100, source].join(',')
  )].join('\n') + '\n';
}

export function composition() {
  const outsideRecommended = shares.slice(1).reduce((sum, row) => sum + row.percent, 0);
  return {
    outside_recommended_percent: outsideRecommended,
    filtered_share_of_outside_recommended_percent: 100 * shares[1].percent / outsideRecommended,
    removed_share_of_outside_recommended_percent: 100 * (shares[2].percent + shares[3].percent) / outsideRecommended,
    interpretation: 'Composition of reported categories; not report success, fraud prevalence or Canadian odds.'
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(analysisCsv());
  process.stderr.write(JSON.stringify(composition(), null, 2) + '\n');
}
