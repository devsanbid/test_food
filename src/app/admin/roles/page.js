'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  Users,
  Shield,
  Crown,
  User,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit3,
  Save,
  X,
  ChevronDown,
  UserCheck,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RoleManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const roles = [
    { value: 'user', label: 'Regular User', icon: User, color: 'bg-gray-100 text-gray-800', description: 'Standard customer access' },
    { value: 'restaurant', label: 'Restaurant Owner', icon: Building, color: 'bg-blue-100 text-blue-800', description: 'Can manage restaurant and menu' },
    { value: 'admin', label: 'Administrator', icon: Shield, color: 'bg-purple-100 text-purple-800', description: 'Full system access' },
    { value: 'super_admin', label: 'Super Admin', icon: Crown, color: 'bg-red-100 text-red-800', description: 'Ultimate system control' }
  ];

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filterRole, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        action: 'users',
        page: currentPage.toString(),
        limit: '15'
      });
      
      if (filterRole) {
        params.append('role', filterRole);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      
      if (data.success) {
          setUsers(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, currentRole, targetRole) => {
    if (currentRole === targetRole) return;
    
    setPendingRoleChange({ userId, currentRole, targetRole });
    setShowConfirmModal(true);
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/admin/users/${pendingRoleChange.userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: pendingRoleChange.targetRole })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(users.map(user => 
          user._id === pendingRoleChange.userId ? { ...user, role: pendingRoleChange.targetRole } : user
        ));
        setShowConfirmModal(false);
        setPendingRoleChange(null);
        alert('User role updated successfully!');
      } else {
        alert('Failed to update user role: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleInfo = (roleValue) => {
    return roles.find(role => role.value === roleValue) || roles[0];
  };

  const getStatusBadge = (user) => {
    if (!user.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </span>
      );
    }
    if (!user.isVerified) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unverified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className=" rounded bg-gradient-to-r from-orange-600 to-red-600 shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                  Role Management
                </h1>
                <p className="text-orange-100 mt-1">Manage user roles and permissions across the platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <span className="text-white text-sm font-medium">{users.length} Total Users</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Role Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {roles.map((role) => {
            const count = users.filter(user => user.role === role.value).length;
            const IconComponent = role.icon;
            return (
              <div key={role.value} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg ${role.color.replace('text-', 'bg-').replace('100', '500/20')}`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{role.label}</h3>
                    </div>
                    <p className="text-gray-400 text-sm">{role.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{count}</div>
                    <div className="text-gray-400 text-sm">users</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 text-white pl-12 pr-4 py-3 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="bg-gray-700 text-white pl-10 pr-8 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 appearance-none"
                >
                  <option value="">All Roles</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Change Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                        <span>Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                      <p>No users found</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const roleInfo = getRoleInfo(user.role);
                    const IconComponent = roleInfo.icon;
                    return (
                      <tr key={user._id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-400">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white">
                            <div className="mb-1">{user.email}</div>
                            {user.phone && (
                              <div className="text-gray-400">{user.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-lg ${roleInfo.color.replace('text-', 'bg-').replace('100', '500/20')}`}>
                              <IconComponent className="w-4 h-4 text-white" />
                            </div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                              {roleInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(user)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user._id, user.role, e.target.value)}
                              className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 text-sm"
                            >
                              {roles.map(role => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-700 px-6 py-4 flex items-center justify-between border-t border-gray-600">
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Change Confirmation Modal */}
      {showConfirmModal && pendingRoleChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <UserCheck className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Confirm Role Change</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to change this user's role from{' '}
              <span className="font-semibold text-purple-400">
                {getRoleInfo(pendingRoleChange.currentRole).label}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-blue-400">
                {getRoleInfo(pendingRoleChange.targetRole).label}
              </span>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingRoleChange(null);
                }}
                disabled={isUpdating}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRoleChange}
                disabled={isUpdating}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Confirm Change</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}