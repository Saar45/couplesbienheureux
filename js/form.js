/* ============================================
   FORM MODULE
   Email validation, sanitization, rate limiting,
   honeypot detection, Mailchimp submission
   ============================================ */
(function () {
  'use strict';

  // --- DOM ---
  var form = document.getElementById('subscribe-form');
  var emailInput = document.getElementById('email');
  var prenomInput = document.getElementById('prenom');
  var rgpdCheckbox = document.getElementById('rgpd');
  var honeypotInput = document.getElementById('website');
  var submitBtn = document.getElementById('btn-submit');
  var emailError = document.getElementById('email-error');
  var rgpdError = document.getElementById('rgpd-error');
  var formStatus = document.getElementById('form-status');

  if (!form) return;

  // --- Sanitization ---
  function sanitizeText(str, maxLen) {
    if (!str) return '';
    return str
      .replace(/[<>"'&]/g, '')
      .replace(/[\x00-\x1f\x7f]/g, '')
      .trim()
      .substring(0, maxLen || 50);
  }

  function sanitizeEmail(str) {
    if (!str) return '';
    return str
      .replace(/[\x00-\x1f\x7f]/g, '')
      .trim()
      .toLowerCase()
      .substring(0, 254);
  }

  // --- Validation ---
  var EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  function isValidEmail(email) {
    if (!email || email.length < 5 || email.length > 254) return false;
    if (!EMAIL_REGEX.test(email)) return false;
    var parts = email.split('@');
    if (parts.length !== 2) return false;
    if (parts[1].indexOf('.') === -1) return false;
    // TLD must be at least 2 chars
    var tld = parts[1].split('.').pop();
    if (!tld || tld.length < 2) return false;
    return true;
  }

  function validateEmail() {
    var email = sanitizeEmail(emailInput.value);
    if (!email) {
      showError(emailError, emailInput, 'L\'email est obligatoire.');
      return false;
    }
    if (!isValidEmail(email)) {
      showError(emailError, emailInput, 'Veuillez entrer un email valide.');
      return false;
    }
    clearError(emailError, emailInput);
    return true;
  }

  function validateRgpd() {
    if (!rgpdCheckbox.checked) {
      showError(rgpdError, null, 'Veuillez accepter pour continuer.');
      return false;
    }
    clearError(rgpdError, null);
    return true;
  }

  function validateForm() {
    var emailOk = validateEmail();
    var rgpdOk = validateRgpd();
    return emailOk && rgpdOk;
  }

  function showError(errorEl, inputEl, message) {
    if (errorEl) errorEl.textContent = message;
    if (inputEl) inputEl.classList.add('is-error');
  }

  function clearError(errorEl, inputEl) {
    if (errorEl) errorEl.textContent = '';
    if (inputEl) inputEl.classList.remove('is-error');
  }

  function updateSubmitState() {
    if (isSubmitting) return;
    var email = sanitizeEmail(emailInput.value);
    var hasEmail = isValidEmail(email);
    var hasConsent = rgpdCheckbox.checked;
    submitBtn.disabled = !(hasEmail && hasConsent);
  }

  // --- Rate Limiting ---
  var MAX_ATTEMPTS = 3;
  var COOLDOWN_MS = 10000;
  var attempts = 0;
  var lastAttemptTime = 0;

  function checkRateLimit() {
    var now = Date.now();
    if (now - lastAttemptTime < COOLDOWN_MS) {
      var secsLeft = Math.ceil((COOLDOWN_MS - (now - lastAttemptTime)) / 1000);
      showStatus('Veuillez patienter ' + secsLeft + ' secondes avant de réessayer.', 'error');
      return false;
    }
    if (attempts >= MAX_ATTEMPTS) {
      showStatus('Nombre maximum de tentatives atteint. Rafraîchissez la page pour réessayer.', 'error');
      return false;
    }
    return true;
  }

  function showStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = 'form__status';
    if (type) formStatus.classList.add('is-' + type);
  }

  function clearStatus() {
    formStatus.textContent = '';
    formStatus.className = 'form__status';
  }

  // --- Submission ---
  var isSubmitting = false;

  function setLoading(loading) {
    isSubmitting = loading;
    if (loading) {
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;
    } else {
      submitBtn.classList.remove('is-loading');
      updateSubmitState();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Double-submit guard
    if (isSubmitting) return;

    clearStatus();

    // Honeypot check — silent fake success
    if (honeypotInput && honeypotInput.value) {
      showStatus('Merci pour votre inscription\u00a0!', 'success');
      setTimeout(function () {
        if (typeof window.quizFormSuccess === 'function') {
          window.quizFormSuccess();
        }
      }, 1200);
      return;
    }

    if (!validateForm()) return;
    if (!checkRateLimit()) return;

    attempts++;
    lastAttemptTime = Date.now();

    var email = sanitizeEmail(emailInput.value);
    var prenom = sanitizeText(prenomInput.value, 50);
    var profile = typeof window.getQuizResult === 'function' ? window.getQuizResult() : '';

    setLoading(true);

    fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        prenom: prenom,
        profile: profile
      })
    })
    .then(function (res) {
      if (res.ok || res.status === 409) {
        showStatus('Merci pour votre inscription\u00a0!', 'success');
        setLoading(false);
        // Prevent re-submit after success
        isSubmitting = true;
        submitBtn.disabled = true;
        setTimeout(function () {
          if (typeof window.quizFormSuccess === 'function') {
            window.quizFormSuccess();
          }
        }, 1200);
      } else {
        return res.json().then(function (data) {
          throw new Error(data.message || 'Erreur serveur');
        });
      }
    })
    .catch(function () {
      setLoading(false);
      showStatus(
        'Une erreur est survenue. Veuillez réessayer.',
        'error'
      );
    });
  }

  // --- Event Listeners ---
  emailInput.addEventListener('blur', function () {
    if (emailInput.value) validateEmail();
    updateSubmitState();
  });

  emailInput.addEventListener('input', function () {
    clearError(emailError, emailInput);
    updateSubmitState();
  });

  rgpdCheckbox.addEventListener('change', function () {
    clearError(rgpdError, null);
    updateSubmitState();
  });

  form.addEventListener('submit', handleSubmit);
})();
