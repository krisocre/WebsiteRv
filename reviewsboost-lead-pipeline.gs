/**
 * Run once as the owner in the separate ReviewsBoost Apps Script project.
 * Uses the configured leads tab. The deployed submission handler stays in place.
 */
function setupReviewsBoostLeadPipeline() {
  const stageHeader = 'ReviewsBoost Stage';
  const reportTitle = 'ReviewsBoost Lead Funnel';
  const stages = ['New', 'Qualified', 'Paid', 'Not qualified'];
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const leadSheet = reviewsBoostSubmissionSheet(reviewsBoostFormSettings());
    const spreadsheet = leadSheet.getParent();
    const headers = leadSheet.getRange(1, 1, 1, Math.max(12, leadSheet.getLastColumn())).getValues()[0];
    if (headers[0] !== 'Timestamp' || headers[11] !== 'Reason') {
      throw new Error('The configured ReviewsBoost leads tab needs Timestamp in A1 and Reason in L1.');
    }
    let report = spreadsheet.getSheetByName(reportTitle);
    if (report && report.getRange('A1').getValue() !== reportTitle) {
      throw new Error('A different sheet already uses the name ' + reportTitle + '.');
    }
    if (headers.filter(header => header === stageHeader).length > 1) {
      throw new Error('There is more than one ' + stageHeader + ' column.');
    }

    let stageColumn = headers.indexOf(stageHeader) + 1;
    if (!stageColumn) {
      stageColumn = leadSheet.getLastColumn() + 1;
      if (stageColumn > leadSheet.getMaxColumns()) leadSheet.insertColumnAfter(leadSheet.getMaxColumns());
      leadSheet.getRange(1, stageColumn).setValue(stageHeader);
    }
    const stageRule = SpreadsheetApp.newDataValidation().requireValueInList(stages, true)
      .setAllowInvalid(false).build();
    if (leadSheet.getMaxRows() < 2) leadSheet.insertRowsAfter(1, 1);
    leadSheet.getRange(2, stageColumn, leadSheet.getMaxRows() - 1, 1).setDataValidation(stageRule);

    if (!report) {
      report = spreadsheet.insertSheet(reportTitle);
      report.getRange('A1').setValue(reportTitle);
      report.getRange('B2:B3').setFormulas([['=EOMONTH(TODAY(),-1)+1'], ['=TODAY()']]);
    }
    const source = "'" + leadSheet.getName().replace(/'/g, "''") + "'!";
    const stageAddress = leadSheet.getRange(2, stageColumn).getA1Notation().replace(/\d+$/, '');
    const stageRange = source + stageAddress + '2:' + stageAddress;
    const dates = source + 'A2:A,">="&$B$2,' + source + 'A2:A,"<"&($B$3+1)';
    const reason = source + 'L2:L';
    const cohort = dates + ',' + reason + ',"*Request reference: RB-*"';

    function count(conditions, stage) {
      return 'COUNTIFS(' + conditions + (stage ? ',' + stageRange + ',"' + stage + '"' : '') + ')';
    }
    function row(label, sourceFilter) {
      const conditions = cohort + (sourceFilter ? ',' + reason + ',"' + sourceFilter + '"' : '');
      return [
        label, '=' + count(conditions), '=' + count(conditions, 'Qualified') + '+' + count(conditions, 'Paid'), '=' + count(conditions, 'Paid')
      ];
    }

    report.getRange('A2:A4').setValues([['Lead date from'], ['Lead date through'], ['Google Ads spend (CAD)']]);
    report.getRange('B2:B3').setNumberFormat('yyyy-mm-dd');
    report.getRange('B4').setNumberFormat('0.00');
    report.getRange('A6:D9').setValues([
      ['Lead source', 'Enquiries', 'Qualified or paid', 'Paid'],
      row('All tagged ReviewsBoost requests', ''),
      row('Google Ads', '*[Traffic Source: Paid - Google Ads]*'),
      row('Organic search', '*[Traffic Source: Organic -*')
    ]);
    report.getRange('A11:A12').setValues([['Cost per qualified Google Ads enquiry'], ['Cost per paid Google Ads case']]);
    report.getRange('B11:B12').setFormulas([
      ['=IF(AND(ISNUMBER(B4),B4>=0,C8>0),B4/C8,"")'],
      ['=IF(AND(ISNUMBER(B4),B4>=0,D8>0),B4/D8,"")']
    ]).setNumberFormat('0.00');
    report.getRange('A14').setValue('Enter Google Ads spend for the same date range. Counts use the current stage of requests submitted during that range.');
    report.getRange('A15').setValue('Only rows with a ReviewsBoost request reference are included. A blank stage counts as new.');
    report.getRange('A1:D1').setFontWeight('bold');
    report.getRange('A6:D6').setFontWeight('bold');
    report.setColumnWidth(1, 310);
    report.setColumnWidths(2, 3, 145);
    return { leads: leadSheet.getName(), stageColumn, report: report.getName() };
  } finally {
    lock.releaseLock();
  }
}
