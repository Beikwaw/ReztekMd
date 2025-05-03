"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

interface TenantContextType {
  isTenant: boolean
  tenantData: any
  loading: boolean
  checkTenantStatus: () => Promise<boolean>
}

const TenantContext = createContext<TenantContextType>({
  isTenant: false,
  tenantData: null,
  loading: true,
  checkTenantStatus: async () => false,
})

export const useTenant = () => useContext(TenantContext)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [isTenantUser, setIsTenantUser] = useState(false)
  const [tenantData, setTenantData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user is a tenant - directly from Firestore, no admin check
          const tenantDoc = await getDoc(doc(db, "tenants", user.uid))

          if (tenantDoc.exists()) {
            setIsTenantUser(true)
            setTenantData(tenantDoc.data())
          } else {
            setIsTenantUser(false)
            setTenantData(null)
          }
        } catch (error) {
          console.error("Error checking tenant status:", error)
          setIsTenantUser(false)
        }
      } else {
        setIsTenantUser(false)
        setTenantData(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const checkTenantStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) return false

    try {
      const tenantDoc = await getDoc(doc(db, "tenants", auth.currentUser.uid))
      const isTenant = tenantDoc.exists()

      setIsTenantUser(isTenant)
      if (isTenant) {
        setTenantData(tenantDoc.data())
      }

      return isTenant
    } catch (error) {
      console.error("Error checking tenant status:", error)
      return false
    }
  }

  return (
    <TenantContext.Provider
      value={{
        isTenant: isTenantUser,
        tenantData,
        loading,
        checkTenantStatus,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}
