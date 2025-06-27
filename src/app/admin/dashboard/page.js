"use client"

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/actions/authActions';
import { 
  Users, 
  Trash2,
  Search,
  UserX,
  UserCheck,
  Heart
} from 'lucide-react';

export default function YumDashboard() {

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchStats();
    fetchUsers();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        router.push('/login');
        return;
      }
      setUser(currentUser);
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin?action=stats', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        console.error('Failed to fetch stats:', data.message);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin?action=users', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setError(data.message || 'Failed to fetch users');
        setUsers([]);
      }
    } catch (error) {
      setError('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'toggle-status',
          userId,
          isActive: !currentStatus
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to update user status');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`/api/admin?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to delete user');
    }
  };

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const displayStats = stats ? [
    { value: stats.users?.total?.toString() || '0', label: 'Total Users', change: `${stats.users?.active || 0} Active`, positive: true },
    { value: stats.users?.active?.toString() || '0', label: 'Active Users', change: `${stats.users?.customers || 0} Customers`, positive: true },
    { value: stats.restaurants?.total?.toString() || '0', label: 'Total Restaurants', change: `${stats.restaurants?.active || 0} Active`, positive: true },
    { value: stats.orders?.total?.toString() || '0', label: 'Total Orders', change: `${stats.orders?.pending || 0} Pending`, positive: true },
    { value: `$${(stats.orders?.totalRevenue || 0).toLocaleString()}`, label: 'Total Revenue', change: `${stats.orders?.completed || 0} Completed`, positive: true },
    { value: stats.reviews?.total?.toString() || '0', label: 'Total Reviews', change: `${stats.reviews?.avgRating || 0}/5 Avg Rating`, positive: true }
  ] : [];



  const StatCard = ({ stat }) => (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
      <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
      <div className={`text-sm ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
        {stat.change}
      </div>
    </div>
  );

  return (
    <div className="text-white">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayStats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>


        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* User Management Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">User Management</h2>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="restaurant">Restaurants</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 text-sm text-gray-400">
              <div>User</div>
              <div>Role</div>
              <div>Status</div>
              <div>Joined</div>
              <div className="text-right">Actions</div>
            </div>
            
            {filteredUsers.map((user) => (
              <div key={user._id} className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 hover:bg-gray-750">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                    <span className="text-orange-600 font-medium text-sm">
                      {user.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{user.username}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </div>
                </div>
                <div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-purple-900 text-purple-200' :
                    user.role === 'restaurant' ? 'bg-blue-900 text-blue-200' :
                    'bg-gray-700 text-gray-200'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
                <div className="text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => toggleUserStatus(user._id, user.isActive)}
                      className={`p-1 rounded hover:bg-gray-700 ${
                        user.isActive ? 'text-red-400' : 'text-green-400'
                      }`}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => deleteUser(user._id)}
                      className="p-1 rounded hover:bg-gray-700 text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-400 bg-gray-800 rounded-lg">
              No users found matching your criteria.
            </div>
          )}
        </div>



        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <div className="flex items-center justify-center">
            Designed, crafted and coded with <Heart className="w-4 h-4 text-red-500 mx-1" /> by Coderthemes.com
          </div>
        </div>
      </div>
  );
}