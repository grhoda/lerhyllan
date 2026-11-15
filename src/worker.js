// 1) Skickar Firebase-inloggningens sidor (/__/auth/…) vidare till Firebase,
//    så att inloggningen sker på samma domän som sidan (krävs av Safari m.fl.).
// 2) /api/sample: läser bilder och text med Claude åt appen. Kräver inloggning
//    (Firebase ID-token) och hemligheten ANTHROPIC_API_KEY. Se README.
const FIREBASE = "https://lerhyllan.firebaseapp.com";
const PROJECT_ID = "lerhyllan";
const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const DEFAULT_MODEL = "claude-sonnet-5-5";
const MAX_BODY_BYTES = 14 * 1024 * 1024;
const MAX_IMAGES = 6;
const MAX_PROMPT_CHARS = 60000;
const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

// ---------- Firebase ID-token ----------
let jwksCache = { keys: null, until: 0 };
async function getJwks() {
  if (jwksCache.keys && Date.now() < jwksCache.until) return jwksCache.keys;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error("jwks");
  const m = /max-age=(\d+)/.exec(res.headers.get("cache-control") || "");
  const ttl = Math.min(Math.max(m ? Number(m[1]) : 3600, 60), 86400) * 1000;
  const body = await res.json();
  jwksCache = { keys: body.keys || [], until: Date.now() + ttl };
  return jwksCache.keys;
}
const b64urlToBytes = (s) => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
const b64urlToJson = (s) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

export async function verifyFirebaseToken(token, projectId = PROJECT_ID) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("format");
  const header = b64urlToJson(parts[0]);
  const payload = b64urlToJson(parts[1]);
  if (header.alg !== "RS256" || !header.kid) throw new Error("alg");
  const jwk = (await getJwks()).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("kid");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
  if (!ok) throw new Error("signature");
  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId || payload.iss !== "https://securetoken.google.com/" + projectId) throw new Error("claims");
  if (!payload.sub || typeof payload.sub !== "string") throw new Error("sub");
  if (typeof payload.exp !== "number" || payload.exp <= now) throw new Error("expired");
  if (typeof payload.iat === "number" && payload.iat > now + 300) throw new Error("iat");
  return payload;
}

// ---------- /api/sample ----------
function allowed(env, payload) {
  const list = String(env.ALLOWED_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!list.length) return true; // ingen begränsning satt: alla inloggade användare
  return !!payload.email && payload.email_verified !== false && list.includes(String(payload.email).toLowerCase());
}

async function handleSample(request, env) {
  if (request.method !== "POST") return json({ code: "invalid_request" }, 405);
  if (!env.ANTHROPIC_API_KEY) return json({ code: "not_configured" }, 503);

  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  let payload;
  try { payload = await verifyFirebaseToken(token); } catch (e) { return json({ code: "session_expired" }, 401); }
  if (!allowed(env, payload)) return json({ code: "not_granted" }, 403);

  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BODY_BYTES) return json({ code: "image_rejected" }, 413);
  let body;
  try { body = await request.json(); } catch (e) { return json({ code: "invalid_request" }, 400); }

  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  if (!prompt.trim() || prompt.length > MAX_PROMPT_CHARS) return json({ code: "invalid_request" }, 400);
  const images = Array.isArray(body.images) ? body.images : [];
  if (images.length > MAX_IMAGES) return json({ code: "image_rejected" }, 400);
  const content = [];
  for (const im of images) {
    if (!im || !MEDIA_TYPES.includes(im.media_type) || typeof im.data !== "string" || !/^[A-Za-z0-9+/=]+$/.test(im.data)) return json({ code: "image_rejected" }, 400);
    content.push({ type: "image", source: { type: "base64", media_type: im.media_type, data: im.data } });
  }
  content.push({ type: "text", text: prompt });

  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: env.ANTHROPIC_MODEL || DEFAULT_MODEL, max_tokens: 4096, messages: [{ role: "user", content }] })
    });
  } catch (e) { return json({ code: "upstream_error" }, 502); }

  if (!res.ok) {
    if (res.status === 429) return json({ code: "rate_limited" }, 429);
    if (res.status === 400) return json({ code: "image_rejected" }, 400);
    if (res.status === 401 || res.status === 403) return json({ code: "not_configured" }, 503);
    return json({ code: "upstream_error" }, 502);
  }
  const data = await res.json().catch(() => null);
  const text = data && Array.isArray(data.content) ? data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n") : "";
  if (!text.trim()) return json({ code: "refused" }, 422);
  return json({ text, truncated: data.stop_reason === "max_tokens" });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/__/auth/") || url.pathname.startsWith("/__/firebase/")) {
      return fetch(new Request(FIREBASE + url.pathname + url.search, request));
    }
    if (url.pathname === "/api/sample/status") return json({ enabled: !!env.ANTHROPIC_API_KEY });
    if (url.pathname === "/api/sample") return handleSample(request, env);
    return env.ASSETS.fetch(request);
  }
};
