import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    console.log("Login API route called");
    
    // Parse the request body
    const body = await request.json().catch(err => {
      console.error("Error parsing request body:", err);
      return null;
    });
    
    if (!body || !body.idToken) {
      console.error("No ID token provided in request body");
      return NextResponse.json({ error: "ID token is required" }, { status: 400 });
    }
    
    const { idToken } = body;
    
    // For simplicity, we'll use the ID token directly as the session token
    // This is a workaround for the Firebase Admin SDK issues in production
    console.log("Creating simplified session...");
    
    try {
      // Create the response
      const response = NextResponse.json({ success: true }, { status: 200 });
      
      // Set the token directly as a cookie
      // This is not as secure as using Firebase Admin's createSessionCookie,
      // but it will work as a temporary solution
      const expiresIn = 60 * 60 * 24 * 5; // 5 days in seconds
      
      response.cookies.set("session", idToken, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
      });
      
      console.log("Session cookie set successfully");
      return response;
    } catch (error) {
      console.error("Error setting session cookie:", error);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in login API route:", error);
    return NextResponse.json(
      { error: `Authentication failed: ${error.message || "Unknown error"}` }, 
      { status: 500 }
    );
  }
}
