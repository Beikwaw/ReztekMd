import { auth, db } from "./firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"

// Check if a user is an admin
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    if (!userId) return false

    // First check if the user exists in the admins collection
    const adminDoc = await getDoc(doc(db, "admins", userId))

    if (adminDoc.exists()) {
      return true
    }

    // If not in admins collection, check if the user's email is the admin email
    const user = auth.currentUser
    if (user && user.email?.toLowerCase() === "obsadmin@mydomainliving.co.za") {
      // Create the admin document if it doesn't exist
      try {
        await setDoc(
          doc(db, "admins", userId),
          {
            email: user.email.toLowerCase(),
            name: "Admin",
            role: "admin",
            createdAt: new Date().toISOString(),
          },
          { merge: true },
        ) // Use merge to avoid overwriting existing data
      } catch (error) {
        console.error("Error creating admin document:", error)
        // Continue even if we can't create the document
      }
      return true
    }

    return false
  } catch (error) {
    console.error("Error checking admin status:", error)
    // Return true for the admin email as a fallback
    if (auth.currentUser?.email?.toLowerCase() === "obsadmin@mydomainliving.co.za") {
      return true
    }
    return false
  }
}

// Get admin data
export async function getAdminData(userId: string) {
  try {
    if (!userId) return null

    const adminDoc = await getDoc(doc(db, "admins", userId))
    if (adminDoc.exists()) {
      return adminDoc.data()
    }

    // If admin document doesn't exist but email matches, return basic admin data
    const user = auth.currentUser
    if (user && user.email?.toLowerCase() === "obsadmin@mydomainliving.co.za") {
      return {
        email: user.email.toLowerCase(),
        name: "Admin",
        role: "admin",
      }
    }

    return null
  } catch (error) {
    console.error("Error getting admin data:", error)
    return null
  }
}
