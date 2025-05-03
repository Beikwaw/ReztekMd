import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function GET() {
  try {
    const session = cookies().get("session")?.value || ""

    if (!session) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    // Verify the session
    const decodedClaims = await adminAuth.verifySessionCookie(session, true)

    // Check if user is admin
    if (decodedClaims.email === "obsadmin@mydomainliving.co.za") {
      // Check if admin document exists, if not create it
      const adminRef = adminDb.collection("admins").doc(decodedClaims.uid)
      const adminDoc = await adminRef.get()

      if (!adminDoc.exists) {
        await adminRef.set({
          email: decodedClaims.email,
          role: "admin",
          createdAt: new Date(),
        })
      }

      return NextResponse.json({ isAdmin: true }, { status: 200 })
    }

    return NextResponse.json({ isAdmin: false }, { status: 403 })
  } catch (error) {
    console.error("Error checking admin status:", error)
    return NextResponse.json({ isAdmin: false, error: "Unauthorized" }, { status: 401 })
  }
}
