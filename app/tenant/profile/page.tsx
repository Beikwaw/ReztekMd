"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { auth, db, storage } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, Camera } from "lucide-react"
import TenantHeader from "@/components/tenant/tenant-header"

export default function TenantProfile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantData, setTenantData] = useState<any>(null)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImageUrl, setProfileImageUrl] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get tenant data
          const tenantDoc = await getDoc(doc(db, "tenants", user.uid))
          
          if (tenantDoc.exists()) {
            const data = tenantDoc.data()
            setTenantData(data)
            setFormData({
              name: data.name || "",
              surname: data.surname || "",
              email: data.email || "",
              phone: data.phone || "",
            })
            
            // Get profile image if it exists
            if (data.profileImage) {
              setProfileImageUrl(data.profileImage)
            }
          } else {
            // Not a tenant, redirect to login
            await auth.signOut()
            router.push("/tenant/login")
          }
        } catch (error) {
          console.error("Error fetching tenant data:", error)
          setError("Failed to load your profile data. Please try again later.")
        } finally {
          setLoading(false)
        }
      } else {
        // Not logged in, redirect to login
        router.push("/tenant/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0])
      
      // Create a preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImageUrl(event.target.result as string)
        }
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    if (!auth.currentUser) {
      setError("You must be logged in to update your profile")
      setSaving(false)
      return
    }

    try {
      const tenantRef = doc(db, "tenants", auth.currentUser.uid)
      
      // Upload profile image if selected
      let profileImageURL = tenantData?.profileImage || ""
      
      if (profileImage) {
        const storageRef = ref(storage, `tenant-profiles/${auth.currentUser.uid}`)
        await uploadBytes(storageRef, profileImage)
        profileImageURL = await getDownloadURL(storageRef)
      }
      
      // Update tenant document
      await updateDoc(tenantRef, {
        ...formData,
        profileImage: profileImageURL,
        updatedAt: new Date().toISOString(),
      })
      
      // Update local state
      setTenantData((prev: any) => ({
        ...prev,
        ...formData,
        profileImage: profileImageURL,
      }))
      
      setSuccess("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TenantHeader 
        userData={tenantData} 
        onLogout={() => auth.signOut().then(() => router.push("/tenant/login"))} 
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <Card className="md:col-span-1 bg-white border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-900">Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-6">
              <div className="relative mb-4 group">
                <Avatar className="h-24 w-24 border-2 border-gray-200">
                  <AvatarImage src={profileImageUrl} alt={tenantData?.name} />
                  <AvatarFallback className="bg-red-600 text-white text-xl">
                    {tenantData?.name?.charAt(0)}
                    {tenantData?.surname?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="profile-image" 
                  className="absolute bottom-0 right-0 bg-red-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-red-700 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <span className="sr-only">Change profile picture</span>
                </label>
                <input 
                  type="file" 
                  id="profile-image" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleProfileImageChange} 
                />
              </div>
              
              <h2 className="text-lg font-medium text-gray-900">
                {tenantData?.name} {tenantData?.surname}
              </h2>
              <p className="text-gray-500 text-sm">{tenantData?.email}</p>
              
              <div className="w-full mt-6 space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Room</span>
                  <span className="font-medium text-gray-900">{tenantData?.roomNumber || "Not assigned"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Residence</span>
                  <span className="font-medium text-gray-900">{tenantData?.residence || "Not assigned"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Phone</span>
                  <span className="font-medium text-gray-900">{tenantData?.phone || "Not provided"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Edit Form */}
          <Card className="md:col-span-2 bg-white border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-900">Edit Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4 bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-500">{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-500">{success}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700">First Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="border-gray-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="surname" className="text-gray-700">Last Name</Label>
                    <Input
                      id="surname"
                      name="surname"
                      value={formData.surname}
                      onChange={handleInputChange}
                      className="border-gray-300"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="border-gray-300"
                    disabled
                  />
                  <p className="text-xs text-gray-500">Email address cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="border-gray-300"
                    placeholder="e.g. +27 12 345 6789"
                  />
                </div>
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="bg-red-600 hover:bg-red-700 text-white" 
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
