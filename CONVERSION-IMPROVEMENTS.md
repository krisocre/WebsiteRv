# Conversion improvements — September 10, 2026

The changes aim to reduce uncertainty before a Canadian business sends an enquiry. They have not been measured as a sales lift.

## Changes

- The homepage explains the work and next step, includes a concrete evidence-preparation example and link to the existing worksheet, and keeps other platforms lower on the page. Existing SEO titles, canonicals, language links and the two hero actions are preserved.
- All seven removal pages show CAD $0 for submitting an enquiry, the initial fee if an order proceeds, and the combined initial plus success fees. The quantity calculator and form summary stay synchronized. Platform-specific success fees and the CAD $30 initial fee per accepted review remain unchanged.
- All eight enquiry forms use two steps. Optional details are expandable, phone remains optional, and the removal concern can be selected without writing a long explanation. There is an explicit unsure choice. Customers review the fee summary before sending contact details.
- The forms distinguish an enquiry from a paid order. Written scope and terms precede ordering. Unverified high-success-rate claims were replaced with concrete screening and preparation language. No customer results, testimonials, credentials or guarantees were invented.
- Submission success now requires readable server confirmation. Pending, offline and uncertain results have clear messages; answers are preserved on errors, and repeated clicks cannot send duplicate requests. A reference and downloadable copy support follow-up. The backend update adds deduplication and transactional English/French email acknowledgements after saving the row.
- Mobile input sizing, keyboard navigation, dialog focus restoration and popup styling were checked alongside the form changes.

## Measurement

`enquiry-flow.js` emits `reviewsboost:funnel` DOM events: `form_started`, `contact_step`, `submission_started`, `submission_confirmed` and `submission_unconfirmed`. Details contain the platform and, for an unconfirmed submission, an offline flag. They contain no names, emails, profile links, notes or request references. No analytics service, tracking cookie or data collection has been installed. An event firing is not evidence of a sale.

When an approved analytics integration is available, compare confirmed enquiries per Canadian service-page visitor and the proportion of those enquiries that become eligible, paid cases. Track actual outcomes in the business records. Do not optimize only for form starts or interpret a higher submission count as higher revenue. Use a concurrent comparison or enough stable traffic to account for changes in platform mix, traffic quality and seasonality.

## Operational details still needed

Publish a real company/team identity and verified case evidence once supplied. A useful case example records the platform, policy issue, submitted date, outcome date and initial/success fees, with customer permission and private information removed. A success rate needs a defined time window and denominator that includes unsuccessful accepted cases. Platform-wide removal statistics are not ReviewsBoost's results.

The owner still needs to confirm response times, cancellation/refund rules, and terms for reviews that reappear before stronger promises can be published. The current pages defer those order-specific details to written terms before payment. The website has an enquiry funnel, not a checkout.

## Verification and rollout

The automated browser suite covers eight forms at desktop/mobile sizes, required fields, Back navigation, quantities and totals, Unicode payloads, single submission, saved receipts and offline/server/network errors. Requests are mocked. Backend/transport tests use mocked Apps Script services. The static SEO audit and HTML validation check the published page structure separately.

Follow [FORM-SETUP.md](FORM-SETUP.md) to configure and update the existing Apps Script deployment and publish the website assets. Live storage, redirect/CORS behavior, actual latency and email delivery require a controlled post-deployment check. Nothing in these local tests sends a real enquiry.
