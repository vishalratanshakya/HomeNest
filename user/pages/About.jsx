import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Target, Lightbulb, Handshake, Rocket, Users, MapPin, Star, Shield } from 'lucide-react';
import UserNavbar from '../components/UserNavbar';

export default function About() {
  const [activeSection, setActiveSection] = useState('mission');

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />

      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 sm:p-12 mb-8 text-white">
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 flex items-center">
              <Home className="w-10 h-10 mr-3" />
              About Us
            </h1>
            <p className="text-xl sm:text-2xl text-primary-100 leading-relaxed">
              Welcome to HomeNest, your trusted platform for finding the perfect property with ease and confidence.
            </p>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-100 mb-8">
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            At HomeNest, we simplify the process of buying, selling, and renting properties by connecting users with the best listings in their desired locations. Whether you're searching for a modern apartment, a luxury villa, or a commercial space, we provide a seamless and user-friendly experience.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'mission', label: 'Our Mission', icon: Target },
            { id: 'offer', label: 'What We Offer', icon: Lightbulb },
            { id: 'why', label: 'Why Choose Us', icon: Handshake },
            { id: 'vision', label: 'Our Vision', icon: Rocket },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeSection === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Content Display Area */}
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 border border-gray-100 min-h-[300px] transition-all duration-500 relative overflow-hidden mb-12">
          {/* Decorative Background Element */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-50 rounded-full opacity-50" />
          
          <div className="relative z-10">
            {activeSection === 'mission' && (
              <div className="fade-in flex flex-col md:flex-row items-center gap-8">
                <div className="bg-primary-50 p-6 rounded-2xl">
                  <Target className="w-16 h-16 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
                  <p className="text-xl text-gray-700 leading-relaxed max-w-2xl">
                    Our mission is to make real estate accessible, transparent, and efficient for everyone. We aim to eliminate complexity and help users make informed property decisions through data-driven insights and premium service.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700">#Transparency</span>
                    <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700">#Efficiency</span>
                    <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700">#Accessibility</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'offer' && (
              <div className="fade-in">
                <div className="flex items-center mb-6">
                  <Lightbulb className="w-10 h-10 text-primary-600 mr-4" />
                  <h2 className="text-3xl font-bold text-gray-900">What We Offer</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: 'Property Listings', desc: 'A wide range of verified apartments, villas, and commercial spaces.' },
                    { title: 'Smart Search', desc: 'Advanced filters for location, price range, and specific property features.' },
                    { title: 'Market Insights', desc: 'Real-time data on property values and neighborhood trends.' },
                    { title: 'Expert Guidance', desc: 'Direct connection with top-rated agents and legal advisors.' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start p-4 bg-gray-50 rounded-xl">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'why' && (
              <div className="fade-in flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                    <Handshake className="w-10 h-10 text-primary-600 mr-3" />
                    Why Choose HomeNest?
                  </h2>
                  <div className="space-y-4">
                    <p className="text-lg text-gray-700">
                      We prioritize your experience above everything else. Our platform is built on trust, speed, and innovation.
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['24/7 Support', 'Verified Owners', 'Zero Hidden Fees', 'Instant Booking', 'Secure Payments', 'Top Locations'].map((check) => (
                        <li key={check} className="flex items-center text-gray-700">
                          <Shield className="w-5 h-5 text-green-500 mr-2" />
                          {check}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="w-full md:w-1/3 bg-gradient-to-br from-primary-600 to-primary-800 p-8 rounded-3xl text-white shadow-xl">
                  <div className="text-4xl font-bold mb-2">99%</div>
                  <p className="text-primary-100 mb-4">Customer Satisfaction Rate</p>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="w-[99%] h-full bg-white" />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'vision' && (
              <div className="fade-in text-center max-w-3xl mx-auto py-6">
                <Rocket className="w-16 h-16 text-primary-600 mx-auto mb-6 float" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
                <p className="text-2xl text-gray-600 italic leading-relaxed">
                  "To revolutionize the global real estate landscape by making property ownership a dream reachable for everyone, everywhere."
                </p>
                <div className="mt-8 flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-primary-600 rounded-full" />
                  <div className="w-2 h-2 bg-primary-400 rounded-full" />
                  <div className="w-2 h-2 bg-primary-200 rounded-full" />
                </div>
              </div>
            )}
            {activeSection === 'team' && (
              <div className="fade-in">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <Users className="w-10 h-10 text-primary-600 mr-3" />
                  Expert Team
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600">500+</div>
                    <div className="text-gray-600">Certified Agents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600">15+</div>
                    <div className="text-gray-600">Years Average Exp.</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600">24/7</div>
                    <div className="text-gray-600">Consultancy Support</div>
                  </div>
                </div>
                <p className="mt-8 text-gray-700 text-lg">
                  Our professionals are trained to provide personalized advice, ensuring you find a home that matches your lifestyle and investment goals.
                </p>
              </div>
            )}

            {activeSection === 'map' && (
              <div className="fade-in">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-10 h-10 text-primary-600 mr-3" />
                  Wide Coverage
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  From bustling city centers to quiet suburban retreats, we cover the most sought-after neighborhoods across the country.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio'].map(city => (
                    <span key={city} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-md text-sm">
                      {city}
                    </span>
                  ))}
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm">+50 more cities</span>
                </div>
              </div>
            )}

            {activeSection === 'star' && (
              <div className="fade-in">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
                  <Star className="w-10 h-10 text-primary-600 mr-3" />
                  Top Quality Assurance
                </h2>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-yellow-400 bg-yellow-50 rounded-r-lg">
                    <p className="font-medium text-yellow-800">Verified Listings Only</p>
                    <p className="text-sm text-yellow-700">We manually verify ownership and property condition before any listing goes live.</p>
                  </div>
                  <p className="text-gray-700 text-lg">
                    Our quality score helps you compare properties based on amenities, neighborhood safety, and building maintenance standards.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'shield' && (
              <div className="fade-in">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <Shield className="w-10 h-10 text-primary-600 mr-3" />
                  Secure & Trusted
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <ul className="space-y-3">
                    {['Encrypted Transactions', 'Fraud Protection', 'Identity Verification', 'Safe Data Storage'].map(item => (
                      <li key={item} className="flex items-center font-medium text-gray-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="bg-gray-900 p-6 rounded-2xl text-white text-center">
                    <Shield className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <div className="text-sm font-mono opacity-70">SSL SECURED CONNECTION</div>
                    <div className="text-xs mt-2 opacity-50">AES-256 BIT ENCRYPTION</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Features Grid */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Core Pillars</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: 'team', icon: Users, title: 'Expert Team', desc: 'Our team consists of 500+ licensed agents with deep local market knowledge.' },
            { id: 'map', icon: MapPin, title: 'Wide Coverage', desc: 'Find properties in over 120 cities across the country with detailed area guides.' },
            { id: 'star', icon: Star, title: 'Top Quality', desc: 'Every property on our platform undergoes a 50-point quality verification check.' },
            { id: 'shield', icon: Shield, title: 'Secure Platform', desc: 'Bank-grade security for your data and encrypted payment processing.' }
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => {
                  setActiveSection(feature.id);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center hover:shadow-md transition-all hover-lift group ${
                  activeSection === feature.id ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                }`}
              >
                <Icon className={`w-12 h-12 mx-auto mb-3 transition-colors ${
                  activeSection === feature.id ? 'text-primary-700' : 'text-primary-600'
                }`} />
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Technology Note */}
        <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 sm:p-8 border border-gray-200">
          <div className="flex items-center mb-4">
            <Lightbulb className="w-6 h-6 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">💡 Pro Tip</h3>
          </div>
            <p className="text-gray-700 leading-relaxed">
            This platform is developed using modern technologies to deliver a fast and responsive user experience. HomeNest is a modern real estate platform designed to help users find, buy, and rent properties with ease. We provide a seamless experience with smart search, verified listings, and a user-friendly interface.
          </p>
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-primary-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Dream Property?</h2>
          <p className="text-xl mb-6 text-primary-100">
            Join thousands of satisfied users who found their perfect home with HomeNest
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/user/search"
              className="px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-all"
            >
              Start Searching
            </Link>
            <Link
              to="/user/home"
              className="px-6 py-3 bg-primary-700 text-white rounded-lg font-semibold hover:bg-primary-800 transition-all border border-primary-500"
            >
              View Properties
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
