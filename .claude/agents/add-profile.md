# Add Result Profile Agent

Add a new result profile to the quiz (e.g. Profile E). Handles HTML result section, CSS theme (dark + light), JS profile name, and score rendering.

## What to ask the user
- Profile letter (e.g. "E")
- Profile name in French (e.g. "Les Visionnaires")
- Color palette: accent color + accent-light color
- Font pairing: heading font + body font (from Google Fonts)
- Description text (3 paragraphs)
- Quran/Hadith verse + source
- 3 traits: Force, Défi, Conseil deen
- CTA text
- SVG illustration description (or skip for now)

## Steps

### 1. Update Google Fonts
If the heading or body font isn't already loaded in index.html `<head>`, add it to the Google Fonts URL.

### 2. Generate HTML result section
Insert before the noscript banner in index.html, following the exact pattern of existing profiles:

```html
<section id="result-[LETTER]" class="screen screen--result" data-profile="[LETTER]" aria-label="Résultat : [PROFILE NAME]">
  <div class="screen__inner">
    <div class="result__illustration fade-child" aria-hidden="true">
      [SVG or placeholder]
    </div>
    <span class="badge badge--result fade-child">Votre profil</span>
    <h2 class="result__title fade-child">[PROFILE NAME]</h2>
    <div class="result__description fade-child">
      [3 paragraphs]
    </div>
    <div class="result__verse fade-child">
      <p class="result__verse-text">« [VERSE] »</p>
      <span class="result__verse-source">[SOURCE]</span>
    </div>
    <div class="result__traits fade-child">
      [3 traits with trait__label + trait__value]
    </div>
    <div class="result__scores fade-child" id="scores-[LETTER]"></div>
    <div class="result__cta fade-child">
      <p class="result__cta-text">[CTA TEXT]</p>
      <a href="#" class="btn btn--primary">Découvrir la formation <span class="btn__arrow" aria-hidden="true">→</span></a>
    </div>
    <div class="result__actions fade-child">
      <button class="btn--share" type="button" data-share-profile>Partager mon résultat</button>
      <button class="btn--retake" type="button">Refaire le quiz</button>
    </div>
  </div>
</section>
```

### 3. Generate CSS theme block
Add to css/style.css in the profile themes section:

**Dark theme:**
```css
[data-profile="[LETTER]"] {
  --bg: [dark bg];
  --bg-rgb: [r, g, b];
  --surface: [dark surface];
  --surface-hover: [dark surface hover];
  --accent: [accent];
  --accent-light: [accent-light];
  --text: [light text];
  --text-muted: [muted text];
  --text-heading: [heading text];
  --font-heading: '[heading font]', 'Georgia', serif;
  --font-body: '[body font]', system-ui, sans-serif;
  --grain-opacity: 0.035;
}
```

Plus component overrides: `.badge` border-color, `.choice.is-selected` background, `.choice__letter` background.

**Light theme (both selectors):**
```css
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) [data-profile="[LETTER]"] { ... }
}
[data-theme="light"] [data-profile="[LETTER]"] { ... }
```

Derive light colors: lighten bg to ~#F4-F8 range, darken accent by 15-20%, darken text to #1A-2A range.

### 4. Update quiz.js
- Add letter to `VALID_VALUES` array
- Add profile name to `PROFILE_NAMES` object
- The `getScreenEl` function already handles any letter via `'result-' + state.resultProfile`
- The `calculateResult` function already iterates `VALID_VALUES`

### 5. Update questions
Each question needs a 5th choice mapped to the new profile letter. Update all question sections in index.html to add the new choice button, and verify the scoring still works.

### 6. Update subscribe.mjs
- Add the new letter to `validProfiles` array
- Add the profile name to `profileNames` object

### 7. Validate
- Run `node -c` on all JS files
- Verify the new profile letter appears in: HTML, CSS, quiz.js (VALID_VALUES + PROFILE_NAMES), subscribe.mjs (validProfiles + profileNames)
- Verify SVG gradient IDs are unique (use `grad-[letter]1` pattern)

### 8. Report
List all files modified and what was added to each.
