/* ============================================
   QUIZ MODULE
   Orchestration, scoring, navigation, events,
   back buttons, share, keyboard shortcuts
   ============================================ */
(function () {
  'use strict';

  // Valid answer values
  var VALID_VALUES = ['A', 'B', 'C', 'D'];

  // Profile names for share text
  var PROFILE_NAMES = {
    A: 'Les Ambitieux Connectés',
    B: 'Les Romantiques en Quête',
    C: 'Les Prudents qui Avancent',
    D: 'Les Bâtisseurs Enracinés'
  };

  // --- State ---
  var state = {
    currentStep: 0,   // 0=cover, 1-7=questions, 8=form, 9=result
    answers: [null, null, null, null, null, null, null],
    scores: { A: 0, B: 0, C: 0, D: 0 },
    resultProfile: null,
    isNavigating: false
  };

  // --- Screen map ---
  function getScreenEl(step) {
    if (step === 0) return document.getElementById('cover');
    if (step >= 1 && step <= 7) return document.getElementById('q' + step);
    if (step === 8) return document.getElementById('form-screen');
    if (step === 9) return document.getElementById('result-' + state.resultProfile);
    return null;
  }

  // --- Navigation ---
  function navigateTo(step) {
    if (state.isNavigating) return;
    state.isNavigating = true;

    var currentEl = getScreenEl(state.currentStep);

    // Update progress for question screens
    if (step >= 1 && step <= 7) {
      window.animations.updateProgress(step);
    }

    // Calculate result before navigating to result screen
    if (step === 9 && !state.resultProfile) {
      calculateResult();
    }

    var targetEl = getScreenEl(step);
    if (!targetEl) {
      state.isNavigating = false;
      return;
    }

    window.animations.exitScreen(currentEl).then(function () {
      state.currentStep = step;
      return window.animations.enterScreen(targetEl);
    }).then(function () {
      state.isNavigating = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (step === 8) {
        var emailInput = document.getElementById('email');
        if (emailInput) {
          setTimeout(function () { emailInput.focus(); }, 100);
        }
      }
    }).catch(function () {
      state.isNavigating = false;
    });
  }

  // --- Scoring ---
  function recordAnswer(questionIndex, value) {
    if (VALID_VALUES.indexOf(value) === -1) return;
    if (questionIndex < 0 || questionIndex > 6) return;

    var prev = state.answers[questionIndex];
    if (prev !== null && VALID_VALUES.indexOf(prev) !== -1) {
      state.scores[prev]--;
    }

    state.answers[questionIndex] = value;
    state.scores[value]++;
  }

  function calculateResult() {
    var max = 0;
    var winner = 'A';

    for (var i = 0; i < VALID_VALUES.length; i++) {
      var p = VALID_VALUES[i];
      if (state.scores[p] > max) {
        max = state.scores[p];
        winner = p;
      }
    }

    state.resultProfile = winner;
    renderScores(winner);
    return winner;
  }

  function renderScores(winner) {
    var container = document.getElementById('scores-' + winner);
    if (!container) return;

    // Clear previous content safely
    while (container.firstChild) container.removeChild(container.firstChild);

    var title = document.createElement('p');
    title.className = 'result__scores-title';
    title.textContent = 'Vos réponses';
    container.appendChild(title);

    var total = 7;
    for (var i = 0; i < VALID_VALUES.length; i++) {
      var letter = VALID_VALUES[i];
      var count = state.scores[letter];
      var pct = Math.round((count / total) * 100);
      var isWinner = letter === winner;

      var row = document.createElement('div');
      row.className = 'score-row' + (isWinner ? ' is-winner' : '');

      var label = document.createElement('span');
      label.className = 'score-row__label';
      label.textContent = letter;

      var bar = document.createElement('div');
      bar.className = 'score-row__bar';
      var fill = document.createElement('div');
      fill.className = 'score-row__fill' + (isWinner ? ' is-winner' : '');
      fill.style.width = pct + '%';
      bar.appendChild(fill);

      var countEl = document.createElement('span');
      countEl.className = 'score-row__count';
      countEl.textContent = count + '/7';

      row.appendChild(label);
      row.appendChild(bar);
      row.appendChild(countEl);
      container.appendChild(row);
    }
  }

  function resetQuiz() {
    state.currentStep = 0;
    state.answers = [null, null, null, null, null, null, null];
    state.scores = { A: 0, B: 0, C: 0, D: 0 };
    state.resultProfile = null;
    state.isNavigating = false;

    document.querySelectorAll('.choice.is-selected').forEach(function (el) {
      el.classList.remove('is-selected');
    });

    document.querySelectorAll('.progress__fill').forEach(function (bar) {
      bar.style.width = '0%';
    });

    var form = document.getElementById('subscribe-form');
    if (form) form.reset();
    var submitBtn = document.getElementById('btn-submit');
    if (submitBtn) submitBtn.disabled = true;
    var formStatus = document.getElementById('form-status');
    if (formStatus) {
      formStatus.textContent = '';
      formStatus.className = 'form__status';
    }
  }

  // --- Share ---
  function shareResult(btn) {
    var profileName = PROFILE_NAMES[state.resultProfile] || '';
    var shareText = 'Je suis « ' + profileName + ' » ! Découvre quel type de couple musulman tu es :';
    var shareUrl = window.location.origin + window.location.pathname;

    // Try native Web Share API (mobile)
    if (navigator.share) {
      navigator.share({
        title: 'Mon profil couple — CouplesBienHeureux',
        text: shareText,
        url: shareUrl
      }).catch(function () {
        // User cancelled share — no action needed
      });
      return;
    }

    // Fallback: copy to clipboard
    var fullText = shareText + ' ' + shareUrl;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullText).then(function () {
        showCopiedFeedback(btn);
      }).catch(function () {
        fallbackCopy(fullText, btn);
      });
    } else {
      fallbackCopy(fullText, btn);
    }
  }

  function fallbackCopy(text, btn) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showCopiedFeedback(btn);
    } catch (e) {
      // Silent fail
    }
    document.body.removeChild(textarea);
  }

  function showCopiedFeedback(btn) {
    var originalText = btn.textContent;
    btn.textContent = 'Lien copié !';
    btn.classList.add('is-copied');
    setTimeout(function () {
      btn.textContent = originalText;
      btn.classList.remove('is-copied');
    }, 2000);
  }

  // --- Expose API for form.js ---
  window.getQuizResult = function () {
    if (!state.resultProfile) calculateResult();
    return state.resultProfile;
  };

  window.quizFormSuccess = function () {
    navigateTo(9);
  };

  // --- Event Binding ---
  function init() {
    // Start button
    var startBtn = document.getElementById('btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        navigateTo(1);
      });
    }

    // Choice buttons (event delegation per question screen)
    for (var q = 1; q <= 7; q++) {
      (function (qNum) {
        var screen = document.getElementById('q' + qNum);
        if (!screen) return;

        screen.addEventListener('click', function (e) {
          if (state.isNavigating) return;

          var choiceBtn = e.target.closest('.choice');
          if (!choiceBtn) return;

          var value = choiceBtn.getAttribute('data-value');
          if (!value || VALID_VALUES.indexOf(value) === -1) return;

          window.animations.highlightChoice(choiceBtn);
          recordAnswer(qNum - 1, value);

          setTimeout(function () {
            if (qNum < 7) {
              navigateTo(qNum + 1);
            } else {
              navigateTo(8);
            }
          }, 400);
        });
      })(q);
    }

    // Back buttons — all screens
    document.querySelectorAll('.btn--back[data-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetStep = parseInt(btn.getAttribute('data-back'), 10);
        if (!isNaN(targetStep) && targetStep >= 0 && targetStep <= 7) {
          navigateTo(targetStep);
        }
      });
    });

    // Skip form button
    var skipBtn = document.getElementById('btn-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', function () {
        calculateResult();
        navigateTo(9);
      });
    }

    // Retake buttons
    document.querySelectorAll('.btn--retake').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var currentResultEl = getScreenEl(9);
        if (currentResultEl) {
          window.animations.exitScreen(currentResultEl).then(function () {
            resetQuiz();
            state.currentStep = 0;
            var coverEl = document.getElementById('cover');
            window.animations.enterScreen(coverEl);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }
      });
    });

    // Share buttons
    document.querySelectorAll('.btn--share[data-share-profile]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        shareResult(btn);
      });
    });

    // Keyboard shortcuts (A/B/C/D to pick answers, Backspace to go back)
    document.addEventListener('keydown', function (e) {
      // Don't capture keys when typing in form inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (state.isNavigating) return;

      var step = state.currentStep;

      // A/B/C/D keys on question screens
      if (step >= 1 && step <= 7) {
        var key = e.key.toUpperCase();
        if (VALID_VALUES.indexOf(key) !== -1) {
          e.preventDefault();
          var screen = getScreenEl(step);
          if (!screen) return;
          var choiceBtn = screen.querySelector('.choice[data-value="' + key + '"]');
          if (choiceBtn) {
            choiceBtn.click();
          }
        }

        // Backspace / left arrow = go back
        if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
          e.preventDefault();
          var backTarget = step === 1 ? 0 : step - 1;
          navigateTo(backTarget);
        }
      }

      // Backspace on form screen = go back to Q7
      if (step === 8 && (e.key === 'Backspace' || e.key === 'ArrowLeft')) {
        if (e.target.tagName !== 'INPUT') {
          e.preventDefault();
          navigateTo(7);
        }
      }

      // Enter on cover = start quiz
      if (step === 0 && e.key === 'Enter') {
        e.preventDefault();
        navigateTo(1);
      }
    });

    // Reveal cover fade children on load
    var coverEl = document.getElementById('cover');
    if (coverEl && coverEl.classList.contains('active')) {
      setTimeout(function () {
        var children = coverEl.querySelectorAll('.fade-child');
        children.forEach(function (child) {
          child.classList.add('is-visible');
        });
      }, 100);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
