import Link from 'next/link'
import { Phone, Calendar, DollarSign, Clock, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#2e7d32] to-[#1b5e20] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              GreenAcre <span className="text-[#2e7d32]">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#2e7d32] hover:bg-[#1b5e20]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-green-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI-Powered Voice Assistant for Lawn Care Businesses
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900">
              Never Miss a Call,
              <br />
              <span className="text-[#2e7d32]">Never Miss a Customer</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Let AI handle your calls 24/7. Automatically answer questions, provide quotes,
              and book appointments while you focus on growing your lawn care business.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/signup">
                <Button size="lg" className="bg-[#2e7d32] hover:bg-[#1b5e20] text-lg px-8 py-6">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Watch Demo
                </Button>
              </Link>
            </div>

            <p className="text-sm text-gray-500">
              No credit card required • Setup in 5 minutes • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Automate Customer Calls
            </h2>
            <p className="text-lg text-gray-600">
              Our AI assistant handles the entire customer journey from first call to booked appointment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-[#2e7d32]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Call Answering</h3>
              <p className="text-gray-600">
                Never miss a lead. AI answers every call, day or night, with natural conversation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-[#2e7d32]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Quotes</h3>
              <p className="text-gray-600">
                AI looks up property size and provides accurate pricing based on your rates.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-[#2e7d32]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
              <p className="text-gray-600">
                Syncs with Google Calendar to book appointments automatically during available slots.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-[#2e7d32]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Save Time</h3>
              <p className="text-gray-600">
                Focus on mowing lawns, not answering phones. Reclaim hours every week.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Get started in minutes with our simple setup process
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-[#2e7d32] text-white flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Sign Up & Configure</h3>
                <p className="text-gray-600">
                  Enter your business details, service areas, and pricing. Takes less than 5 minutes.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-[#2e7d32] text-white flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Get Your Phone Number</h3>
                <p className="text-gray-600">
                  We provision a dedicated phone number for your business with AI assistant built-in.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-[#2e7d32] text-white flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Start Taking Calls</h3>
                <p className="text-gray-600">
                  Your AI assistant is ready! Share your number and watch appointments roll in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Lawn Care Businesses Love Us
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-[#2e7d32] flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Never Miss a Lead</h4>
                  <p className="text-gray-600">Every call is answered, even during busy season</p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-[#2e7d32] flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Professional Image</h4>
                  <p className="text-gray-600">Sound like a big company, even if you're solo</p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-[#2e7d32] flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">More Bookings</h4>
                  <p className="text-gray-600">Convert more calls into paying customers</p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-[#2e7d32] flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Less Admin Work</h4>
                  <p className="text-gray-600">Stop playing phone tag and focus on the work</p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-[#2e7d32] flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Easy Setup</h4>
                  <p className="text-gray-600">No technical knowledge required</p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-[#2e7d32] flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Transparent Pricing</h4>
                  <p className="text-gray-600">Simple plans with no hidden fees</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#2e7d32] to-[#1b5e20] text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Grow Your Business?
            </h2>
            <p className="text-xl text-white/90">
              Join lawn care businesses already using GreenAcre AI to handle their calls
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-[#2e7d32] hover:bg-gray-100 text-lg px-8 py-6">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-white/70">
              14-day free trial • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#2e7d32] to-[#1b5e20] flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">
                  GreenAcre AI
                </span>
              </div>
              <p className="text-sm">
                AI-powered voice assistant for lawn care businesses.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/signup" className="hover:text-white">Get Started</Link></li>
                <li><Link href="#" className="hover:text-white">Features</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} GreenAcre AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
