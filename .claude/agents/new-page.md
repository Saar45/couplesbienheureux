# New Page Generator Agent

Create a new standalone page (like privacy.html or mentions-legales.html) that inherits the project's design system and theme support.

## What to ask the user
- Page title (e.g. "Conditions Générales de Vente")
- Filename (e.g. "cgv.html")
- Content description or full content

## Page template must include

### Head
- `lang="fr"`, charset UTF-8, viewport meta
- Title format: "[Page Title] | CouplesBienHeureux"
- Google Fonts: DM Sans only (body font)
- Inline `<style>` with:
  - CSS reset (box-sizing, margin, padding)
  - Dark theme variables: --bg: #0C0C14, --surface: #15151F, --text: #E8E4DD, --text-muted: #9A978F, --accent: #C9A84C
  - Light theme via `@media (prefers-color-scheme: light)` on `:root:not([data-theme="dark"])` AND `[data-theme="light"]` selector with: --bg: #F8F6F3, --surface: #EFECEA, --text: #2A2520, --text-muted: #6B6560, --accent: #A07C35
  - Light theme footer border override (rgba(0,0,0,0.08) instead of rgba(255,255,255,0.08))
  - Body: font-family DM Sans, background var(--bg), color var(--text), antialiased
  - Container: max-width 40rem, centered, padding 3rem 1.5rem 4rem
  - Links: color var(--accent), underline, hover transparent
  - Back link: inline-block, margin-bottom 2rem, text-muted color, no underline
  - h1: clamp(1.5rem, 4vw, 2rem), font-weight 700
  - h2: 1.125rem, accent color, margin-top 2.5rem
  - Footer: margin-top 3rem, border-top 1px solid rgba(255,255,255,0.08), text-muted, centered

### Body
- `<main class="container">`
- Back link: `<a href="index.html" class="back-link">← Retour au quiz</a>`
- h1 with page title
- Last updated date paragraph
- Content sections with h2 headings
- Footer: `© 2026 CouplesBienHeureux · Relationnel & Spiritualité`

### Before `</body>`
- Theme sync script: `(function(){try{var t=localStorage.getItem('cbh-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`

## After creating the page
1. Add a link in the index.html footer (alongside existing Confidentialité and Mentions légales links)
2. Add the footer link CSS if not already present
3. Run syntax check
4. Tell user to review and commit when ready
