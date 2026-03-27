import { createHash } from 'crypto';

// Allowed origins — add your production domain here
const ALLOWED_ORIGINS = [
  'https://couplesbienheureux.com',
  'https://www.couplesbienheureux.com',
];

// Also allow Netlify preview deploys and local dev
function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Netlify deploy previews: https://<deploy-id>--<site>.netlify.app
  if (/^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.netlify\.app$/.test(origin)) return true;
  // Local development
  if (origin === 'http://localhost:8888' || origin === 'http://localhost:3456') return true;
  return false;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

// Max request body size: 2KB (email + prenom + profile is tiny)
const MAX_BODY_SIZE = 2048;

export default async (request) => {
  const origin = request.headers.get('origin') || '';
  const headers = corsHeaders(origin);

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return Response.json(
      { message: 'Méthode non autorisée' },
      { status: 405, headers }
    );
  }

  // --- Origin validation ---
  if (!isAllowedOrigin(origin)) {
    return Response.json(
      { message: 'Origine non autorisée' },
      { status: 403, headers }
    );
  }

  // --- Content-Type check ---
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return Response.json(
      { message: 'Content-Type invalide' },
      { status: 415, headers }
    );
  }

  // --- Body size check ---
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_SIZE) {
    return Response.json(
      { message: 'Requête trop volumineuse' },
      { status: 413, headers }
    );
  }

  // --- Parse body ---
  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return Response.json(
      { message: 'Erreur de lecture' },
      { status: 400, headers }
    );
  }

  if (rawBody.length > MAX_BODY_SIZE) {
    return Response.json(
      { message: 'Requête trop volumineuse' },
      { status: 413, headers }
    );
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json(
      { message: 'JSON invalide' },
      { status: 400, headers }
    );
  }

  // --- Type checking: body must be a plain object ---
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json(
      { message: 'Requête invalide' },
      { status: 400, headers }
    );
  }

  const { email, prenom, profile } = body;

  // --- Server-side validation ---
  if (!email || typeof email !== 'string') {
    return Response.json(
      { message: 'Email obligatoire' },
      { status: 400, headers }
    );
  }

  const cleanEmail = email.trim().toLowerCase().substring(0, 254);
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(cleanEmail) || !cleanEmail.includes('.', cleanEmail.indexOf('@'))) {
    return Response.json(
      { message: 'Email invalide' },
      { status: 400, headers }
    );
  }

  const validProfiles = ['A', 'B', 'C', 'D'];
  const cleanProfile = (typeof profile === 'string' && validProfiles.includes(profile.toUpperCase()))
    ? profile.toUpperCase()
    : '';

  // Sanitize prenom: strip control chars, HTML entities, and limit length
  const cleanPrenom = typeof prenom === 'string'
    ? prenom.replace(/[<>"'&\x00-\x1f\x7f]/g, '').trim().substring(0, 50)
    : '';

  // --- Mailchimp API ---
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  const server = process.env.MAILCHIMP_SERVER;

  if (!apiKey || !listId || !server) {
    console.error('Missing Mailchimp environment variables');
    return Response.json(
      { message: 'Configuration serveur manquante' },
      { status: 500, headers }
    );
  }

  // Validate server prefix format (e.g. "us21") to prevent SSRF
  if (!/^[a-z]{2}\d{1,3}$/.test(server)) {
    console.error('Invalid MAILCHIMP_SERVER format:', server);
    return Response.json(
      { message: 'Configuration serveur invalide' },
      { status: 500, headers }
    );
  }

  const profileNames = {
    A: 'Les Ambitieux Connectés',
    B: 'Les Romantiques en Quête',
    C: 'Les Prudents qui Avancent',
    D: 'Les Bâtisseurs Enracinés',
  };

  // Mailchimp requires MD5 hash of lowercase email
  const subscriberHash = createHash('md5').update(cleanEmail).digest('hex');
  const baseUrl = `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;
  const authHeader = 'Basic ' + Buffer.from('anystring:' + apiKey).toString('base64');

  // --- Step 1: Add or update member ---
  const mailchimpPayload = {
    email_address: cleanEmail,
    status_if_new: 'subscribed',
    merge_fields: {
      FNAME: cleanPrenom,
      PROFILE: cleanProfile,
    },
  };

  try {
    const mcResponse = await fetch(baseUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(mailchimpPayload),
    });

    if (!mcResponse.ok) {
      const mcData = await mcResponse.json().catch(() => ({}));

      // "Member Exists" with same data is fine
      if (mcResponse.status === 400 && mcData.title === 'Member Exists') {
        return Response.json(
          { message: 'Déjà inscrit' },
          { status: 409, headers }
        );
      }

      console.error('Mailchimp PUT error:', mcResponse.status, mcData);
      return Response.json(
        { message: 'Erreur lors de l\'inscription. Veuillez réessayer.' },
        { status: 502, headers }
      );
    }

    // --- Step 2: Add tags (separate endpoint — PUT ignores tags) ---
    if (cleanProfile && profileNames[cleanProfile]) {
      const tagsUrl = `${baseUrl}/tags`;
      try {
        await fetch(tagsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            tags: [{ name: profileNames[cleanProfile], status: 'active' }],
          }),
        });
      } catch (tagErr) {
        // Non-blocking: member is subscribed even if tagging fails
        console.error('Mailchimp tag error:', tagErr);
      }
    }

    return Response.json(
      { message: 'Inscription réussie' },
      { status: 200, headers }
    );
  } catch (err) {
    console.error('Mailchimp fetch error:', err);
    return Response.json(
      { message: 'Erreur serveur. Veuillez réessayer.' },
      { status: 500, headers }
    );
  }
};

export const config = {
  path: '/api/subscribe',
};
