# CouplesBienHeureux — Quiz Interactif

## Project
Interactive personality quiz for Muslim francophone couples. Pure HTML/CSS/JS (no frameworks), hosted on Netlify with serverless functions for Mailchimp integration.

- **Audience**: Diaspora africaine francophone (Sénégal, Paris, Belgique), 90% mobile from TikTok
- **TikTok**: @couplesbienheureux (46.9k followers)
- **Live URL**: https://couplesbienheureux-quizz.netlify.app
- **Repo**: https://github.com/Saar45/couplesbienheureux

## Architecture
- SPA with show/hide sections (no routing, no build step)
- 13 screens: cover, 7 questions, email form, 4 result profiles
- Each result profile has its own visual identity (palette, fonts, SVG, Quran/Hadith verse)
- Light/dark mode with system detection + manual toggle (persisted in localStorage)
- Netlify Function (`subscribe.mjs`) proxies Mailchimp API — key never exposed client-side

## File Structure
```
index.html              # Full SPA
privacy.html            # RGPD/CNIL privacy policy
css/style.css           # All styles, 4 profile themes, light/dark mode
js/animations.js        # Screen transitions, theme toggle
js/form.js              # Email validation, rate limiting, honeypot, submission
js/quiz.js              # Quiz logic, scoring, navigation, share, keyboard shortcuts
netlify/functions/subscribe.mjs  # Mailchimp serverless proxy
_headers                # Security headers (CSP, HSTS, etc.)
netlify.toml            # Netlify config, redirects
```

## Scoring
Simple tally: each question's 4 choices map to A/B/C/D profiles. Highest count wins. Ties break alphabetically.

## Environment Variables (Netlify dashboard)
- `MAILCHIMP_API_KEY`
- `MAILCHIMP_LIST_ID`
- `MAILCHIMP_SERVER`

## Git
- Remote: origin → GitHub (Saar45 account)
- Local git config: Saar45 / nabysarr16@gmail.com
- Commits: one short sentence, no co-authored-by

## Conventions
- No frameworks, no build tools — vanilla HTML/CSS/JS only
- Mobile-first CSS with custom properties
- Google Fonts only
- All text content in French
