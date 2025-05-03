"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useTenant } from "@/contexts/tenant-context"
import TenantHeader from "@/components/tenant/tenant-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle, AlertCircle, Star } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, ClipboardList, CheckCircle2, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function TenantDashboard() {
  const router = useRouter()
  const { isTenant, tenantData, loading: tenantLoading } = useTenant()
  const [loading, setLoading] = useState(true)
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("active")
  const [error, setError] = useState("")
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [feedbackError, setFeedbackError] = useState("")
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user is a tenant
        const tenantDoc = await getDoc(doc(db, "tenants", user.uid))
        if (!tenantDoc.exists()) {
          // Do not navigate here, instead let the new useEffect handle it
          return
        }
        try {
          await fetchMaintenanceRequests(user.uid)
        } catch (error: any) {
          setError(error.message || "Failed to load maintenance requests")
        } finally {
          setLoading(false)
        }
      } else {
        // Do not navigate here, instead let the new useEffect handle it
      }
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!loading && !tenantLoading && !isTenant) {
      router.push("/tenant/login")
    }
  }, [isTenant, loading, tenantLoading, router])

  const fetchMaintenanceRequests = async (userId: string) => {
    try {
      const requestsQuery = query(
        collection(db, "maintenanceRequests"),
        where("tenantId", "==", userId),
        orderBy("submittedAt", "desc"),
      )
      const querySnapshot = await getDocs(requestsQuery)
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMaintenanceRequests(requests)
    } catch (error: any) {
      setError(error.message || "Failed to load maintenance requests")
    }
  }

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "N/A";
    
    try {
      // Handle Firestore timestamps
      if (dateValue && typeof dateValue.toDate === 'function') {
        return new Date(dateValue.toDate()).toLocaleDateString();
      }
      
      // Handle string dates or ISO strings
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "N/A";
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  const openFeedbackDialog = (request: any) => {
    setSelectedRequest(request)
    setRating(0)
    setComment("")
    setFeedbackError("")
    setFeedbackSuccess(false)
    setFeedbackOpen(true)
  }

  const handleSubmitFeedback = async () => {
    if (!selectedRequest || !auth.currentUser) return

    setFeedbackError("")

    if (rating === 0) {
      setFeedbackError("Please select a rating")
      return
    }

    if (!comment.trim()) {
      setFeedbackError("Please provide a comment")
      return
    }

    try {
      setSubmittingFeedback(true)

      // Add feedback to the feedback collection
      await addDoc(collection(db, "feedback"), {
        comment: comment,
        createdAt: new Date().toISOString(),
        rating: rating.toString(),
        requestId: selectedRequest.id,
        residence: selectedRequest.residence,
        roomNumber: selectedRequest.roomNumber,
        status: selectedRequest.status,
        tenantId: selectedRequest.tenantId,
        tenantName: selectedRequest.tenantName,
        userId: auth.currentUser.uid,
      })

      // Update the request to indicate it has feedback
      await updateDoc(doc(db, "maintenanceRequests", selectedRequest.id), {
        hasFeedback: true,
        rating: rating,
      })

      // Update local state
      setMaintenanceRequests(
        maintenanceRequests.map((req) => 
          req.id === selectedRequest.id ? { ...req, hasFeedback: true, rating: rating } : req
        )
      )

      setFeedbackSuccess(true)
      setSubmittingFeedback(false)

      // Close dialog after 3 seconds
      setTimeout(() => {
        setFeedbackOpen(false)
      }, 3000)
    } catch (error: any) {
      console.error("Error submitting feedback:", error)
      setFeedbackError("An error occurred while submitting feedback")
      setSubmittingFeedback(false)
    }
  }

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isTenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p>Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const activeRequests = maintenanceRequests.filter(
    (request) => request.status === "Pending" || request.status === "In Progress",
  )

  const completedRequests = maintenanceRequests.filter(
    (request) => request.status === "Completed" || request.status === "Cancelled",
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TenantHeader userData={tenantData} onLogout={() => auth.signOut().then(() => router.push("/tenant/login"))} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {tenantData?.name || 'Tenant'}</h1>
          <p className="text-gray-600 mt-2">
            {tenantData?.roomNumber ? `Room ${tenantData.roomNumber}` : ''}{tenantData?.residence ? `, ${tenantData.residence}` : ''}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col space-y-1.5 p-6 pb-2">
              <div className="font-semibold tracking-tight text-lg text-gray-900">Active Requests</div>
              <div className="text-sm text-gray-500">Current maintenance requests</div>
            </div>
            <div className="p-6 pt-0 flex items-center">
              <Clock className="h-8 w-8 text-red-600 mr-3" />
              <div className="text-3xl font-bold text-gray-900">{activeRequests.length}</div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col space-y-1.5 p-6 pb-2">
              <div className="font-semibold tracking-tight text-lg text-gray-900">Completed</div>
              <div className="text-sm text-gray-500">Resolved maintenance requests</div>
            </div>
            <div className="p-6 pt-0 flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mr-3" />
              <div className="text-3xl font-bold text-gray-900">{completedRequests.length}</div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col space-y-1.5 p-6 pb-2">
              <div className="font-semibold tracking-tight text-lg text-gray-900">New Request</div>
              <div className="text-sm text-gray-500">Submit a maintenance request</div>
            </div>
            <div className="p-6 pt-0">
              <Link href="/tenant/request">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Request
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("active")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "active"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Active Requests
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "completed"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Completed Requests
              </button>
            </div>
          </div>
        </div>

        {/* Request Cards */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardContent className="p-6">
            {activeTab === "active" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Active Maintenance Requests</h2>
                {activeRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <ClipboardList className="h-6 w-6 text-gray-600" />
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No active requests</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new maintenance request.</p>
                    <div className="mt-6">
                      <Link href="/tenant/request">
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          New Request
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeRequests.map((request) => (
                      <Card key={request.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                        <CardContent className="p-0">
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-gray-900">{request.issueType}</h3>
                                <p className="text-sm text-gray-500">
                                  {formatDate(request.submittedAt)}
                                </p>
                              </div>
                              <div className="flex items-center">
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    request.status === "In Progress"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {request.status}
                                </span>
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-700">{request.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "completed" && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Completed Maintenance Requests</h2>
                {completedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <CheckCircle className="h-6 w-6 text-gray-600" />
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No completed requests</h3>
                    <p className="mt-1 text-sm text-gray-500">Your completed maintenance requests will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedRequests.map((request) => (
                      <Card key={request.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                        <CardContent className="p-0">
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-gray-900">{request.issueType}</h3>
                                <p className="text-sm text-gray-500">
                                  {formatDate(request.submittedAt)}
                                </p>
                              </div>
                              <div className="flex items-center">
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                  {request.status}
                                </span>
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-700">{request.description}</p>
                            
                            {/* Show feedback UI based on status and whether feedback exists */}
                            {request.status === "Completed" && (
                              <div className="mt-4">
                                {request.hasFeedback ? (
                                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Your Rating</p>
                                    <div className="flex items-center">
                                      <div className="flex mr-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-4 w-4 ${
                                              star <= (request.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm text-gray-500">Feedback provided</span>
                                    </div>
                                  </div>
                                ) : (
                                  <Button 
                                    onClick={() => openFeedbackDialog(request)} 
                                    className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Provide Feedback
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-xl font-semibold">Provide Feedback</DialogTitle>
            <DialogDescription className="text-gray-600">
              Please rate your experience with the maintenance service
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Rating</label>
              <div className="flex space-x-2 mt-2">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    className="p-0 bg-transparent border-0"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        starValue <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Comment</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            
            {feedbackError && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-500">{feedbackError}</AlertDescription>
              </Alert>
            )}
            
            {feedbackSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">Feedback submitted successfully!</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleSubmitFeedback} 
              className="w-full bg-red-600 hover:bg-red-700 text-white" 
              disabled={submittingFeedback}
            >
              {submittingFeedback ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
