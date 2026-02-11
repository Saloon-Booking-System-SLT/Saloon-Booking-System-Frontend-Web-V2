// firebase.js - Updated for saloon-booking-system-7ee3f project
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBmuXSVsyUdtyJN8ze3Euii0H6Yeae6_bU",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "saloon-booking-system-7ee3f.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "saloon-booking-system-7ee3f",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "saloon-booking-system-7ee3f.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "194406605053",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:194406605053:web:7dbe58c13b680227d19e94",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-2XKJWVXY0Z",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Auth and Providers
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ 
  prompt: "select_account",
  login_hint: "user@example.com" 
});

// Add additional scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');

// ✅ Optional: Limit login to session only (not persisted after close)
setPersistence(auth, browserSessionPersistence)
  .then(() => console.log("✅ Session-only login enabled"))
  .catch((err) => console.error("❌ Auth persistence error:", err));

// ✅ Recaptcha Setup Function
const setupRecaptcha = (containerId = "recaptcha-container") => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      containerId,
      {
        size: "invisible",
        callback: (response) => {
          console.log("reCAPTCHA solved:", response);
        },
      },
      auth
    );
  }
  return window.recaptchaVerifier;
};

// ✅ Export everything needed
export {
  auth,
  googleProvider,
  signInWithPhoneNumber,
  setupRecaptcha,
};