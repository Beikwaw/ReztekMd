"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [initialized, setInitialized] = useState(false)

  // Check if Firebase is initialized
  useEffect(() => {
    if (auth) {
      setInitialized(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!initialized) {
      setError("Firebase is not initialized yet. Please try again in a moment.")
      return
    }

    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    try {
      setLoading(true)
      console.log("Attempting to sign in with:", email)

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("Sign in successful:", userCredential.user.uid)

      // Check if user is admin (hardcoded check for the admin email)
      if (email.toLowerCase() === "obsadmin@mydomainliving.co.za") {
        // Create or update admin document
        const adminRef = doc(db, "admins", userCredential.user.uid)
        await setDoc(
          adminRef,
          {
            email: email.toLowerCase(),
            name: "Admin",
            role: "admin",
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          },
          { merge: true },
        )

        console.log("Admin document created/updated")

        try {
          // Get the ID token with a longer expiration
          const idToken = await userCredential.user.getIdToken(true);
          
          // Call the API to set the session cookie
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
            credentials: 'include', // Important for cookies
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Session creation failed:", errorData);
            setError("Failed to create admin session. Please try again.");
            setLoading(false);
            return;
          }
          
          console.log("Session created successfully, redirecting to dashboard");
          
          // Redirect to admin dashboard
          router.push("/admin/dashboard");
        } catch (sessionError) {
          console.error("Session creation error:", sessionError);
          setError("Failed to create session. Please try again.");
          setLoading(false);
        }
      } else {
        // Not an admin, sign out
        await auth.signOut()
        setError("Access denied. Only authorized admins can enter.")
        setLoading(false)
      }
    } catch (err: any) {
      console.error("Login error:", err)

      // Provide more specific error messages
      if (err.code === "auth/invalid-api-key") {
        setError("Authentication configuration error. Please contact support.")
      } else if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.")
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email.")
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.")
      } else {
        setError(`Login failed: ${err.message}`)
      }

      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center flex-1">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Image src="/logo.png" alt="RezTek Logo" width={200} height={120} className="mx-auto mb-4" />
              <h1 className="text-2xl font-bold">Admin Login</h1>
              <p className="text-gray-400 mt-2">Access the admin dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800">
              {error && (
                <Alert className="bg-red-900/20 border-red-600/50 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
