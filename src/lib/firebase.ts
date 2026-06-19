import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// In AI Studio, Firebase config is fetched from an API endpoint exposed by the development server.
// Since we don't have the real config variables right now, we will fetch it at runtime.
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

const initFirebase = async () => {
    try {
        const response = await fetch('/__/firebase/init.json');
        if (!response.ok) {
           console.warn("Could not fetch Firebase config. The app environment might not be fully seeded yet.");
           return;
        }
        
        // Ensure we don't try to parse index.html as JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return;
        }

        const config = await response.json();
        const app = initializeApp(config);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (err) {
        console.error("Firebase initialization failed:", err);
    }
}

// We invoke this right away, and export a promise so the app can wait if needed
export const firebaseInitPromise = initFirebase();

export { auth, db };
