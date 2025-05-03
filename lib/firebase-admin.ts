import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { getStorage } from "firebase-admin/storage"
import { cert, getApps, initializeApp } from "firebase-admin/app"

// Initialize Firebase Admin
const initializeFirebaseAdmin = () => {
  // Check if Firebase Admin is already initialized
  if (getApps().length > 0) {
    return;
  }

  // For production deployment (Vercel)
  if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: "reztek-my-domain-living.firebasestorage.app",
      });
      console.log("Firebase Admin initialized with environment variables");
    } catch (error) {
      console.error("Error initializing Firebase Admin with env vars:", error);
      throw new Error("Failed to initialize Firebase Admin with environment variables");
    }
  } 
  // For local development
  else {
    try {
      // Try to load the real service account file first
      let serviceAccount;
      try {
        serviceAccount = require("./serviceAccountKey.json");
      } catch (e) {
        // If the real service account file doesn't exist, try the dummy one
        // This is mainly to help the build process
        console.log("Real service account file not found, trying dummy file");
        serviceAccount = require("./firebase-service-account-dummy.json");
      }
      
      initializeApp({
        credential: cert(serviceAccount),
        storageBucket: "reztek-my-domain-living.firebasestorage.app",
      });
      console.log("Firebase Admin initialized with service account file");
    } catch (error) {
      console.error("Error initializing Firebase Admin with service account:", error);
      throw new Error("Firebase Admin credentials not available. Set environment variables or provide serviceAccountKey.json");
    }
  }
};

// Try to initialize Firebase Admin
try {
  initializeFirebaseAdmin();
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
  // Don't throw here to allow the app to continue loading
}

// Export Firestore, Auth, and Storage
let adminDb;
let adminAuth;
let adminStorage;

try {
  adminDb = getFirestore();
  adminAuth = getAuth();
  adminStorage = getStorage();
} catch (error) {
  console.error("Error getting Firebase Admin services:", error);
  // Create dummy objects for development/testing
  adminDb = {} as any;
  adminAuth = {} as any;
  adminStorage = {} as any;
}

export { adminDb, adminAuth, adminStorage }
