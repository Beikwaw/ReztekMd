import { getApps, initializeApp, cert, AppOptions } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { getStorage } from "firebase-admin/storage"

// Initialize Firebase Admin based on environment
const initializeFirebaseAdmin = () => {
  // Check if Firebase Admin is already initialized
  if (getApps().length > 0) return;

  try {
    // For production (Vercel) environment - use environment variables
    if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
      console.log("Initializing Firebase Admin with environment variables");
      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      if (!projectId || !clientEmail || !privateKey) {
        console.error("Missing Firebase Admin environment variables");
        throw new Error("Missing Firebase Admin environment variables");
      }
      
      const options: AppOptions = {
        credential: cert({
          projectId,
          clientEmail,
          privateKey
        }),
        storageBucket: "reztek-my-domain-living.appspot.com",
      };
      
      initializeApp(options);
      console.log("Firebase Admin initialized with environment variables");
    } 
    // For local development - try to use service account key file
    else {
      try {
        console.log("Trying to initialize Firebase Admin with service account key file");
        // First try to import the real service account key
        const serviceAccount = require("./serviceAccountKey.json");
        initializeApp({
          credential: cert(serviceAccount as any),
          storageBucket: "reztek-my-domain-living.appspot.com",
        });
        console.log("Firebase Admin initialized with serviceAccountKey.json");
      } catch (error) {
        console.log("Service account key not found, using dummy key");
        // If real key not found, use the dummy key for development/testing
        const dummyServiceAccount = require("./serviceAccountKeyDummy.json");
        initializeApp({
          credential: cert(dummyServiceAccount as any),
          storageBucket: "reztek-my-domain-living.appspot.com",
        });
        console.log("Firebase Admin initialized with dummy service account");
      }
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    throw error;
  }
};

// Initialize Firebase Admin
initializeFirebaseAdmin();

// Export Firebase Admin services
const adminDb = getFirestore();
const adminAuth = getAuth();
const adminStorage = getStorage();

export { adminDb, adminAuth, adminStorage }
