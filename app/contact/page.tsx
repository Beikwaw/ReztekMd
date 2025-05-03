"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Phone, Mail, MapPin, ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState("salt-river")

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Image src="/logo.png" alt="RezTek Logo" width={200} height={120} className="mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold">Contact Support</h1>
            <p className="text-gray-400 mt-2">Get in touch with the support team at your residence</p>
          </div>

          <Tabs defaultValue="salt-river" onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid grid-cols-2 w-full bg-gray-800">
              <TabsTrigger value="salt-river" className="data-[state=active]:bg-red-600">
                My Domain Salt River
              </TabsTrigger>
              <TabsTrigger value="observatory" className="data-[state=active]:bg-red-600">
                My Domain Observatory
              </TabsTrigger>
            </TabsList>

            <TabsContent value="salt-river" className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-4">Subwarden Contact Details</h2>
                <p className="text-gray-400 mb-6">
                  For any residence-related issues, please contact one of the subwardens below:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Avela Ntsokoma */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle>Avela Ntsokoma</CardTitle>
                      <CardDescription className="text-gray-400">Subwarden</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open("tel:0712327373")}
                      >
                        <Phone className="mr-2 h-4 w-4 text-red-500" />
                        071 232 7373
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open("mailto:ntsave004@myuct.ac.za")}
                      >
                        <Mail className="mr-2 h-4 w-4 text-red-500" />
                        ntsave004@myuct.ac.za
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Ayabonga Yedwa */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle>Ayabonga Yedwa</CardTitle>
                      <CardDescription className="text-gray-400">Subwarden</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open("tel:0660338109")}
                      >
                        <Phone className="mr-2 h-4 w-4 text-red-500" />
                        066 033 8109
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open("mailto:ydwaya001@myuct.ac.za")}
                      >
                        <Mail className="mr-2 h-4 w-4 text-red-500" />
                        ydwaya001@myuct.ac.za
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Kelebogile Mathibe */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle>Kelebogile Mathibe</CardTitle>
                      <CardDescription className="text-gray-400">Subwarden</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open("tel:0817442214")}
                      >
                        <Phone className="mr-2 h-4 w-4 text-red-500" />
                        081 744 2214
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open("mailto:mthkel014@myuct.ac.za")}
                      >
                        <Mail className="mr-2 h-4 w-4 text-red-500" />
                        mthkel014@myuct.ac.za
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Unam Soya */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle>Unam Soya</CardTitle>
                      <CardDescription className="text-gray-400">Subwarden</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open("tel:0628977857")}
                      >
                        <Phone className="mr-2 h-4 w-4 text-red-500" />
                        062 897 7857
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open("mailto:syxuna001@myuct.ac.za")}
                      >
                        <Mail className="mr-2 h-4 w-4 text-red-500" />
                        syxuna001@myuct.ac.za
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-4">Residence Address</h2>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-red-500 mr-2 mt-1" />
                  <div>
                    <p>364 Victoria Rd, Salt River, Cape Town, 7925</p>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => window.open("https://www.mydomainliving.co.za/salt-river", "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Accommodation
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="observatory" className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle>Sleepover Requests</CardTitle>
                      <CardDescription className="text-gray-400">For sleepover and guest arrangements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open("mailto:obsadmin@mydomainliving.co.za")}
                      >
                        <Mail className="mr-2 h-4 w-4 text-red-500" />
                        obsadmin@mydomainliving.co.za
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle>Front Desk Security</CardTitle>
                      <CardDescription className="text-gray-400">
                        For immediate assistance and emergencies
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open("tel:0682040814")}
                      >
                        <Phone className="mr-2 h-4 w-4 text-red-500" />
                        068 204 0814
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-4">Residence Address</h2>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-red-500 mr-2 mt-1" />
                  <div>
                    <p>1 Seymour St, Observatory, Cape Town, 7925</p>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => window.open("https://www.mydomainliving.co.za/observatory", "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Accommodation
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">Need to report a maintenance issue?</p>
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link href="/tenant/request">Submit Maintenance Request</Link>
            </Button>
          </div>
        </div>
      </div>

      <footer className="py-6 border-t border-gray-800 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} RezTek. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
