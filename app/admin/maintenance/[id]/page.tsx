"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import AdminHeader from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Phone,
  Mail,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ImageIcon,
  ArrowLeft,
  Home,
} from "lucide-react"
import { isAdmin, getAdminData } from "@/lib/admin-utils"

export default function MaintenanceRequestDetail() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<any>(null)
  const [imageOpen, setImageOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user is admin
          const adminStatus = await isAdmin(user.uid)

          if (adminStatus) {
            // Get admin data
            const data = await getAdminData(user.uid)
            setAdminData(data || { name: "Admin", email: user.email })

            // Fetch maintenance request
            await fetchRequest(requestId)
          } else {
            // Not an admin, redirect to login
            router.push("/admin/login")
          }
        } catch (error) {
          console.error("Error checking admin status:", error)
          router.push("/admin/login")
        }
      } else {
        // No user logged in, redirect to login
        router.push("/admin/login")
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [router, requestId])

  const fetchRequest = async (id: string) => {
    try {
      const requestDoc = await getDoc(doc(db, "maintenanceRequests", id))

      if (requestDoc.exists()) {
        const data = requestDoc.data()
        setRequest({
          id: requestDoc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || data.submittedAt?.toDate() || new Date(),
        })
      } else {
        console.error("Request not found")
        router.push("/admin/maintenance")
      }
    } catch (error) {
      console.error("Error fetching request:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push("/admin/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const updateRequestStatus = async (newStatus: string) => {
    try {
      setUpdatingStatus(true)

      await updateDoc(doc(db, "maintenanceRequests", requestId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      })

      // Update local state
      setRequest({
        ...request,
        status: newStatus,
        updatedAt: new Date(),
      })

      setUpdatingStatus(false)
    } catch (error) {
      console.error("Error updating request status:", error)
      setUpdatingStatus(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
      case "In Progress":
        return "bg-blue-500/20 text-blue-500 border-blue-500/50"
      case "Completed":
        return "bg-green-500/20 text-green-500 border-green-500/50"
      case "Cancelled":
        return "bg-red-500/20 text-red-500 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/50"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Low":
        return "bg-green-500/20 text-green-500 border-green-500/50"
      case "Medium":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
      case "High":
        return "bg-red-500/20 text-red-500 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/50"
    }
  }

  if (loading || !request) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4">Loading maintenance request...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <AdminHeader adminData={adminData} onLogout={handleLogout} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
          onClick={() => router.push("/admin/maintenance")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Requests
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <span className="font-mono text-red-500 mr-2">#{request.id.substring(0, 8)}</span>
              Maintenance Request
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
              <Badge className={getUrgencyColor(request.urgencyLevel)}>{request.urgencyLevel} Urgency</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                  <p className="whitespace-pre-line">{request.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Location</h3>
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                      <span>{request.issueLocation}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Dates</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">Submitted: {formatDate(request.submittedAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">Last Updated: {formatDate(request.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {request.imageUrl && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Attached Image</h3>
                    <div className="relative h-64 w-full rounded-md overflow-hidden bg-gray-800">
                      <Image
                        src={request.imageUrl || "/placeholder.svg"}
                        alt="Maintenance request image"
                        fill
                        className="object-contain"
                      />
                      <Button
                        className="absolute bottom-4 right-4 bg-gray-900/80 hover:bg-gray-900"
                        onClick={() => setImageOpen(true)}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        View Full Image
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className={`${
                      request.status === "Pending"
                        ? "bg-yellow-900/30 border-yellow-600"
                        : "bg-gray-800 hover:bg-gray-700 border-gray-700"
                    }`}
                    onClick={() => updateRequestStatus("Pending")}
                    disabled={updatingStatus || request.status === "Pending"}
                  >
                    <Clock className="mr-2 h-5 w-5" />
                    Mark as Pending
                  </Button>
                  <Button
                    variant="outline"
                    className={`${
                      request.status === "In Progress"
                        ? "bg-blue-900/30 border-blue-600"
                        : "bg-gray-800 hover:bg-gray-700 border-gray-700"
                    }`}
                    onClick={() => updateRequestStatus("In Progress")}
                    disabled={updatingStatus || request.status === "In Progress"}
                  >
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Mark as In Progress
                  </Button>
                  <Button
                    variant="outline"
                    className={`${
                      request.status === "Completed"
                        ? "bg-green-900/30 border-green-600"
                        : "bg-gray-800 hover:bg-gray-700 border-gray-700"
                    }`}
                    onClick={() => updateRequestStatus("Completed")}
                    disabled={updatingStatus || request.status === "Completed"}
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Mark as Completed
                  </Button>
                  <Button
                    variant="outline"
                    className={`${
                      request.status === "Cancelled"
                        ? "bg-red-900/30 border-red-600"
                        : "bg-gray-800 hover:bg-gray-700 border-gray-700"
                    }`}
                    onClick={() => updateRequestStatus("Cancelled")}
                    disabled={updatingStatus || request.status === "Cancelled"}
                  >
                    <XCircle className="mr-2 h-5 w-5" />
                    Mark as Cancelled
                  </Button>
                </div>

                {updatingStatus && <div className="text-center text-sm text-gray-400 mt-4">Updating status...</div>}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Tenant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-3">
                    {request.tenantName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium">{request.tenantName}</h3>
                    <p className="text-sm text-gray-400">Tenant Code: {request.tenantCode}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center">
                    <Home className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Room {request.roomNumber}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>My Domain {request.residence}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{request.tenantEmail}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{request.tenantPhone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open(`tel:${request.tenantPhone}`)}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call Tenant
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => window.open(`mailto:${request.tenantEmail}`)}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email Tenant
                  </Button>
                </div>
              </CardContent>
            </Card>

            {request.hasFeedback && (
              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader>
                  <CardTitle>Tenant Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (request.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-500"
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2">{request.rating}/5</span>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full bg-gray-800 hover:bg-gray-700 border-gray-700"
                    onClick={() => router.push("/admin/feedback")}
                  >
                    View Detailed Feedback
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Image View Dialog */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-4xl">
          <DialogHeader>
            <DialogTitle>Attached Image</DialogTitle>
          </DialogHeader>

          {request?.imageUrl && (
            <div className="py-4 flex justify-center">
              <div className="relative h-[70vh] w-full">
                <Image
                  src={request.imageUrl || "/placeholder.svg"}
                  alt="Maintenance request image"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImageOpen(false)}
              className="bg-gray-800 hover:bg-gray-700 border-gray-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
