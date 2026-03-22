import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyC0OLHjlCUE6h-10Nezy0nPDvQmzrlK5xM",
    authDomain: "future-35c71.firebaseapp.com",
    projectId: "future-35c71",
    storageBucket: "future-35c71.firebasestorage.app",
    messagingSenderId: "235355062295",
    appId: "1:235355062295:web:8e5329c09bde463b981c52",
    measurementId: "G-S2PX3WL5XX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable persistence for zero-lag local loading
import { enableIndexedDbPersistence } from "firebase/firestore";
if (typeof window !== "undefined") {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn("Persistence failed: Multiple tabs open");
        } else if (err.code === 'unimplemented') {
            console.warn("Persistence failed: Browser not supported");
        }
    });
}

export { db, storage };
