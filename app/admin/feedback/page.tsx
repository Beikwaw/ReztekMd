"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Star, Calendar } from "lucide-react"
import AdminHeader from "@/components/admin/admin-header"

interface Feedback {
  id: string
  requestId: string
  tenantId: string
  tenantName: string
  rating: string
  comment: string
  residence: string
  roomNumber: string
  createdAt: any
  status: string
}

export default function AdminFeedback() {
  const router = useRouter()
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("Observatory")
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user is an admin
          const adminDoc = await getDoc(doc(db, "admins", user.uid))

          if (adminDoc.exists()) {
            setAdminData(adminDoc.data())
            await fetchFeedback(activeTab)
          } else {
            // Not an admin, sign out
            await signOut(auth)
            router.push("/admin/login")
          }
        } catch (error) {
          console.error("Error fetching admin data:", error)
        } finally {
          setLoading(false)
        }
      } else {
        // User is not logged in
        router.push("/admin/login")
      }
    })

    return () => unsubscribe()
  }, [router, activeTab])

  useEffect(() => {
    if (feedback.length > 0) {
      filterFeedback()
    }
  }, [searchQuery, feedback])

  const fetchFeedback = async (residence: string) => {
    try {
      const feedbackQuery = query(
        collection(db, "feedback"),
        where("residence", "==", residence),
        orderBy("createdAt", "desc"),
      )

      const feedbackSnapshot = await getDocs(feedbackQuery)
      const feedbackList: Feedback[] = []

      feedbackSnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Feedback, "id">
        feedbackList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        })
      })

      setFeedback(feedbackList)
      setFilteredFeedback(feedbackList)
    } catch (error) {
      console.error("Error fetching feedback:", error)
    }
  }

  const filterFeedback = () => {
    if (!searchQuery.trim()) {
      setFilteredFeedback(feedback)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = feedback.filter(
      (item) =>
        item.tenantName.toLowerCase().includes(query) ||
        item.roomNumber.toLowerCase().includes(query) ||
        item.comment.toLowerCase().includes(query),
    )

    setFilteredFeedback(filtered)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/admin/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchQuery("")
  }

  const openFeedbackDetails = (item: Feedback) => {
    setSelectedFeedback(item)
    setDetailsOpen(true)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date)
  }

  const getRatingColor = (rating: string) => {
    const ratingNum = Number.parseInt(rating)
    if (ratingNum >= 4) return "text-green-500"
    if (ratingNum === 3) return "text-yellow-500"
    return "text-red-500"
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
      <AdminHeader adminData={adminData} onLogout={handleLogout} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Tenant Feedback</h1>
          <p className="text-gray-400 mt-2">View and analyze tenant feedback on maintenance requests</p>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-gray-800">
              <TabsTrigger value="Observatory" className="data-[state=active]:bg-red-600">
                My Domain Observatory
              </TabsTrigger>
              <TabsTrigger value="Salt River" className="data-[state=active]:bg-red-600">
                My Domain Salt River
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 w-full sm:w-[300px]"
              />
            </div>
          </div>

          <TabsContent value="Observatory" className="space-y-6">
            {filteredFeedback.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardContent className="pt-6 text-center">
                  <div className="mb-4">
                    <Star className="h-12 w-12 text-gray-500 mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Feedback Found</h3>
                  <p className="text-gray-400">
                    {searchQuery
                      ? "No feedback matches your search criteria."
                      : "There is no feedback recorded for My Domain Observatory."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFeedback.map((item) => (
                  <Card key={item.id} className="bg-gray-900 border-gray-800 text-white">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{item.tenantName}</CardTitle>
                        <Badge variant="outline" className="bg-gray-800 border-gray-700">
                          Room {item.roomNumber}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-400 flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(item.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= Number.parseInt(item.rating)
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-500"
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`ml-2 font-bold ${getRatingColor(item.rating)}`}>{item.rating}/5</span>
                      </div>

                      <div>
                        <div className="text-sm text-gray-400">Comment</div>
                        <p className="text-sm line-clamp-3">{item.comment}</p>
                      </div>

                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full bg-gray-800 hover:bg-gray-700 border-gray-700"
                          onClick={() => openFeedbackDetails(item)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="Salt River" className="space-y-6">
            {filteredFeedback.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardContent className="pt-6 text-center">
                  <div className="mb-4">
                    <Star className="h-12 w-12 text-gray-500 mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Feedback Found</h3>
                  <p className="text-gray-400">
                    {searchQuery
                      ? "No feedback matches your search criteria."
                      : "There is no feedback recorded for My Domain Salt River."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFeedback.map((item) => (
                  <Card key={item.id} className="bg-gray-900 border-gray-800 text-white">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{item.tenantName}</CardTitle>
                        <Badge variant="outline" className="bg-gray-800 border-gray-700">
                          Room {item.roomNumber}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-400 flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(item.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= Number.parseInt(item.rating)
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-500"
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`ml-2 font-bold ${getRatingColor(item.rating)}`}>{item.rating}/5</span>
                      </div>

                      <div>
                        <div className="text-sm text-gray-400">Comment</div>
                        <p className="text-sm line-clamp-3">{item.comment}</p>
                      </div>

                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full bg-gray-800 hover:bg-gray-700 border-gray-700"
                          onClick={() => openFeedbackDetails(item)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Feedback Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription className="text-gray-400">Detailed feedback information</DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold">
                  {selectedFeedback.tenantName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedFeedback.tenantName}</h3>
                  <p className="text-gray-400">Room {selectedFeedback.roomNumber}</p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-md p-4 space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Rating</div>
                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Number.parseInt(selectedFeedback.rating)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-500"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`ml-2 font-bold text-lg ${getRatingColor(selectedFeedback.rating)}`}>
                      {selectedFeedback.rating}/5
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Comment</div>
                  <p className="text-base">{selectedFeedback.comment}</p>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Request Status</div>
                  <Badge
                    className={
                      selectedFeedback.status === "Completed"
                        ? "bg-green-500/20 text-green-500 border-green-500/50"
                        : "bg-blue-500/20 text-blue-500 border-blue-500/50"
                    }
                  >
                    {selectedFeedback.status}
                  </Badge>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Submitted On</div>
                  <p>{formatDate(selectedFeedback.createdAt)}</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                  onClick={() => router.push(`/admin/dashboard?requestId=${selectedFeedback.requestId}`)}
                >
                  View Related Request
                </Button>
                <Button
                  variant="outline"
                  className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                  onClick={() => setDetailsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
