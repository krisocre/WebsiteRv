(function () {
  'use strict';
  var form = document.getElementById('evidenceForm');
  var concern = document.getElementById('concern');
  var checklist = document.getElementById('evidenceChecklist');
  var output = document.getElementById('caseOutput');
  var preview = document.getElementById('casePreview');
  var status = document.getElementById('caseStatus');
  var policies = 'https://support.google.com/contributionpolicy/answer/7400114';
  var reporting = 'https://support.google.com/business/answer/4596773';
  var scenarios = {
    conflict: { label: 'Possible conflict of interest', note: 'Explain the relationship and how the evidence connects it to this author. A shared name alone is not enough.', evidence: ['Dated source supporting the employment or competitor relationship', 'Evidence connecting that relationship to the review author', 'Review URL and screenshot with date captured'] },
    spam: { label: 'Repeated, promotional or unrelated content', note: 'Identify the specific repeated wording or unrelated subject. Keep a suspected pattern separate from a claim about who caused it.', evidence: ['Direct URLs for the relevant posts', 'Matching excerpts or specific unrelated content', 'Timeline of when the posts were observed'] },
    privacy: { label: 'Possible personal information exposure', note: 'Identify the exposed information privately. Public-facing professional names may be allowed; context matters.', evidence: ['Private copy of the relevant content in context', 'Explanation of what information is exposed and whose it is', 'Review URL and date captured'] },
    harassment: { label: 'Possible threats or harassment', note: 'Preserve the words in context and identify the specific threat or targeted conduct.', evidence: ['Exact relevant excerpt with surrounding context', 'Dated screenshot and direct review URL', 'Related messages or posts, if relevant'] },
    extortion: { label: 'Direct demand connected to review removal', note: 'Use the dedicated channel only for a direct demand for money or favours to remove reviews. Preserve the demand and related review links; do not pay or engage with the sender.', evidence: ['Original demand showing sender, date and time', 'Links to reviews connected to the demand', 'Timeline connecting the reviews and the demand'] },
    unknown: { label: 'Unrecognized reviewer: evidence gap', note: 'A missing customer record does not establish fake engagement. Investigate the stated experience and any independently verifiable inconsistency before alleging a violation.', evidence: ['Records and date range checked, documented privately', 'Specific verifiable inconsistency beyond an unrecognized name', 'Review URL and full context'] },
    negative: { label: 'Negative opinion: no policy issue established', note: 'Disagreement or a low rating alone is not a removal basis. Review the underlying concern and prepare a measured public response.', evidence: ['Specific service concern to investigate', 'Relevant internal facts recorded privately', 'A proposed resolution or contact route'] }
  };
  var stages = {
    new: 'If your evidence supports a policy concern, choose the closest reason in Google\'s reporting flow. Save the submission date.',
    pending: 'Monitor the existing report in the Reviews Management Tool. Keep this worksheet with that case while the decision is pending.',
    rejected: 'Check whether a one-time appeal is available. Identify the policy issue and the supporting evidence the earlier decision may have missed.',
    appealed: 'Follow the existing appeal and check the account email for its result. Keep the case reference with your evidence.'
  };

  document.getElementById('checkerFields').disabled = false;
  concern.addEventListener('change', function () {
    checklist.replaceChildren();
    var scenario = scenarios[concern.value];
    checklist.hidden = !scenario;
    if (!scenario) return;
    var title = document.createElement('strong');
    title.textContent = '2. Mark the evidence you already have';
    checklist.append(title);
    scenario.evidence.forEach(function (item, index) {
      var label = document.createElement('label');
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'evidence';
      input.value = String(index);
      label.append(input, document.createTextNode(item));
      checklist.append(label);
    });
  });
  form.addEventListener('input', function () {
    if (!output.hidden) status.textContent = 'Details changed. Build the worksheet again to update it.';
    output.hidden = true;
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var scenario = scenarios[concern.value];
    if (!scenario) return;
    var stage = document.getElementById('reportStage');
    var isExtortion = concern.value === 'extortion';
    var unsupported = concern.value === 'unknown' || concern.value === 'negative';
    var advice = scenario.note + (isExtortion || unsupported && stage.value === 'new' ? '' : ' ' + stages[stage.value]);
    var route = isExtortion ? 'https://support.google.com/business/answer/16404809' : reporting;
    document.getElementById('caseAdvice').textContent = advice;
    var official = document.getElementById('officialRoute');
    official.href = route;
    official.textContent = isExtortion ? "Open Google's extortion reporting guidance" : "Open Google's reporting and appeal guidance";
    var evidence = Array.from(checklist.querySelectorAll('input')).map(function (input, index) {
      return (input.checked ? '[Have] ' : '[To prepare] ') + scenario.evidence[index];
    });
    var business = document.getElementById('caseBusiness').value.trim();
    var review = document.getElementById('caseReview').value.trim();
    var facts = document.getElementById('caseFacts').value.trim();
    var text = [
      'GOOGLE REVIEW CASE WORKSHEET', 'Prepared with ReviewsBoost | Method v1.0',
      'https://reviewsboost.ca/google-review-removal-checker.html', '',
      'Business: ' + (business || '[Add business and location]'),
      'Review URL: ' + (review || '[Add direct review URL]'),
      'Reporting stage: ' + stage.options[stage.selectedIndex].text,
      'Existing case reference: [Add if applicable]', '',
      'CONCERN TO ASSESS', scenario.label, 'Policy reference: ' + policies, '',
      'FACTS PROVIDED BY YOU (not independently verified)', facts || '[Add dated, verifiable facts and attachment references]', '',
      'EVIDENCE CHECKLIST', evidence.join('\n'), '',
      'UNCERTAINTIES', '[Add missing evidence and alternative explanations]', '',
      'NEXT STEP', advice, 'Official guidance: ' + route, '',
      'Google decides removal. This worksheet has not been submitted. Keep sensitive evidence private.'
    ].join('\n');
    preview.textContent = text;
    output.hidden = false;
    status.textContent = 'Worksheet ready. Review the preview before copying or downloading.';
    output.focus();
  });
  document.getElementById('copyCase').addEventListener('click', async function () {
    try {
      await navigator.clipboard.writeText(preview.textContent);
      status.textContent = 'Worksheet copied.';
    } catch (error) {
      var range = document.createRange();
      range.selectNodeContents(preview);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Automatic copy is unavailable. Copy the selected preview or use Download .txt.';
    }
  });
  document.getElementById('downloadCase').addEventListener('click', function () {
    var url = URL.createObjectURL(new Blob([preview.textContent], { type: 'text/plain;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = 'google-review-case-worksheet.txt';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    status.textContent = 'Worksheet download started.';
  });
})();
