import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()
    
    if (!idToken) {
      console.error("No ID token provided");
      return NextResponse.json({ error: "ID token is required" }, { status: 400 });
    }

    console.log("Creating session cookie for token");
    
    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })

    // Create the response first
    const response = NextResponse.json({ success: true }, { status: 200 });
    
    // Set the cookie in the response
    response.cookies.set("session", sessionCookie, {
      maxAge: Math.floor(expiresIn / 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
    
    console.log("Session cookie created successfully");
    
    return response;
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
