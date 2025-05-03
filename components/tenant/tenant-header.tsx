"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, Home, PlusCircle, History, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface TenantHeaderProps {
  userData: any
  onLogout: () => void
}

export default function TenantHeader({ userData, onLogout }: TenantHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/tenant/dashboard" className="flex items-center">
              <Image src="/logo.png" alt="RezTek Logo" width={120} height={60} />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/tenant/dashboard" className="text-gray-300 hover:text-white flex items-center">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/tenant/request" className="text-gray-300 hover:text-white flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Request
            </Link>
            <Link href="/tenant/history" className="text-gray-300 hover:text-white flex items-center">
              <History className="mr-2 h-4 w-4" />
              History
            </Link>
            <div className="border-l border-gray-700 h-6 mx-2"></div>
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2 bg-red-600 text-white">
                <AvatarFallback>
                  {userData?.name?.charAt(0)}
                  {userData?.surname?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{userData?.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-gray-300 hover:text-white">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-gray-300">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-gray-900 text-white border-gray-800 w-[80%] sm:w-[350px]">
              <div className="flex flex-col h-full">
                <div className="flex items-center mb-6">
                  <Avatar className="h-10 w-10 mr-3 bg-red-600 text-white">
                    <AvatarFallback>
                      {userData?.name?.charAt(0)}
                      {userData?.surname?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {userData?.name} {userData?.surname}
                    </p>
                    <p className="text-sm text-gray-400">{userData?.email}</p>
                  </div>
                </div>
                <nav className="space-y-4">
                  <Link
                    href="/tenant/dashboard"
                    className="flex items-center p-2 rounded-md hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    <Home className="mr-3 h-5 w-5 text-red-500" />
                    Dashboard
                  </Link>
                  <Link
                    href="/tenant/request"
                    className="flex items-center p-2 rounded-md hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    <PlusCircle className="mr-3 h-5 w-5 text-red-500" />
                    New Request
                  </Link>
                  <Link
                    href="/tenant/history"
                    className="flex items-center p-2 rounded-md hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    <History className="mr-3 h-5 w-5 text-red-500" />
                    Request History
                  </Link>
                  <Link
                    href="/tenant/profile"
                    className="flex items-center p-2 rounded-md hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="mr-3 h-5 w-5 text-red-500" />
                    Profile
                  </Link>
                </nav>
                <div className="mt-auto pt-6">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-gray-800"
                    onClick={() => {
                      setIsOpen(false)
                      onLogout()
                    }}
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
