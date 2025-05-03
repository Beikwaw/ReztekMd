"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js"
import { Bar } from "react-chartjs-2"
import { CheckCircle, Clock, FileText, Loader2 } from "lucide-react"
import AdminHeader from "@/components/admin/admin-header"
import jsPDF from "jspdf"
import autoTable from 'jspdf-autotable'
import html2canvas from "html2canvas"

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  PointElement, 
  LineElement
);

// Set default Chart.js options
ChartJS.defaults.color = '#fff';
ChartJS.defaults.font.family = 'Inter, sans-serif';
ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
ChartJS.defaults.plugins.tooltip.padding = 12;
ChartJS.defaults.plugins.tooltip.cornerRadius = 6;

export default function AdminAnalytics() {
  const router = useRouter()
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"Observatory" | "Salt River">("Observatory")
  const [timeRange, setTimeRange] = useState("30")
  const [allRequestsData, setAllRequestsData] = useState<{
    Observatory: Array<{date: string; pending: number; completed: number}>;
    "Salt River": Array<{date: string; pending: number; completed: number}>;
  }>({
    Observatory: [],
    "Salt River": []
  })
  const [stats, setStats] = useState<{
    Observatory: {
      totalRequests: number;
      pendingRequests: number;
      completedRequests: number;
      highUrgencyRequests: number;
      averageRating: number;
    };
    "Salt River": {
      totalRequests: number;
      pendingRequests: number;
      completedRequests: number;
      highUrgencyRequests: number;
      averageRating: number;
    };
  }>({
    Observatory: {
      totalRequests: 0,
      pendingRequests: 0,
      completedRequests: 0,
      highUrgencyRequests: 0,
      averageRating: 0
    },
    "Salt River": {
      totalRequests: 0,
      pendingRequests: 0,
      completedRequests: 0,
      highUrgencyRequests: 0,
      averageRating: 0
    }
  })
  // Store actual maintenance request details for PDF export
  const [maintenanceRequests, setMaintenanceRequests] = useState<{
    Observatory: Array<{
      id: string;
      submittedAt: string;
      description: string;
      status: string;
      urgencyLevel: string;
      unit: string;
      tenantName: string;
    }>;
    "Salt River": Array<{
      id: string;
      submittedAt: string;
      description: string;
      status: string;
      urgencyLevel: string;
      unit: string;
      tenantName: string;
    }>;
  }>({
    Observatory: [],
    "Salt River": []
  })
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const observatoryChartRef = useRef<HTMLDivElement>(null)
  const saltRiverChartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user is an admin
          const adminDoc = await getDoc(doc(db, "admins", user.uid))

          if (adminDoc.exists()) {
            setAdminData(adminDoc.data())
            
            // Only fetch analytics data when parameters change or on initial load
            if (!loading) {
              setLoading(true);
            }
            await fetchAllAnalyticsData(timeRange)
            setLoading(false);
            setLastFetched(new Date());
          } else {
            // Not an admin, sign out
            await signOut(auth)
            router.push("/admin/login")
          }
        } catch (error) {
          console.error("Error fetching admin data:", error)
          setLoading(false);
        }
      } else {
        // User is not logged in
        router.push("/admin/login")
      }
    })

    return () => unsubscribe()
  }, [router, timeRange])

  useEffect(() => {
    // Only set up interval if user is authenticated and data is loaded
    if (adminData && !loading) {
      const interval = setInterval(() => {
        console.log("Auto-refreshing analytics data...");
        fetchAllAnalyticsData(timeRange);
        setLastFetched(new Date());
      }, 60000); // 60 seconds
      
      return () => clearInterval(interval);
    }
  }, [adminData, loading, timeRange]);

  // Use useMemo to get the current residence data
  const currentResidenceData = useMemo(() => {
    return allRequestsData[activeTab as "Observatory" | "Salt River"];
  }, [allRequestsData, activeTab]);

  // Use useMemo to get the current residence stats
  const currentStats = useMemo(() => {
    return stats[activeTab as "Observatory" | "Salt River"];
  }, [stats, activeTab]);

  // Fetch data for both residences in a single function to minimize reads
  const fetchAllAnalyticsData = async (days: string) => {
    try {
      console.log("Fetching analytics data for the last", days, "days");
      
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - Number.parseInt(days))
      
      console.log("Date range:", startDate.toISOString(), "to", endDate.toISOString());

      // Initialize state for both residences
      const initialStats = {
        Observatory: {
          totalRequests: 0,
          pendingRequests: 0,
          completedRequests: 0,
          highUrgencyRequests: 0,
          averageRating: 0
        },
        "Salt River": {
          totalRequests: 0,
          pendingRequests: 0,
          completedRequests: 0,
          highUrgencyRequests: 0,
          averageRating: 0
        }
      };
      
      setStats(initialStats);

      // Initialize maintenance requests
      const requestDetails = {
        Observatory: [] as Array<{
          id: string;
          submittedAt: string;
          description: string;
          status: string;
          urgencyLevel: string;
          unit: string;
          tenantName: string;
        }>,
        "Salt River": [] as Array<{
          id: string;
          submittedAt: string;
          description: string;
          status: string;
          urgencyLevel: string;
          unit: string;
          tenantName: string;
        }>
      };

      // Create cache key for local storage
      const cacheKey = `maintenanceRequests_${startDate.toISOString()}_${endDate.toISOString()}`;
      
      // Try to get data from cache first to reduce Firestore reads
      let requestsData = [];
      
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          console.log("Using cached maintenance request data");
          requestsData = JSON.parse(cachedData);
        } else {
          // Fetch all maintenance requests in one query to reduce reads
          const requestsQuery = query(
            collection(db, "maintenanceRequests"),
            where("submittedAt", ">=", startDate.toISOString()),
            where("submittedAt", "<=", endDate.toISOString()),
            orderBy("submittedAt", "asc"),
            limit(500) // Limit to 500 requests to prevent excessive reads
          );

          const requestsSnapshot = await getDocs(requestsQuery);
          console.log("Fetched", requestsSnapshot.size, "maintenance requests from Firestore");
          
          // Convert snapshot to array of data
          requestsData = requestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Cache the data to reduce future Firestore reads
          try {
            localStorage.setItem(cacheKey, JSON.stringify(requestsData));
          } catch (e) {
            console.error("Error caching data:", e);
          }
        }
      } catch (e) {
        console.error("Error with localStorage or caching:", e);
        
        // Fallback to direct Firestore query if localStorage fails
        const requestsQuery = query(
          collection(db, "maintenanceRequests"),
          where("submittedAt", ">=", startDate.toISOString()),
          where("submittedAt", "<=", endDate.toISOString()),
          orderBy("submittedAt", "asc"),
          limit(500)
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        console.log("Fallback: Fetched", requestsSnapshot.size, "maintenance requests from Firestore");
        
        requestsData = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      // Process data for both residences
      const residenceData = {
        Observatory: [] as Array<{date: string; pending: number; completed: number}>,
        "Salt River": [] as Array<{date: string; pending: number; completed: number}>
      };
      
      const statusCounts = {
        Observatory: { Pending: 0, "In Progress": 0, Completed: 0, Cancelled: 0 },
        "Salt River": { Pending: 0, "In Progress": 0, Completed: 0, Cancelled: 0 }
      };
      
      const dateGroups = {
        Observatory: {} as Record<string, { pending: number; completed: number }>,
        "Salt River": {} as Record<string, { pending: number; completed: number }>
      };
      
      const highUrgencyCounts = {
        Observatory: 0,
        "Salt River": 0
      };

      // Process all requests in memory
      requestsData.forEach((data: any) => {
        const residence = data.residence as "Observatory" | "Salt River";
        
        // Skip if not one of our two residences
        if (residence !== "Observatory" && residence !== "Salt River") {
          return;
        }
        
        const date = new Date(data.submittedAt);
        const dateStr = new Intl.DateTimeFormat("en-ZA", { month: "short", day: "2-digit" }).format(date);

        // Initialize date group if it doesn't exist
        if (!dateGroups[residence][dateStr]) {
          dateGroups[residence][dateStr] = { pending: 0, completed: 0 };
        }

        // Count by status
        if (data.status === "Completed") {
          dateGroups[residence][dateStr].completed += 1;
          statusCounts[residence].Completed += 1;
        } else if (data.status === "Cancelled") {
          statusCounts[residence].Cancelled += 1;
        } else {
          // Count as pending for both "Pending" and "In Progress"
          dateGroups[residence][dateStr].pending += 1;
          if (data.status === "Pending") {
            statusCounts[residence].Pending += 1;
          } else if (data.status === "In Progress") {
            statusCounts[residence]["In Progress"] += 1;
          }
        }

        // Count high urgency requests
        if (data.urgencyLevel === "High") {
          highUrgencyCounts[residence] += 1;
        }
        
        // Store maintenance request details for PDF export
        requestDetails[residence].push({
          id: data.id,
          submittedAt: data.submittedAt,
          description: data.description || "No description provided",
          status: data.status,
          urgencyLevel: data.urgencyLevel || "Not specified",
          unit: data.unit || "Not specified",
          tenantName: data.tenantName || "Unknown"
        });
      });

      // Format chart data for both residences
      ["Observatory", "Salt River"].forEach((residence) => {
        // Ensure we have date groups for this residence
        if (Object.keys(dateGroups[residence as "Observatory" | "Salt River"]).length === 0) {
          // If no data for this residence, create at least one entry with zeros
          const today = new Date();
          const dateStr = new Intl.DateTimeFormat("en-ZA", { month: "short", day: "2-digit" }).format(today);
          dateGroups[residence as "Observatory" | "Salt River"][dateStr] = { pending: 0, completed: 0 };
          console.log(`Created default data point for ${residence} since no data was found`);
        }
        
        // Log the date groups to help debug
        console.log(`Date groups for ${residence}:`, dateGroups[residence as "Observatory" | "Salt River"]);
        
        const chartData = Object.keys(dateGroups[residence as "Observatory" | "Salt River"])
          .sort((a, b) => {
            // Convert date strings to comparable values
            const monthsOrder = {
              "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
              "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
            };
            
            const [monthA, dayA] = a.split(" ");
            const [monthB, dayB] = b.split(" ");
            
            // Compare months first
            const monthDiff = monthsOrder[monthA as keyof typeof monthsOrder] - monthsOrder[monthB as keyof typeof monthsOrder];
            if (monthDiff !== 0) return monthDiff;
            
            // If same month, compare days
            return parseInt(dayA) - parseInt(dayB);
          })
          .map((date) => ({
            date,
            pending: dateGroups[residence as "Observatory" | "Salt River"][date].pending,
            completed: dateGroups[residence as "Observatory" | "Salt River"][date].completed,
          }));

        console.log(`Processed chart data for ${residence}:`, chartData);
        
        residenceData[residence as "Observatory" | "Salt River"] = chartData;
        
        // Update stats for this residence
        const totalRequests = 
          statusCounts[residence as "Observatory" | "Salt River"].Pending + 
          statusCounts[residence as "Observatory" | "Salt River"]["In Progress"] + 
          statusCounts[residence as "Observatory" | "Salt River"].Completed + 
          statusCounts[residence as "Observatory" | "Salt River"].Cancelled;
          
        setStats((prevStats) => ({
          ...prevStats,
          [residence]: {
            ...prevStats[residence as "Observatory" | "Salt River"],
            totalRequests,
            pendingRequests: statusCounts[residence as "Observatory" | "Salt River"].Pending + 
                            statusCounts[residence as "Observatory" | "Salt River"]["In Progress"],
            completedRequests: statusCounts[residence as "Observatory" | "Salt River"].Completed,
            highUrgencyRequests: highUrgencyCounts[residence as "Observatory" | "Salt River"],
          },
        }));
      });

      console.log("Chart data processed:", residenceData);
      console.log("Maintenance request details:", requestDetails);
      
      // Update chart data for both residences
      setAllRequestsData(residenceData);
      
      // Update maintenance request details
      setMaintenanceRequests(requestDetails);

      // Fetch average ratings in a single batch to reduce reads
      await fetchAllAverageRatings(startDate, endDate);
      
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    }
  };

  // Fetch average ratings for both residences in one function
  const fetchAllAverageRatings = async (startDate: Date, endDate: Date) => {
    try {
      // Use a single query to get all feedback in the date range
      const feedbackQuery = query(
        collection(db, "feedback"),
        where("createdAt", ">=", startDate.toISOString()),
        where("createdAt", "<=", endDate.toISOString()),
        limit(200) // Limit to 200 feedback items to prevent excessive reads
      );

      const feedbackSnapshot = await getDocs(feedbackQuery);
      
      // Process in memory
      const ratingTotals = {
        Observatory: { total: 0, count: 0 },
        "Salt River": { total: 0, count: 0 }
      };

      feedbackSnapshot.forEach((doc) => {
        const data = doc.data();
        const residence = data.residence as "Observatory" | "Salt River";
        
        // Skip if not one of our two residences
        if (residence !== "Observatory" && residence !== "Salt River") {
          return;
        }
        
        const rating = Number.parseInt(data.rating);
        ratingTotals[residence as "Observatory" | "Salt River"].total += rating;
        ratingTotals[residence as "Observatory" | "Salt River"].count++;
      });

      // Update average ratings for both residences
      ["Observatory", "Salt River"].forEach((residence) => {
        const avgRating = ratingTotals[residence as "Observatory" | "Salt River"].count > 0 
          ? Number.parseFloat((ratingTotals[residence as "Observatory" | "Salt River"].total / 
                              ratingTotals[residence as "Observatory" | "Salt River"].count).toFixed(1)) 
          : 0;
          
        setStats((prevStats) => ({
          ...prevStats,
          [residence]: {
            ...prevStats[residence as "Observatory" | "Salt River"],
            averageRating: avgRating,
          },
        }));
      });
      
    } catch (error) {
      console.error("Error fetching average ratings:", error);
    }
  };

  // Use useEffect to log chart data when it changes
  useEffect(() => {
    console.log("Current Observatory chart data:", allRequestsData["Observatory"]);
    console.log("Current Salt River chart data:", allRequestsData["Salt River"]);
    
    // Force chart redraw by setting a key on the chart component
    if (allRequestsData["Observatory"].length > 0 || allRequestsData["Salt River"].length > 0) {
      console.log("Data is available for charts");
    }
  }, [allRequestsData]);

  // Use useEffect to log when chart refs are available
  useEffect(() => {
    if (observatoryChartRef.current) {
      console.log("Observatory chart ref is available");
    }
    if (saltRiverChartRef.current) {
      console.log("Salt River chart ref is available");
    }
  }, [observatoryChartRef.current, saltRiverChartRef.current]);

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/admin/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Handle tab change - this needs to accept a string and cast it to our type
  const handleTabChange = (value: string) => {
    setActiveTab(value as "Observatory" | "Salt River");
  };

  // Handle time range change - this needs to accept a string directly
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  const handleRefreshData = async () => {
    setLoading(true);
    await fetchAllAnalyticsData(timeRange);
    setLoading(false);
  };

  const exportToPDF = async () => {
    try {
      setExportLoading(true)

      // Check if there's data to export
      if (maintenanceRequests[activeTab].length === 0) {
        alert("No maintenance requests found for the selected time period. Try extending the time range before exporting.");
        setExportLoading(false);
        return;
      }

      // Create a new PDF document
      const doc = new jsPDF()

      // Add logos
      try {
        // Add My Domain logo
        const myDomainImg = new Image()
        myDomainImg.src = "/logo.png"
        await new Promise((resolve) => {
          myDomainImg.onload = resolve
        })
        doc.addImage(myDomainImg, "PNG", 10, 10, 30, 30)

        // Add RezTek logo
        const reztekImg = new Image()
        reztekImg.crossOrigin = "anonymous"
        reztekImg.src =
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-XjYVntwVnrzOrvrVEdTIKBMLXR8rvM.png"
        await new Promise((resolve) => {
          reztekImg.onload = resolve
        })
        doc.addImage(reztekImg, "PNG", 150, 15, 40, 20)
      } catch (error) {
        console.error("Error adding logos:", error)
      }

      // Add title
      doc.setFontSize(20)
      doc.text(`My Domain ${activeTab} - Analytics Report`, 14, 50)

      // Add subtitle
      doc.setFontSize(12)
      doc.text(`Last ${timeRange} days | Generated on ${new Date().toLocaleDateString()}`, 14, 60)

      // Add summary section
      doc.setFontSize(16)
      doc.text("Summary", 14, 75)

      // Add summary data
      doc.setFontSize(10)
      const summaryData = [
        ["Total Requests", stats[activeTab].totalRequests.toString()],
        ["Pending Requests", stats[activeTab].pendingRequests.toString()],
        ["Completed Requests", stats[activeTab].completedRequests.toString()],
        ["High Urgency Requests", stats[activeTab].highUrgencyRequests.toString()],
        ["Average Rating", `${stats[activeTab].averageRating}/5`],
      ]

      // Use autoTable properly
      try {
        autoTable(doc, {
          startY: 80,
          head: [["Metric", "Value"]],
          body: summaryData,
          theme: "grid",
          headStyles: { fillColor: [225, 29, 72] },
        })
        
        // Add chart title
        doc.setFontSize(16)
        const finalY = (doc as any).lastAutoTable?.finalY || 140;
        doc.text("Maintenance Requests by Date", 14, finalY + 15)

        // Add chart data
        const chartTableData = allRequestsData[activeTab].map((item) => [
          item.date, 
          item.pending.toString(), 
          item.completed.toString()
        ])

        // Use autoTable properly
        autoTable(doc, {
          startY: finalY + 20,
          head: [["Date", "Pending", "Completed"]],
          body: chartTableData,
          theme: "grid",
          headStyles: { fillColor: [225, 29, 72] },
        })

        // Try to capture the chart as an image if available
        if (activeTab === "Observatory" && observatoryChartRef.current) {
          try {
            const canvas = await html2canvas(observatoryChartRef.current)
            const chartImg = canvas.toDataURL("image/png")
            doc.addPage()
            doc.text("Maintenance Requests Chart", 14, 20)
            doc.addImage(chartImg, "PNG", 10, 30, 180, 100)
          } catch (error) {
            console.error("Error capturing chart:", error)
          }
        } else if (activeTab === "Salt River" && saltRiverChartRef.current) {
          try {
            const canvas = await html2canvas(saltRiverChartRef.current)
            const chartImg = canvas.toDataURL("image/png")
            doc.addPage()
            doc.text("Maintenance Requests Chart", 14, 20)
            doc.addImage(chartImg, "PNG", 10, 30, 180, 100)
          } catch (error) {
            console.error("Error capturing chart:", error)
          }
        }

        // Add detailed maintenance requests page
        doc.addPage()
        doc.setFontSize(16)
        doc.text("Detailed Maintenance Requests", 14, 20)
        
        // Format maintenance request data for the table
        const requestsData = maintenanceRequests[activeTab].map(request => {
          const date = new Date(request.submittedAt);
          return [
            date.toLocaleDateString(),
            request.unit,
            request.tenantName,
            request.status,
            request.urgencyLevel,
            request.description.length > 40 ? request.description.substring(0, 40) + "..." : request.description
          ];
        });
        
        // Add maintenance requests table
        autoTable(doc, {
          startY: 30,
          head: [["Date", "Unit", "Tenant", "Status", "Urgency", "Description"]],
          body: requestsData,
          theme: "grid",
          headStyles: { fillColor: [225, 29, 72] },
          styles: { overflow: 'linebreak', cellWidth: 'wrap' },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 15 },
            2: { cellWidth: 30 },
            3: { cellWidth: 25 },
            4: { cellWidth: 20 },
            5: { cellWidth: 'auto' }
          }
        })

        // Add footer
        doc.setFontSize(8)
        doc.text("My Domain Student Living - Confidential", 14, doc.internal.pageSize.height - 10)
        doc.text("Generated by RezTek", doc.internal.pageSize.width - 60, doc.internal.pageSize.height - 10)

        // Save the PDF
        doc.save(`my_domain_${activeTab.toLowerCase()}_analytics_${new Date().toISOString().split("T")[0]}.pdf`)
      } catch (error) {
        console.error("Error generating PDF tables:", error)
        alert("There was an error generating the PDF. Please try again.")
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("There was an error generating the PDF. Please try again.")
    } finally {
      setExportLoading(false)
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

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-400 mt-1">View and analyze maintenance request data</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="bg-gray-800 hover:bg-gray-700 border-gray-700"
              onClick={handleRefreshData}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full" />
                  Refreshing...
                </>
              ) : (
                "Refresh Data"
              )}
            </Button>
            <Button
              variant="outline"
              className="bg-gray-800 hover:bg-gray-700 border-gray-700"
              onClick={exportToPDF}
              disabled={exportLoading}
            >
              {exportLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full" />
                  Exporting...
                </>
              ) : (
                "Export to PDF"
              )}
            </Button>
          </div>
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

            <Select onValueChange={handleTimeRangeChange} defaultValue={timeRange}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="Observatory" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Requests</CardTitle>
                  <CardDescription className="text-gray-400">Last {timeRange} days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats["Observatory"].totalRequests}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Pending Requests</CardTitle>
                  <CardDescription className="text-gray-400">Awaiting resolution</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                  <div className="text-3xl font-bold">{stats["Observatory"].pendingRequests}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Completed</CardTitle>
                  <CardDescription className="text-gray-400">Successfully resolved</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                  <div className="text-3xl font-bold">{stats["Observatory"].completedRequests}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Average Rating</CardTitle>
                  <CardDescription className="text-gray-400">Tenant satisfaction</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center">
                  <div className="text-3xl font-bold text-yellow-500">{stats["Observatory"].averageRating}/5</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Maintenance Requests</CardTitle>
                <CardDescription className="text-gray-400">Pending vs Completed requests by date</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div ref={observatoryChartRef} className="h-full">
                  {allRequestsData["Observatory"].length > 0 ? (
                    <Bar
                      key={`observatory-chart-${lastFetched?.getTime() || 0}`}
                      data={{
                        labels: allRequestsData["Observatory"].map((d) => d.date),
                        datasets: [
                          {
                            label: "Pending",
                            data: allRequestsData["Observatory"].map((d) => d.pending),
                            backgroundColor: "#FFB74D",
                          },
                          {
                            label: "Completed",
                            data: allRequestsData["Observatory"].map((d) => d.completed),
                            backgroundColor: "#4CAF50",
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            stacked: false,
                            ticks: { 
                              color: "#888",
                              precision: 0 // Only show whole numbers
                            },
                            grid: { color: "#444" },
                          },
                          x: {
                            ticks: { color: "#888" },
                            grid: { color: "#444" },
                          },
                        },
                        plugins: {
                          legend: {
                            labels: { color: "#fff" },
                            position: 'top',
                          },
                          tooltip: {
                            callbacks: {
                              title: function(tooltipItems) {
                                return tooltipItems[0].label;
                              },
                              label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value} request${value !== 1 ? 's' : ''}`;
                              }
                            }
                          }
                        },
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No maintenance requests found in the selected time period. Try extending the time range.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="Salt River" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Requests</CardTitle>
                  <CardDescription className="text-gray-400">Last {timeRange} days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats["Salt River"].totalRequests}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Pending Requests</CardTitle>
                  <CardDescription className="text-gray-400">Awaiting resolution</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                  <div className="text-3xl font-bold">{stats["Salt River"].pendingRequests}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Completed</CardTitle>
                  <CardDescription className="text-gray-400">Successfully resolved</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                  <div className="text-3xl font-bold">{stats["Salt River"].completedRequests}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Average Rating</CardTitle>
                  <CardDescription className="text-gray-400">Tenant satisfaction</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center">
                  <div className="text-3xl font-bold text-yellow-500">{stats["Salt River"].averageRating}/5</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Maintenance Requests</CardTitle>
                <CardDescription className="text-gray-400">Pending vs Completed requests by date</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div ref={saltRiverChartRef} className="h-full">
                  {allRequestsData["Salt River"].length > 0 ? (
                    <Bar
                      key={`salt-river-chart-${lastFetched?.getTime() || 0}`}
                      data={{
                        labels: allRequestsData["Salt River"].map((d) => d.date),
                        datasets: [
                          {
                            label: "Pending",
                            data: allRequestsData["Salt River"].map((d) => d.pending),
                            backgroundColor: "#FFB74D",
                          },
                          {
                            label: "Completed",
                            data: allRequestsData["Salt River"].map((d) => d.completed),
                            backgroundColor: "#4CAF50",
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            stacked: false,
                            ticks: { 
                              color: "#888",
                              precision: 0 // Only show whole numbers
                            },
                            grid: { color: "#444" },
                          },
                          x: {
                            ticks: { color: "#888" },
                            grid: { color: "#444" },
                          },
                        },
                        plugins: {
                          legend: {
                            labels: { color: "#fff" },
                            position: 'top',
                          },
                          tooltip: {
                            callbacks: {
                              title: function(tooltipItems) {
                                return tooltipItems[0].label;
                              },
                              label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value} request${value !== 1 ? 's' : ''}`;
                              }
                            }
                          }
                        },
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No maintenance requests found in the selected time period. Try extending the time range.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
