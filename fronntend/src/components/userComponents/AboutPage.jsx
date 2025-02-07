import React from 'react';
import { ArrowRight, Star, Trophy, Truck, ChevronDown, Instagram, Facebook, Twitter } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with Background Pattern */}
      <div className="relative bg-gradient-to-r from-cyan-300 to-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-10" />
        <div className="container mx-auto px-4 py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in">Elite Football Boots</h1>
            <p className="text-xl mb-8 text-blue-100">Elevate Your Game with Professional-Grade Footwear</p>
            <div className="flex justify-center gap-4">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors">
                Shop Now
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-blue-600 transition-colors">
                Learn More
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Features Grid with Hover Effects */}
      <div className="container mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Trophy, title: "Premium Quality", desc: "Handcrafted with premium materials for ultimate performance" },
            { icon: Star, title: "Pro Athletes' Choice", desc: "Trusted by professional players worldwide" },
            { icon: Truck, title: "Global Shipping", desc: "Fast delivery to your doorstep, wherever you are" },
            { icon: ArrowRight, title: "Easy Returns", desc: "30-day no-questions-asked return policy" }
          ].map((feature, index) => (
            <div key={index} className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex justify-center mb-6">
                <feature.icon className="w-12 h-12 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">{feature.title}</h3>
              <p className="text-gray-600 text-center">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Story Section with Image */}
      <div className="bg-blue-50 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src="https://cdn.shopify.com/s/files/1/0110/7319/1998/files/01-PdO-SXLGGR-1920x1080.jpg?v=1587553384" alt="Football boots craftsmanship" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-6">Our Journey to Excellence</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  From humble beginnings in a small workshop to becoming a global leader in football footwear, 
                  our passion for excellence has never wavered.
                </p>
                <p>
                  Each pair of boots represents our commitment to innovation, quality, and the beautiful game. 
                  We collaborate with professional athletes to perfect every detail.
                </p>
                <p>
                  Our dedication to sustainability means we're not just creating great boots - we're helping 
                  to protect the planet for future generations of players.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="container mx-auto px-4 py-24">
        <h2 className="text-4xl font-bold text-center mb-16">Follow Our Journey</h2>
        <div className="flex justify-center gap-8">
          {[Instagram, Facebook, Twitter].map((Icon, index) => (
            <button key={index} className="p-4 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              <Icon className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>

      {/* Contact CTA with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Join the Elite?</h2>
          <p className="text-xl mb-8 text-blue-100">Get exclusive access to new releases and special offers</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="px-6 py-3 rounded-full text-gray-900 flex-grow"
            />
            <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;