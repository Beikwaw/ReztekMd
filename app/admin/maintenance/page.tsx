"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from "firebase/firestore"
import { auth, db, storage } from "@/lib/firebase"
import { ref, getDownloadURL } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Phone, Mail, Clock, AlertTriangle, CheckCircle, Star, FileText, Loader2 } from "lucide-react"
import AdminHeader from "@/components/admin/admin-header"
import Image from "next/image"
import jsPDF from "jspdf"
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

interface MaintenanceRequest {
  id: string
  tenantId: string
  tenantName: string
  roomNumber: string
  residence: string
  issueLocation: string
  issueDescription: string
  urgencyLevel: string
  status: string
  imageUrl?: string
  submittedAt: any
  lastUpdatedAt: any
  contactNumber: string
  email: string
  hasFeedback?: boolean
  rating?: number | null
}

export default function AdminMaintenance() {
  const router = useRouter()
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("Observatory")
  const [statusFilter, setStatusFilter] = useState("all")
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user is an admin
          const adminDoc = await getDoc(doc(db, "admins", user.uid))

          if (adminDoc.exists()) {
            setAdminData(adminDoc.data())
            await fetchRequests(activeTab)
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
    if (requests.length > 0) {
      filterRequests()
    }
  }, [searchQuery, statusFilter, requests])

  const fetchRequests = async (residence: string) => {
    try {
      const requestsQuery = query(
        collection(db, "maintenanceRequests"),
        where("residence", "==", residence),
        orderBy("submittedAt", "desc"),
      )

      const requestsSnapshot = await getDocs(requestsQuery)
      const requestsList: MaintenanceRequest[] = []

      requestsSnapshot.forEach((doc) => {
        const data = doc.data() as Omit<MaintenanceRequest, "id">
        
        // Ensure dates are properly formatted
        let submittedAt: any;
        let lastUpdatedAt: any;
        
        try {
          submittedAt = data.submittedAt ? new Date(data.submittedAt) : new Date();
          // Check if date is valid
          if (isNaN(submittedAt.getTime())) {
            submittedAt = new Date(); // Fallback to current date if invalid
          }
        } catch (e) {
          console.error("Error parsing submittedAt date:", e);
          submittedAt = new Date();
        }
        
        try {
          lastUpdatedAt = data.lastUpdatedAt ? new Date(data.lastUpdatedAt) : 
                         (data.submittedAt ? new Date(data.submittedAt) : new Date());
          // Check if date is valid
          if (isNaN(lastUpdatedAt.getTime())) {
            lastUpdatedAt = submittedAt; // Fallback to submitted date if invalid
          }
        } catch (e) {
          console.error("Error parsing lastUpdatedAt date:", e);
          lastUpdatedAt = submittedAt;
        }
        
        requestsList.push({
          id: doc.id,
          ...data,
          submittedAt,
          lastUpdatedAt,
          hasFeedback: data.hasFeedback || false,
          rating: data.rating || null
        })
      })

      setRequests(requestsList)
      setFilteredRequests(requestsList)
    } catch (error) {
      console.error("Error fetching maintenance requests:", error)
    }
  }

  const filterRequests = () => {
    let filtered = [...requests]

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (request) =>
          (request.tenantName?.toLowerCase() || "").includes(query) ||
          (request.roomNumber?.toLowerCase() || "").includes(query) ||
          (request.issueDescription?.toLowerCase() || "").includes(query) ||
          (request.issueLocation?.toLowerCase() || "").includes(query) ||
          (request.id?.toLowerCase() || "").includes(query) ||
          (request.tenantId?.toLowerCase() || "").includes(query)
      )
    }

    setFilteredRequests(filtered)
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
    setStatusFilter("all")
  }

  const openRequestDetails = (request: MaintenanceRequest) => {
    setSelectedRequest(request)
    setDetailsOpen(true)
    
    // Reset image URL when opening a new request
    setImageUrl(null)
    
    // Try to fetch image from Firebase Storage
    if (request.tenantId && request.id) {
      fetchMaintenanceImage(request.tenantId, request.id);
    }
  }

  const fetchMaintenanceImage = async (userId: string, requestId: string) => {
    try {
      setImageLoading(true);
      
      // Try direct path first if imageUrl exists in the request
      if (selectedRequest?.imageUrl && selectedRequest.imageUrl.trim() !== "") {
        console.log("Using existing imageUrl:", selectedRequest.imageUrl);
        setImageUrl(selectedRequest.imageUrl);
        setImageLoading(false);
        return;
      }
      
      console.log("No valid imageUrl found, trying to fetch from storage directly");
      
      // Try all possible paths where the image might be stored
      const possiblePaths = [
        `maintenance-requests/${requestId}`,
        `maintenance-requests/${userId}/${requestId}`,
        `maintenance-requests/${requestId}/image`,
      ];
      
      // Also try to find any file in the directory by checking common extensions
      const fileExtensions = ['jpg', 'jpeg', 'png', 'gif'];
      
      // Try each path
      for (const path of possiblePaths) {
        try {
          console.log("Trying path:", path);
          const storageRef = ref(storage, path);
          try {
            const url = await getDownloadURL(storageRef);
            console.log("Found image at:", path);
            setImageUrl(url);
            
            // Update the Firestore document with the found URL for future use
            try {
              await updateDoc(doc(db, "maintenanceRequests", requestId), {
                imageUrl: url
              });
              console.log("Updated Firestore document with image URL");
            } catch (updateErr) {
              console.log("Could not update Firestore document:", updateErr);
            }
            
            setImageLoading(false);
            return;
          } catch (err) {
            // Try with extensions
            for (const ext of fileExtensions) {
              try {
                const extPath = `${path}.${ext}`;
                console.log("Trying path with extension:", extPath);
                const extRef = ref(storage, extPath);
                const url = await getDownloadURL(extRef);
                console.log("Found image at:", extPath);
                setImageUrl(url);
                
                // Update the Firestore document with the found URL
                try {
                  await updateDoc(doc(db, "maintenanceRequests", requestId), {
                    imageUrl: url
                  });
                  console.log("Updated Firestore document with image URL");
                } catch (updateErr) {
                  console.log("Could not update Firestore document:", updateErr);
                }
                
                setImageLoading(false);
                return;
              } catch (extErr) {
                // Continue to next extension
              }
            }
          }
        } catch (pathErr) {
          // Continue to next path
        }
      }
      
      // If we get here, no image was found
      console.log("No image found for this maintenance request");
      setImageUrl(null);
    } catch (error) {
      console.log("Error in image fetching process:", error);
      setImageUrl(null);
    } finally {
      setImageLoading(false);
    }
  };

  const openImagePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (imageUrl || selectedRequest?.imageUrl) {
      setImagePreviewOpen(true)
    }
  }

  const updateRequestStatus = async (newStatus: string) => {
    if (!selectedRequest) return

    try {
      setUpdatingStatus(true)

      await updateDoc(doc(db, "maintenanceRequests", selectedRequest.id), {
        status: newStatus,
        lastUpdatedAt: new Date().toISOString(),
      })

      // Update local state
      const updatedRequests = requests.map((req) => {
        if (req.id === selectedRequest.id) {
          return {
            ...req,
            status: newStatus,
            lastUpdatedAt: new Date(),
          }
        }
        return req
      })

      setRequests(updatedRequests)
      setSelectedRequest({
        ...selectedRequest,
        status: newStatus,
        lastUpdatedAt: new Date(),
      })

      setUpdatingStatus(false)
    } catch (error) {
      console.error("Error updating request status:", error)
      setUpdatingStatus(false)
    }
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    
    try {
      // Handle string ISO dates
      if (typeof date === 'string') {
        // Check if it's a valid ISO string
        if (!date.match(/^\d{4}-\d{2}-\d{2}/) && !date.includes('T')) {
          return "Invalid Date Format";
        }
      }
      
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) return "Invalid Date";
      
      return new Intl.DateTimeFormat("en-ZA", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(dateObj);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  }

  const formatDateTime = (dateValue: any) => {
    if (!dateValue) return "N/A";
    
    try {
      // Handle Firestore timestamps
      if (dateValue && typeof dateValue.toDate === 'function') {
        const date = dateValue.toDate();
        return new Intl.DateTimeFormat("en-ZA", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(date);
      }
      
      // Handle string dates or ISO strings
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "N/A";
      
      return new Intl.DateTimeFormat("en-ZA", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "High":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/50">High</Badge>
      case "Medium":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Medium</Badge>
      case "Low":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Low</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/50">{urgency}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Completed</Badge>
      case "In Progress":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">In Progress</Badge>
      case "Pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Pending</Badge>
      case "Cancelled":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/50">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/50">{status}</Badge>
    }
  }

  const exportToPDF = async () => {
    try {
      if (filteredRequests.length === 0) {
        alert("No maintenance requests to export.")
        return
      }
      
      setExportingPdf(true)
      
      // Create PDF document with orientation detection for better mobile viewing
      // Use portrait for fewer columns, landscape for more columns
      const orientation = filteredRequests[0] && Object.keys(filteredRequests[0]).length > 5 ? 'landscape' : 'portrait'
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4',
      })
      
      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      // Add header
      doc.setFontSize(16) // Slightly smaller font for better mobile display
      doc.text(`My Domain ${activeTab} - Maintenance Requests Report`, 14, 20)
      doc.setFontSize(10) // Smaller subheading
      doc.text(`Generated on ${format(new Date(), "dd MMM yyyy")}`, 14, 28)
      
      // Format data for table - optimize for mobile viewing
      const tableData = filteredRequests.map(request => {
        // Format dates
        let submittedDate = "N/A"
        let updatedDate = "N/A"
        
        try {
          if (request.submittedAt) {
            submittedDate = format(new Date(request.submittedAt), "dd/MM/yy") // Shorter date format for mobile
          }
          
          if (request.lastUpdatedAt) {
            updatedDate = format(new Date(request.lastUpdatedAt), "dd/MM/yy") // Shorter date format for mobile
          }
        } catch (e) {
          console.error("Date formatting error:", e)
        }
        
        // Truncate long text for better mobile display
        const truncateText = (text: string | undefined, maxLength: number) => {
          if (!text) return "N/A"
          return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
        }
        
        return [
          truncateText(request.id, 8), // Shorter ID for mobile
          truncateText(request.tenantName, 15),
          truncateText(request.roomNumber, 8),
          truncateText(request.issueLocation, 10),
          truncateText(request.urgencyLevel, 8),
          truncateText(request.status, 10),
          submittedDate,
          updatedDate
        ]
      })
      
      // Calculate optimal column widths based on device
      const calculateColumnWidths = () => {
        const totalWidth = pageWidth - 20 // Margins
        
        // Responsive column widths - percentages of total width
        return {
          0: { cellWidth: totalWidth * 0.12 },  // Request ID
          1: { cellWidth: totalWidth * 0.15 },  // Tenant
          2: { cellWidth: totalWidth * 0.10 },  // Room Number
          3: { cellWidth: totalWidth * 0.12 },  // Location
          4: { cellWidth: totalWidth * 0.10 },  // Urgency
          5: { cellWidth: totalWidth * 0.12 },  // Status
          6: { cellWidth: totalWidth * 0.12 },  // Submitted
          7: { cellWidth: totalWidth * 0.12 }   // Last Updated
        }
      }
      
      // Add table with responsive settings
      autoTable(doc, {
        startY: 35,
        head: [["ID", "Tenant", "Room", "Location", "Urgency", "Status", "Submitted", "Updated"]], // Shorter headers for mobile
        body: tableData,
        theme: "grid",
        headStyles: { 
          fillColor: [225, 29, 72],
          fontSize: 8, // Smaller header font for mobile
          cellPadding: 2 // Less padding for mobile
        },
        styles: { 
          overflow: 'linebreak', 
          cellWidth: 'wrap',
          cellPadding: 2, // Less padding for mobile
          fontSize: 7, // Smaller font for mobile
          lineWidth: 0.1, // Thinner lines for mobile
          halign: 'left' // Left alignment for better readability on small screens
        },
        columnStyles: calculateColumnWidths(),
        didDrawPage: (data) => {
          // This function runs on each page creation
          // We'll use it to add the footer and logo to each page
        }
      })
      
      // Add footer to each page
      const pageCount = (doc as any).internal.pages.length - 1
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        
        // Add logo at the center bottom above "Kind regards"
        try {
          const logoImg = document.createElement('img')
          logoImg.src = '/reztek-logo.png'
          
          // Wait for the image to load
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve
            logoImg.onerror = reject
          })
          
          // Add logo to PDF (positioned at center bottom)
          const imgWidth = 30 // Slightly smaller for mobile
          const imgHeight = (logoImg.height * imgWidth) / logoImg.width
          const centerX = pageWidth / 2 - imgWidth / 2
          const logoY = pageHeight - 40 // Position above "Kind regards"
          doc.addImage(logoImg.src, 'PNG', centerX, logoY, imgWidth, imgHeight)
        } catch (error) {
          console.error("Error adding logo to PDF:", error)
          // Continue without logo if there's an error
        }
        
        // Add "Kind regards, RezTek" message
        doc.setFontSize(10)
        doc.text("Kind regards,", 14, pageHeight - 25)
        doc.setFont("helvetica", 'bold')
        doc.text("RezTek", 14, pageHeight - 20)
        doc.setFont("helvetica", 'normal')
        
        // Add footer text
        doc.setFontSize(8)
        doc.text("My Domain Student Living - Confidential", 14, pageHeight - 10)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
        doc.text("Generated by RezTek", pageWidth - 60, pageHeight - 10)
      }
      
      // Use blob for better cross-device compatibility
      const pdfBlob = doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      // Create a link and trigger download - works on mobile and desktop
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `my_domain_${activeTab.toLowerCase()}_maintenance_${format(new Date(), "yyyy-MM-dd")}.pdf`
      
      // Different approach for mobile vs desktop
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // For mobile devices - open in new tab (most mobile browsers handle PDFs well)
        window.open(pdfUrl, '_blank')
      } else {
        // For desktop - direct download
        link.click()
      }
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 100)
      
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again or contact support.")
    } finally {
      setExportingPdf(false)
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
      <AdminHeader adminData={adminData} onLogout={handleLogout} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Maintenance Requests</h1>
          <p className="text-gray-400 mt-2">View and manage tenant maintenance requests</p>
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

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Enter the tenant request ID to search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 w-full sm:w-[300px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                onClick={exportToPDF}
                disabled={exportingPdf || filteredRequests.length === 0}
              >
                {exportingPdf ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          <TabsContent value="Observatory" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Maintenance Requests</CardTitle>
                <CardDescription className="text-gray-400">
                  All maintenance requests for My Domain Observatory
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Requests Found</h3>
                    <p className="text-gray-400">
                      {searchQuery || statusFilter !== "all"
                        ? "No requests match your search criteria."
                        : "There are no maintenance requests for My Domain Observatory."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead>Request ID</TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Urgency</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((request) => (
                          <TableRow
                            key={request.id}
                            className="border-gray-800 cursor-pointer hover:bg-gray-800/50"
                            onClick={() => openRequestDetails(request)}
                          >
                            <TableCell className="font-mono text-xs">{request.id.slice(0, 8)}...</TableCell>
                            <TableCell>{request.tenantName}</TableCell>
                            <TableCell>{request.roomNumber}</TableCell>
                            <TableCell>{request.issueLocation}</TableCell>
                            <TableCell>{getUrgencyBadge(request.urgencyLevel)}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell>{formatDate(request.submittedAt)}</TableCell>
                            <TableCell>{formatDate(request.lastUpdatedAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openRequestDetails(request)
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="Salt River" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Maintenance Requests</CardTitle>
                <CardDescription className="text-gray-400">
                  All maintenance requests for My Domain Salt River
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Requests Found</h3>
                    <p className="text-gray-400">
                      {searchQuery || statusFilter !== "all"
                        ? "No requests match your search criteria."
                        : "There are no maintenance requests for My Domain Salt River."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead>Request ID</TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Urgency</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((request) => (
                          <TableRow
                            key={request.id}
                            className="border-gray-800 cursor-pointer hover:bg-gray-800/50"
                            onClick={() => openRequestDetails(request)}
                          >
                            <TableCell className="font-mono text-xs">{request.id.slice(0, 8)}...</TableCell>
                            <TableCell>{request.tenantName}</TableCell>
                            <TableCell>{request.roomNumber}</TableCell>
                            <TableCell>{request.issueLocation}</TableCell>
                            <TableCell>{getUrgencyBadge(request.urgencyLevel)}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell>{formatDate(request.submittedAt)}</TableCell>
                            <TableCell>{formatDate(request.lastUpdatedAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openRequestDetails(request)
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Request Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-3xl">
          <DialogHeader>
            <DialogTitle>Maintenance Request Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Detailed information about the maintenance request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Request Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-800 p-4 rounded-md">
                      <div>
                        <p className="text-sm text-gray-400">Request ID</p>
                        <p className="font-mono text-sm break-all">{selectedRequest.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Status</p>
                        <div>{getStatusBadge(selectedRequest.status)}</div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Urgency Level</p>
                        <div>{getUrgencyBadge(selectedRequest.urgencyLevel)}</div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Submitted</p>
                        <p>{formatDateTime(selectedRequest.submittedAt)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Last Updated</p>
                        <p>{formatDateTime(selectedRequest.lastUpdatedAt)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Location</p>
                        <p>{selectedRequest.issueLocation}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Issue Description</h3>
                    <div className="bg-gray-800 p-4 rounded-md min-h-[100px] max-h-[300px] overflow-y-auto">
                      {selectedRequest.issueDescription ? (
                        <p className="whitespace-pre-wrap break-words text-white">{selectedRequest.issueDescription}</p>
                      ) : (
                        <p className="text-gray-400 italic">No description provided</p>
                      )}
                    </div>
                  </div>

                  {selectedRequest.imageUrl || imageUrl ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Image</h3>
                      <div className="bg-gray-800 p-2 rounded-md cursor-pointer" onClick={openImagePreview}>
                        <div className="relative h-40 w-full sm:w-3/4 md:w-1/2 mx-auto">
                          {imageLoading ? (
                            <div className="flex items-center justify-center h-full">
                              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
                            </div>
                          ) : (
                            <Image
                              src={imageUrl || selectedRequest.imageUrl || "/placeholder.svg"}
                              alt="Maintenance issue"
                              fill
                              className="object-contain rounded"
                            />
                          )}
                        </div>
                        <p className="text-center text-sm text-gray-400 mt-2">Click to enlarge</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Tenant Information</h3>
                    <div className="bg-gray-800 p-4 rounded-md space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">Name</p>
                        <p className="font-medium">{selectedRequest.tenantName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Room</p>
                        <p>Room {selectedRequest.roomNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Residence</p>
                        <p>My Domain {selectedRequest.residence}</p>
                      </div>
                      <div className="pt-2 space-y-2">
                        <Button
                          variant="outline"
                          className="w-full bg-gray-700 hover:bg-gray-600 border-gray-600"
                          onClick={() => window.open(`tel:${selectedRequest.contactNumber}`)}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call Tenant
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full bg-gray-700 hover:bg-gray-600 border-gray-600"
                          onClick={() => window.open(`mailto:${selectedRequest.email}`)}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email Tenant
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Update Status</h3>
                    <div className="bg-gray-800 p-4 rounded-md space-y-3">
                      <p className="text-sm text-gray-400">Current Status: {selectedRequest.status}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className={`${
                            selectedRequest.status === "Pending"
                              ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
                              : "bg-gray-700 hover:bg-gray-600 border-gray-600"
                          }`}
                          onClick={() => updateRequestStatus("Pending")}
                          disabled={updatingStatus || selectedRequest.status === "Pending"}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Pending
                        </Button>
                        <Button
                          variant="outline"
                          className={`${
                            selectedRequest.status === "In Progress"
                              ? "bg-blue-500/20 text-blue-500 border-blue-500/50"
                              : "bg-gray-700 hover:bg-gray-600 border-gray-600"
                          }`}
                          onClick={() => updateRequestStatus("In Progress")}
                          disabled={updatingStatus || selectedRequest.status === "In Progress"}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          In Progress
                        </Button>
                        <Button
                          variant="outline"
                          className={`${
                            selectedRequest.status === "Completed"
                              ? "bg-green-500/20 text-green-500 border-green-500/50"
                              : "bg-gray-700 hover:bg-gray-600 border-gray-600"
                          }`}
                          onClick={() => updateRequestStatus("Completed")}
                          disabled={updatingStatus || selectedRequest.status === "Completed"}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </Button>
                        <Button
                          variant="outline"
                          className={`${
                            selectedRequest.status === "Cancelled"
                              ? "bg-red-500/20 text-red-500 border-red-500/50"
                              : "bg-gray-700 hover:bg-gray-600 border-gray-600"
                          }`}
                          onClick={() => updateRequestStatus("Cancelled")}
                          disabled={updatingStatus || selectedRequest.status === "Cancelled"}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Cancelled
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Section - Only shown for completed requests with feedback */}
              {selectedRequest.status === "Completed" && selectedRequest.hasFeedback && (
                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Tenant Feedback</h3>
                  <div className="bg-gray-800 p-4 rounded-md">
                    <div className="flex items-center mb-3">
                      <div className="flex mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= (selectedRequest.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-500"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-yellow-500 font-medium">{selectedRequest.rating}/5</span>
                    </div>
                    <div className="text-sm text-gray-300">
                      <p className="italic">Tenant has provided feedback for this maintenance request.</p>
                      <p className="mt-2 text-gray-400">
                        You can view detailed feedback in the Feedback section of the admin panel.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDetailsOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-4xl max-h-[90vh] p-2">
          <DialogHeader>
            <DialogTitle>Maintenance Request Image</DialogTitle>
            <DialogDescription className="text-gray-400">
              Image submitted with the maintenance request
            </DialogDescription>
          </DialogHeader>
          {(imageUrl || selectedRequest?.imageUrl) ? (
            <div className="relative h-full w-full min-h-[60vh]">
              <Image
                src={imageUrl || selectedRequest?.imageUrl || "/placeholder.svg"}
                alt="Maintenance issue"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <p className="text-gray-400">No image available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
