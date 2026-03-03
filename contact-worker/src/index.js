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
// Valeur = email du client qui recevra les messages
const CLIENTS = {
  "laurent-rahaingo.fr":     "laurent.rahaingomanana@gmail.com",
  "www.laurent-rahaingo.fr": "laurent.rahaingomanana@gmail.com",
  "camille-larode.fr":       "larode.c@hotmail.com",
  "www.camille-larode.fr":   "larode.c@hotmail.com",
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

    if (!CLIENTS[domain]) {
      return jsonResponse({ error: "Site non autorisé" }, 403, request);
    }

    const clientEmail = CLIENTS[domain];

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

    // Construire le contenu du mail
    // On inclut tous les champs envoyés (le formulaire peut varier selon le site)
    let body = `Nouveau message depuis ${domain}\n`;
    body += `${"─".repeat(40)}\n\n`;

    // Coordonnées
    body += `Nom : ${nom.trim()}\n`;
    body += `Email : ${email.trim()}\n`;
    if (data.telephone)    body += `Téléphone : ${data.telephone}\n`;
    if (data.entreprise)   body += `Entreprise : ${data.entreprise}\n`;
    if (data.type)         body += `Type d'activité : ${data.type}\n`;

    // Projet
    if (data.siteExistant) body += `\nSite existant : ${data.siteExistant}\n`;
    if (data.urlExistant)  body += `URL existant : ${data.urlExistant}\n`;
    if (data.souhait)      body += `Souhait : ${data.souhait}\n`;
    if (data.logo)         body += `Logo : ${data.logo}\n`;
    if (data.photos)       body += `Photos pro : ${data.photos}\n`;

    // Contenu & fonctionnalités
    if (data.pages)           body += `\nPages souhaitées : ${data.pages}\n`;
    if (data.fonctionnalites) body += `Fonctionnalités : ${data.fonctionnalites}\n`;

    // Détails
    body += `\n`;
    body += `Message :\n${message.trim()}\n`;

    if (data.ambiance) {
      body += `\nAmbiance / Sites aimés :\n${data.ambiance}\n`;
    }
    if (data.budget) body += `\nBudget : ${data.budget}\n`;
    if (data.delai)  body += `Délai : ${data.delai}\n`;

    // Envoyer le mail via Resend
    const subject = data.entreprise
      ? `Nouveau message - ${data.entreprise}`
      : `Nouveau message de ${nom.trim()}`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "no-reply@laurent-rahaingo.fr",
        to: clientEmail,
        reply_to: email.trim(),
        subject: subject,
        text: body,
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
