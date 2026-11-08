# Lerhyllan

Ett bibliotek för glasyrer, kombinationer och keramikprojekt. Data sparas i Firebase (Firestore) och man loggar in med e-post och lösenord.

## Kom igång

1. Skapa ett projekt på https://console.firebase.google.com
2. **Build → Firestore Database → Create database** (välj `eur3` eller `europe-north1`).
3. **Authentication → Sign-in method → Email/Password → slå på.**
4. **Projektinställningar → Lägg till webbapp.** Kopiera config-värdena till `public/firebase-config.js`.
5. Lägg in `firestore.rules` under Firestore → Rules → Publish.

## Hosting (Cloudflare)

Sidan ligger i `public/` och läggs ut som en Cloudflare Worker med statiska filer (`wrangler.jsonc`), precis som Kvitt.
Cloudflare bygger om automatiskt vid varje push till `main`.

Lägg till Cloudflare-adressen (t.ex. `lerhyllan.<konto>.workers.dev`) under
Firebase → Authentication → Settings → Authorized domains, annars fungerar inte inloggningslänken.

## Data

```
users/{uid}/glazes/{id}
users/{uid}/combos/{id}
users/{uid}/projects/{id}
users/{uid}/images/{id}   bilder som data-URL (≤ 1 MB)
```

Bilderna ligger i Firestore så att gratisplanen (Spark) räcker.

AI-funktionerna från Claude-artefakten (läsa glasyrer från bild, förslag på kombinationer) finns inte i den här versionen.
