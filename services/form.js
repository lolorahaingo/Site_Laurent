var WORKER_URL = 'https://contact-worker.lolorahaingo.workers.dev';

var TURNSTILE_SITEKEYS = {
  'laurent-rahaingo.fr': '0x4AAAAAAClt3RWhFLlgphth',
  'www.laurent-rahaingo.fr': '0x4AAAAAAClt3RWhFLlgphth',
  'localhost': '0x4AAAAAACluaw9FuPjWzSJf',
  '127.0.0.1': '0x4AAAAAACluaw9FuPjWzSJf'
};
var TURNSTILE_SITEKEY = TURNSTILE_SITEKEYS[window.location.hostname] || TURNSTILE_SITEKEYS['localhost'];
var turnstileToken = '';

var form = document.getElementById('devis-form');
var urlWrapper = document.getElementById('url-field-wrapper');
var submitBtn = form ? form.querySelector('button[type="submit"]') : null;

if (form) {

// --- Cloudflare Turnstile antibot ---
function renderTurnstile() {
  if (typeof turnstile !== 'undefined') {
    turnstile.render('#turnstile-container', {
      sitekey: TURNSTILE_SITEKEY,
      appearance: 'interaction-only',
      language: 'fr',
      callback: function (token) {
        turnstileToken = token;
      },
      'error-callback': function () {
        turnstileToken = '';
      },
      'expired-callback': function () {
        turnstileToken = '';
      }
    });
  } else {
    // Script not loaded yet, retry in 200ms
    setTimeout(renderTurnstile, 200);
  }
}
renderTurnstile();

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
      var labelText = cb.parentNode.childNodes[1].textContent.trim();
      extras.push({ name: labelText, price: price });
    }
  });

  var html = '';
  extras.forEach(function (extra) {
    html += '<div class="form__pricing-row">';
    html += '<span>' + extra.name + '</span>';
    html += '<span>+' + extra.price + '\u00a0\u20ac/mois</span>';
    html += '</div>';
  });
  pricingExtras.innerHTML = html;
  pricingTotal.textContent = total + '\u00a0\u20ac/mois';

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

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  var rgpdCheckbox = form.querySelector('input[name="rgpd"]');
  if (!rgpdCheckbox || !rgpdCheckbox.checked) {
    alert('Veuillez accepter la politique de confidentialit\u00e9 pour envoyer votre demande.');
    return;
  }

  if (!turnstileToken) {
    alert('Veuillez patienter pendant la vérification antibot, puis réessayez.');
    return;
  }

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

  var messageParts = [];
  messageParts.push('Description de l\'activite :\n' + description);
  if (ambiance) messageParts.push('Sites aimes / Ambiance souhaitee :\n' + ambiance);
  if (commentaire) messageParts.push('Commentaire supplementaire :\n' + commentaire);

  var honeypot = form.querySelector('input[name="_gotcha"]');
  var gotchaValue = honeypot ? honeypot.value : '';

  var data = {
    nom: nom,
    email: email,
    message: messageParts.join('\n\n'),
    _gotcha: gotchaValue,
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
    rgpd: true,
    'cf-turnstile-response': turnstileToken
  };

  submitBtn.disabled = true;
  submitBtn.classList.add('btn--loading');
  submitBtn.textContent = 'Envoi en cours...';

  fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(function (response) {
    return response.json().then(function (json) {
      if (response.ok && json.success) {
        setFormState('success');
        turnstileToken = '';
      } else {
        setFormState('error', json.error || 'Une erreur est survenue.');
        if (typeof turnstile !== 'undefined') { turnstile.reset(); turnstileToken = ''; }
      }
    });
  })
  .catch(function () {
    setFormState('error', 'Impossible de contacter le serveur.');
    if (typeof turnstile !== 'undefined') { turnstile.reset(); turnstileToken = ''; }
  });
});

} // end if (form)

function setFormState(state, errorMessage) {
  var existing = form.parentNode.querySelector('.form__status');
  if (existing) existing.remove();

  if (state === 'success') {
    form.style.display = 'none';
    var fallback = form.parentNode.querySelector('.form__fallback');
    if (fallback) fallback.style.display = 'none';

    var msg = document.createElement('div');
    msg.className = 'form__status form__status--success';

    var iconSuccess = document.createElement('span');
    iconSuccess.className = 'form__status-icon';
    iconSuccess.textContent = '\u2713';
    msg.appendChild(iconSuccess);

    var heading = document.createElement('h3');
    heading.textContent = 'Demande envoy\u00e9e avec succ\u00e8s !';
    msg.appendChild(heading);

    var pSuccess = document.createElement('p');
    pSuccess.textContent = 'Merci pour votre int\u00e9r\u00eat. Je vous recontacte tr\u00e8s rapidement avec une proposition adapt\u00e9e.';
    msg.appendChild(pSuccess);

    form.parentNode.insertBefore(msg, form);
  }

  if (state === 'error') {
    submitBtn.disabled = false;
    submitBtn.classList.remove('btn--loading');
    submitBtn.textContent = 'Envoyer ma demande';

    var msg = document.createElement('div');
    msg.className = 'form__status form__status--error';

    var iconError = document.createElement('span');
    iconError.className = 'form__status-icon';
    iconError.textContent = '\u2717';
    msg.appendChild(iconError);

    var pError = document.createElement('p');
    pError.textContent = errorMessage || 'Une erreur est survenue.';
    msg.appendChild(pError);

    var pFallback = document.createElement('p');
    pFallback.textContent = 'Vous pouvez aussi m\'\u00e9crire directement \u00e0 ';
    var mailLink = document.createElement('a');
    mailLink.href = 'mailto:laurent.rahaingomanana@gmail.com';
    mailLink.textContent = 'laurent.rahaingomanana@gmail.com';
    pFallback.appendChild(mailLink);
    msg.appendChild(pFallback);

    form.parentNode.insertBefore(msg, form);
  }
}

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
