'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  Eye, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Filter,
  Search,
  BarChart3,
  PieChart,
  Wallet,
  Building2
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';
import { checkRestaurantProfileComplete, ProfileIncompleteMessage } from '@/lib/restaurantProfileUtils';

export default function RestaurantPayouts() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    currentBalance: 0,
    lastPayout: null,
    nextPayout: null,
    commissionRate: 0
  });
  
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [earningsChart, setEarningsChart] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  const router = useRouter();

  const fetchPayoutData = async () => {
    try {
      const response = await fetch(`/api/restaurant/payouts?range=${dateRange}&status=${statusFilter}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEarnings({
            totalEarnings: data.data.totalEarnings,
            pendingPayouts: data.data.pendingPayouts,
            completedPayouts: data.data.completedPayouts,
            currentBalance: data.data.currentBalance,
            lastPayout: data.data.payoutHistory.length > 0 ? new Date(data.data.payoutHistory[0].date) : null,
            nextPayout: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            commissionRate: data.data.commissionRate * 100
          });
          
          setPayoutHistory(data.data.payoutHistory.map(payout => ({
            ...payout,
            date: new Date(payout.date),
            amount: payout.netAmount + (payout.netAmount * data.data.commissionRate),
            commission: payout.netAmount * data.data.commissionRate,
            orders: payout.orderCount || 0,
            method: payout.method || 'Bank Transfer'
          })));
        }
      } else if (response.status === 401) {
        console.error('Authentication failed');
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch payout data:', error);
    }
  };

  const fetchEarningsChart = async () => {
    try {
      const response = await fetch(`/api/restaurant/payouts/chart?range=${dateRange}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setEarningsChart(data.chartData || []);
      } else if (response.status === 401) {
        console.error('Authentication failed for chart data');
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch earnings chart:', error);
      setEarningsChart([]);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/restaurant/payouts/payment-methods', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      } else if (response.status === 401) {
        console.error('Authentication failed for payment methods');
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      setPaymentMethods([]);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'payouts', name: 'Payout History', icon: CreditCard },
    { id: 'analytics', name: 'Analytics', icon: PieChart },
    { id: 'settings', name: 'Payment Settings', icon: Wallet }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData || userData.role !== 'restaurant') {
          router.push('/login');
          return;
        }
        setUser(userData);
        
        // Check profile completeness
        const profileCheck = await checkRestaurantProfileComplete();
        if (!profileCheck.isComplete) {
          setProfileIncomplete(true);
          setMissingFields(profileCheck.missingFields);
          setLoading(false);
          return;
        }
        
        await fetchPayoutData();
        await fetchEarningsChart();
        await fetchPaymentMethods();
        
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user && !profileIncomplete) {
      fetchPayoutData();
    }
  }, [dateRange, statusFilter, user, profileIncomplete]);

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };

  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
  };

  const handleExportPayouts = async () => {
    try {
      const response = await fetch(`/api/restaurant/payouts?range=${dateRange}&status=${statusFilter}&export=true`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payouts-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (response.status === 401) {
        console.error('Authentication failed for export');
        router.push('/login');
      }
    } catch (error) {
       console.error('Failed to export payouts:', error);
     }
   };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'processing': return 'text-yellow-400 bg-yellow-400/20';
      case 'pending': return 'text-blue-400 bg-blue-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredPayouts = payoutHistory.filter(payout => {
    const matchesSearch = payout.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewPayout = (payout) => {
    setSelectedPayout(payout);
    setShowPayoutModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show profile incomplete message if profile is not complete
  if (profileIncomplete) {
    return <ProfileIncompleteMessage missingFields={missingFields} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/restaurant/dashboard" className="flex items-center space-x-2 text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-green-500" />
                <span className="text-xl font-bold">Payouts & Earnings</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              
              <button 
                onClick={handleExportPayouts}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-xl mb-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Earnings Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-400" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-1">{formatCurrency(earnings.totalEarnings)}</h3>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <p className="text-green-400 text-xs mt-2">+12.5% from last month</p>
              </div>
              
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-400" />
                  </div>
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-1">{formatCurrency(earnings.pendingPayouts)}</h3>
                <p className="text-gray-400 text-sm">Pending Payouts</p>
                <p className="text-blue-400 text-xs mt-2">Next payout: {formatDate(earnings.nextPayout)}</p>
              </div>
              
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-orange-400" />
                  </div>
                  <CheckCircle className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold mb-1">{formatCurrency(earnings.completedPayouts)}</h3>
                <p className="text-gray-400 text-sm">Completed Payouts</p>
                <p className="text-orange-400 text-xs mt-2">Last: {formatDate(earnings.lastPayout)}</p>
              </div>
              
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-purple-400" />
                  </div>
                  <Wallet className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-1">{formatCurrency(earnings.currentBalance)}</h3>
                <p className="text-gray-400 text-sm">Current Balance</p>
                <p className="text-purple-400 text-xs mt-2">Available for payout</p>
              </div>
            </div>

            {/* Earnings Chart */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Earnings Trend</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-400">Earnings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-400">Payouts</span>
                  </div>
                </div>
              </div>
              
              <div className="h-64 flex items-end justify-between space-x-2">
                {earningsChart.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                    <div className="w-full flex flex-col space-y-1">
                      <div 
                        className="bg-orange-500 rounded-t"
                        style={{ height: `${(data.earnings / 5000) * 200}px` }}
                      ></div>
                      <div 
                        className="bg-green-500 rounded-b"
                        style={{ height: `${(data.payouts / 5000) * 200}px` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400">{data.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payouts */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Recent Payouts</h3>
                <button 
                  onClick={() => setActiveTab('payouts')}
                  className="text-orange-400 hover:text-orange-300 text-sm"
                >
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {payoutHistory.slice(0, 3).map(payout => (
                  <div key={payout.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(payout.status)}`}>
                        {getStatusIcon(payout.status)}
                      </div>
                      <div>
                        <h4 className="font-medium">{payout.id}</h4>
                        <p className="text-sm text-gray-400">{formatDate(payout.date)} • {payout.method}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(payout.netAmount)}</p>
                      <p className="text-sm text-gray-400 capitalize">{payout.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Payout History Tab */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by ID or reference..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                <button className="flex items-center space-x-2 text-orange-400 hover:text-orange-300">
                  <Filter className="h-4 w-4" />
                  <span>More Filters</span>
                </button>
              </div>
            </div>

            {/* Payout List */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-300">Payout ID</th>
                      <th className="text-left p-4 font-medium text-gray-300">Date</th>
                      <th className="text-left p-4 font-medium text-gray-300">Amount</th>
                      <th className="text-left p-4 font-medium text-gray-300">Commission</th>
                      <th className="text-left p-4 font-medium text-gray-300">Net Amount</th>
                      <th className="text-left p-4 font-medium text-gray-300">Status</th>
                      <th className="text-left p-4 font-medium text-gray-300">Method</th>
                      <th className="text-left p-4 font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayouts.map(payout => (
                      <tr key={payout.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{payout.id}</p>
                            <p className="text-sm text-gray-400">{payout.orders} orders</p>
                          </div>
                        </td>
                        <td className="p-4 text-gray-300">{formatDate(payout.date)}</td>
                        <td className="p-4 font-medium">{formatCurrency(payout.amount)}</td>
                        <td className="p-4 text-red-400">-{formatCurrency(payout.commission)}</td>
                        <td className="p-4 font-semibold text-green-400">{formatCurrency(payout.netAmount)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                            {getStatusIcon(payout.status)}
                            <span className="capitalize">{payout.status}</span>
                          </span>
                        </td>
                        <td className="p-4 text-gray-300">{payout.method}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleViewPayout(payout)}
                            className="text-orange-400 hover:text-orange-300 p-1"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Commission Breakdown */}
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold mb-6">Commission Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Platform Commission Rate</span>
                    <span className="font-semibold">{earnings.commissionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Commission Paid</span>
                    <span className="font-semibold text-red-400">{formatCurrency(earnings.totalEarnings * (earnings.commissionRate / 100))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Net Earnings</span>
                    <span className="font-semibold text-green-400">{formatCurrency(earnings.totalEarnings * (1 - earnings.commissionRate / 100))}</span>
                  </div>
                </div>
              </div>

              {/* Payout Frequency */}
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold mb-6">Payout Schedule</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Payout Frequency</span>
                    <span className="font-semibold">Bi-weekly</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Next Payout Date</span>
                    <span className="font-semibold text-blue-400">{formatDate(earnings.nextPayout)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Minimum Payout</span>
                    <span className="font-semibold">{formatCurrency(50)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Performance */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-6">Monthly Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">{formatCurrency(3900)}</div>
                  <p className="text-gray-400">This Month's Earnings</p>
                  <p className="text-green-400 text-sm mt-1">+8.5% from last month</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">145</div>
                  <p className="text-gray-400">Orders Completed</p>
                  <p className="text-blue-400 text-sm mt-1">+12 from last month</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">{formatCurrency(26.90)}</div>
                  <p className="text-gray-400">Average Order Value</p>
                  <p className="text-orange-400 text-sm mt-1">+2.1% from last month</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Payment Methods */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Payment Methods</h3>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors">
                  Add Method
                </button>
              </div>
              
              <div className="space-y-4">
                {paymentMethods.map(method => (
                  <div key={method.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        {method.type === 'bank' ? <Building2 className="h-6 w-6 text-blue-400" /> : <CreditCard className="h-6 w-6 text-blue-400" />}
                      </div>
                      <div>
                        <h4 className="font-medium">{method.name}</h4>
                        <p className="text-sm text-gray-400">{method.details}</p>
                        {method.isDefault && (
                          <span className="inline-block bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded mt-1">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        method.status === 'verified' ? 'text-green-400 bg-green-400/20' : 'text-yellow-400 bg-yellow-400/20'
                      }`}>
                        <CheckCircle className="h-3 w-3" />
                        <span className="capitalize">{method.status}</span>
                      </span>
                      <button className="text-gray-400 hover:text-white p-1">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payout Settings */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-6">Payout Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Payout Frequency</label>
                  <select className="w-full md:w-auto bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly" selected>Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Payout Amount</label>
                  <input
                    type="number"
                    value="50.00"
                    className="w-full md:w-auto bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="10"
                    step="0.01"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Auto Payout</h4>
                    <p className="text-sm text-gray-400">Automatically transfer earnings when minimum is reached</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payout Detail Modal */}
      {showPayoutModal && selectedPayout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Payout Details</h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Payout ID:</span>
                <span className="font-medium">{selectedPayout.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date:</span>
                <span>{formatDate(selectedPayout.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Orders:</span>
                <span>{selectedPayout.orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gross Amount:</span>
                <span>{formatCurrency(selectedPayout.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Commission:</span>
                <span className="text-red-400">-{formatCurrency(selectedPayout.commission)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-4">
                <span className="text-gray-400">Net Amount:</span>
                <span className="font-semibold text-green-400">{formatCurrency(selectedPayout.netAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Method:</span>
                <span>{selectedPayout.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reference:</span>
                <span className="font-mono text-sm">{selectedPayout.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayout.status)}`}>
                  {getStatusIcon(selectedPayout.status)}
                  <span className="capitalize">{selectedPayout.status}</span>
                </span>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition-colors">
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}