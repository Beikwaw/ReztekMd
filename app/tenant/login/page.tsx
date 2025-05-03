"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, ArrowLeft, Eye, EyeOff, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Declare global type for reCAPTCHA
declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

export default function TenantLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState("")
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState("")
  const router = useRouter()

  // Load reCAPTCHA script
  useEffect(() => {
    // Only load if it's not already loaded
    if (!document.querySelector('script[src*="recaptcha"]')) {
      window.onRecaptchaLoad = () => {
        setRecaptchaLoaded(true);
      };
      
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else {
      setRecaptchaLoaded(true);
    }
    
    return () => {
      window.onRecaptchaLoad = () => {};
    };
  }, []);

  // Initialize reCAPTCHA when dialog opens
  useEffect(() => {
    if (forgotPasswordOpen && recaptchaLoaded && window.grecaptcha) {
      try {
        // Clear any existing reCAPTCHA
        const container = document.getElementById('recaptcha-container');
        if (container) container.innerHTML = '';
        
        // Use setTimeout to ensure the container is ready in the DOM
        setTimeout(() => {
          try {
            // Render new reCAPTCHA
            window.grecaptcha.render('recaptcha-container', {
              'sitekey': '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // This is a test key, replace with your actual key in production
              'callback': (token: string) => {
                setRecaptchaToken(token);
              },
              'expired-callback': () => {
                setRecaptchaToken("");
              }
            });
          } catch (renderError) {
            console.error("Error rendering reCAPTCHA:", renderError);
          }
        }, 100);
      } catch (error) {
        console.error("Error setting up reCAPTCHA:", error);
      }
    }
  }, [forgotPasswordOpen, recaptchaLoaded]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Verify this is a tenant account
      const tenantDoc = await getDoc(doc(db, "tenants", user.uid))

      if (!tenantDoc.exists()) {
        // Not a tenant, sign out
        await auth.signOut()
        setError("This account is not registered as a tenant. Please use the correct login portal.")
        setLoading(false)
        return
      }

      // Successful login - redirect to tenant dashboard
      router.push("/tenant/dashboard")
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "Failed to login. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    setResetEmailSent(false);
    
    try {
      // Check if this is the admin email
      if (resetEmail.toLowerCase() === "obsadmin@mydomainliving.co.za") {
        console.log("Admin password reset attempted");
        setResetError("Admin passwords can only be reset by system administrators. Please contact support.");
        setResetLoading(false);
        return;
      }
      
      if (!recaptchaToken) {
        setResetError("Please complete the reCAPTCHA verification");
        setResetLoading(false);
        return;
      }
      
      // Verify this is a tenant email before sending reset
      // This is a simple check - in production you might want to check against your database
      if (!resetEmail.includes('@')) {
        setResetError("Please enter a valid email address");
        setResetLoading(false);
        return;
      }
      
      // Send password reset email
      await sendPasswordResetEmail(auth, resetEmail);
      setResetEmailSent(true);
      setResetEmail("");
      
      // Reset reCAPTCHA
      if (window.grecaptcha) {
        window.grecaptcha.reset();
      }
      
    } catch (error: any) {
      console.error("Password reset error:", error);
      setResetError(error.message || "Failed to send reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotPasswordDialog = () => {
    setForgotPasswordOpen(false);
    setResetEmail("");
    setResetError("");
    setResetEmailSent(false);
    setRecaptchaToken("");
  };

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
              <h1 className="text-2xl font-bold">Tenant Login</h1>
              <p className="text-gray-400 mt-2">Access your tenant portal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800">
              {error && (
                <Alert className="bg-red-900/20 border-red-600/50 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 pr-10"
                    placeholder="Enter your password"
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

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
              
              <div className="text-center mt-4 text-sm text-gray-400">
                <Link href="/tenant/register" className="text-red-400 hover:text-red-300">
                  Don't have an account? Register here
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Your Password</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter your email address below and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>

          {resetEmailSent ? (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-white">Password Reset Email Sent</h3>
              <p className="mt-2 text-sm text-gray-400">
                Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
              </p>
              <Button
                onClick={closeForgotPasswordDialog}
                className="mt-4 w-full bg-red-600 hover:bg-red-700"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {resetError && (
                <Alert className="bg-red-900/20 border-red-600/50 text-red-200">
                  <AlertDescription>{resetError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-gray-200">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">Verification</Label>
                <div id="recaptcha-container" className="flex justify-center"></div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForgotPasswordDialog}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-red-600 hover:bg-red-700"
                  disabled={resetLoading || !recaptchaToken}
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
