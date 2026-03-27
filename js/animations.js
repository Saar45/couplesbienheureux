/* ============================================
   ANIMATIONS MODULE
   Screen transitions, stagger effects, progress
   ============================================ */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var DURATION_ENTER = reducedMotion ? 10 : 500;
  var DURATION_EXIT = reducedMotion ? 10 : 200;

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Exit a screen with fade-out animation.
   * Returns a Promise that resolves when the animation ends.
   */
  function exitScreen(el) {
    if (!el || !el.classList.contains('active')) {
      return Promise.resolve();
    }

    if (reducedMotion) {
      el.classList.remove('active');
      resetFadeChildren(el);
      return Promise.resolve();
    }

    el.classList.add('exiting');
    return wait(DURATION_EXIT).then(function () {
      el.classList.remove('active', 'exiting');
      resetFadeChildren(el);
    });
  }

  /**
   * Enter a screen with fade-in animation.
   * Returns a Promise that resolves when the animation ends.
   */
  function enterScreen(el) {
    if (!el) return Promise.resolve();

    el.classList.add('active');

    if (reducedMotion) {
      revealFadeChildren(el);
      return Promise.resolve();
    }

    el.classList.add('entering');
    revealFadeChildren(el);

    return wait(DURATION_ENTER).then(function () {
      el.classList.remove('entering');
    });
  }

  /**
   * Add is-visible to fade-child elements for staggered entrance.
   */
  function revealFadeChildren(container) {
    var children = container.querySelectorAll('.fade-child');
    children.forEach(function (child) {
      // Force reflow to restart animation
      child.classList.remove('is-visible');
      void child.offsetHeight;
      child.classList.add('is-visible');
    });
  }

  /**
   * Reset fade children to hidden state.
   */
  function resetFadeChildren(container) {
    var children = container.querySelectorAll('.fade-child');
    children.forEach(function (child) {
      child.classList.remove('is-visible');
    });
  }

  /**
   * Update progress bar for a given question number (1-7).
   */
  function updateProgress(questionNumber) {
    var percent = (questionNumber / 7) * 100;
    var bars = document.querySelectorAll('.progress__fill');
    bars.forEach(function (bar) {
      bar.style.width = percent + '%';
    });
  }

  /**
   * Highlight a selected choice button.
   */
  function highlightChoice(button) {
    // Remove prior selections in same question
    var siblings = button.parentElement.querySelectorAll('.choice');
    siblings.forEach(function (s) { s.classList.remove('is-selected'); });

    button.classList.add('is-selected');
  }

  // --- Theme Toggle ---
  function initTheme() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    var root = document.documentElement;

    // Check saved preference
    var saved = null;
    try { saved = localStorage.getItem('cbh-theme'); } catch (e) { /* no storage */ }

    if (saved === 'light' || saved === 'dark') {
      root.setAttribute('data-theme', saved);
    }
    // Otherwise: no data-theme → system preference via prefers-color-scheme rules

    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      var systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;

      var next;
      if (current === 'light') {
        next = 'dark';
      } else if (current === 'dark') {
        next = 'light';
      } else {
        // No explicit theme set → toggle away from system default
        next = systemLight ? 'dark' : 'light';
      }

      root.setAttribute('data-theme', next);
      try { localStorage.setItem('cbh-theme', next); } catch (e) { /* no storage */ }
    });
  }

  // Init theme immediately (before DOMContentLoaded) to avoid flash
  if (document.getElementById('theme-toggle')) {
    initTheme();
  } else {
    document.addEventListener('DOMContentLoaded', initTheme);
  }

  // Expose public API
  window.animations = {
    exitScreen: exitScreen,
    enterScreen: enterScreen,
    updateProgress: updateProgress,
    highlightChoice: highlightChoice,
    DURATION_ENTER: DURATION_ENTER,
    DURATION_EXIT: DURATION_EXIT
  };
})();
