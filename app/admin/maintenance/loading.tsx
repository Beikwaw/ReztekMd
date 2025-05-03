import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-gray-800 bg-black">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full bg-gray-800" />
            <Skeleton className="h-6 w-32 bg-gray-800" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-md bg-gray-800" />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 bg-gray-800 mb-2" />
          <Skeleton className="h-4 w-96 bg-gray-800" />
        </div>

        <Tabs defaultValue="Observatory" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-gray-800">
              <TabsTrigger value="Observatory" className="data-[state=active]:bg-red-600">
                My Domain Observatory
              </TabsTrigger>
              <TabsTrigger value="Salt River" disabled>
                My Domain Salt River
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Skeleton className="h-10 w-[250px] bg-gray-800" />
              <Skeleton className="h-10 w-[180px] bg-gray-800" />
            </div>
          </div>

          <TabsContent value="Observatory" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Maintenance Requests</CardTitle>
                <CardDescription className="text-gray-400">
                  All maintenance requests for My Domain Observatory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex flex-col space-y-3">
                        <div className="flex justify-between">
                          <Skeleton className="h-5 w-1/4 bg-gray-800" />
                          <Skeleton className="h-5 w-24 bg-gray-800" />
                        </div>
                        <Skeleton className="h-16 w-full bg-gray-800" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
