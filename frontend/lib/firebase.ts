// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDWPE5plmItjVGXG_Zf60TtQNnoRagREAk",
  authDomain: "echo-css.firebaseapp.com",
  databaseURL: "https://echo-css-default-rtdb.firebaseio.com",
  projectId: "echo-css",
  storageBucket: "echo-css.firebasestorage.app",
  messagingSenderId: "610384872498",
  appId: "1:610384872498:web:06c12c4687de61cdba682b",
  measurementId: "G-ZGHQY0MM0D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only if supported (client-side only)
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };
