"use client"
import Image from "next/image";

import Link from 'next/link';
import { 
  ChefHat, 
  Clock, 
  Star, 
  Truck, 
  Shield, 
  Heart,
  MapPin,
  Phone,
  ArrowRight,
  Play
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-500" />
              <span className="text-2xl font-bold text-white">FoodSewa</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-300 hover:text-orange-500 transition-colors">Home</a>
              <a href="#features" className="text-gray-300 hover:text-orange-500 transition-colors">Features</a>
              <a href="#restaurants" className="text-gray-300 hover:text-orange-500 transition-colors">Restaurants</a>
              <a href="#contact" className="text-gray-300 hover:text-orange-500 transition-colors">Contact</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-gray-900 to-gray-900"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Delicious Food
                  <span className="text-orange-500"> Delivered</span>
                  <br />to Your Door
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Experience the finest cuisine from top restaurants in your city. 
                  Fast delivery, fresh ingredients, and unforgettable flavors.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/signup" 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 flex items-center justify-center group"
                >
                  Order Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="border border-gray-600 hover:border-orange-500 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center group">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </button>
              </div>
              
              <div className="flex items-center space-x-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">50K+</div>
                  <div className="text-gray-400">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">200+</div>
                  <div className="text-gray-400">Restaurants</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">30min</div>
                  <div className="text-gray-400">Avg Delivery</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-orange-500/20 to-transparent rounded-3xl p-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform">
                      <div className="text-4xl mb-2">🍕</div>
                      <h3 className="font-semibold mb-1">Italian Pizza</h3>
                      <p className="text-gray-400 text-sm">Fresh mozzarella, basil</p>
                      <div className="flex items-center mt-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm ml-1">4.8</span>
                      </div>
                    </div>
                    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 transform -rotate-3 hover:rotate-0 transition-transform mt-8">
                      <div className="text-4xl mb-2">🍔</div>
                      <h3 className="font-semibold mb-1">Gourmet Burger</h3>
                      <p className="text-gray-400 text-sm">Angus beef, truffle sauce</p>
                      <div className="flex items-center mt-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm ml-1">4.9</span>
                      </div>
                    </div>
                    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform">
                      <div className="text-4xl mb-2">🍜</div>
                      <h3 className="font-semibold mb-1">Ramen Bowl</h3>
                      <p className="text-gray-400 text-sm">Rich tonkotsu broth</p>
                      <div className="flex items-center mt-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm ml-1">4.7</span>
                      </div>
                    </div>
                    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 transform -rotate-2 hover:rotate-0 transition-transform mt-4">
                      <div className="text-4xl mb-2">🥗</div>
                      <h3 className="font-semibold mb-1">Fresh Salad</h3>
                      <p className="text-gray-400 text-sm">Organic greens, quinoa</p>
                      <div className="flex items-center mt-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm ml-1">4.6</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent rounded-3xl blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose FoodSewa?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              We're committed to delivering not just food, but an exceptional experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 hover:bg-gray-700/80 transition-all group">
              <div className="bg-orange-500/20 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Fast Delivery</h3>
              <p className="text-gray-400 leading-relaxed">
                Get your favorite meals delivered in 30 minutes or less. Our efficient delivery network ensures your food arrives hot and fresh.
              </p>
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 hover:bg-gray-700/80 transition-all group">
              <div className="bg-orange-500/20 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Safe & Secure</h3>
              <p className="text-gray-400 leading-relaxed">
                Your safety is our priority. All our delivery partners follow strict hygiene protocols and contactless delivery options.
              </p>
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 hover:bg-gray-700/80 transition-all group">
              <div className="bg-orange-500/20 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Heart className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Quality Food</h3>
              <p className="text-gray-400 leading-relaxed">
                We partner with the best restaurants and ensure every meal meets our high standards for taste, freshness, and quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-orange-600 to-orange-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">Ready to Order?</h2>
          <p className="text-xl mb-8 text-orange-100">
            Join thousands of satisfied customers and experience the best food delivery service in the city.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup" 
              className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
            >
              Create Account
            </Link>
            <Link 
              href="/login" 
              className="border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold">FoodSewa</span>
              </div>
              <p className="text-gray-400">
                Delivering happiness, one meal at a time. Experience the best food delivery service in your city.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-orange-500 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Restaurants</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Become a Partner</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Safety</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>123 Food Street, City</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FoodSewa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
