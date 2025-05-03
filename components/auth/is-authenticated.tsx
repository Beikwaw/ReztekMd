"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Loader2 } from "lucide-react"

interface IsAuthenticatedProps {
  children: React.ReactNode
  adminOnly?: boolean
  redirectTo?: string
}

export default function IsAuthenticated({
  children,
  adminOnly = false,
  redirectTo = "/tenant/login",
}: IsAuthenticatedProps) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push(redirectTo)
      } else if (adminOnly && user.email !== "obsadmin@mydomainliving.co.za") {
        router.push("/")
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router, adminOnly, redirectTo])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    )
  }

  return <>{children}</>
}
