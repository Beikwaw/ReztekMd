"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import AdminHeader from "@/components/admin/admin-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isAdmin, getAdminData } from "@/lib/admin-utils"
import { AlertCircle, CheckCircle2, Clock, Package, Users, MessageSquare, BarChart3, Loader2 } from "lucide-react"

// Define interface for maintenance requests
interface MaintenanceRequest {
  id: string;
  tenantId?: string;
  tenantName?: string;
  roomNumber?: string;
  residence?: string;
  issueLocation?: string;
  issueDescription?: string;
  urgencyLevel?: string;
  status?: string;
  imageUrl?: string;
  submittedAt?: any;
  lastUpdatedAt?: any;
  [key: string]: any; // Allow for additional properties
}

export default function AdminDashboard() {
  const router = useRouter()
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pendingRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    totalTenants: 0,
    lowStockItems: 0,
    recentFeedback: 0,
  })
  const [recentRequests, setRecentRequests] = useState<MaintenanceRequest[]>([])
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          console.log("User authenticated:", user.email);
          
          // Check if user is admin
          if (user.email?.toLowerCase() === "obsadmin@mydomainliving.co.za") {
            console.log("Admin email verified");
            
            // Get admin data
            try {
              const data = await getAdminData(user.uid);
              setAdminData(data || { name: "Admin", email: user.email });
              
              // Fetch dashboard stats
              await fetchDashboardStats();
              
              // Set loading to false after data is fetched
              setLoading(false);
              
              // Set up a refresh interval for dashboard stats
              const refreshInterval = setInterval(() => {
                fetchDashboardStats();
              }, 60000); // Refresh every minute
              
              return () => clearInterval(refreshInterval);
            } catch (dataError) {
              console.error("Error fetching admin data:", dataError);
              setLoading(false);
            }
          } else {
            console.log("Not an admin email:", user.email);
            // Not an admin, redirect to login
            router.push("/admin/login");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setLoading(false);
          router.push("/admin/login");
        }
      } else {
        // No user logged in, redirect to login
        console.log("No user logged in, redirecting to login");
        router.push("/admin/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      console.log("Refreshing dashboard stats...");
      
      // Fetch maintenance requests with a single query and process locally
      const maintenanceRequestsQuery = query(
        collection(db, "maintenanceRequests"),
        orderBy("submittedAt", "desc"),
        limit(100) // Limit to most recent 100 requests to reduce reads
      );
      const maintenanceSnapshot = await getDocs(maintenanceRequestsQuery);
      const maintenanceRequests: MaintenanceRequest[] = maintenanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Process maintenance data locally to avoid multiple queries
      const pendingCount = maintenanceRequests.filter(req => 
        req.status?.toString().toLowerCase() === "pending").length;
      const inProgressCount = maintenanceRequests.filter(req => 
        req.status?.toString().toLowerCase() === "in progress").length;
      const completedCount = maintenanceRequests.filter(req => 
        req.status?.toString().toLowerCase() === "completed").length;
      
      // Get the 5 most recent requests
      const recentRequestsData = maintenanceRequests.slice(0, 5);
      
      // Fetch total tenants - this is a relatively small collection
      const tenantsSnapshot = await getDocs(collection(db, "tenants"));
      
      // Fetch low stock items
      const lowStockQuery = query(collection(db, "inventory"), where("quantity", "<", 5));
      const lowStockSnapshot = await getDocs(lowStockQuery);
      
      // Fetch recent feedback count
      const feedbackQuery = query(
        collection(db, "feedback"),
        orderBy("createdAt", "desc"),
        limit(20) // Limit to most recent feedback
      );
      const feedbackSnapshot = await getDocs(feedbackQuery);

      setStats({
        pendingRequests: pendingCount,
        inProgressRequests: inProgressCount,
        completedRequests: completedCount,
        totalTenants: tenantsSnapshot.size,
        lowStockItems: lowStockSnapshot.size,
        recentFeedback: feedbackSnapshot.size,
      });

      setRecentRequests(recentRequestsData);
      
      // Update last refresh timestamp
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push("/admin/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AdminHeader adminData={adminData} onLogout={handleLogout} />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                <span className="text-3xl font-bold">{stats.pendingRequests}</span>
              </div>
              <Button
                variant="link"
                className="text-yellow-500 p-0 h-auto mt-2"
                onClick={() => router.push("/admin/maintenance")}
              >
                View all pending
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">In Progress Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-500 mr-3" />
                <span className="text-3xl font-bold">{stats.inProgressRequests}</span>
              </div>
              <Button
                variant="link"
                className="text-blue-500 p-0 h-auto mt-2"
                onClick={() => router.push("/admin/maintenance")}
              >
                View in progress
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Completed Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mr-3" />
                <span className="text-3xl font-bold">{stats.completedRequests}</span>
              </div>
              <Button
                variant="link"
                className="text-green-500 p-0 h-auto mt-2"
                onClick={() => router.push("/admin/maintenance")}
              >
                View completed
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Total Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500 mr-3" />
                <span className="text-3xl font-bold">{stats.totalTenants}</span>
              </div>
              <Button
                variant="link"
                className="text-blue-500 p-0 h-auto mt-2"
                onClick={() => router.push("/admin/tenants")}
              >
                Manage tenants
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Package className="h-8 w-8 text-red-500 mr-3" />
                <span className="text-3xl font-bold">{stats.lowStockItems}</span>
              </div>
              <Button
                variant="link"
                className="text-red-500 p-0 h-auto mt-2"
                onClick={() => router.push("/admin/stock")}
              >
                View inventory
              </Button>
            </CardContent>
          </Card>
        </div>

        {stats.lowStockItems > 0 && (
          <Alert className="bg-red-900/20 border-red-600/50 text-red-200 mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Low Stock Alert</AlertTitle>
            <AlertDescription>
              You have {stats.lowStockItems} items that are running low on stock.
              <Button
                variant="link"
                className="text-red-400 p-0 h-auto ml-2"
                onClick={() => router.push("/admin/stock")}
              >
                Check inventory
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="requests" className="mb-8">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="requests">Recent Requests</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-4">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>Recent Maintenance Requests</CardTitle>
                <CardDescription className="text-gray-400">
                  The latest maintenance requests from tenants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentRequests.length > 0 ? (
                  <div className="space-y-4">
                    {recentRequests.map((request) => (
                      <div key={request.id} className="p-4 rounded-lg bg-gray-700 flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{request.title || "Maintenance Request"}</h3>
                          <p className="text-sm text-gray-300 mt-1">{request.description?.substring(0, 100)}...</p>
                          <div className="flex items-center mt-2">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                request.status?.toString().toLowerCase() === "pending"
                                  ? "bg-yellow-900/50 text-yellow-300"
                                  : request.status?.toString().toLowerCase() === "in progress"
                                    ? "bg-blue-900/50 text-blue-300"
                                    : request.status?.toString().toLowerCase() === "completed"
                                      ? "bg-green-900/50 text-green-300"
                                      : "bg-gray-900/50 text-gray-300"
                              }`}
                            >
                              {request.status?.toString()}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              {new Date(request.submittedAt?.toDate()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-gray-600"
                          onClick={() => router.push(`/admin/maintenance/${request.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No recent maintenance requests</p>
                )}

                <Button
                  className="w-full mt-4 bg-red-600 hover:bg-red-700"
                  onClick={() => router.push("/admin/maintenance")}
                >
                  View All Maintenance Requests
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
                <CardDescription className="text-gray-400">Performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button className="bg-red-600 hover:bg-red-700" onClick={() => router.push("/admin/analytics")}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Detailed Analytics
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="mt-4">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
                <CardDescription className="text-gray-400">Latest feedback from tenants</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button className="bg-red-600 hover:bg-red-700" onClick={() => router.push("/admin/feedback")}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View All Feedback
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
