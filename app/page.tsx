import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Building, Clock, Shield, Star, PenToolIcon as Tool, UserCog } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-transparent opacity-90 z-10"></div>
        <div className="container mx-auto px-4 py-20 relative z-20">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-8 w-full max-w-md">
              <Image src="/logo.png" alt="RezTek Logo" width={500} height={300} className="mx-auto" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Maintenance Management
              <span className="text-red-600"> Simplified</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-300">
              Streamlining maintenance requests for residential properties with an intuitive platform for both tenants
              and administrators.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/tenant/login"
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium flex items-center justify-center transition-colors"
              >
                Tenant Portal <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/admin/login"
                className="px-8 py-3 bg-white hover:bg-gray-200 text-black rounded-md font-medium flex items-center justify-center transition-colors"
              >
                Admin Portal <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-white text-black">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Powerful Features for <span className="text-red-600">Both Portals</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-100 p-8 rounded-lg">
              <div className="bg-red-600 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <UserCog className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Easy Registration</h3>
              <p className="text-gray-700">
                Simple sign-up process for tenants with secure authentication and password management.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-100 p-8 rounded-lg">
              <div className="bg-red-600 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Tool className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Maintenance Requests</h3>
              <p className="text-gray-700">
                Submit and track maintenance issues with unique waiting number tokens for easy reference.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-100 p-8 rounded-lg">
              <div className="bg-red-600 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Updates</h3>
              <p className="text-gray-700">
                Stay informed with status updates on maintenance requests throughout the process.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-100 p-8 rounded-lg">
              <div className="bg-red-600 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Feedback System</h3>
              <p className="text-gray-700">
                Rate and review completed maintenance work to help improve service quality.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-100 p-8 rounded-lg">
              <div className="bg-red-600 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Platform</h3>
              <p className="text-gray-700">
                Enhanced security with hashed passwords, CAPTCHA verification, and data encryption.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-100 p-8 rounded-lg">
              <div className="bg-red-600 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Building className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Multiple Residences</h3>
              <p className="text-gray-700">
                Support for multiple properties with dedicated management for each location.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Comparison */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Choose Your <span className="text-red-600">Portal</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Tenant Portal */}
            <div className="border border-gray-800 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Tenant Portal</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-red-600 rounded-full p-1 mr-3 mt-1">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Easy sign-up with email verification</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-600 rounded-full p-1 mr-3 mt-1">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Submit maintenance requests with pre-filled information</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-600 rounded-full p-1 mr-3 mt-1">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Track request history and status updates</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-600 rounded-full p-1 mr-3 mt-1">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Provide feedback on completed maintenance</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-600 rounded-full p-1 mr-3 mt-1">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Secure password reset with CAPTCHA verification</span>
                </li>
              </ul>
              <div className="mt-8 text-center">
                <h4 className="text-lg font-medium text-red-500">Access via Tenant Portal button above</h4>
              </div>
            </div>

            {/* Admin Portal Logo */}
            <div className="border border-gray-800 rounded-lg p-8 flex flex-col items-center justify-center">
              <Image 
                src="/reztek-logo.png" 
                alt="RezTek Logo" 
                width={240} 
                height={180} 
                className="mx-auto mb-4" 
              />
              <h3 className="text-xl font-semibold mt-4 text-center">Admin Management System</h3>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Streamline Your Maintenance Process?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join RezTek today and experience a more efficient way to manage property maintenance requests.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tenant/register"
              className="px-8 py-3 bg-black hover:bg-gray-900 text-white rounded-md font-medium flex items-center justify-center transition-colors"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 bg-white hover:bg-gray-200 text-black rounded-md font-medium flex items-center justify-center transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-black border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <Image src="/logo.png" alt="RezTek Logo" width={180} height={100} />
              <p className="text-gray-500 mt-2">JUST A CLICK AWAY</p>
            </div>
            <div className="text-gray-500 text-center md:text-right">
              <p>&copy; {new Date().getFullYear()} RezTek. All rights reserved.</p>
              <p className="mt-2">Serving My Domain Salt River & My Domain Observatory</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
