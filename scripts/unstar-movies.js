import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBBnfoVDYOFTu8Ri9kEHkkKn2SQFTeRUXg",
    authDomain: "shine-tech-dfebf.firebaseapp.com",
    projectId: "shine-tech-dfebf",
    storageBucket: "shine-tech-dfebf.firebasestorage.app",
    messagingSenderId: "570549421083",
    appId: "1:570549421083:web:3eb293740bdc74c17324be",
    measurementId: "G-Q8HKTMEC57"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function unstarAllMovies() {
    console.log("Fetching movies from Firebase...");
    try {
        const querySnapshot = await getDocs(collection(db, "movies"));
        const movies = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log(`Found ${movies.length} movies. Unstarring...`);

        for (const movie of movies) {
            if (movie.isStarred || movie.isLatest) {
                console.log(`Unstarring: ${movie.name}`);
                await updateDoc(doc(db, "movies", movie.id), {
                    isStarred: false,
                    isLatest: false
                });
            }
        }

        console.log("✅ All movies unstarred successfully.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error unstarring movies:", error);
        process.exit(1);
    }
}

unstarAllMovies();
