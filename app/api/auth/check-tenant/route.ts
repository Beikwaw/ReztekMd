import { NextRequest, NextResponse } from "next/server"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Check if the email exists in the tenants collection
    const tenantQuery = query(
      collection(db, "tenants"),
      where("email", "==", email)
    )

    const querySnapshot = await getDocs(tenantQuery)
    const isTenant = !querySnapshot.empty

    return NextResponse.json({ isTenant })
  } catch (error) {
    console.error("Error checking tenant status:", error)
    return NextResponse.json({ isTenant: false, error: "Failed to verify tenant status" })
  }
} 