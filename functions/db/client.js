import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { applicationDefault } from "firebase-admin/app";

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
  storageBucket: "svdfirebase000.firebasestorage.app",
  databaseURL: `https://svdfirebase000.firebaseio.com`,
  projectId: "svdfirebase000"
});

const db = getFirestore();

export { db };
