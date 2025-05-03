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
    
    console.log("Verifying ID token...");
    
    try {
      // Verify the ID token first
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      console.log("ID token verified successfully for user:", decodedToken.uid);
      
      // Check if the user is an admin (email is obsadmin@mydomainliving.co.za)
      if (decodedToken.email !== "obsadmin@mydomainliving.co.za") {
        console.error("Unauthorized access attempt with email:", decodedToken.email);
        return NextResponse.json({ error: "Unauthorized. Admin access only." }, { status: 403 });
      }
      
      // Create session cookie
      console.log("Creating session cookie...");
      const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      
      // Create the response
      const response = NextResponse.json({ success: true }, { status: 200 });
      
      // Set the cookie in the response
      response.cookies.set("session", sessionCookie, {
        maxAge: Math.floor(expiresIn / 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
      });
      
      console.log("Session cookie created and set successfully");
      return response;
    } catch (verifyError) {
      console.error("Error verifying ID token:", verifyError);
      return NextResponse.json({ error: "Invalid or expired ID token" }, { status: 401 });
    }
  } catch (error: any) {
    console.error("Error in login API route:", error);
    return NextResponse.json(
      { error: `Authentication failed: ${error.message || "Unknown error"}` }, 
      { status: 500 }
    );
  }
}
