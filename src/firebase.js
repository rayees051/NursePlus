import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCx1WIj6sz1ZQ7e_ghNTc3x6UwaT1ET8MA",
  authDomain: "nurseplus-313.firebaseapp.com",
  projectId: "nurseplus-313",
  storageBucket: "nurseplus-313.firebasestorage.app",
  messagingSenderId: "931847006251",
  appId: "1:931847006251:web:2eba6307cb363aa19be26e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);