// Typewriter animation for the greeting
(function () {
  'use strict';

  const MESSAGE = 'Bienvenue,<br>sur mon site.';
  const TYPING_SPEED = 80;
  const PAUSE_BEFORE_RESTART = 3000;

  const el = document.getElementById('salutation');
  if (!el) return;

  let index = 0;

  function type() {
    if (index <= MESSAGE.length) {
      // Skip over HTML tags entirely (e.g. <br>)
      while (index < MESSAGE.length && MESSAGE.charAt(index) === '<') {
        const closingIndex = MESSAGE.indexOf('>', index);
        if (closingIndex !== -1) {
          index = closingIndex + 1;
        } else {
          break;
        }
      }

      el.innerHTML = MESSAGE.substring(0, index);
      index++;
      setTimeout(type, TYPING_SPEED);
    } else {
      // Pause then restart
      setTimeout(function () {
        index = 0;
        type();
      }, PAUSE_BEFORE_RESTART);
    }
  }

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', type);
  } else {
    type();
  }

  // Mobile burger menu toggle
  const burger = document.querySelector('.nav__burger');
  const navLinks = document.querySelector('.nav__links');

  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('active');
      burger.classList.toggle('active');
      burger.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('active');
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();
