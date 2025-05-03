import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Only protect /admin routes except /admin/login
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    request.nextUrl.pathname !== "/admin/login"
  ) {
    // Check for direct admin session first (our new approach)
    const adminSession = request.cookies.get("admin_session")?.value
    if (adminSession) {
      try {
        // Decode and verify the admin session
        const sessionData = JSON.parse(Buffer.from(adminSession, 'base64').toString());
        
        // Check if it's a valid admin session
        if (
          sessionData.email === "obsadmin@mydomainliving.co.za" && 
          sessionData.role === "admin" &&
          // Session not expired (5 days)
          sessionData.timestamp > Date.now() - (5 * 24 * 60 * 60 * 1000)
        ) {
          console.log("Valid direct admin session found");
          return NextResponse.next();
        }
      } catch (error) {
        console.error("Error parsing admin session:", error);
      }
    }
    
    // Fall back to regular session check
    const session = request.cookies.get("session")?.value || ""
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
    
    try {
      // Verify the session using our API route
      const response = await fetch(`${request.nextUrl.origin}/api/auth/verify-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session }),
      })
      
      if (!response.ok) {
        console.error("Session verification failed with status:", response.status);
        return NextResponse.redirect(new URL("/admin/login", request.url))
      }
      
      const data = await response.json()
      if (!data.valid) {
        console.error("Invalid session:", data.error);
        return NextResponse.redirect(new URL("/admin/login", request.url))
      }
      
      // Check if the user is an admin
      if (data.email !== "obsadmin@mydomainliving.co.za") {
        console.error("Not an admin email:", data.email);
        return NextResponse.redirect(new URL("/admin/login", request.url))
      }
    } catch (error) {
      console.error("Error verifying session:", error);
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
}
