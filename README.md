# CouplesBienHeureux — Quiz Interactif

Quiz de personnalité pour couples musulmans francophones. Single-page HTML/CSS/JS hébergé sur Netlify.

## Développement local

```bash
# Avec Netlify CLI (recommandé — active les Functions)
npm install -g netlify-cli
netlify dev

# Sans Netlify CLI (quiz fonctionne, mais pas la soumission email)
npx serve .
```

## Variables d'environnement

Configurer dans le dashboard Netlify (Site settings > Environment variables) :

| Variable | Description |
|---|---|
| `MAILCHIMP_API_KEY` | Clé API Mailchimp complète (ex: `abc123-us21`) |
| `MAILCHIMP_LIST_ID` | ID de l'audience Mailchimp |
| `MAILCHIMP_SERVER` | Préfixe datacenter (ex: `us21`) |

## Configuration Mailchimp

Dans l'audience Mailchimp, ajouter un champ merge :
- **PROFILE** (type texte) — stocke la lettre du profil (A/B/C/D)

Le champ `FNAME` existe par défaut.

## Structure

```
├── index.html              # Quiz SPA
├── privacy.html            # Politique de confidentialité RGPD
├── css/style.css           # Styles complets
├── js/
│   ├── animations.js       # Transitions écrans
│   ├── form.js             # Validation + soumission email
│   └── quiz.js             # Logique quiz + scoring
├── netlify/functions/
│   └── subscribe.mjs       # Proxy Mailchimp (serverless)
├── _headers                # En-têtes de sécurité
├── netlify.toml            # Config Netlify
└── README.md
```

## Déploiement

Push vers le repo connecté à Netlify. Pas de build step nécessaire.
