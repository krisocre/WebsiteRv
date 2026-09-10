(function () {
  'use strict';
  var form = document.querySelector('#removalForm, #platformRemovalForm, #reputationForm');
  if (!form) return;
  var fr = document.documentElement.lang === 'fr-CA';
  var reputation = form.id === 'reputationForm';
  var platform = reputation ? 'Reputation' : document.body.dataset.platform || 'Google';
  var fee = Number(document.body.dataset.successFee || 40);
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
    success.innerHTML = '<h2>Request received</h2><p></p><button type="button" class="button">Send another request</button>';
    form.after(success);
    success.querySelector('button').addEventListener('click', function () { success.hidden = true; form.hidden = false; focus(); });
  }
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
  progress.after(stages[0], stages[1]);
  move('business_url', stages[0]);
  if (reputation) {
    move('selected_plan', stages[0]);
    move('reason', stages[0]);
  } else {
    move('review_count', stages[0]);
    var categoryField = element('div', 'field full');
    var categoryLabel = element('label', '', fr ? 'Quel est le problème? *' : 'What concerns you about the review? *');
    categoryLabel.htmlFor = 'enquiryCategory';
    var category = element('select');
    category.id = 'enquiryCategory';
    category.name = 'concern_category';
    category.required = true;
    var options = fr
      ? ['Choisissez un motif', 'Aucune expérience réelle', 'Conflit d’intérêts', 'Harcèlement ou menaces', 'Renseignements personnels', 'Pourriel ou publicité', 'Contenu hors sujet', 'Je ne sais pas — aidez-moi à évaluer']
      : ['Choose a concern', 'No genuine experience', 'Conflict of interest', 'Harassment or threats', 'Personal information', 'Spam or advertising', 'Off-topic content', 'Unsure — please assess'];
    options.forEach(function (label, index) { category.add(new Option(label, index ? label : '')); });
    categoryField.append(categoryLabel, category);
    stages[0].appendChild(categoryField);
    var reason = field('reason');
    reason.required = false;
    reason.placeholder = fr ? 'Ajoutez du contexte utile. Aucun document privé ni mot de passe.' : 'Add useful context. Keep private records and passwords out of this form.';
    form.querySelector('label[for="' + reason.id + '"]').textContent = fr ? 'Contexte supplémentaire (facultatif)' : 'Additional context (optional)';
    extras(stages[0], fr ? 'Ajouter des liens ou du contexte (facultatif)' : 'Add review links or context (optional)', ['review_links', 'reason']);
  }
  ['full_name', 'business_name', 'email_address'].forEach(function (name) { move(name, stages[1]); });
  field('business_name').placeholder = fr ? 'Entreprise — ville, province' : 'Business — city, province';
  field('email_address').maxLength = 254;
  extras(stages[1], fr ? 'Ajouter un téléphone (facultatif)' : 'Add a phone number (optional)', ['phone_number']);
  // Remove empty layout wrappers after moving the existing inputs and listeners.
  Array.from(form.children).forEach(function (child) {
    if (child.matches('.form-row, .field-grid')) child.remove();
  });
  var summary = element('p', 'enquiry-summary');
  var actions = element('div', 'enquiry-actions');
  var back = element('button', 'enquiry-back', fr ? 'Retour' : 'Back');
  back.type = 'button';
  var next = element('button', originalButtonClasses, fr ? 'Continuer vers mes coordonnées →' : 'Continue to My Details →');
  next.type = 'button';
  submit.textContent = fr ? 'Envoyer ma demande' : 'Send My Request';
  stages[1].after(summary, actions);
  actions.append(back, next, submit);
  status.hidden = true;
  status.style.display = '';
  var note = element('p', 'enquiry-note', fr
    ? 'Envoi gratuit. Aucune carte ni mot de passe. Cette demande ne déclenche aucun paiement. Vous approuvez les modalités écrites avant de commander.'
    : 'Free to submit. No card or account password. This request does not take payment. Review and approve the written terms before ordering.');
  actions.after(note);

  function totals() {
    if (reputation) { summary.textContent = 'Tell us what you need. We will discuss the scope and price before any paid work is agreed.'; return; }
    var n = Number(field('review_count').value) || 1;
    summary.textContent = fr
      ? n + ' avis · ' + n * 30 + ' $ CA de frais initiaux si vous commandez · +' + fee + ' $ par avis supprimé · ' + n * (30 + fee) + ' $ de frais au total si tous sont supprimés.'
      : n + (n === 1 ? ' review' : ' reviews') + ' · CAD $' + n * 30 + ' initial fee if you proceed · +$' + fee + ' per removed review · $' + n * (30 + fee) + ' total service fees if all are removed.';
    var total = document.getElementById('combinedTotal');
    if (total) total.textContent = fr ? n * (30 + fee) + ' $' : '$' + n * (30 + fee);
  }
  function focus() {
    var input = stages[step].querySelector('input, select, textarea');
    if (input) input.focus();
  }
  function show(index, focusInput) {
    step = index;
    stages.forEach(function (section, i) { section.hidden = i !== index; });
    Array.from(progress.children).forEach(function (li, i) {
      if (i === index) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    back.hidden = index === 0;
    next.hidden = index === 1;
    submit.hidden = index === 0;
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
    if (confirmed) success.querySelector('button').before(box);
    else status.after(box);
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (busy || locked) return;
    if (step === 0) { forward(); return; }
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
    busy = true; submit.disabled = true; back.disabled = true; form.setAttribute('aria-busy', 'true');
    var inputs = Array.from(form.querySelectorAll('input, textarea, select'));
    inputs.forEach(function (input) { input.disabled = true; });
    submit.textContent = fr ? 'Envoi…' : 'Sending…';
    message(fr ? 'Envoi sécurisé de votre demande…' : 'Sending your request securely…');
    emit('submission_started');
    var slow = setTimeout(function () { message(fr ? 'L’envoi prend un peu plus de temps. Gardez cette page ouverte; aucune nouvelle demande n’est nécessaire.' : 'This is taking a little longer. Keep this page open; there is no need to submit again.'); }, 4000);
    ReviewSubmission.send(payload).then(function () {
      emit('submission_confirmed');
      receipt(payload, true);
      success.querySelector('h2').textContent = fr ? 'Demande reçue' : 'Request received';
      success.querySelector('p').textContent = fr ? 'Aucun paiement n’a été effectué. Nous examinerons vos renseignements et vous contacterons au sujet de l’admissibilité et des modalités avant toute commande. Conservez les liens et captures des avis.' : 'No payment has been taken. We will review your details and contact you about eligibility and written terms before you place an order. Keep the review links and screenshots for your case.';
      form.hidden = true; success.hidden = false; success.focus();
      var intro = document.getElementById('removalFormIntro'); if (intro) intro.hidden = true;
      var modal = document.getElementById('orderModal'); if (modal) modal.setAttribute('aria-labelledby', 'removalSuccessTitle');
      status.hidden = true;
      form.reset(); show(0, false); started = false; reference = '';
      if (!reputation) { document.getElementById('reviewQuantity').value = 1; document.getElementById('reviewQuantity').dispatchEvent(new Event('input')); }
    }).catch(function (error) {
      var offline = error.code === 'offline';
      locked = !offline;
      message(offline
        ? (fr ? 'Vous êtes hors ligne. Vos réponses sont conservées dans ce formulaire. Reconnectez-vous, puis réessayez.' : 'You appear to be offline. Your answers are still in this form. Reconnect, then try again.')
        : (fr ? 'Nous ne pouvons pas confirmer la réception. Vos réponses sont conservées. Enregistrez votre demande et contactez-nous avec la référence ci-dessous avant de la renvoyer.' : 'We could not confirm receipt. Your answers are still here. Save your request and email us with the reference below before sending it again.'), true);
      receipt(payload, false); emit('submission_unconfirmed', { offline: offline });
    }).finally(function () {
      clearTimeout(slow); busy = false; submit.disabled = locked; back.disabled = false;
      inputs.forEach(function (input) { input.disabled = false; });
      form.removeAttribute('aria-busy'); submit.textContent = fr ? 'Envoyer ma demande' : 'Send My Request';
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
