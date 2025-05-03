import { getApps, initializeApp, cert } from "firebase-admin/app"
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
      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Missing Firebase Admin environment variables");
      }
      
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey
        }),
        storageBucket: "reztek-my-domain-living.firebasestorage.app",
      });
      console.log("Firebase Admin initialized with environment variables");
    } 
    // For local development - try to use service account key file
    else {
      try {
        // First try to import the real service account key
        const serviceAccount = require("./serviceAccountKey.json");
        initializeApp({
          credential: cert(serviceAccount as any),
          storageBucket: "reztek-my-domain-living.firebasestorage.app",
        });
        console.log("Firebase Admin initialized with serviceAccountKey.json");
      } catch (error) {
        // If real key not found, use the dummy key for development/testing
        const dummyServiceAccount = require("./serviceAccountKeyDummy.json");
        initializeApp({
          credential: cert(dummyServiceAccount as any),
          storageBucket: "reztek-my-domain-living.firebasestorage.app",
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
