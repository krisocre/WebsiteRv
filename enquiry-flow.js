(function () {
  'use strict';
  var form = document.querySelector('#removalForm, #platformRemovalForm, #reputationForm');
  if (!form) return;
  var fr = document.documentElement.lang === 'fr-CA';
  var reputation = form.id === 'reputationForm';
  var inline = form.hasAttribute('data-inline-enquiry');
  var platform = reputation ? 'Reputation' : document.body.dataset.platform || 'Google';
  var fee = Number(document.body.dataset.successFee || 95);
  var submit = form.querySelector('[type="submit"]');
  var status = form.querySelector('[role="status"]');
  var success = document.getElementById('removalSuccess') || document.getElementById('platformSuccess');
  var step = 0, busy = false, locked = false, started = false;
  var reference = '';
  var originalButtonClasses = submit.className;
  if (!success) {
    success = document.createElement('div');
    success.className = 'platform-success';
    success.hidden = true; success.tabIndex = -1;
    success.setAttribute('role', 'status');
    success.innerHTML = '<h2>Request sent</h2><button type="button" class="button">Send another request</button>';
    form.after(success);
    success.querySelector('button').addEventListener('click', function () { success.hidden = true; form.hidden = false; focus(); });
  }
  var confirmationRegion = form.closest('.assessment-section, .form-layout, .contact-layout');
  success.id = success.id || 'platformSuccess';
  var confirmationDialog = form.closest('[role="dialog"]');
  var dialogLabel = confirmationDialog?.getAttribute('aria-labelledby');
  var successHeading = success.querySelector('h2');
  var restartButton = success.querySelector('button');
  var successMark = element('span', 'enquiry-success-mark');
  successMark.setAttribute('aria-hidden', 'true');
  successMark.innerHTML = '<svg viewBox="0 0 32 32" width="32" height="32" fill="none"><path d="m8 16 5.5 5.5L25 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  successHeading.id = successHeading.id || 'platformSuccessTitle';
  successHeading.classList.add('enquiry-success-title');
  successHeading.textContent = fr ? 'Demande envoyée' : 'Request sent';
  restartButton.classList.add('enquiry-success-reset');
  restartButton.textContent = fr ? 'Envoyer une autre demande' : 'Send another request';
  success.replaceChildren(successMark, successHeading, restartButton);
  success.classList.add('enquiry-success');
  success.setAttribute('role', 'status');
  success.setAttribute('aria-live', 'polite');
  success.setAttribute('aria-atomic', 'true');
  success.setAttribute('aria-labelledby', successHeading.id);
  success.tabIndex = -1;
  restartButton.addEventListener('click', function (event) {
    // Reopen the form in place, including the Yelp dialog, instead of closing it.
    event.stopImmediatePropagation();
    success.hidden = true;
    form.hidden = false;
    confirmationRegion?.classList.remove('is-submitted');
    var intro = document.getElementById('removalFormIntro'); if (intro) intro.hidden = false;
    if (confirmationDialog && dialogLabel) confirmationDialog.setAttribute('aria-labelledby', dialogLabel);
    show(0, true);
  }, true);
  var stages = [];
  form.classList.add('enquiry-form');
  form.noValidate = true;

  function emit(name, detail) {
    // Local integration hook only: no analytics request, cookies or personal data.
    document.dispatchEvent(new CustomEvent('reviewsboost:funnel', {
      detail: Object.assign({ event: name, platform: platform }, detail || {})
    }));
  }
  function element(tag, cls, value) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value) node.textContent = value;
    return node;
  }
  function field(name) { return form.elements.namedItem(name); }
  function move(name, parent) {
    var input = field(name);
    if (!input) return;
    parent.appendChild(input.closest('.field, .form-group'));
    if (input.type === 'text') input.maxLength = 250;
    if (input.type === 'url') input.maxLength = 2048;
    if (input.tagName === 'TEXTAREA') input.maxLength = 4000;
  }
  function extras(parent, label, names) {
    var details = element('details', 'enquiry-extra');
    details.appendChild(element('summary', '', label));
    var grid = element('div', 'enquiry-grid');
    names.forEach(function (name) { move(name, grid); });
    details.appendChild(grid);
    parent.appendChild(details);
    return details;
  }
  var progress = element('ol', 'enquiry-progress');
  progress.setAttribute('aria-label', fr ? 'Étapes de la demande' : 'Request steps');
  [fr ? 'Votre avis' : 'Your review', fr ? 'Vos coordonnées' : 'Your details'].forEach(function (label, index) {
    if (reputation && index === 0) label = 'Your concern';
    progress.appendChild(element('li', '', label));
    var section = element('div', 'enquiry-grid');
    section.setAttribute('role', 'group');
    section.setAttribute('aria-label', label);
    stages.push(section);
  });
  form.prepend(progress);
  progress.hidden = inline;
  progress.after(stages[0], stages[1]);
  if (inline) {
    stages[0].setAttribute('aria-label', 'Assessment details');
    stages[1].setAttribute('aria-label', 'Optional information');
    ['full_name', 'business_name', 'email_address'].forEach(function (name) { move(name, stages[0]); });
  }
  move('business_url', stages[0]);
  if (reputation) {
    move('selected_plan', stages[0]);
    move('reason', stages[0]);
  } else {
    move('review_count', stages[0]);
    var categoryField = element('div', 'field full');
    var categoryLabel = element('label', '', fr ? 'Quel est le problème? *' : inline ? 'Review concern (optional)' : 'What concerns you about the review? *');
    categoryLabel.htmlFor = 'enquiryCategory';
    var category = element('select');
    category.id = 'enquiryCategory';
    category.name = 'concern_category';
    category.required = !inline;
    var options = fr
      ? ['Choisissez un motif', 'Aucune expérience réelle', 'Conflit d’intérêts', 'Harcèlement ou menaces', 'Renseignements personnels', 'Pourriel ou publicité', 'Contenu hors sujet', 'Je ne sais pas — aidez-moi à évaluer']
      : ['Choose a concern', 'No genuine experience', 'Conflict of interest', 'Harassment or threats', 'Personal information', 'Spam or advertising', 'Off-topic content', 'Unsure — please assess'];
    options.forEach(function (label, index) { category.add(new Option(label, index ? label : '')); });
    categoryField.append(categoryLabel, category);
    var reason = field('reason');
    reason.required = false;
    reason.placeholder = fr ? 'Ajoutez du contexte utile. Aucun document privé ni mot de passe.' : 'Add useful context. Keep private records and passwords out of this form.';
    form.querySelector('label[for="' + reason.id + '"]').textContent = fr ? 'Contexte supplémentaire (facultatif)' : 'Additional context (optional)';
    if (inline) {
      var optional = extras(stages[1], 'Add review details or a phone number (optional)', ['review_links', 'reason', 'phone_number']);
      optional.querySelector('.enquiry-grid').prepend(categoryField);
    } else {
      stages[0].appendChild(categoryField);
      extras(stages[0], fr ? 'Ajouter des liens ou du contexte (facultatif)' : 'Add review links or context (optional)', ['review_links', 'reason']);
    }
  }
  if (!inline) ['full_name', 'business_name', 'email_address'].forEach(function (name) { move(name, stages[1]); });
  field('business_name').placeholder = inline ? '' : fr ? 'Entreprise — ville, province' : 'Business — city, province';
  field('email_address').maxLength = 254;
  if (!inline) extras(stages[1], fr ? 'Ajouter un téléphone (facultatif)' : 'Add a phone number (optional)', ['phone_number']);
  // Remove empty layout wrappers after moving the existing inputs and listeners.
  Array.from(form.children).forEach(function (child) {
    if (child.matches('.form-row, .field-grid')) child.remove();
  });
  var summary = element('p', 'enquiry-summary');
  summary.hidden = inline; // The inline homepage has a separate live estimate.
  var actions = element('div', 'enquiry-actions');
  var back = element('button', 'enquiry-back', fr ? 'Retour' : 'Back');
  back.type = 'button';
  var next = element('button', originalButtonClasses, fr ? 'Continuer vers mes coordonnées →' : 'Continue to My Details →');
  next.type = 'button';
  var submitLabel = fr ? 'Envoyer ma demande' : inline ? 'Request my free assessment' : 'Send My Request';
  submit.textContent = submitLabel;
  stages[1].after(summary, actions);
  actions.append(back, next, submit);
  var legalNotice = form.querySelector('.submission-legal');
  if (legalNotice) actions.before(legalNotice);
  form.querySelectorAll('.form-privacy, .platform-disclaimer').forEach(function (notice) { notice.remove(); });
  status.hidden = true;
  status.style.display = '';
  var note = element('p', 'enquiry-note', fr
    ? 'Envoi gratuit, sans paiement. Vos renseignements servent à évaluer la demande et à vous répondre. Aucun mot de passe ni dossier client privé.'
    : 'Free to submit. No payment now. We use your details to assess and reply. Please omit passwords and private customer records.');
  actions.after(note);

  function totals() {
    if (reputation) { summary.textContent = 'Tell us what you need. We will discuss the scope and price before any paid work is agreed.'; return; }
    var n = Number(field('review_count').value) || 1;
    summary.textContent = fr
      ? n + ' avis · ' + n * 45 + ' $ CA de frais initiaux si vous commandez · +' + fee + ' $ par avis supprimé · ' + n * (45 + fee) + ' $ de frais au total si tous sont supprimés.'
      : n + (n === 1 ? ' review' : ' reviews') + ' · CAD $' + n * 45 + ' initial fee if you proceed · +$' + fee + ' per removed review · $' + n * (45 + fee) + ' total service fees if all are removed.';
    var total = document.getElementById('combinedTotal');
    if (total) total.textContent = fr ? n * (45 + fee) + ' $' : '$' + n * (45 + fee);
  }
  function focus() {
    // Existing modal open handlers restore the form before requesting focus.
    if (success.hidden && !form.hidden) {
      confirmationRegion?.classList.remove('is-submitted');
      var intro = document.getElementById('removalFormIntro'); if (intro) intro.hidden = false;
      if (confirmationDialog && dialogLabel) confirmationDialog.setAttribute('aria-labelledby', dialogLabel);
    }
    var input = stages[step].querySelector('input, select, textarea');
    if (input) input.focus();
  }
  function show(index, focusInput) {
    step = index;
    stages.forEach(function (section, i) { section.hidden = !inline && i !== index; });
    Array.from(progress.children).forEach(function (li, i) {
      if (i === index) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    back.hidden = inline || index === 0;
    next.hidden = inline || index === 1;
    submit.hidden = !inline && index === 0;
    if (legalNotice) legalNotice.hidden = !inline && index === 0;
    totals();
    if (focusInput) focus();
  }
  function valid(index) {
    var invalid = Array.from(stages[index].querySelectorAll('input, select, textarea')).find(function (input) {
      if (input.required && typeof input.value === 'string') input.value = input.value.trim();
      return !input.checkValidity();
    });
    if (!invalid) return true;
    show(index, false);
    var details = invalid.closest('details');
    if (details) details.open = true;
    invalid.reportValidity();
    return false;
  }
  function forward() { if (!busy && valid(0)) { show(1, true); emit('contact_step'); } }
  next.addEventListener('click', forward);
  back.addEventListener('click', function () { show(0, true); });
  form.addEventListener('input', function () { totals(); if (!started) { started = true; emit('form_started'); } });
  document.addEventListener('input', totals);
  document.querySelectorAll('#increaseQty, #decreaseQty').forEach(function (button) { button.addEventListener('click', totals); });
  function message(text, error) { status.textContent = text; status.hidden = false; status.classList.toggle('error', Boolean(error)); }
  function record(payload, confirmed) {
    var lines = [fr ? 'Demande ReviewsBoost' : 'ReviewsBoost request', 'Reference: ' + reference,
      (fr ? 'État : ' : 'Status: ') + (confirmed ? (fr ? 'Réception confirmée' : 'Receipt confirmed') : (fr ? 'Réception non confirmée' : 'Receipt not confirmed'))];
    payload.forEach(function (value, key) { if (key !== 'request_id') lines.push(key + ': ' + value); });
    return lines.join('\n');
  }
  function download(text, id) {
    var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    var link = element('a'); link.href = url; link.download = 'reviewsboost-' + id + '.txt';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function receipt(payload, confirmed) {
    var savedRecord = record(payload, confirmed), savedReference = reference;
    form.parentElement.querySelectorAll('.enquiry-receipt').forEach(function (old) { old.remove(); });
    var box = element('div', 'enquiry-receipt');
    var copy = element('p', '', (fr ? 'Référence : ' : 'Reference: ') + reference);
    var save = element('button', originalButtonClasses, fr ? 'Enregistrer ma demande' : 'Save My Request'); save.type = 'button';
    save.addEventListener('click', function () { download(savedRecord, savedReference); });
    var support = element('a', '', fr ? 'Contacter ReviewsBoost par courriel' : 'Email ReviewsBoost about this request');
    support.href = 'mailto:support@reviewsboost.ca?subject=' + encodeURIComponent('Request ' + reference);
    box.append(copy, save, element('p'));
    box.lastChild.appendChild(support);
    status.after(box);
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (busy || locked) return;
    if (!inline && step === 0) { forward(); return; }
    if (!valid(0) || !valid(1)) return;
    totals();
    var payload = new FormData(form);
    if (!reference) reference = 'RB-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
    payload.set('request_id', reference);
    payload.set('locale', fr ? 'fr-CA' : 'en-CA');
    payload.set('contact_detail', field('email_address').value.trim());
    if (!reputation) {
      payload.set('reason', field('concern_category').value + (field('reason').value.trim() ? '\n' + field('reason').value.trim() : '') + '\nRequest reference: ' + reference);
      payload.delete('concern_category');
    } else payload.set('reason', payload.get('reason') + '\nRequest reference: ' + reference);
    if (window.SubmissionTerms) window.SubmissionTerms.prepare(payload);
    busy = true; submit.disabled = true; back.disabled = true; form.setAttribute('aria-busy', 'true');
    var inputs = Array.from(form.querySelectorAll('input, textarea, select'));
    inputs.forEach(function (input) { input.disabled = true; });
    submit.textContent = fr ? 'Envoi…' : 'Sending…';
    message(fr ? 'Envoi sécurisé de votre demande…' : 'Sending your request securely…');
    emit('submission_started');
    var slow = setTimeout(function () { message(fr ? 'L’envoi prend un peu plus de temps. Gardez cette page ouverte; aucune nouvelle demande n’est nécessaire.' : 'This is taking a little longer. Keep this page open; there is no need to submit again.'); }, 4000);
    ReviewSubmission.send(payload).then(function (result) {
      // Only the backend's explicit success is a measured lead. The sender's
      // legacy notification-error accommodation remains a UI-only outcome.
      if (result.result === 'success' && result.warning !== 'owner_notification_failed') {
        try { window.ReviewsBoostMeasurement?.confirmedLead(form, reference); } catch (_) { /* Tracking must never block an enquiry. */ }
      }
      emit('submission_confirmed');
      form.parentElement.querySelectorAll('.enquiry-receipt').forEach(function (old) { old.remove(); });
      confirmationRegion?.classList.add('is-submitted');
      if (confirmationDialog) confirmationDialog.setAttribute('aria-labelledby', successHeading.id);
      form.hidden = true; success.hidden = false; success.focus();
      var intro = document.getElementById('removalFormIntro'); if (intro) intro.hidden = true;
      var modal = document.getElementById('orderModal'); if (modal) modal.setAttribute('aria-labelledby', 'removalSuccessTitle');
      status.hidden = true;
      form.reset(); show(0, false); started = false; reference = '';
      if (!reputation) { document.getElementById('reviewQuantity').value = 1; document.getElementById('reviewQuantity').dispatchEvent(new Event('input')); }
    }).catch(function (error) {
      var offline = error.code === 'offline';
      var rejected = error.code === 'server_rejected';
      locked = !offline && !rejected;
      message(offline
        ? (fr ? 'Vous êtes hors ligne. Vos réponses sont conservées dans ce formulaire. Reconnectez-vous, puis réessayez.' : 'You appear to be offline. Your answers are still in this form. Reconnect, then try again.')
        : rejected
          ? (fr ? 'Le serveur n’a pas accepté la demande. Vos réponses sont conservées; corrigez-les ou réessayez.' : 'The server did not accept the request. Your answers are preserved; correct them or try again.')
          : (fr ? 'Nous ne pouvons pas confirmer la réception. Vos réponses sont conservées. Enregistrez votre demande et contactez-nous avec la référence ci-dessous avant de la renvoyer.' : 'We could not confirm receipt. Your answers are still here. Save your request and email us with the reference below before sending it again.'), true);
      receipt(payload, false); emit('submission_unconfirmed', { offline: offline });
    }).finally(function () {
      clearTimeout(slow); busy = false; submit.disabled = locked; back.disabled = false;
      inputs.forEach(function (input) { input.disabled = false; });
      form.removeAttribute('aria-busy'); submit.textContent = submitLabel;
    });
  });
  // Keep keyboard users inside open dialogs, including dynamically added fields.
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;
    var dialog = form.closest('[role="dialog"]');
    if (!dialog || !dialog.classList.contains('open')) return;
    var items = Array.from(dialog.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex="0"]')).filter(function (node) { return !node.disabled && node.getClientRects().length; });
    var first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.ReviewEnquiry = { focus: focus };
  show(0, false);
})();
