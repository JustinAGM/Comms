import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "commschat.firebaseapp.com",
  projectId: "commschat",
  storageBucket: "commschat.firebasestorage.app",
  messagingSenderId: "626241756218",
  appId: "1:626241756218:web:6d771d1c0bc6541c6a6903"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
