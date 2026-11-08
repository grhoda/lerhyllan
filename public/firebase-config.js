// Firebase-inställningar för Lerhyllan (inte hemliga – skyddas av firestore.rules).
window.LERHYLLAN_FIREBASE = {
  apiKey: "AIzaSyAuy7aHPAc0sK8ny_uUBs017-9opqghOws",
  // På egen domän sköts inloggningen via /__/auth (se src/worker.js).
  authDomain: location.hostname === "lerhyllan.rhoda.se" ? location.host : "lerhyllan.firebaseapp.com",
  projectId: "lerhyllan",
  storageBucket: "lerhyllan.firebasestorage.app",
  messagingSenderId: "357106337147",
  appId: "1:357106337147:web:e00bab1c14017bfc77e9de",
  measurementId: "G-JV3SXNRE90"
};
