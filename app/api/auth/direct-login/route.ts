import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("Direct login API route called");
    
    // Parse the request body
    const body = await request.json().catch(err => {
      console.error("Error parsing request body:", err);
      return null;
    });
    
    if (!body || !body.email) {
      console.error("No email provided in request body");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    const { email } = body;
    
    // Only allow the admin email
    if (email !== "obsadmin@mydomainliving.co.za") {
      console.error("Unauthorized access attempt with email:", email);
      return NextResponse.json({ error: "Unauthorized. Admin access only." }, { status: 403 });
    }
    
    console.log("Creating direct admin session for:", email);
    
    // Create a simple session object with admin info
    const sessionData = {
      email: email,
      role: "admin",
      name: "Admin",
      timestamp: Date.now(),
      isDirectLogin: true
    };
    
    // Encode session data
    const sessionString = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    
    // Create the response
    const response = NextResponse.json({ success: true }, { status: 200 });
    
    // Set the session cookie (5 days expiration)
    const expiresIn = 60 * 60 * 24 * 5; // 5 days in seconds
    response.cookies.set("admin_session", sessionString, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
    
    console.log("Direct admin session created successfully");
    return response;
  } catch (error: any) {
    console.error("Error in direct login API route:", error);
    return NextResponse.json(
      { error: `Authentication failed: ${error.message || "Unknown error"}` }, 
      { status: 500 }
    );
  }
}
