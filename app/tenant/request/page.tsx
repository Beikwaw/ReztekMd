"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, AlertCircle, CheckCircle, LogOut } from "lucide-react"
import TenantHeader from "@/components/tenant/tenant-header"

export default function MaintenanceRequest() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [requestId, setRequestId] = useState("")

  const [formData, setFormData] = useState({
    issueLocation: "",
    urgencyLevel: "",
    description: "",
  })

  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [showHighUrgencyDisclaimer, setShowHighUrgencyDisclaimer] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "tenants", user.uid))
          if (userDoc.exists()) {
            setUserData(userDoc.data())
          } else {
            router.push("/tenant/login")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        } finally {
          setLoading(false)
        }
      } else {
        router.push("/tenant/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Show disclaimer when High urgency is selected
    if (name === "urgencyLevel") {
      setShowHighUrgencyDisclaimer(value === "High");
      
      // Clear image if changing from High to another level
      if (value !== "High" && formData.urgencyLevel === "High") {
        setImage(null);
        setImagePreview(null);
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null)
    const file = e.target.files?.[0]
    if (file) {
      // Check file type - accept any valid image format
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml'];
      
      if (!validImageTypes.includes(file.type)) {
        setImageError("Please upload a valid image file (JPEG, PNG, GIF, WEBP, BMP, TIFF, SVG)");
        return;
      }
      
      setImage(file)
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push("/tenant/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setImageError(null)

    if (!formData.issueLocation || !formData.urgencyLevel || !formData.description) {
      setError("Please fill in all required fields")
      return
    }

    // Check if image is required for high urgency
    if (formData.urgencyLevel === "High" && !image) {
      setError("Please upload an image for high urgency requests")
      return
    }

    // Check image size if one is uploaded
    if (image) {
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (image.size > maxSize) {
        setImageError(`File size exceeds 10MB limit. Current size: ${(image.size / (1024 * 1024)).toFixed(2)}MB`);
        setError("Please select a smaller image file (maximum 10MB)")
        return;
      }
      
      // Validate image type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml'];
      if (!validImageTypes.includes(image.type)) {
        setImageError("Please upload a valid image file (JPEG, PNG, GIF, WEBP, BMP, TIFF, SVG)");
        return;
      }
    }

    try {
      setSubmitting(true)

      // First add the request to get an ID
      const requestRef = await addDoc(collection(db, "maintenanceRequests"), {
        tenantId: auth.currentUser?.uid,
        tenantName: `${userData?.name} ${userData?.surname}`,
        tenantEmail: userData?.email,
        tenantPhone: userData?.contactNumber,
        roomNumber: userData?.roomNumber,
        residence: userData?.residence,
        tenantCode: userData?.tenantCode,
        issueLocation: formData.issueLocation,
        urgencyLevel: formData.urgencyLevel,
        description: formData.description,
        imageUrl: "",
        status: "Pending",
        hasFeedback: false,
        rating: null,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setRequestId(requestRef.id)

      // Upload image if exists and urgency is high
      let imageUrl = ""
      if (image && auth.currentUser && formData.urgencyLevel === "High") {
        try {
          // Simplify the storage path to avoid permission issues
          const fileName = `${Date.now()}_${image.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
          const storageRef = ref(storage, `maintenance-requests/${requestRef.id}/${fileName}`)

          await uploadBytes(storageRef, image)
          imageUrl = await getDownloadURL(storageRef)

          // Update the request with the image URL
          await updateDoc(doc(db, "maintenanceRequests", requestRef.id), {
            imageUrl: imageUrl,
          })
        } catch (storageError: any) {
          console.error("Storage error:", storageError)
          setError(`Image upload failed: ${storageError.message}. Your request has been submitted without the image.`)
          // Continue without the image
        }
      }

      setSuccess(true)
      setSubmitting(false)
    } catch (err: any) {
      console.error("Error submitting request:", err)
      setError(err.message || "An error occurred while submitting your request")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Maintenance Request</h1>
            <p className="text-gray-400 mt-1">Submit a new maintenance request for your room</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              variant="outline"
              className="bg-gray-800 hover:bg-gray-700 border-gray-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {success ? (
          <Card className="bg-gray-900 border-gray-800 text-white">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center items-center gap-4 mb-4">
                <Image src="/logo.png" alt="My Domain Logo" width={100} height={100} className="mx-auto" />
                <Image src="/reztek-logo.png" alt="RezTek Logo" width={120} height={40} className="mx-auto" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-500">Request Submitted Successfully!</CardTitle>
              <CardDescription className="text-gray-400">
                Your maintenance request has been received and will be processed soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>

              <div className="bg-gray-800 p-6 rounded-md text-center">
                <p className="text-sm text-gray-400 mb-2">Your Request ID</p>
                <p className="text-2xl font-mono font-bold text-red-500">{requestId}</p>
                <p className="text-sm text-gray-400 mt-2">Please save this number for future reference</p>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-3 text-center">Request Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Name:</div>
                  <div className="font-medium">
                    {userData?.name} {userData?.surname}
                  </div>

                  <div className="text-gray-400">Room Number:</div>
                  <div className="font-medium">{userData?.roomNumber}</div>

                  <div className="text-gray-400">Residence:</div>
                  <div className="font-medium">My Domain {userData?.residence}</div>

                  <div className="text-gray-400">Issue Location:</div>
                  <div className="font-medium">{formData.issueLocation}</div>

                  <div className="text-gray-400">Urgency Level:</div>
                  <div className="font-medium">{formData.urgencyLevel}</div>
                </div>
              </div>

              <Alert className="bg-yellow-900/20 border-yellow-600/50 text-yellow-200">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  You can track the status of your request in the Request History section.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-800 p-4 rounded-md">
                <p className="font-bold">Contact Information</p>
                <p className="text-gray-400">My Domain {userData?.residence} Front Desk - 068 204 0814</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => router.push("/tenant/dashboard")} className="bg-red-600 hover:bg-red-700 flex-1">
                  Return to Dashboard
                </Button>
                <Button onClick={() => router.push("/tenant/history")} className="bg-gray-800 hover:bg-gray-700 flex-1">
                  View Request History
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert className="bg-red-900/20 border-red-600/50 text-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Tenant Information</CardTitle>
                <CardDescription className="text-gray-400">
                  This information is pre-filled from your profile
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={`${userData?.name} ${userData?.surname}`}
                    disabled
                    className="bg-gray-800 border-gray-700 text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Room Number</Label>
                  <Input value={userData?.roomNumber} disabled className="bg-gray-800 border-gray-700 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <Label>Tenant Code</Label>
                  <Input value={userData?.tenantCode} disabled className="bg-gray-800 border-gray-700 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <Label>Place of Residence</Label>
                  <Input
                    value={`My Domain ${userData?.residence}`}
                    disabled
                    className="bg-gray-800 border-gray-700 text-gray-400"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
                <CardDescription className="text-gray-400">
                  Please provide details about your maintenance issue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="issueLocation">Issue Location *</Label>
                  <Select onValueChange={(value) => handleSelectChange("issueLocation", value)} required>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kitchen">Kitchen</SelectItem>
                      <SelectItem value="Bathroom">Bathroom</SelectItem>
                      <SelectItem value="Bedroom">Bedroom</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgencyLevel">Urgency Level *</Label>
                  <Select onValueChange={(value) => handleSelectChange("urgencyLevel", value)} required>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.urgencyLevel === "High" && (
                    <p className="text-xs text-red-400">* Image upload is required for high urgency requests</p>
                  )}
                </div>

                {showHighUrgencyDisclaimer && (
                  <Alert className="bg-red-900/20 border-red-600/50 text-red-200">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>
                      <h4 className="font-bold mb-1">High Urgency Maintenance Disclaimer</h4>
                      <p className="text-sm">
                        This request form is for emergencies only, such as electrical faults, severe flooding, fire sparks, 
                        or any issue posing immediate danger. Non-emergency or minor issues will not be attended to through this channel.
                      </p>
                      <p className="text-sm mt-2">
                        Misuse of this service will result in your request being disregarded. Repeated abuse may lead to further action.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {formData.urgencyLevel === "High" && (
                  <div className="space-y-2">
                    <Label htmlFor="image">
                      Image Upload (Required)
                    </Label>
                    <div className="border-2 border-dashed border-gray-700 rounded-md p-4 text-center">
                      <input type="file" id="image" accept="image/*" onChange={handleImageChange} className="hidden" />
                      {imagePreview ? (
                        <div className="space-y-4">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-md"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setImage(null)
                              setImagePreview(null)
                            }}
                            className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                          >
                            Remove Image
                          </Button>
                        </div>
                      ) : (
                        <label
                          htmlFor="image"
                          className="cursor-pointer flex flex-col items-center justify-center py-6"
                        >
                          <Upload className="h-10 w-10 text-gray-500 mb-2" />
                          <p className="text-sm text-gray-400">Click to upload an image of the issue</p>
                          <p className="text-xs text-gray-500 mt-1">Any image format accepted (JPG, PNG, GIF, etc.)</p>
                          <p className="text-xs text-gray-500">Maximum size: 10MB</p>
                          {imageError && (
                            <p className="text-xs text-red-400 mt-2">{imageError}</p>
                          )}
                        </label>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Please describe the issue in detail"
                    className="bg-gray-800 border-gray-700 min-h-[120px]"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Maintenance Request"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
