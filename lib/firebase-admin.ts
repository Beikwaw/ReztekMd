import { getApps, initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { getStorage } from "firebase-admin/storage"
import serviceAccount from "./serviceAccountKey.json"

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
    storageBucket: "reztek-my-domain-living.firebasestorage.app",
  })
}

const adminDb = getFirestore()
const adminAuth = getAuth()
const adminStorage = getStorage()

export { adminDb, adminAuth, adminStorage }
