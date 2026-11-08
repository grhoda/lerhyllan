# Lerhyllan

Ett bibliotek för glasyrer, kombinationer och keramikprojekt. Data sparas i Firebase (Firestore) och varje användare loggar in med Google.

## Kom igång

1. Skapa ett projekt på https://console.firebase.google.com
2. **Build → Firestore Database → Create database** (välj `eur3` eller `europe-north1`).
3. **Build → Authentication → Get started → Google → Enable.**
4. **Projektinställningar → Lägg till webbapp.** Kopiera config-värdena till `firebase-config.js`.
5. Publicera regler och sidan:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy
```

Sidan hamnar på `https://<projekt-id>.web.app`.

## Data

```
users/{uid}/glazes/{id}
users/{uid}/combos/{id}
users/{uid}/projects/{id}
users/{uid}/images/{id}   bilder som data-URL (≤ 1 MB)
```

Bilderna ligger i Firestore så att gratisplanen (Spark) räcker.

AI-funktionerna från Claude-artefakten (läsa glasyrer från bild, förslag på kombinationer) finns inte i den här versionen.
