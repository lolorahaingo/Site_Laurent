(function () {
  'use strict';

  var form = document.getElementById('devis-form');
  var urlWrapper = document.getElementById('url-field-wrapper');

  if (!form) return;

  // --- Conditional URL field visibility ---
  var siteRadios = form.querySelectorAll('input[name="site-existant"]');
  siteRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (this.value === 'Oui') {
        urlWrapper.classList.add('form__url-field--visible');
      } else {
        urlWrapper.classList.remove('form__url-field--visible');
        // Clear the URL field when hiding
        var urlInput = document.getElementById('field-url');
        if (urlInput) urlInput.value = '';
      }
    });
  });

  // --- Form submission ---
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Validate required fields
    if (!form.checkValidity()) {
      // Trigger native validation UI
      form.reportValidity();
      return;
    }

    // Gather field values
    var nom = form.querySelector('#field-nom').value.trim();
    var email = form.querySelector('#field-email').value.trim();
    var entreprise = form.querySelector('#field-entreprise').value.trim();
    var type = form.querySelector('#field-type').value;

    var siteExistant = getRadioValue('site-existant');
    var urlExistant = form.querySelector('#field-url').value.trim();
    var souhait = getRadioValue('souhait');
    var logo = getRadioValue('logo');
    var photos = getRadioValue('photos');

    var pages = getCheckboxValues('pages');
    var description = form.querySelector('#field-description').value.trim();
    var ambiance = form.querySelector('#field-ambiance').value.trim();

    // Build email body
    var body = '';
    body += 'Nom / Prenom : ' + nom + '\n';
    body += 'Email : ' + email + '\n';
    body += 'Entreprise / Activite : ' + entreprise + '\n';
    body += 'Type d\'activite : ' + type + '\n';
    body += '\n';
    body += 'Site existant : ' + siteExistant + '\n';
    if (siteExistant === 'Oui' && urlExistant) {
      body += 'URL du site existant : ' + urlExistant + '\n';
    }
    body += 'Souhait : ' + souhait + '\n';
    body += '\n';
    body += 'Logo : ' + logo + '\n';
    body += 'Photos professionnelles : ' + photos + '\n';
    body += '\n';
    body += 'Pages souhaitees : ' + (pages.length > 0 ? pages.join(', ') : 'Non precisees') + '\n';
    body += '\n';
    body += 'Description de l\'activite :\n' + description + '\n';
    if (ambiance) {
      body += '\nSites aimes / Ambiance souhaitee :\n' + ambiance + '\n';
    }

    var subject = 'Demande de site web - ' + entreprise;

    var mailtoLink = 'mailto:laurent.rahaingomanana@gmail.com'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);

    window.location.href = mailtoLink;
  });

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
