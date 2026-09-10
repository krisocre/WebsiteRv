(function () {
  var root = document.body;
  var platform = root.dataset.platform;
  var isFrench = root.dataset.locale === 'fr-CA';
  var usePopupForm = platform !== 'Google';
  var successFee = Number(root.dataset.successFee);
  var quantity = document.getElementById('reviewQuantity');
  var formQuantity = document.getElementById('formReviewQuantity');
  var decrease = document.getElementById('decreaseQty');
  var increase = document.getElementById('increaseQty');
  var upfrontTotal = document.getElementById('upfrontTotal');
  var successTotal = document.getElementById('successTotal');
  var selectedPlan = document.getElementById('selectedPlan');
  var form = document.getElementById('platformRemovalForm');
  var submit = document.getElementById('platformSubmit');
  var status = document.getElementById('platformStatus');
  var success = document.getElementById('platformSuccess');
  var successClose = document.getElementById('platformSuccessClose');
  var requestSection = document.getElementById('request');
  var legacyServiceLinks = document.querySelector('.service-links');
  var navLinks = document.getElementById('navLinks');
  var hamburger = document.getElementById('hamburger');
  var servicesMenu = document.getElementById('servicesMenu');
  var servicesMenuButton = document.getElementById('servicesMenuButton');
  var servicesMenuFooter = document.querySelector('.services-dropdown-footer');
  var submitDefaultText = isFrench ? 'Envoyer la demande de suppression' : 'Submit Removal Request';
  function restoreSubmitLabel() {
    if (isFrench) submit.textContent = submitDefaultText;
    else submit.innerHTML = 'Submit Removal Request <span aria-hidden="true">&#8594;</span>';
  }
  var serviceOptions = [
    { name: 'Google', label: 'Google Review Removal', frLabel: 'Suppression d’avis Google', mark: 'G', fee: '$30 upfront + $40 after removal', frFee: '30 $ au départ + 40 $ après suppression', href: '/', color: '#4285f4' },
    { name: 'Facebook', label: 'Facebook Review Removal', frLabel: 'Suppression d’avis Facebook', mark: 'FB', fee: '$30 upfront + $45 after removal', frFee: '30 $ au départ + 45 $ après suppression', href: 'remove-facebook-reviews.html', color: '#1b63b7' },
    { name: 'Yelp', label: 'Yelp Review Removal', frLabel: 'Suppression d’avis Yelp', mark: 'Y', fee: '$30 upfront + $55 after removal', frFee: '30 $ au départ + 55 $ après suppression', href: 'remove-yelp-reviews.html', color: '#c81e2b' },
    { name: 'Tripadvisor', label: 'Tripadvisor Review Removal', frLabel: 'Suppression d’avis Tripadvisor', mark: 'TA', fee: '$30 upfront + $65 after removal', frFee: '30 $ au départ + 65 $ après suppression', href: 'remove-tripadvisor-reviews.html', color: '#006b5e' },
    { name: 'Trustpilot', label: 'Trustpilot Review Removal', frLabel: 'Suppression d’avis Trustpilot', mark: 'TP', fee: '$30 upfront + $75 after removal', frFee: '30 $ au départ + 75 $ après suppression', href: 'remove-trustpilot-reviews.html', color: '#006b55' },
    { name: 'Glassdoor', label: 'Glassdoor Review Removal', frLabel: 'Suppression d’avis Glassdoor', mark: 'GD', fee: '$30 upfront + $95 after removal', frFee: '30 $ au départ + 95 $ après suppression', href: 'remove-glassdoor-reviews.html', color: '#116b31' }
  ];

  if (!isFrench) {
    document.querySelectorAll('#servicesDropdown > a').forEach(function (link) {
      if (new URL(link.href, window.location.href).pathname === window.location.pathname) link.remove();
    });
  }

  servicesMenuFooter.querySelectorAll('br').forEach(function (lineBreak) {
    lineBreak.remove();
  });

  if (!isFrench) {
    var frenchLink = document.createElement('a');
    frenchLink.href = 'suppression-avis-google.html';
    frenchLink.lang = 'fr-CA';
    frenchLink.textContent = 'Français : suppression d’avis Google';
    servicesMenuFooter.appendChild(frenchLink);
  }

  if (!success) {
    success = document.createElement('div');
    success.className = 'platform-success';
    success.id = 'platformSuccess';
    success.hidden = true;
    success.tabIndex = -1;
    success.setAttribute('role', 'status');
    success.setAttribute('aria-live', 'polite');
    success.innerHTML = '<div class="platform-success-icon" aria-hidden="true">&#10003;</div>' +
      (isFrench
        ? '<h2>Demande de suppression envoyée</h2><p>Les renseignements concernant l’avis ' + platform + ' ont été transmis. Nous évaluerons le motif lié aux règles et communiquerons avec vous pour la prochaine étape.</p><button class="button" id="platformSuccessClose" type="button">Envoyer une autre demande</button>'
        : '<h2>Removal request submitted</h2><p>Your review details have been sent. A specialist will assess the case and contact you with the next step.</p><button class="button" id="platformSuccessClose" type="button">Done</button>');
    form.insertAdjacentElement('afterend', success);
    successClose = document.getElementById('platformSuccessClose');
  }

  var servicesSection = document.createElement('section');
  servicesSection.className = 'section platform-services';
  servicesSection.id = 'other-services';
  servicesSection.setAttribute('aria-labelledby', 'other-services-title');
  servicesSection.innerHTML = '<div class="container"><div class="section-head">' +
    (isFrench
      ? '<p class="eyebrow">Autres services de suppression</p><h2 id="other-services-title">Aide pour les principales plateformes d’avis</h2><p>Choisissez la plateforme où l’avis apparaît. Les frais initiaux demeurent à 30 $ CA; les frais de réussite varient selon le travail exigé par chaque système de modération.</p>'
      : '<p class="eyebrow">Other review-removal services</p><h2 id="other-services-title">Support for other major review platforms</h2><p>Choose the platform where the review appears. The $30 CAD initial fee stays fixed; the success fee reflects the work required by each moderation system.</p>') +
    '</div><div class="platform-service-grid">' + serviceOptions.filter(function (service) {
      return service.name !== platform;
    }).map(function (service) {
      return '<a class="platform-service-option" style="--service-color:' + service.color + '" href="' + service.href + '">' +
        '<span class="platform-service-mark">' + service.mark + '</span>' +
        '<span class="platform-service-copy"><strong>' + (isFrench ? service.frLabel : service.label) + '</strong><small>' + (isFrench ? service.frFee : service.fee) + '</small></span>' +
        '<span class="platform-service-arrow" aria-hidden="true">&#8594;</span></a>';
    }).join('') + '</div></div>';
  requestSection.insertAdjacentElement('afterend', servicesSection);
  if (legacyServiceLinks) legacyServiceLinks.remove();

  var pricingCalc = document.querySelector('.pricing-calc');
  if (usePopupForm) {
    pricingCalc.insertAdjacentHTML('afterbegin', '<p class="calc-kicker">Build your request</p><h3 class="calc-title">Choose the number of ' + platform + ' reviews</h3>');
  }

  var lastModalTrigger = null;
  var modalClose = null;
  function openModal(trigger) {
    if (!usePopupForm) return;
    lastModalTrigger = trigger || document.activeElement;
    requestSection.classList.add('open');
    requestSection.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    window.setTimeout(function () { document.getElementById('fullName').focus(); }, 60);
  }
  function closeModal() {
    if (!usePopupForm) return;
    requestSection.classList.remove('open');
    requestSection.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    success.hidden = true;
    form.hidden = false;
    if (lastModalTrigger && document.contains(lastModalTrigger)) lastModalTrigger.focus();
  }
  if (usePopupForm) {
    var profileLabels = {
      Facebook: 'Facebook Business Page URL *',
      Yelp: 'Yelp Business Listing URL *',
      Tripadvisor: 'Tripadvisor Property or Listing URL *',
      Trustpilot: 'Trustpilot Business Profile URL *',
      Glassdoor: 'Glassdoor Employer Profile URL *'
    };
    var profilePlaceholders = {
      Facebook: 'https://facebook.com/...',
      Yelp: 'https://yelp.ca/biz/...',
      Tripadvisor: 'https://tripadvisor.ca/...',
      Trustpilot: 'https://ca.trustpilot.com/review/...',
      Glassdoor: 'https://glassdoor.ca/Reviews/...'
    };
    var intro = requestSection.querySelector('.form-layout > div:first-child');
    var introCopy = intro.querySelector(':scope > p:not(.eyebrow):not(.callout)');
    intro.querySelector('.eyebrow').textContent = 'Review removal request';
    intro.querySelector('h2').textContent = 'Start the Removal Process';
    introCopy.textContent = 'For business locations in Canada. Enter the ' + platform + ' profile and review details below; include your city and province in the case details. All fees are in CAD.';
    intro.querySelector('.callout').remove();

    var labels = {
      fullName: 'Full Name *',
      businessName: 'Business Name *',
      email: 'Email Address *',
      phone: 'Phone (optional)',
      businessUrl: profileLabels[platform],
      formReviewQuantity: 'How many reviews do you want removed? *',
      reviewLinks: 'Review link(s) (optional)',
      reason: 'Why should these reviews be removed? *'
    };
    Object.keys(labels).forEach(function (id) {
      form.querySelector('label[for="' + id + '"]').textContent = labels[id];
    });
    document.getElementById('businessUrl').placeholder = profilePlaceholders[platform];
    formQuantity.setAttribute('inputmode', 'numeric');
    document.getElementById('phone').placeholder = '555-123-4567';
    document.getElementById('reason').placeholder = 'Tell us what is wrong with the reviews—for example, no genuine customer experience, a competitor or former employee, spam, threats, harassment, or another policy issue.';
    var reviewLinks = document.getElementById('reviewLinks');
    reviewLinks.setAttribute('aria-describedby', 'reviewLinksHelp');
    var reviewLinksHelp = document.createElement('small');
    reviewLinksHelp.className = 'form-help';
    reviewLinksHelp.id = 'reviewLinksHelp';
    reviewLinksHelp.innerHTML = '<span class="form-help-mark" aria-hidden="true">i</span>If no individual link is provided, we will use the latest lowest-rated review(s) on the profile, up to the number selected, for the removal assessment.';
    reviewLinks.insertAdjacentElement('afterend', reviewLinksHelp);
    var privacy = form.querySelector('.platform-disclaimer');
    privacy.className = 'form-privacy';
    privacy.innerHTML = '<span aria-hidden="true">&#128274;</span> Your submission is handled according to our <a href="privacy-policy.html">privacy policy</a>.';
    submit.innerHTML = 'Submit Removal Request <span aria-hidden="true">&#8594;</span>';

    requestSection.classList.add('platform-modal');
    requestSection.setAttribute('role', 'dialog');
    requestSection.setAttribute('aria-modal', 'true');
    requestSection.setAttribute('aria-hidden', 'true');
    var modalHeading = requestSection.querySelector('h2');
    modalHeading.id = 'platformModalTitle';
    requestSection.setAttribute('aria-labelledby', modalHeading.id);
    var formQuantityField = formQuantity.closest('.field');
    formQuantityField.classList.add('full');
    modalClose = document.createElement('button');
    modalClose.className = 'platform-modal-close';
    modalClose.type = 'button';
    modalClose.setAttribute('aria-label', 'Close removal request form');
    modalClose.innerHTML = '&times;';
    requestSection.querySelector('.form-layout').prepend(modalClose);
    modalClose.addEventListener('click', closeModal);
    requestSection.addEventListener('click', function (event) {
      if (event.target === requestSection) closeModal();
    });
    document.getElementById('phone').addEventListener('input', function (event) {
      var phoneInput = event.currentTarget;
      var digits = phoneInput.value.replace(/\D/g, '').slice(0, 10);
      if (digits.length > 6) phoneInput.value = digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
      else if (digits.length > 3) phoneInput.value = digits.slice(0, 3) + '-' + digits.slice(3);
      else phoneInput.value = digits;
    });
  }

  function closeServicesMenu() {
    servicesMenu.classList.remove('open');
    servicesMenuButton.setAttribute('aria-expanded', 'false');
  }
  servicesMenuButton.addEventListener('click', function (event) {
    event.stopPropagation();
    var isOpen = servicesMenu.classList.toggle('open');
    servicesMenuButton.setAttribute('aria-expanded', String(isOpen));
  });
  servicesMenu.addEventListener('mouseenter', function () {
    if (window.matchMedia('(min-width: 1181px)').matches) servicesMenuButton.setAttribute('aria-expanded', 'true');
  });
  servicesMenu.addEventListener('mouseleave', function () {
    if (window.matchMedia('(min-width: 1181px)').matches && !servicesMenu.contains(document.activeElement)) closeServicesMenu();
  });
  servicesMenu.addEventListener('focusout', function () {
    window.setTimeout(function () {
      if (!servicesMenu.contains(document.activeElement)) closeServicesMenu();
    }, 0);
  });
  document.addEventListener('click', function (event) {
    if (!servicesMenu.contains(event.target)) closeServicesMenu();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      if (usePopupForm && requestSection.classList.contains('open')) closeModal();
      else {
        servicesMenuButton.focus();
        closeServicesMenu();
      }
    }
  });
  hamburger.addEventListener('click', function () {
    var isOpen = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
    if (!isOpen) closeServicesMenu();
  });
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      closeServicesMenu();
    });
  });

  function count() {
    var value = Math.round(Number(quantity.value) || 1);
    return Math.max(1, Math.min(50, value));
  }
  function update() {
    var value = count();
    quantity.value = value;
    upfrontTotal.textContent = isFrench ? value * 30 + ' $' : '$' + value * 30;
    successTotal.textContent = isFrench ? value * successFee + ' $' : '$' + value * successFee;
    selectedPlan.value = platform + ' Review Removal - ' + value + (value === 1 ? ' review' : ' reviews') + ' - $' + value * 30 + ' upfront + $' + successFee + ' per successfully removed review';
    document.getElementById('formReviewQuantity').value = value;
  }
  decrease.addEventListener('click', function () { quantity.value = count() - 1; update(); });
  increase.addEventListener('click', function () { quantity.value = count() + 1; update(); });
  quantity.addEventListener('input', update);
  formQuantity.addEventListener('input', function () {
    quantity.value = formQuantity.value;
    update();
  });
  document.querySelectorAll('[data-focus-form]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (usePopupForm) {
        event.preventDefault();
        openModal(link);
      } else {
        window.setTimeout(function () { document.getElementById('fullName').focus(); }, 250);
      }
    });
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    quantity.value = formQuantity.value;
    update();
    submit.disabled = true;
    submit.textContent = isFrench ? 'Envoi en cours...' : 'Sending...';
    status.hidden = true;
    status.classList.remove('error');
    var payload = new FormData(form);
    payload.set('contact_detail', document.getElementById('email').value.trim());
    fetch('https://script.google.com/macros/s/AKfycby4mQu0BJFu8Jmbw_zZPzrBb9TF_YRw4j0Ayu3PFvwgicSN5vtzynX0ASet2utzxtlnMw/exec', {
      method: 'POST', mode: 'no-cors', body: payload
    }).then(function () {
      form.reset();
      quantity.value = 1;
      update();
      submit.disabled = false;
      restoreSubmitLabel();
      form.hidden = true;
      success.hidden = false;
      success.focus();
    }).catch(function () {
      status.textContent = isFrench ? 'La demande n’a pas pu être envoyée. Écrivez à support@reviewsboost.ca.' : 'The request could not be sent. Please email support@reviewsboost.ca.';
      status.classList.add('error');
      status.hidden = false;
      submit.disabled = false;
      restoreSubmitLabel();
    });
  });
  successClose.addEventListener('click', function () {
    if (usePopupForm) closeModal();
    else {
      success.hidden = true;
      form.hidden = false;
      document.getElementById('fullName').focus();
    }
  });
  update();
  if (usePopupForm && window.location.hash === '#request') openModal();
})();
