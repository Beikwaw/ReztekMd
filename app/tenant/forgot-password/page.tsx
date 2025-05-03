"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [captchaValue, setCaptchaValue] = useState("")
  const [captchaAnswer, setCaptchaAnswer] = useState("")

  // Generate a simple CAPTCHA
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10)
    const num2 = Math.floor(Math.random() * 10)
    setCaptchaValue(`${num1} + ${num2}`)
    setCaptchaAnswer((num1 + num2).toString())
  }

  // Generate CAPTCHA on component mount
  useState(() => {
    generateCaptcha()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Please enter your email address")
      return
    }

    // Check if it's the admin email
    if (email.toLowerCase() === "obsadmin@mydomainliving.co.za") {
      setError("Password reset is not available for this email")
      return
    }

    // Verify CAPTCHA
    const userCaptcha = (document.getElementById("captcha") as HTMLInputElement).value
    if (userCaptcha !== captchaAnswer) {
      setError("Incorrect CAPTCHA answer. Please try again.")
      generateCaptcha()
      return
    }

    try {
      setLoading(true)
      await sendPasswordResetEmail(auth, email)
      setSuccess(true)
      setLoading(false)
    } catch (err: any) {
      console.error("Password reset error:", err)
      setError(err.message || "An error occurred. Please try again.")
      setLoading(false)
      generateCaptcha()
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <div className="mb-8">
          <Link href="/tenant/login" className="inline-flex items-center text-gray-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center flex-1">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Image src="/logo.png" alt="RezTek Logo" width={200} height={120} className="mx-auto mb-4" />
              <h1 className="text-2xl font-bold">Reset Password</h1>
              <p className="text-gray-400 mt-2">Enter your email to receive a password reset link</p>
            </div>

            {success ? (
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 text-center">
                <Alert className="mb-4 bg-green-900/20 border-green-600/50 text-green-200">
                  <AlertDescription>
                    Password reset email sent! Please check your inbox and follow the instructions to reset your
                    password.
                  </AlertDescription>
                </Alert>
                <Button asChild className="mt-4">
                  <Link href="/tenant/login">Return to Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800">
                {error && (
                  <Alert className="bg-red-900/20 border-red-600/50 text-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
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
                  <Label htmlFor="captcha">CAPTCHA: {captchaValue}</Label>
                  <Input
                    id="captcha"
                    type="text"
                    placeholder="Enter the answer"
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                  <p className="text-xs text-gray-400">Please solve this simple math problem to verify you're human</p>
                </div>

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                  {loading ? "Sending..." : "Reset Password"}
                </Button>

                <div className="text-center text-sm text-gray-400">
                  Remember your password?{" "}
                  <Link href="/tenant/login" className="text-red-500 hover:text-red-400">
                    Login here
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
