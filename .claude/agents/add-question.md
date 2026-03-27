# Add Quiz Question Agent

Add a new question to the quiz. Handles HTML, CSS progress bar, and JS state updates.

## What to ask the user
- Question text (in French)
- 4 answer choices with their profile mapping (A/B/C/D)

## Steps

### 1. Read current state
- Count existing questions in index.html (look for `data-question` attributes)
- Read the current total in quiz.js (VALID_VALUES, answers array length, progress calculations)
- Note the current last question number (N)

### 2. Generate HTML
Insert a new `<section>` before the form screen in index.html:

```html
<section id="q[N+1]" class="screen screen--question" data-question="[N+1]" aria-label="Question [N+1] sur [TOTAL]">
  <div class="screen__inner">
    <div class="question__nav">
      <button class="btn--back" type="button" data-back="[N]" aria-label="Retour à la question précédente">
        <span aria-hidden="true">&larr;</span>
      </button>
      <div class="progress" role="progressbar" aria-valuenow="[N+1]" aria-valuemin="1" aria-valuemax="[TOTAL]">
        <div class="progress__bar"><div class="progress__fill"></div></div>
        <span class="progress__label">[N+1] / [TOTAL]</span>
      </div>
    </div>
    <h2 class="question__text fade-child">[QUESTION TEXT]</h2>
    <div class="choices fade-child">
      [4 choice buttons with data-value A/B/C/D]
    </div>
  </div>
</section>
```

### 3. Update all existing questions
- Update ALL aria-label attributes: "Question X sur [NEW TOTAL]"
- Update ALL progress aria-valuemax to [NEW TOTAL]
- Update ALL progress__label text to "X / [NEW TOTAL]"
- Update the form screen back button: data-back="[NEW LAST QUESTION]"

### 4. Update quiz.js
- Update the answers array: add one more `null` entry
- Update the `resetQuiz` function: answers array must match new length
- Update `navigateTo`: the question range check (step >= 1 && step <= N) must use new N
- Update the choice event loop: `for (var q = 1; q <= N; q++)` must use new N
- Update the last question check: `if (qNum < N)` must use new N
- Update `renderScores`: change `total` from old count to new count
- Update `updateProgress`: divide by new total, not 7
- Update keyboard handler: question range check

### 5. Validate
- Run `node -c js/quiz.js` to check syntax
- Verify the question count is consistent across HTML and JS
- Verify all aria-valuemax attributes match the new total
- Verify all progress labels match

### 6. Report
Tell the user what was added and what was updated. List all files modified.

## Important
- The progress calculation in animations.js uses the total passed from quiz.js — make sure updateProgress receives the right fraction
- Never hardcode "7" anywhere — always derive from the actual question count
- Keep the same HTML structure as existing questions (fade-child classes, choice structure)
