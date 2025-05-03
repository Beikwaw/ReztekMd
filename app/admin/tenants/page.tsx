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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Phone, Mail, Search, User, Home } from "lucide-react"
import AdminHeader from "@/components/admin/admin-header"

interface Tenant {
  id: string
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  roomNumber: string
  residence: string
  tenantCode: string
  createdAt: any
}

export default function AdminTenants() {
  const router = useRouter()
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("Observatory")
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user is an admin
          const adminDoc = await getDoc(doc(db, "admins", user.uid))

          if (adminDoc.exists()) {
            setAdminData(adminDoc.data())
            await fetchTenants(activeTab)
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
    if (tenants.length > 0) {
      filterTenants()
    }
  }, [searchQuery, tenants])

  const fetchTenants = async (residence: string) => {
    try {
      const tenantsQuery = query(
        collection(db, "tenants"),
        where("residence", "==", residence),
        orderBy("roomNumber", "asc"),
      )

      const tenantsSnapshot = await getDocs(tenantsQuery)
      const tenantsList: Tenant[] = []

      tenantsSnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Tenant, "id">
        tenantsList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        })
      })

      setTenants(tenantsList)
      setFilteredTenants(tenantsList)
    } catch (error) {
      console.error("Error fetching tenants:", error)
    }
  }

  const filterTenants = () => {
    if (!searchQuery.trim()) {
      setFilteredTenants(tenants)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = tenants.filter(
      (tenant) =>
        (tenant.firstName?.toLowerCase() || "").includes(query) ||
        (tenant.lastName?.toLowerCase() || "").includes(query) ||
        (tenant.email?.toLowerCase() || "").includes(query) ||
        (tenant.roomNumber?.toLowerCase() || "").includes(query) ||
        (tenant.tenantCode?.toLowerCase() || "").includes(query)
    )

    setFilteredTenants(filtered)
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

  const openTenantDetails = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setDetailsOpen(true)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date)
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
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <p className="text-gray-400 mt-2">View and manage tenant information</p>
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
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 w-full sm:w-[300px]"
              />
            </div>
          </div>

          <TabsContent value="Observatory" className="space-y-6">
            {filteredTenants.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardContent className="pt-6 text-center">
                  <div className="mb-4">
                    <User className="h-12 w-12 text-gray-500 mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Tenants Found</h3>
                  <p className="text-gray-400">
                    {searchQuery
                      ? "No tenants match your search criteria."
                      : "There are no registered tenants for My Domain Observatory."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTenants.map((tenant) => (
                  <Card key={tenant.id} className="bg-gray-900 border-gray-800 text-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {tenant.firstName} {tenant.lastName}
                      </CardTitle>
                      <CardDescription className="text-gray-400">Room {tenant.roomNumber}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {tenant.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {tenant.contactNumber}
                        </div>
                        <div className="flex items-center text-sm">
                          <Home className="h-4 w-4 mr-2 text-gray-400" />
                          My Domain {tenant.residence}
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="text-xs text-gray-400 mb-1">Tenant Code</div>
                        <div className="font-mono bg-gray-800 px-2 py-1 rounded text-red-400 text-sm">
                          {tenant.tenantCode}
                        </div>
                      </div>

                      <div className="flex justify-between pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                          onClick={() => openTenantDetails(tenant)}
                        >
                          View Details
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-500 hover:text-blue-400 hover:bg-blue-900/20"
                            onClick={() => window.open(`tel:${tenant.contactNumber}`)}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-500 hover:text-green-400 hover:bg-green-900/20"
                            onClick={() => window.open(`mailto:${tenant.email}`)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="Salt River" className="space-y-6">
            {filteredTenants.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardContent className="pt-6 text-center">
                  <div className="mb-4">
                    <User className="h-12 w-12 text-gray-500 mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Tenants Found</h3>
                  <p className="text-gray-400">
                    {searchQuery
                      ? "No tenants match your search criteria."
                      : "There are no registered tenants for My Domain Salt River."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTenants.map((tenant) => (
                  <Card key={tenant.id} className="bg-gray-900 border-gray-800 text-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {tenant.firstName} {tenant.lastName}
                      </CardTitle>
                      <CardDescription className="text-gray-400">Room {tenant.roomNumber}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {tenant.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {tenant.contactNumber}
                        </div>
                        <div className="flex items-center text-sm">
                          <Home className="h-4 w-4 mr-2 text-gray-400" />
                          My Domain {tenant.residence}
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="text-xs text-gray-400 mb-1">Tenant Code</div>
                        <div className="font-mono bg-gray-800 px-2 py-1 rounded text-red-400 text-sm">
                          {tenant.tenantCode}
                        </div>
                      </div>

                      <div className="flex justify-between pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                          onClick={() => openTenantDetails(tenant)}
                        >
                          View Details
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-500 hover:text-blue-400 hover:bg-blue-900/20"
                            onClick={() => window.open(`tel:${tenant.contactNumber}`)}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-500 hover:text-green-400 hover:bg-green-900/20"
                            onClick={() => window.open(`mailto:${tenant.email}`)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Tenant Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription className="text-gray-400">Detailed information about the tenant</DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold">
                  {selectedTenant?.firstName?.charAt(0)}
                  {selectedTenant?.lastName?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedTenant.firstName} {selectedTenant.lastName}
                  </h3>
                  <p className="text-gray-400">Tenant since {formatDate(selectedTenant.createdAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-400">Email Address</div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedTenant.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Contact Number</div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedTenant.contactNumber}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-400">Room Number</div>
                    <div className="flex items-center">
                      <Home className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedTenant.roomNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Residence</div>
                    <div>My Domain {selectedTenant.residence}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-1">Tenant Code</div>
                <div className="font-mono bg-gray-800 px-3 py-2 rounded text-red-400">{selectedTenant.tenantCode}</div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                  onClick={() => window.open(`tel:${selectedTenant.contactNumber}`)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Tenant
                </Button>
                <Button
                  variant="outline"
                  className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                  onClick={() => window.open(`mailto:${selectedTenant.email}`)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Tenant
                </Button>
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
