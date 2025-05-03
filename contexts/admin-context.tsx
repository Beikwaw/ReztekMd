"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { isAdmin, getAdminData } from "@/lib/admin-utils"

interface AdminContextType {
  isAdmin: boolean
  adminData: any
  loading: boolean
  checkAdminStatus: () => Promise<boolean>
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  adminData: null,
  loading: true,
  checkAdminStatus: async () => false,
})

export const useAdmin = () => useContext(AdminContext)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const adminStatus = await isAdmin(user.uid)
          setIsAdminUser(adminStatus)

          if (adminStatus) {
            const data = await getAdminData(user.uid)
            setAdminData(data || { name: "Admin", email: user.email })
          }
        } catch (error) {
          console.error("Error checking admin status:", error)
          setIsAdminUser(false)
        }
      } else {
        setIsAdminUser(false)
        setAdminData(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) return false

    try {
      const adminStatus = await isAdmin(auth.currentUser.uid)
      setIsAdminUser(adminStatus)

      if (adminStatus) {
        const data = await getAdminData(auth.currentUser.uid)
        setAdminData(data || { name: "Admin", email: auth.currentUser.email })
      }

      return adminStatus
    } catch (error) {
      console.error("Error checking admin status:", error)
      return false
    }
  }

  return (
    <AdminContext.Provider
      value={{
        isAdmin: isAdminUser,
        adminData,
        loading,
        checkAdminStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}
