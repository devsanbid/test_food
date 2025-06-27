'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Phone, Mail, Clock, Send, User, Bot, ChevronDown, ChevronUp, Search, FileText, Star, AlertCircle } from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

export default function SupportPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatMessage, setChatMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const router = useRouter();

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      message: 'Hello! I\'m here to help you with any questions about your orders, account, or our services. How can I assist you today?',
      timestamp: new Date(Date.now() - 5 * 60 * 1000)
    }
  ]);

  const [supportTickets, setSupportTickets] = useState([
    {
      id: 'TK001',
      subject: 'Order not delivered',
      status: 'resolved',
      priority: 'high',
      created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lastUpdate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      orderId: '34561'
    },
    {
      id: 'TK002',
      subject: 'Refund request for cancelled order',
      status: 'in_progress',
      priority: 'medium',
      created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      orderId: '34560'
    }
  ]);

  const faqs = [
    {
      id: 1,
      category: 'Orders',
      question: 'How can I track my order?',
      answer: 'You can track your order in real-time by going to "Order History" in your account. You\'ll see the current status and estimated delivery time. You\'ll also receive notifications about order updates.'
    },
    {
      id: 2,
      category: 'Orders',
      question: 'Can I cancel my order after placing it?',
      answer: 'Yes, you can cancel your order within 5 minutes of placing it, or before the restaurant starts preparing it. Go to "Order History" and click "Cancel Order" if the option is available.'
    },
    {
      id: 3,
      category: 'Payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards, digital wallets (PayPal, Apple Pay, Google Pay), and cash on delivery. All online payments are processed securely.'
    },
    {
      id: 4,
      category: 'Delivery',
      question: 'What are your delivery hours?',
      answer: 'Our delivery hours vary by restaurant, but most operate from 10:00 AM to 11:00 PM. You can see specific hours for each restaurant on their profile page.'
    },
    {
      id: 5,
      category: 'Account',
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page, enter your email address, and we\'ll send you a reset link. You can also change your password from your profile settings.'
    },
    {
      id: 6,
      category: 'Delivery',
      question: 'How much does delivery cost?',
      answer: 'Delivery fees vary based on distance and restaurant. The exact fee will be shown before you complete your order. Some restaurants offer free delivery on orders above a certain amount.'
    },
    {
      id: 7,
      category: 'Orders',
      question: 'What if my order is wrong or missing items?',
      answer: 'If there\'s an issue with your order, please contact us immediately through the app or call our support line. We\'ll work with the restaurant to resolve the issue and may offer a refund or replacement.'
    },
    {
      id: 8,
      category: 'Account',
      question: 'How do loyalty points work?',
      answer: 'You earn 1 point for every $1 spent. Collect 100 points to get $5 off your next order. Points are automatically added to your account after each successful order.'
    }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData || userData.role !== 'user') {
          router.push('/login');
          return;
        }
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const sendMessage = () => {
    if (!chatMessage.trim()) return;

    const newMessage = {
      id: chatMessages.length + 1,
      sender: 'user',
      message: chatMessage,
      timestamp: new Date()
    };

    setChatMessages([...chatMessages, newMessage]);
    setChatMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: chatMessages.length + 2,
        sender: 'bot',
        message: 'Thank you for your message. I\'ve received your inquiry and will help you resolve this issue. For urgent matters, please call our support line at (555) 123-4567.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'text-green-500 bg-green-500/10';
      case 'in_progress': return 'text-yellow-500 bg-yellow-500/10';
      case 'open': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Customer Support</h1>
          <p className="text-gray-400">We're here to help! Get assistance with your orders, account, or any other questions.</p>
        </div>

        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { key: 'chat', label: 'Live Chat', icon: MessageCircle },
            { key: 'faq', label: 'FAQ', icon: FileText },
            { key: 'tickets', label: 'My Tickets', icon: AlertCircle },
            { key: 'contact', label: 'Contact Info', icon: Phone }
          ].map(tab => {
            const IconComponent = tab.icon;
            return (
              <button 
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center px-4 py-2 rounded-md transition-colors text-sm ${
                  activeTab === tab.key ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'chat' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MessageCircle className="w-6 h-6 mr-3 text-orange-500" />
              <h2 className="text-xl font-semibold">Live Chat Support</h2>
              <div className="ml-auto flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-500">Online</span>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto mb-4">
              {chatMessages.map(message => (
                <div key={message.id} className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-700 text-gray-100'
                  }`}>
                    <div className="flex items-center mb-1">
                      {message.sender === 'bot' ? <Bot className="w-4 h-4 mr-2" /> : <User className="w-4 h-4 mr-2" />}
                      <span className="text-xs opacity-75">
                        {message.sender === 'bot' ? 'Support Bot' : 'You'}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <input 
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
              />
              <button 
                onClick={sendMessage}
                className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search FAQs..."
                  className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-orange-500 w-64"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              {filteredFaqs.map(faq => (
                <div key={faq.id} className="border border-gray-700 rounded-lg">
                  <button 
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700 transition-colors"
                  >
                    <div>
                      <span className="inline-block bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs mr-3">
                        {faq.category}
                      </span>
                      <span className="font-medium">{faq.question}</span>
                    </div>
                    {expandedFaq === faq.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-4 pb-4 text-gray-300">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {filteredFaqs.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No FAQs found matching your search.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Support Tickets</h2>
              <button className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors text-sm">
                Create New Ticket
              </button>
            </div>
            
            {supportTickets.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No support tickets found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {supportTickets.map(ticket => (
                  <div key={ticket.id} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="font-medium text-lg">#{ticket.id}</span>
                          <span className={`ml-3 px-2 py-1 rounded text-xs ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`ml-2 text-xs ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.toUpperCase()} PRIORITY
                          </span>
                        </div>
                        <h3 className="font-semibold mb-2">{ticket.subject}</h3>
                        {ticket.orderId && (
                          <p className="text-sm text-gray-400 mb-2">Related to Order #{ticket.orderId}</p>
                        )}
                        <div className="text-sm text-gray-400">
                          <p>Created: {ticket.created.toLocaleDateString()}</p>
                          <p>Last Update: {ticket.lastUpdate.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button className="text-orange-500 hover:text-orange-400 text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="flex items-start">
                  <Phone className="w-6 h-6 mr-4 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Phone Support</h3>
                    <p className="text-gray-300 mb-2">+1 (555) 123-4567</p>
                    <p className="text-sm text-gray-400">Available 24/7 for urgent issues</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="w-6 h-6 mr-4 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Email Support</h3>
                    <p className="text-gray-300 mb-2">support@foodsewa.com</p>
                    <p className="text-sm text-gray-400">Response within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="w-6 h-6 mr-4 text-orange-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Business Hours</h3>
                    <p className="text-gray-300 mb-1">Monday - Friday: 9:00 AM - 9:00 PM</p>
                    <p className="text-gray-300 mb-1">Saturday - Sunday: 10:00 AM - 8:00 PM</p>
                    <p className="text-sm text-gray-400">Emergency support available 24/7</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="font-semibold mb-4">Quick Contact Form</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500">
                      <option>Order Issue</option>
                      <option>Payment Problem</option>
                      <option>Account Help</option>
                      <option>Technical Support</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea 
                      rows={4}
                      placeholder="Describe your issue..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 py-2 rounded-lg transition-colors"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}