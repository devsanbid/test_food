"use client"

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/actions/authActions';
import { 
  Plus, 
  Edit3, 
  Eye, 
  Trash2,
  Search
} from 'lucide-react';

export default function DishesList() {
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState('Ascending');
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
    fetchDishes();
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
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchDishes = async () => {
    try {
      setLoading(true);
  
      const response = await fetch('/api/admin/dishes', {
        headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDishes(data.dishes || []);
      } else {
        console.error('Failed to fetch dishes');
      }
    } catch (error) {
      console.error('Error fetching dishes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dishId) => {
    if (!confirm('Are you sure you want to delete this dish?')) return;
    
    try {
      const response = await fetch(`/api/admin/dishes/${dishId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        setDishes(dishes.filter(dish => dish._id !== dishId));
      } else {
        alert('Failed to delete dish');
      }
    } catch (error) {
      console.error('Error deleting dish:', error);
      alert('Error deleting dish');
    }
  };

  const filteredDishes = dishes.filter(dish =>
    dish.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dish.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusStyles = {
      'active': 'bg-green-500/20 text-green-400 border border-green-500/30',
      'inactive': 'bg-red-500/20 text-red-400 border border-red-500/30',
      'pending': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading dishes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Dishes Management</h1>
          <p className="text-slate-400">Manage all dishes in the system</p>
        </div>

        {/* Search and Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 w-80"
            />
          </div>
          <button 
            onClick={() => router.push('/admin/dishes/add')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dish</span>
          </button>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700">
          {/* Table Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">All Dishes ({filteredDishes.length})</h2>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredDishes.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-slate-400 mb-4">
                  <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No dishes found</p>
                  {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
                </div>
                <button 
                  onClick={() => router.push('/admin/dishes/add')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                >
                  Add First Dish
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-300 font-medium">Dish</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Restaurant</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Category</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Price</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Status</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDishes.map((dish) => (
                    <tr key={dish._id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={dish.image || '/placeholder-dish.jpg'}
                            alt={dish.name}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.src = '/placeholder-dish.jpg';
                            }}
                          />
                          <div>
                            <div className="text-white font-medium">{dish.name}</div>
                            <div className="text-slate-400 text-sm">{dish.description?.substring(0, 50)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{dish.restaurant?.name || 'N/A'}</td>
                      <td className="p-4 text-slate-300">{dish.category}</td>
                      <td className="p-4 text-white font-medium">${dish.price}</td>
                      <td className="p-4">{getStatusBadge(dish.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => router.push(`/admin/dishes/edit/${dish._id}`)}
                            className="p-2 text-blue-400 hover:bg-slate-600 rounded-lg transition-colors"
                            title="Edit Dish"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => router.push(`/admin/dishes/details/${dish._id}`)}
                            className="p-2 text-green-400 hover:bg-slate-600 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(dish._id)}
                            className="p-2 text-red-400 hover:bg-slate-600 rounded-lg transition-colors"
                            title="Delete Dish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }
