// firebase.js
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
  apiKey: "AIzaSyCDXwghNQOji0TBgq0HwU9C5pkmtITF3Fo",
  authDomain: "salon-fcbfb.firebaseapp.com",
  projectId: "salon-fcbfb",
  storageBucket: "salon-fcbfb.appspot.com", // ✅ Corrected bucket URL
  messagingSenderId: "398504432118",
  appId: "1:398504432118:web:40cd9e591d08e2ed91b7d7",
  measurementId: "G-VPGYBS57H4",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Auth and Providers
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

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
