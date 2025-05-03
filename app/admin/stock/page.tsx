"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  where,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, CheckCircle } from "lucide-react"
import AdminHeader from "@/components/admin/admin-header"

interface StockItem {
  id: string
  name: string
  quantity: number
  residence: string
  category: string
  lastRestocked: any
  notes: string
  lowStockThreshold: number
}

export default function AdminStock() {
  const router = useRouter()
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("Observatory")
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    category: "",
    notes: "",
    lowStockThreshold: 5,
  })

  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user is an admin
          const adminDoc = await getDoc(doc(db, "admins", user.uid))

          if (adminDoc.exists()) {
            setAdminData(adminDoc.data())
            await fetchStockItems(activeTab)
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
    if (stockItems.length > 0) {
      filterItems()
    }
  }, [searchQuery, stockItems])

  const fetchStockItems = async (residence: string) => {
    try {
      const stockQuery = query(collection(db, "stock"), where("residence", "==", residence), orderBy("name", "asc"))

      const stockSnapshot = await getDocs(stockQuery)
      const stockList: StockItem[] = []

      stockSnapshot.forEach((doc) => {
        const data = doc.data() as Omit<StockItem, "id">
        stockList.push({
          id: doc.id,
          ...data,
          lastRestocked: data.lastRestocked ? new Date(data.lastRestocked) : new Date(),
        })
      })

      setStockItems(stockList)
      setFilteredItems(stockList)
    } catch (error) {
      console.error("Error fetching stock items:", error)
    }
  }

  const filterItems = () => {
    if (!searchQuery.trim()) {
      setFilteredItems(stockItems)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = stockItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.notes.toLowerCase().includes(query),
    )

    setFilteredItems(filtered)
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

  const openAddDialog = () => {
    setFormData({
      name: "",
      quantity: 0,
      category: "",
      notes: "",
      lowStockThreshold: 5,
    })
    setFormError("")
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (item: StockItem) => {
    setSelectedItem(item)
    setFormData({
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      notes: item.notes || "",
      lowStockThreshold: item.lowStockThreshold || 5,
    })
    setFormError("")
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (item: StockItem) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "quantity" || name === "lowStockThreshold") {
      setFormData({
        ...formData,
        [name]: Number.parseInt(value) || 0,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError("Item name is required")
      return false
    }

    if (!formData.category.trim()) {
      setFormError("Category is required")
      return false
    }

    if (formData.quantity < 0) {
      setFormError("Quantity cannot be negative")
      return false
    }

    if (formData.lowStockThreshold < 0) {
      setFormError("Low stock threshold cannot be negative")
      return false
    }

    return true
  }

  const handleAddItem = async () => {
    if (!validateForm()) return

    try {
      setSubmitting(true)

      await addDoc(collection(db, "stock"), {
        name: formData.name,
        quantity: formData.quantity,
        category: formData.category,
        residence: activeTab,
        notes: formData.notes,
        lowStockThreshold: formData.lowStockThreshold,
        lastRestocked: new Date().toISOString(),
      })

      setIsAddDialogOpen(false)
      await fetchStockItems(activeTab)
      setSubmitting(false)
    } catch (error) {
      console.error("Error adding stock item:", error)
      setFormError("Failed to add item. Please try again.")
      setSubmitting(false)
    }
  }

  const handleUpdateItem = async () => {
    if (!selectedItem || !validateForm()) return

    try {
      setSubmitting(true)

      await updateDoc(doc(db, "stock", selectedItem.id), {
        name: formData.name,
        quantity: formData.quantity,
        category: formData.category,
        notes: formData.notes,
        lowStockThreshold: formData.lowStockThreshold,
        lastRestocked: new Date().toISOString(),
      })

      setIsEditDialogOpen(false)
      await fetchStockItems(activeTab)
      setSubmitting(false)
    } catch (error) {
      console.error("Error updating stock item:", error)
      setFormError("Failed to update item. Please try again.")
      setSubmitting(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!selectedItem) return

    try {
      setSubmitting(true)

      await deleteDoc(doc(db, "stock", selectedItem.id))

      setIsDeleteDialogOpen(false)
      await fetchStockItems(activeTab)
      setSubmitting(false)
    } catch (error) {
      console.error("Error deleting stock item:", error)
      setSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date)
  }

  const getStockStatus = (item: StockItem) => {
    if (item.quantity <= 0) {
      return { label: "Out of Stock", color: "bg-red-500/20 text-red-500 border-red-500/50" }
    } else if (item.quantity <= item.lowStockThreshold) {
      return { label: "Low Stock", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" }
    } else {
      return { label: "In Stock", color: "bg-green-500/20 text-green-500 border-green-500/50" }
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
          <h1 className="text-3xl font-bold">Stock Management</h1>
          <p className="text-gray-400 mt-2">Track and manage maintenance supplies inventory</p>
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

            <div className="flex items-center gap-4">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 w-full sm:w-[250px]"
                />
              </div>
              <Button onClick={openAddDialog} className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          <TabsContent value="Observatory" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage maintenance supplies for My Domain Observatory
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Items Found</h3>
                    <p className="text-gray-400 mb-4">
                      {searchQuery ? "No items match your search criteria." : "There are no inventory items added yet."}
                    </p>
                    {!searchQuery && (
                      <Button onClick={openAddDialog} className="bg-red-600 hover:bg-red-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Item
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead>Item Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Restocked</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => {
                          const status = getStockStatus(item)
                          return (
                            <TableRow key={item.id} className="border-gray-800">
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                <Badge className={status.color}>{status.label}</Badge>
                              </TableCell>
                              <TableCell>{formatDate(item.lastRestocked)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-blue-500 hover:text-blue-400 hover:bg-blue-900/20"
                                    onClick={() => openEditDialog(item)}
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                                    onClick={() => openDeleteDialog(item)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
                <CardDescription className="text-gray-400">Items that need to be restocked soon</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredItems.filter((item) => item.quantity <= item.lowStockThreshold).length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-400">All items are sufficiently stocked</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredItems
                      .filter((item) => item.quantity <= item.lowStockThreshold)
                      .map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                          <div className="flex items-center">
                            <AlertTriangle
                              className={`h-5 w-5 mr-3 ${item.quantity === 0 ? "text-red-500" : "text-yellow-500"}`}
                            />
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-400">{item.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`font-bold ${item.quantity === 0 ? "text-red-500" : "text-yellow-500"}`}>
                                {item.quantity} left
                              </p>
                              <p className="text-xs text-gray-400">Threshold: {item.lowStockThreshold}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                              onClick={() => openEditDialog(item)}
                            >
                              Restock
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="Salt River" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage maintenance supplies for My Domain Salt River
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Items Found</h3>
                    <p className="text-gray-400 mb-4">
                      {searchQuery ? "No items match your search criteria." : "There are no inventory items added yet."}
                    </p>
                    {!searchQuery && (
                      <Button onClick={openAddDialog} className="bg-red-600 hover:bg-red-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Item
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead>Item Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Restocked</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => {
                          const status = getStockStatus(item)
                          return (
                            <TableRow key={item.id} className="border-gray-800">
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                <Badge className={status.color}>{status.label}</Badge>
                              </TableCell>
                              <TableCell>{formatDate(item.lastRestocked)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-blue-500 hover:text-blue-400 hover:bg-blue-900/20"
                                    onClick={() => openEditDialog(item)}
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                                    onClick={() => openDeleteDialog(item)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
                <CardDescription className="text-gray-400">Items that need to be restocked soon</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredItems.filter((item) => item.quantity <= item.lowStockThreshold).length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-400">All items are sufficiently stocked</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredItems
                      .filter((item) => item.quantity <= item.lowStockThreshold)
                      .map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                          <div className="flex items-center">
                            <AlertTriangle
                              className={`h-5 w-5 mr-3 ${item.quantity === 0 ? "text-red-500" : "text-yellow-500"}`}
                            />
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-400">{item.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`font-bold ${item.quantity === 0 ? "text-red-500" : "text-yellow-500"}`}>
                                {item.quantity} left
                              </p>
                              <p className="text-xs text-gray-400">Threshold: {item.lowStockThreshold}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                              onClick={() => openEditDialog(item)}
                            >
                              Restock
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>Add Stock Item</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new stock item to the inventory
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {formError && (
              <div className="bg-red-900/20 border border-red-600/50 text-red-200 px-4 py-2 rounded-md">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-700"
                placeholder="e.g., Plumbing, Electrical, Tools"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-700"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-700"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-700"
                placeholder="Additional information about this item"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="bg-gray-800 hover:bg-gray-700 border-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={handleAddItem} className="bg-red-600 hover:bg-red-700" disabled={submitting}>
              {submitting ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update item details or restock quantity
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {formError && (
              <div className="bg-red-900/20 border border-red-600/50 text-red-200 px-4 py-2 rounded-md">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">Item Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-700"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-700"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="edit-lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-700"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Input
                id="edit-notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="bg-gray-800 hover:bg-gray-700 border-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateItem} className="bg-red-600 hover:bg-red-700" disabled={submitting}>
              {submitting ? "Updating..." : "Update Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>Delete Inventory Item</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="py-4">
              <div className="bg-gray-800 p-4 rounded-md mb-4">
                <p className="font-medium">{selectedItem.name}</p>
                <p className="text-sm text-gray-400">Category: {selectedItem.category}</p>
                <p className="text-sm text-gray-400">Quantity: {selectedItem.quantity}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-gray-800 hover:bg-gray-700 border-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700" disabled={submitting}>
              {submitting ? "Deleting..." : "Delete Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
