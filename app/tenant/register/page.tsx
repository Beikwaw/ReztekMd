"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Eye, EyeOff, ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TenantRegister() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
    roomNumber: "",
    residence: "",
    tenantCode: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleResidenceChange = (value: string) => {
    setFormData((prev) => ({ ...prev, residence: value }))
  }

  const validateForm = () => {
    if (
      !formData.name ||
      !formData.surname ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.contactNumber ||
      !formData.roomNumber ||
      !formData.residence ||
      !formData.tenantCode
    ) {
      setError("All fields are required")
      return false
    }

    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      setError("Please enter a valid email address")
      return false
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    if (!/^\d+$/.test(formData.contactNumber)) {
      setError("Contact number should contain only digits")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) return

    try {
      setLoading(true)

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user

      // Store additional user data in Firestore
      await setDoc(doc(db, "tenants", user.uid), {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        contactNumber: formData.contactNumber,
        roomNumber: formData.roomNumber,
        residence: formData.residence,
        tenantCode: formData.tenantCode,
        createdAt: new Date().toISOString(),
        id: user.uid,
      })

      // Sign out the user after registration so they can log in properly
      await auth.signOut()

      setSuccess(true)
      setLoading(false)

      // Redirect after 5 seconds
      setTimeout(() => {
        router.push("/tenant/login")
      }, 5000)
    } catch (err: any) {
      console.error("Registration error:", err)
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already registered. Please use a different email or login.")
      } else {
        setError(err.message || "An error occurred during registration")
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
              <div className="flex justify-center items-center gap-4 mb-4">
                <Image src="/logo.png" alt="My Domain Logo" width={120} height={120} className="mx-auto" />
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-XjYVntwVnrzOrvrVEdTIKBMLXR8rvM.png"
                  alt="RezTek Logo"
                  width={150}
                  height={50}
                  className="mx-auto"
                />
              </div>
              <h1 className="text-2xl font-bold">Tenant Registration</h1>
              <p className="text-gray-400 mt-2">Create your account to submit maintenance requests</p>
            </div>

            {success ? (
              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center items-center gap-4 mb-4">
                    <Image src="/logo.png" alt="My Domain Logo" width={100} height={100} className="mx-auto" />
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-XjYVntwVnrzOrvrVEdTIKBMLXR8rvM.png"
                      alt="RezTek Logo"
                      width={120}
                      height={40}
                      className="mx-auto"
                    />
                  </div>
                  <CardTitle className="text-2xl font-bold text-green-500">Welcome to My Domain!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  </div>

                  <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Thank You for Registering!</h2>
                    <p className="mb-4">Your account has been created successfully.</p>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="font-bold text-lg mb-3 text-center">Your Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-400">Name:</div>
                      <div className="font-medium">
                        {formData.name} {formData.surname}
                      </div>

                      <div className="text-gray-400">Email:</div>
                      <div className="font-medium">{formData.email}</div>

                      <div className="text-gray-400">Room Number:</div>
                      <div className="font-medium">{formData.roomNumber}</div>

                      <div className="text-gray-400">Residence:</div>
                      <div className="font-medium">My Domain {formData.residence}</div>

                      <div className="text-gray-400">Tenant Code:</div>
                      <div className="font-medium text-red-500">{formData.tenantCode}</div>
                    </div>
                  </div>

                  <Alert className="bg-yellow-900/20 border-yellow-600/50 text-yellow-200">
                    <AlertDescription>
                      Please keep your tenant code safe as it will be used to track your maintenance requests.
                    </AlertDescription>
                  </Alert>

                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-4">Redirecting to login page in 5 seconds...</p>
                    <Button onClick={() => router.push("/tenant/login")} className="bg-red-600 hover:bg-red-700">
                      Go to Login
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800">
                <Alert className="bg-yellow-900/20 border-yellow-600/50 text-yellow-200">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    Please ensure all details entered are accurate. Once submitted, your information cannot be edited.
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert className="bg-red-900/20 border-red-600/50 text-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="surname">Surname</Label>
                  <Input
                    id="surname"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Gmail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomNumber">Room Number</Label>
                  <Input
                    id="roomNumber"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenantCode">Tenant Code</Label>
                  <Input
                    id="tenantCode"
                    name="tenantCode"
                    value={formData.tenantCode}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                  <p className="text-xs text-red-400">
                    ❗ This code is important for admin tracking. Keep it safe – it is used to view your requests.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="residence">Place of Residence</Label>
                  <Select onValueChange={handleResidenceChange} required>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select residence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Salt River">My Domain Salt River</SelectItem>
                      <SelectItem value="Observatory">My Domain Observatory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password (min 8 characters)</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="bg-gray-800 border-gray-700 pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                  {loading ? "Registering..." : "Register"}
                </Button>

                <div className="text-center text-sm text-gray-400">
                  Already have an account?{" "}
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
