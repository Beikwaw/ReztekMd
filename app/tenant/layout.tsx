import type React from "react"
import { TenantProvider } from "@/contexts/tenant-context"

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <TenantProvider>{children}</TenantProvider>
}
