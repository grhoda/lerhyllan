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

## Läsa från bild och få förslag (Claude)

Knappen **+ Lägg till** (under Glasyrer och Kombinationer) låter dig välja *Ny glasyr* eller *Ny kombination*, och sedan *Från bild* eller *Fyll i själv*.

- **Ny glasyr från bild:** en eller flera burkar i samma bild. Claude läser etiketterna och du kollar innan det sparas.
- **Ny kombination från bild:** bild (och gärna text) på ett provbrick eller en sak. Claude läser texten i bilden och föreslår namn, glasyrer från ditt bibliotek i lagerordning, antal strykningar och färg. Du får ett förifyllt formulär att ändra eller spara.
- **Få förslag** under Inspiration använder samma funktion.

Bilden och texten skickas från sidan till `/api/sample` i `src/worker.js`, som kontrollerar inloggningen (Firebase ID-token) och anropar Claudes API. Sidan använder inte funktionen förrän den är påslagen.

Slå på den så här:

1. Skapa en API-nyckel på https://console.anthropic.com.
2. Cloudflare → Workers & Pages → lerhyllan → Settings → Variables and secrets → lägg till hemligheten **`ANTHROPIC_API_KEY`**.
3. (Rekommenderas) Lägg till variabeln **`ALLOWED_EMAILS`** med din e-postadress, flera skiljs med komma. Utan den kan alla som skapar ett konto i appen använda funktionen på din nyckel.
4. (Valfritt) **`ANTHROPIC_MODEL`** byter modell. Standard är `claude-sonnet-5-5`.

Utan nyckeln fungerar allt annat som vanligt, och *Från bild* döljs med en förklaring.
