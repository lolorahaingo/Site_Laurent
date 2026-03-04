/**
 * Contact Worker — API d'envoi de mails pour sites statiques
 *
 * Reçoit les données d'un formulaire de contact (POST JSON),
 * identifie le site client via le header Origin,
 * et envoie un mail via Resend.
 *
 * Pour ajouter un nouveau client :
 * 1. Ajouter une entrée dans CLIENTS ci-dessous
 * 2. Redéployer : wrangler deploy
 *
 * Secrets requis (wrangler secret put) :
 * - RESEND_API_KEY              → clé API Resend pour l'envoi de mails
 * - TURNSTILE_SECRET_LAURENT    → clé secrète Turnstile pour laurent-rahaingo.fr
 * - TURNSTILE_SECRET_CAMILLE    → clé secrète Turnstile pour camille-larode.fr
 * - TURNSTILE_SECRET_LOCALHOST  → clé secrète Turnstile pour localhost / 127.0.0.1
 *
 * En cas de spam :
 * - Modéré  → ajouter l'IP dans BLOCKED_IPS + wrangler deploy
 * - Urgent  → passer MAINTENANCE à true + wrangler deploy
 * - Critique → désactiver le Worker dans le dashboard Cloudflare
 */

// ─── Coupe-circuit ───────────────────────────────────────────
// Passer à true pour désactiver tout envoi de mail (en cas de spam)
const MAINTENANCE = false;

// ─── IPs bloquées ────────────────────────────────────────────
// Ajouter ici les IPs de spammeurs identifiés
const BLOCKED_IPS = [
  // "123.45.67.89",
];

// ─── Configuration des clients ───────────────────────────────
// Clé   = domaine du site (sans https://)
// Valeur = { email, fromName, turnstileSecret }
const CLIENTS = {
  "laurent-rahaingo.fr":     { email: "laurent.rahaingomanana@gmail.com", fromName: "Laurent Rahaingo",  turnstileSecret: "TURNSTILE_SECRET_LAURENT" },
  "www.laurent-rahaingo.fr": { email: "laurent.rahaingomanana@gmail.com", fromName: "Laurent Rahaingo",  turnstileSecret: "TURNSTILE_SECRET_LAURENT" },
  "camille-larode.fr":       { email: "larode.c@hotmail.com",            fromName: "Camille Larode",     turnstileSecret: "TURNSTILE_SECRET_CAMILLE" },
  "www.camille-larode.fr":   { email: "larode.c@hotmail.com",            fromName: "Camille Larode",     turnstileSecret: "TURNSTILE_SECRET_CAMILLE" },
  "localhost":               { email: "lolorahaingo@hotmail.fr",          fromName: "Test Local",         turnstileSecret: "TURNSTILE_SECRET_LOCALHOST" },
  "127.0.0.1":               { email: "lolorahaingo@hotmail.fr",          fromName: "Test Local",         turnstileSecret: "TURNSTILE_SECRET_LOCALHOST" },
  // Ajoute tes clients ici ↑
};

// ─── Rate limiting via Cache API ─────────────────────────────
// Max 1 requête par IP par fenêtre de 60 secondes
// Utilise le Cache API de Cloudflare (partagé entre toutes les instances)
const RATE_LIMIT_MAX = 1;
const RATE_LIMIT_WINDOW = 60; // secondes

async function isRateLimited(ip) {
  const cache = caches.default;
  const cacheKey = new Request(`https://rate-limit.internal/${ip}`);

  const cached = await cache.match(cacheKey);
  let count = 0;

  if (cached) {
    count = parseInt(await cached.text(), 10) || 0;
  }

  count++;

  if (count > RATE_LIMIT_MAX) {
    return true; // Bloqué
  }

  // Stocker le compteur mis à jour avec un TTL (expire automatiquement)
  const response = new Response(String(count), {
    headers: { "Cache-Control": `max-age=${RATE_LIMIT_WINDOW}` },
  });
  await cache.put(cacheKey, response);

  return false;
}

// ─── Vérification Cloudflare Turnstile ───────────────────────
// Valide le token Turnstile côté serveur via l'API siteverify
async function verifyTurnstile(token, ip, secretKey) {
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: secretKey,
      response: token,
      remoteip: ip,
    }),
  });

  const result = await response.json();
  return result;
}

// ─── Worker principal ────────────────────────────────────────
export default {
  async fetch(request, env) {

    // Gestion CORS preflight (le navigateur envoie OPTIONS avant POST)
    if (request.method === "OPTIONS") {
      return handleCORS(request);
    }

    // Seul POST est accepté
    if (request.method !== "POST") {
      return jsonResponse({ error: "Méthode non autorisée" }, 405, request);
    }

    // Coupe-circuit : tout est désactivé
    if (MAINTENANCE) {
      return jsonResponse({ error: "Service temporairement indisponible." }, 503, request);
    }

    // Vérification IP bloquée
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (BLOCKED_IPS.includes(ip)) {
      return jsonResponse({ error: "Accès refusé." }, 403, request);
    }

    // Rate limiting par IP
    if (await isRateLimited(ip)) {
      return jsonResponse({ error: "Trop de requêtes. Réessayez dans une minute." }, 429, request);
    }

    // Identifier le site appelant via le header Origin
    const origin = request.headers.get("Origin") || "";
    const domain = origin.replace(/^https?:\/\//, "");

    const client = CLIENTS[domain];
    if (!client) {
      return jsonResponse({ error: "Site non autorisé" }, 403, request);
    }

    const clientEmail = client.email;

    // Lire et valider les données du formulaire
    let data;
    try {
      data = await request.json();
    } catch (e) {
      return jsonResponse({ error: "JSON invalide" }, 400, request);
    }

    // Honeypot : si ce champ caché est rempli, c'est un bot
    if (data._gotcha) {
      // On répond "succès" pour ne pas alerter le bot, mais on n'envoie rien
      return jsonResponse({ success: true, message: "Mail envoyé avec succès" }, 200, request);
    }

    // ─── Vérification antibot Cloudflare Turnstile ────────────
    const turnstileToken = data["cf-turnstile-response"];

    if (!turnstileToken) {
      return jsonResponse({ error: "Vérification antibot requise. Veuillez réessayer." }, 400, request);
    }

    try {
      const turnstileSecretKey = env[client.turnstileSecret];
      if (!turnstileSecretKey) {
        console.error("Turnstile secret not configured for domain:", domain);
        return jsonResponse({ error: "Erreur de configuration antibot." }, 500, request);
      }

      const turnstileResult = await verifyTurnstile(turnstileToken, ip, turnstileSecretKey);

      if (!turnstileResult.success) {
        console.error("Turnstile verification failed:", JSON.stringify(turnstileResult));
        return jsonResponse({ error: "La vérification antibot a échoué. Veuillez réessayer." }, 403, request);
      }
    } catch (e) {
      console.error("Turnstile verification error:", e);
      return jsonResponse({ error: "Erreur lors de la vérification antibot." }, 500, request);
    }

    // Vérification consentement RGPD côté serveur
    if (!data.rgpd) {
      return jsonResponse({ error: "Le consentement RGPD est requis." }, 400, request);
    }

    const { nom, email, message } = data;

    if (!nom || !nom.trim()) {
      return jsonResponse({ error: "Le champ 'nom' est requis" }, 400, request);
    }
    if (!email || !email.trim() || !email.includes("@")) {
      return jsonResponse({ error: "Email invalide" }, 400, request);
    }
    if (!message || !message.trim()) {
      return jsonResponse({ error: "Le champ 'message' est requis" }, 400, request);
    }

    // ─── Validation de longueur côté serveur ──────────────────
    const MAX_LENGTHS = {
      nom: 80, email: 100, telephone: 20, entreprise: 100,
      type: 100, urlExistant: 200, description: 2000,
      ambiance: 500, commentaire: 500, message: 5000,
      pages: 500, fonctionnalites: 500, souhait: 100,
      logo: 50, photos: 50, budget: 100, delai: 100,
      siteExistant: 10
    };
    for (const [field, maxLen] of Object.entries(MAX_LENGTHS)) {
      if (data[field] && typeof data[field] === "string" && data[field].length > maxLen) {
        return jsonResponse({ error: `Le champ '${field}' dépasse la longueur maximale autorisée (${maxLen} caractères).` }, 400, request);
      }
    }

    // ─── Construction du mail ─────────────────────────────────
    const siteName = domain.replace(/^www\./, "");
    const subject = data.entreprise
      ? `${data.entreprise} vous a contacte via ${siteName}`
      : `${nom.trim()} vous a contacte via ${siteName}`;

    // -- Collecter les infos structurées --
    const contactInfo = [];
    contactInfo.push({ label: "Nom", value: nom.trim() });
    contactInfo.push({ label: "Email", value: email.trim() });
    if (data.telephone)  contactInfo.push({ label: "Telephone", value: data.telephone });
    if (data.entreprise) contactInfo.push({ label: "Entreprise", value: data.entreprise });
    if (data.type)       contactInfo.push({ label: "Type d'activite", value: data.type });

    const projectInfo = [];
    if (data.siteExistant) projectInfo.push({ label: "Site existant", value: data.siteExistant });
    if (data.urlExistant)  projectInfo.push({ label: "URL existant", value: data.urlExistant });
    if (data.souhait)      projectInfo.push({ label: "Souhait", value: data.souhait });
    if (data.logo)         projectInfo.push({ label: "Logo", value: data.logo });
    if (data.photos)       projectInfo.push({ label: "Photos pro", value: data.photos });
    if (data.pages)        projectInfo.push({ label: "Pages souhaitees", value: data.pages });
    if (data.fonctionnalites) projectInfo.push({ label: "Fonctionnalites", value: data.fonctionnalites });
    if (data.budget)       projectInfo.push({ label: "Budget", value: data.budget });
    if (data.delai)        projectInfo.push({ label: "Delai", value: data.delai });

    // -- Version texte brut --
    let textBody = `Bonjour,\n\n`;
    textBody += `Vous avez recu un nouveau message via votre site ${siteName}.\n\n`;

    textBody += `Expediteur\n`;
    for (const { label, value } of contactInfo) {
      textBody += `  ${label} : ${value}\n`;
    }

    textBody += `\nMessage\n`;
    textBody += `  ${message.trim()}\n`;

    if (data.ambiance) {
      textBody += `\nAmbiance / Sites aimes\n`;
      textBody += `  ${data.ambiance}\n`;
    }

    if (projectInfo.length > 0) {
      textBody += `\nDetails du projet\n`;
      for (const { label, value } of projectInfo) {
        textBody += `  ${label} : ${value}\n`;
      }
    }

    textBody += `\n---\n`;
    textBody += `Ce message a ete envoye depuis le formulaire de contact de ${siteName}.\n`;
    textBody += `Vous pouvez repondre directement a cet email pour contacter ${nom.trim()}.`;

    // -- Version HTML --
    const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

    let htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#333;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);">

        <tr><td style="background-color:#2c3e50;padding:24px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">Nouveau message</p>
          <p style="margin:4px 0 0;color:#bdc3c7;font-size:13px;">via ${escHtml(siteName)}</p>
        </td></tr>

        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 20px;font-size:15px;line-height:1.5;">Bonjour,</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.5;">Vous avez re&ccedil;u un nouveau message depuis le formulaire de contact de <strong>${escHtml(siteName)}</strong>.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="padding:12px 16px;background-color:#f8f9fa;border-radius:6px;">
              <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">Exp&eacute;diteur</p>
              ${contactInfo.map(({ label, value }) => `<p style="margin:0 0 4px;font-size:14px;"><strong>${escHtml(label)}</strong> : ${escHtml(value)}</p>`).join("\n              ")}
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="padding:16px;background-color:#fefefe;border:1px solid #e8e8e8;border-radius:6px;">
              <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">Message</p>
              <p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escHtml(message.trim())}</p>
            </td></tr>
          </table>`;

    if (data.ambiance) {
      htmlBody += `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="padding:16px;background-color:#fefefe;border:1px solid #e8e8e8;border-radius:6px;">
              <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">Ambiance / Sites aim&eacute;s</p>
              <p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escHtml(data.ambiance)}</p>
            </td></tr>
          </table>`;
    }

    if (projectInfo.length > 0) {
      htmlBody += `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="padding:12px 16px;background-color:#f8f9fa;border-radius:6px;">
              <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">D&eacute;tails du projet</p>
              ${projectInfo.map(({ label, value }) => `<p style="margin:0 0 4px;font-size:14px;"><strong>${escHtml(label)}</strong> : ${escHtml(value)}</p>`).join("\n              ")}
            </td></tr>
          </table>`;
    }

    htmlBody += `
        </td></tr>

        <tr><td style="padding:20px 32px;background-color:#f8f9fa;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#999;line-height:1.5;">
            Ce message a &eacute;t&eacute; envoy&eacute; depuis le formulaire de contact de ${escHtml(siteName)}.<br>
            Vous pouvez r&eacute;pondre directement &agrave; cet email pour contacter ${escHtml(nom.trim())}.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // ─── Envoi via Resend ─────────────────────────────────────
    const fromAddress = `"Formulaire ${siteName}" <contact@laurent-rahaingo.fr>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: clientEmail,
        reply_to: email.trim(),
        subject: subject,
        text: textBody,
        html: htmlBody,
        headers: {
          "X-Auto-Response-Suppress": "OOF, AutoReply",
          "X-Entity-Ref-ID": `form-${siteName}-${Date.now()}`,
          "Precedence": "bulk",
        },
      }),
    });

    if (!resendResponse.ok) {
      const err = await resendResponse.text();
      console.error("Resend error:", err);
      return jsonResponse({ error: "Erreur lors de l'envoi du mail" }, 500, request);
    }

    return jsonResponse({ success: true, message: "Mail envoyé avec succès" }, 200, request);
  },
};

// ─── Helpers ─────────────────────────────────────────────────

function jsonResponse(data, status, request) {
  const headers = corsHeaders(request);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { status, headers });
}

function handleCORS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const domain = origin.replace(/^https?:\/\//, "");
  const headers = new Headers();

  // N'autorise que les domaines enregistrés dans CLIENTS
  if (CLIENTS[domain]) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}
