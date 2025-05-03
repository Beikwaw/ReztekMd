"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, LogOut, User } from "lucide-react"

interface AdminHeaderProps {
  adminData: any
  onLogout: () => void
}

export default function AdminHeader({ adminData, onLogout }: AdminHeaderProps) {
  return (
    <header className="border-b border-gray-800 bg-black">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
              R
            </div>
            <span className="text-xl font-bold">RezTek Admin</span>
          </Link>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="text-sm h-9">
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/maintenance">
            <Button variant="ghost" className="text-sm h-9">
              Maintenance
            </Button>
          </Link>
          <Link href="/admin/tenants">
            <Button variant="ghost" className="text-sm h-9">
              Tenants
            </Button>
          </Link>
          <Link href="/admin/feedback">
            <Button variant="ghost" className="text-sm h-9">
              Feedback
            </Button>
          </Link>
          <Link href="/admin/stock">
            <Button variant="ghost" className="text-sm h-9">
              Stock
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9">
                <div className="bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-medium">
                  {adminData?.name?.charAt(0) || "A"}
                </div>
                <span className="hidden sm:inline">{adminData?.name || "Admin"}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-white">
              <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
