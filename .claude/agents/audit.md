# Security & Quality Audit Agent

Full audit of the couplesbienheureux project. Scan every file for security gaps, accessibility issues, and consistency problems.

## Security Checks

### Headers (`_headers`)
- Verify CSP includes: default-src 'none', script-src 'self', frame-ancestors 'none', upgrade-insecure-requests
- Verify HSTS: max-age >= 63072000, includeSubDomains, preload
- Verify: X-Frame-Options DENY, X-Content-Type-Options nosniff, COOP, CORP

### Serverless Function (`netlify/functions/subscribe.mjs`)
- CORS: only allowed origins (no wildcard)
- Origin validation rejects unknown origins with 403
- Content-Type check (application/json only)
- Body size limit enforced (header + body double-check)
- Server-side re-validation of all inputs (never trust client)
- Email regex + format check
- Profile value whitelisted to A/B/C/D
- Prenom sanitized: HTML chars, control chars, length limit
- SSRF protection: Mailchimp server prefix format validated
- No API keys in source code (must be env vars)
- Error messages are generic (no stack traces, no internal details)
- Buffer.from used (not btoa)

### Client JS (`js/form.js`)
- Sanitization: HTML chars `<>"'&` stripped, control chars `\x00-\x1f\x7f` stripped
- Email validation: regex + TLD >= 2 chars
- Rate limiting: max attempts + cooldown
- Honeypot: silent fake success (no alert to bots)
- Double-submit guard (isSubmitting flag)
- No innerHTML with user data
- No console.log of sensitive data

### Client JS (`js/quiz.js`)
- No innerHTML with user input (use DOM methods)
- Navigation lock (isNavigating flag)
- data-value validated against VALID_VALUES whitelist
- No eval, no Function constructor, no document.write

### Netlify Config (`netlify.toml`)
- Attack paths blocked: .env, .git, wp-admin, wp-login
- API redirect configured

### HTML (`index.html`)
- Honeypot field: position off-screen (not display:none), tabindex=-1, autocomplete=off
- Form has novalidate + server fallback action
- External links have rel="noopener"
- No inline scripts (CSP compliance)

## Accessibility Checks
- All sections have aria-label
- Progress bars have aria-valuenow/min/max
- Error messages use aria-live="polite"
- Buttons have type="button" (not default submit)
- Form inputs have associated labels
- Focus management on screen transitions

## Consistency Checks
- All 4 profiles exist in: HTML (result sections), CSS (theme blocks), JS (PROFILE_NAMES)
- Email address is the same across: privacy.html, mentions-legales.html
- Theme sync: privacy.html and mentions-legales.html read cbh-theme from localStorage
- Footer links present on index.html (confidentialité + mentions légales)
- All profile light-mode variants exist in CSS

## Output
Report findings as a table: | File | Issue | Severity | Fix |
If everything passes, confirm "All clear" per category.
