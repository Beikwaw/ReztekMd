"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Star, Clock, CheckCircle, Calendar, MapPin } from "lucide-react"
import TenantHeader from "@/components/tenant/tenant-header"

interface MaintenanceRequest {
  id: string
  tenantId: string
  tenantName: string
  tenantEmail: string
  tenantPhone: string
  roomNumber: string
  residence: string
  tenantCode: string
  issueLocation: string
  urgencyLevel: string
  description: string
  status: string
  submittedAt: any
  imageUrl: string | null
  hasFeedback: boolean
  rating: number | null
}

export default function RequestHistory() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [feedbackError, setFeedbackError] = useState("")
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "tenants", user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUserData(userData)

            // Fetch maintenance requests
            const requestsQuery = query(
              collection(db, "maintenanceRequests"),
              where("tenantId", "==", user.uid),
              orderBy("submittedAt", "desc"),
            )

            const requestsSnapshot = await getDocs(requestsQuery)
            const requestsList: MaintenanceRequest[] = []

            requestsSnapshot.forEach((doc) => {
              const data = doc.data()
              requestsList.push({
                id: doc.id,
                tenantId: data.tenantId,
                tenantName: data.tenantName,
                tenantEmail: data.tenantEmail,
                tenantPhone: data.tenantPhone,
                roomNumber: data.roomNumber,
                residence: data.residence,
                tenantCode: data.tenantCode,
                issueLocation: data.issueLocation,
                urgencyLevel: data.urgencyLevel,
                description: data.description,
                status: data.status,
                submittedAt: data.submittedAt?.toDate() || new Date(),
                imageUrl: data.imageUrl || null,
                hasFeedback: data.hasFeedback || false,
                rating: data.rating || null,
              })
            })

            setRequests(requestsList)
          } else {
            router.push("/tenant/login")
          }
        } catch (error) {
          console.error("Error fetching data:", error)
        } finally {
          setLoading(false)
        }
      } else {
        router.push("/tenant/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push("/tenant/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const openFeedbackDialog = (request: MaintenanceRequest) => {
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
      setRequests(
        requests.map((req) => (req.id === selectedRequest.id ? { ...req, hasFeedback: true, rating: rating } : req)),
      )

      setFeedbackSuccess(true)
      setSubmittingFeedback(false)

      // Close dialog after 3 seconds
      setTimeout(() => {
        setFeedbackOpen(false)
      }, 3000)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      setFeedbackError("An error occurred while submitting feedback")
      setSubmittingFeedback(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <TenantHeader userData={userData} onLogout={handleLogout} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Request History</h1>
          <p className="text-gray-400 mt-2">View and manage your maintenance requests</p>
        </div>

        {requests.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800 text-white">
            <CardContent className="pt-6 text-center">
              <div className="mb-4">
                <Clock className="h-12 w-12 text-gray-500 mx-auto" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Requests Yet</h3>
              <p className="text-gray-400 mb-4">You haven&apos;t submitted any maintenance requests yet.</p>
              <Button onClick={() => router.push("/tenant/request")} className="bg-red-600 hover:bg-red-700">
                Submit a Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <Card key={request.id} className="bg-gray-900 border-gray-800 text-white overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <span className="font-mono text-red-500 mr-2">#{request.id.substring(0, 8)}</span>
                      </CardTitle>
                      <CardDescription className="text-gray-400 flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(request.submittedAt)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                      <Badge className={getUrgencyColor(request.urgencyLevel)}>{request.urgencyLevel} Urgency</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-400 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" /> Location
                          </div>
                          <div className="font-medium">{request.issueLocation}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Description</div>
                          <p className="text-sm">{request.description}</p>
                        </div>
                      </div>
                    </div>
                    {request.imageUrl && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Attached Image</div>
                        <Image
                          src={request.imageUrl || "/placeholder.svg"}
                          alt="Request image"
                          width={200}
                          height={150}
                          className="rounded-md object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-gray-800 pt-4 flex flex-wrap justify-between gap-2">
                  {request.status === "Completed" ? (
                    request.hasFeedback ? (
                      <div className="w-full">
                        <div className="text-sm text-gray-400 mb-2">Your Feedback</div>
                        <div className="flex items-center mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (request.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-500"
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm">{request.rating}/5</span>
                        </div>
                        <p className="text-sm text-gray-300">Feedback submitted</p>
                      </div>
                    ) : (
                      <Button onClick={() => openFeedbackDialog(request)} className="bg-red-600 hover:bg-red-700">
                        Provide Feedback
                      </Button>
                    )
                  ) : (
                    <div className="text-sm text-gray-400 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {request.status === "Pending" ? "Waiting for review" : "In progress"}
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          {feedbackSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>Feedback Submitted</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Thank you for your feedback
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 text-center">
                <div className="flex justify-center items-center gap-4 mb-4">
                  <Image src="/logo.png" alt="My Domain Logo" width={80} height={80} className="mx-auto" />
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-XjYVntwVnrzOrvrVEdTIKBMLXR8rvM.png"
                    alt="RezTek Logo"
                    width={100}
                    height={30}
                    className="mx-auto"
                  />
                </div>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold mb-2">Thank You!</h3>
                <p className="text-gray-400 mb-4">Your feedback has been submitted successfully.</p>

                <div className="bg-gray-800 p-4 rounded-lg mb-4">
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-500"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-300 italic">"{comment}"</p>
                </div>

                <p className="text-sm text-gray-400">
                  Your feedback helps us improve our maintenance services at My Domain {selectedRequest?.residence}.
                </p>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex justify-center items-center gap-4 mb-4">
                  <Image src="/logo.png" alt="My Domain Logo" width={80} height={80} className="mx-auto" />
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-XjYVntwVnrzOrvrVEdTIKBMLXR8rvM.png"
                    alt="RezTek Logo"
                    width={100}
                    height={30}
                    className="mx-auto"
                  />
                </div>
                <DialogTitle>Provide Feedback</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Please rate your experience with the maintenance service
                </DialogDescription>
              </DialogHeader>

              {feedbackError && (
                <Alert className="bg-red-900/20 border-red-600/50 text-red-200">
                  <AlertDescription>{feedbackError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rating</label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                        <Star
                          className={`h-8 w-8 ${star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-500"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Comment</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Please share your experience with the maintenance service"
                    className="bg-gray-800 border-gray-700 min-h-[100px]"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-400 text-right">{comment.length}/200 characters</p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setFeedbackOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitFeedback}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={submittingFeedback}
                >
                  {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
