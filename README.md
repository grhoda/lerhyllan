# Lerhyllan

Ett bibliotek för glasyrer, kombinationer och keramikprojekt. Data sparas i Firebase (Firestore) och man öppnar sin lerhylla med namn + kod (minst 8 tecken). Varken namn eller kod sparas; de blir en SHA-256-nyckel som pekar ut biblioteket.

## Kom igång

1. Skapa ett projekt på https://console.firebase.google.com
2. **Build → Firestore Database → Create database** (välj `eur3` eller `europe-north1`).
3. **Projektinställningar → Lägg till webbapp.** Kopiera config-värdena till `public/firebase-config.js`.
4. Lägg in `firestore.rules` under Firestore → Rules → Publish.

## Hosting (Cloudflare)

Sidan ligger i `public/` och läggs ut som en Cloudflare Worker med statiska filer (`wrangler.jsonc`), precis som Kvitt.
Cloudflare bygger om automatiskt vid varje push till `main`.

## Data

```
libraries/{nyckel}/glazes/{id}
libraries/{nyckel}/combos/{id}
libraries/{nyckel}/projects/{id}
libraries/{nyckel}/images/{id}   bilder som data-URL (≤ 1 MB)
```

Bilderna ligger i Firestore så att gratisplanen (Spark) räcker.

AI-funktionerna från Claude-artefakten (läsa glasyrer från bild, förslag på kombinationer) finns inte i den här versionen.
