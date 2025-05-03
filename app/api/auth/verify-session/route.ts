import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { session } = await request.json()
    
    if (!session || typeof session !== 'string') {
      console.error("Invalid session format received");
      return NextResponse.json({ valid: false, error: "Invalid session format" }, { status: 400 });
    }
    
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(session, true);
      return NextResponse.json({ valid: true, email: decodedClaims.email });
    } catch (verifyError: any) {
      console.error("Session verification failed:", verifyError.message);
      return NextResponse.json({ valid: false, error: "Session expired or invalid" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error processing session verification request:", error);
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 });
  }
}