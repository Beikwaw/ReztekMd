import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { getStorage } from "firebase-admin/storage"
import { cert, getApps, initializeApp } from "firebase-admin/app"

// Check if the app has already been initialized
if (!getApps().length) {
  // Use environment variables if available, otherwise try to use the service account file
  try {
    // For production deployment (Vercel)
    if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: "reztek-my-domain-living.firebasestorage.app",
      })
      console.log("Firebase Admin initialized with environment variables");
    } 
    // For local development (fallback to service account file)
    else {
      try {
        const serviceAccount = require("./serviceAccountKey.json");
        initializeApp({
          credential: cert(serviceAccount as any),
          storageBucket: "reztek-my-domain-living.firebasestorage.app",
        })
        console.log("Firebase Admin initialized with service account file");
      } catch (error) {
        console.error("Failed to load service account file:", error);
        throw new Error("Firebase Admin credentials not available");
      }
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }
}

const adminDb = getFirestore()
const adminAuth = getAuth()
const adminStorage = getStorage()

export { adminDb, adminAuth, adminStorage }
