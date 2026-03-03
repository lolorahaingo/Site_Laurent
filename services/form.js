(function () {
  'use strict';

  var WORKER_URL = 'https://contact-worker.lolorahaingo.workers.dev';

  var form = document.getElementById('devis-form');
  var urlWrapper = document.getElementById('url-field-wrapper');
  var submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (!form) return;

  // --- Conditional URL field visibility ---
  var siteRadios = form.querySelectorAll('input[name="site-existant"]');
  siteRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (this.value === 'Oui') {
        urlWrapper.classList.add('form__url-field--visible');
      } else {
        urlWrapper.classList.remove('form__url-field--visible');
        var urlInput = document.getElementById('field-url');
        if (urlInput) urlInput.value = '';
      }
    });
  });

  // --- Conditional "Autre" fields visibility ---
  var typeSelect = document.getElementById('field-type');
  var typeAutreWrapper = document.getElementById('type-autre-wrapper');
  if (typeSelect && typeAutreWrapper) {
    typeSelect.addEventListener('change', function () {
      if (this.value === 'Autre') {
        typeAutreWrapper.classList.add('form__url-field--visible');
      } else {
        typeAutreWrapper.classList.remove('form__url-field--visible');
        var input = document.getElementById('field-type-autre');
        if (input) input.value = '';
      }
    });
  }

  // --- Dynamic pricing ---
  var BASE_MONTHLY = 69;
  var pricingExtras = document.getElementById('pricing-extras');
  var pricingTotal = document.getElementById('pricing-total');
  var fonctCheckboxes = form.querySelectorAll('input[name="fonctionnalites"]');

  function updatePricing() {
    var extras = [];
    var total = BASE_MONTHLY;

    fonctCheckboxes.forEach(function (cb) {
      if (cb.checked && cb.dataset.price) {
        var price = parseInt(cb.dataset.price, 10);
        total += price;
        // Récupérer le texte du label (sans le badge de prix)
        var labelText = cb.parentNode.childNodes[1].textContent.trim();
        extras.push({ name: labelText, price: price });
      }
    });

    // Mettre à jour les lignes d'extras
    var html = '';
    extras.forEach(function (extra) {
      html += '<div class="form__pricing-row">';
      html += '<span>' + extra.name + '</span>';
      html += '<span>+' + extra.price + '\u00a0\u20ac/mois</span>';
      html += '</div>';
    });
    pricingExtras.innerHTML = html;

    // Mettre à jour le total
    pricingTotal.textContent = total + '\u00a0\u20ac/mois';

    // Mettre à jour le label et la value du radio "Formule standard"
    var budgetStandardPrice = document.getElementById('budget-standard-price');
    var budgetStandardRadio = document.getElementById('budget-standard');
    if (budgetStandardPrice) {
      budgetStandardPrice.textContent = total;
    }
    if (budgetStandardRadio) {
      budgetStandardRadio.value = 'Formule standard (490\u20ac + ' + total + '\u20ac/mois)';
    }
  }

  fonctCheckboxes.forEach(function (cb) {
    cb.addEventListener('change', updatePricing);
  });

  // --- Form submission ---
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Validate required fields
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Vérification RGPD côté JS (en plus du required HTML)
    var rgpdCheckbox = form.querySelector('input[name="rgpd"]');
    if (!rgpdCheckbox || !rgpdCheckbox.checked) {
      alert('Veuillez accepter la politique de confidentialité pour envoyer votre demande.');
      return;
    }

    // Gather field values
    var nom = form.querySelector('#field-nom').value.trim();
    var email = form.querySelector('#field-email').value.trim();
    var telephone = form.querySelector('#field-telephone').value.trim();
    var entreprise = form.querySelector('#field-entreprise').value.trim();
    var type = form.querySelector('#field-type').value;
    var typeAutre = form.querySelector('#field-type-autre');
    if (type === 'Autre' && typeAutre) type = typeAutre.value.trim() || 'Autre';

    var siteExistant = getRadioValue('site-existant');
    var urlExistant = form.querySelector('#field-url').value.trim();
    var souhait = getRadioValue('souhait');
    var logo = getRadioValue('logo');
    var photos = getRadioValue('photos');
    var budget = getRadioValue('budget');

    var pages = getCheckboxValues('pages');
    var fonctionnalites = getCheckboxValues('fonctionnalites');
    var description = form.querySelector('#field-description').value.trim();
    var ambiance = form.querySelector('#field-ambiance').value.trim();
    var delai = getRadioValue('delai');
    var commentaire = form.querySelector('#field-commentaire').value.trim();

    // Build message for the Worker
    var messageParts = [];
    messageParts.push('Description de l\'activite :\n' + description);
    if (ambiance) messageParts.push('Sites aimes / Ambiance souhaitee :\n' + ambiance);
    if (commentaire) messageParts.push('Commentaire supplementaire :\n' + commentaire);

    // Honeypot anti-spam
    var honeypot = form.querySelector('input[name="_gotcha"]');
    var gotchaValue = honeypot ? honeypot.value : '';

    var data = {
      nom: nom,
      email: email,
      message: messageParts.join('\n\n'),
      _gotcha: gotchaValue,
      // Champs specifiques au formulaire de devis
      telephone: telephone,
      entreprise: entreprise,
      type: type,
      siteExistant: siteExistant,
      urlExistant: (siteExistant === 'Oui' && urlExistant) ? urlExistant : '',
      souhait: souhait,
      logo: logo,
      photos: photos,
      budget: budget,
      pages: pages.length > 0 ? pages.join(', ') : 'Non precisees',
      fonctionnalites: fonctionnalites.length > 0 ? fonctionnalites.join(', ') : 'Aucune',
      delai: delai,
      ambiance: ambiance,
      rgpd: true
    };

    // Set loading state
    setFormState('loading');

    // Send to Worker
    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function (response) {
      return response.json().then(function (json) {
        if (response.ok && json.success) {
          setFormState('success');
        } else {
          setFormState('error', json.error || 'Une erreur est survenue.');
        }
      });
    })
    .catch(function () {
      setFormState('error', 'Impossible de contacter le serveur.');
    });
  });

  // --- Form state management ---
  function setFormState(state, errorMessage) {
    // Remove any existing status message
    var existing = form.parentNode.querySelector('.form__status');
    if (existing) existing.remove();

    if (state === 'loading') {
      submitBtn.disabled = true;
      submitBtn.classList.add('btn--loading');
      submitBtn.textContent = 'Envoi en cours...';
    }

    if (state === 'success') {
      form.style.display = 'none';
      var fallback = form.parentNode.querySelector('.form__fallback');
      if (fallback) fallback.style.display = 'none';

      var msg = document.createElement('div');
      msg.className = 'form__status form__status--success';
      msg.innerHTML =
        '<span class="form__status-icon">&#10003;</span>' +
        '<h3>Demande envoy&eacute;e avec succ&egrave;s !</h3>' +
        '<p>Merci pour votre int&eacute;r&ecirc;t. Je vous recontacte tr&egrave;s rapidement avec une proposition adapt&eacute;e.</p>';
      form.parentNode.insertBefore(msg, form);
    }

    if (state === 'error') {
      submitBtn.disabled = false;
      submitBtn.classList.remove('btn--loading');
      submitBtn.textContent = 'Envoyer ma demande';

      var msg = document.createElement('div');
      msg.className = 'form__status form__status--error';
      msg.innerHTML =
        '<span class="form__status-icon">&#10007;</span>' +
        '<p>' + (errorMessage || 'Une erreur est survenue.') + '</p>' +
        '<p>Vous pouvez aussi m\'&eacute;crire directement &agrave; ' +
        '<a href="mailto:laurent.rahaingomanana@gmail.com">laurent.rahaingomanana@gmail.com</a></p>';
      form.parentNode.insertBefore(msg, form);
    }
  }

  // --- Helpers ---
  function getRadioValue(name) {
    var checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : '';
  }

  function getCheckboxValues(name) {
    var checked = form.querySelectorAll('input[name="' + name + '"]:checked');
    var values = [];
    checked.forEach(function (cb) {
      values.push(cb.value);
    });
    return values;
  }
})();
