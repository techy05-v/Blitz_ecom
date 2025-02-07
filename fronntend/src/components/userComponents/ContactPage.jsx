import { useState } from "react"
import { Mail, Phone, MapPin, MessageSquare, Send, HelpCircle } from "lucide-react"

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Decorative Elements */}
      <div className="fixed top-20 left-20 w-64 h-64 bg-teal-300 rounded-full filter blur-3xl opacity-20"></div>
      <div className="fixed bottom-20 right-20 w-64 h-64 bg-orange-300 rounded-full filter blur-3xl opacity-20"></div>

      {/* Hero Section */}
      <div className="relative bg-white shadow-lg text-gray-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4 text-blue-900">Get in Touch</h1>
          <p className="text-xl text-teal-600">We're here to help you find your perfect football boots</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 -mt-8 relative">
        {/* Quick Contact Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Phone Card */}
          <div className="bg-white shadow-lg rounded-lg p-6 text-gray-800 hover:shadow-xl transition-all duration-300 border-t-4 border-blue-600">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-blue-900">Phone Support</h3>
              <p className="text-teal-600 font-medium">+1 (555) 123-4567</p>
              <p className="text-sm text-gray-500 mt-2">Mon-Fri, 9AM-6PM</p>
            </div>
          </div>

          {/* Email Card */}
          <div className="bg-white shadow-lg rounded-lg p-6 text-gray-800 hover:shadow-xl transition-all duration-300 border-t-4 border-teal-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-blue-900">Email Us</h3>
              <p className="text-teal-600 font-medium">support@footballboots.com</p>
              <p className="text-sm text-gray-500 mt-2">24/7 Email Support</p>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white shadow-lg rounded-lg p-6 text-gray-800 hover:shadow-xl transition-all duration-300 border-t-4 border-orange-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-blue-900">Visit Us</h3>
              <p className="text-teal-600 font-medium">123 Football Street</p>
              <p className="text-sm text-gray-500 mt-2">Sports City, 12345</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* FAQ Section */}
          <div className="bg-white shadow-lg rounded-lg text-gray-800 overflow-hidden">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2 text-blue-900">
                <HelpCircle className="w-8 h-8 text-teal-600" />
                FAQ
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-semibold text-lg mb-2 text-blue-800">How do I find my correct boot size?</h3>
                <p className="text-gray-600">
                  Check our comprehensive size guide with detailed measurements and recommendations for different foot
                  shapes.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-semibold text-lg mb-2 text-blue-800">What's your return policy?</h3>
                <p className="text-gray-600">
                  We offer a hassle-free 30-day return policy for unworn items in original packaging.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-blue-800">Do you offer international shipping?</h3>
                <p className="text-gray-600">Yes, we ship worldwide with tracking provided for all orders.</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white shadow-lg rounded-lg text-gray-800">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2 text-blue-900">
                <MessageSquare className="w-8 h-8 text-teal-600" />
                Send Message
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-800">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-800">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-800">Subject</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-800">Message</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200 h-32"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage

