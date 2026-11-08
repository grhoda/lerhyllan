// Skickar Firebase-inloggningens sidor (/__/auth/…) vidare till Firebase,
// så att inloggningen sker på samma domän som sidan (krävs av Safari m.fl.).
const FIREBASE = "https://lerhyllan.firebaseapp.com";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/__/auth/") || url.pathname.startsWith("/__/firebase/")) {
      return fetch(new Request(FIREBASE + url.pathname + url.search, request));
    }
    return env.ASSETS.fetch(request);
  }
};
