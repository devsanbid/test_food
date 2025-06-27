'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit3, Trash2, Eye, TrendingUp, TrendingDown, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import MenuItemModal from '@/components/MenuItemModal';

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      {message}
    </div>
  );
};

export default function ManagePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    availableItems: 0,
    totalRestaurants: 0,
    categories: 0
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch menu data from API
  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (selectedRestaurant !== 'all') {
        params.append('restaurantId', selectedRestaurant);
      }
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/menu?${params}`);
      const data = await response.json();

      if (data.success) {
        setMenuItems(data.menuItems || []);
        setRestaurants([
          { _id: 'all', name: 'All Restaurants' },
          ...(data.restaurants || [])
        ]);
        setCategories([
          'all',
          ...(Array.isArray(data.categories) ? data.categories : [])
        ]);
        setStats(data.stats || {
          totalItems: 0,
          availableItems: 0,
          totalRestaurants: 0,
          categories: 0
        });
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        showToast(data.message || 'Failed to fetch menu data', 'error');
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
      showToast('Failed to fetch menu data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchMenuData();
  }, [currentPage, selectedRestaurant, selectedCategory, searchTerm]);

  // Mock data for fallback
  const fallbackMenuItems = [
    { id: 1, name: 'Italian Pizza', price: 79, category: 'main', status: 'active', orders: 156, image: '/api/placeholder/80/80' },
    { id: 2, name: 'Veg Burger', price: 488, category: 'main', status: 'active', orders: 89, image: '/api/placeholder/80/80' },
    { id: 3, name: 'Spaghetti', price: 23, category: 'main', status: 'inactive', orders: 45, image: '/api/placeholder/80/80' },
    { id: 4, name: 'Red Velvet Cake', price: 350, category: 'dessert', status: 'active', orders: 78, image: '/api/placeholder/80/80' },
    { id: 5, name: 'Mix Salad', price: 645.2, category: 'appetizer', status: 'active', orders: 234, image: '/api/placeholder/80/80' },
    { id: 6, name: 'Espresso Coffee', price: 419.45, category: 'beverage', status: 'active', orders: 167, image: '/api/placeholder/80/80' },
  ];

  const fallbackCategories = [
    { id: 'all', name: 'All Items', count: fallbackMenuItems.length },
    { id: 'main', name: 'Main Course', count: fallbackMenuItems.filter(item => item.category === 'main').length },
    { id: 'appetizer', name: 'Appetizers', count: fallbackMenuItems.filter(item => item.category === 'appetizer').length },
    { id: 'dessert', name: 'Desserts', count: fallbackMenuItems.filter(item => item.category === 'dessert').length },
    { id: 'beverage', name: 'Beverages', count: fallbackMenuItems.filter(item => item.category === 'beverage').length },
  ];

  const fallbackStats = [
    { title: 'Total Menu Items', value: '156', change: '+12%', trend: 'up', icon: DollarSign },
    { title: 'Active Items', value: '142', change: '+8%', trend: 'up', icon: TrendingUp },
    { title: 'Orders Today', value: '89', change: '-3%', trend: 'down', icon: Calendar },
    { title: 'Revenue', value: '$2,847', change: '+15%', trend: 'up', icon: DollarSign },
  ];

  // CRUD Operations
  const handleAddItem = async (itemData) => {
    try {
      const response = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Menu item added successfully');
        setShowAddModal(false);
        fetchMenuData(); // Refresh data
      } else {
        showToast(data.message || 'Failed to add menu item', 'error');
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
      showToast('Failed to add menu item', 'error');
    }
  };

  const handleEditItem = async (itemData) => {
    try {
      const response = await fetch('/api/admin/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: selectedItem.restaurantId,
          itemId: selectedItem._id,
          action: 'update',
          ...itemData
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Menu item updated successfully');
        setShowEditModal(false);
        setSelectedItem(null);
        fetchMenuData(); // Refresh data
      } else {
        showToast(data.message || 'Failed to update menu item', 'error');
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      showToast('Failed to update menu item', 'error');
    }
  };

  const handleDeleteItem = async (item) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/menu?restaurantId=${item.restaurantId}&itemId=${item._id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Menu item deleted successfully');
        fetchMenuData(); // Refresh data
      } else {
        showToast(data.message || 'Failed to delete menu item', 'error');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      showToast('Failed to delete menu item', 'error');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const response = await fetch('/api/admin/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: item.restaurantId,
          itemId: item._id,
          action: 'toggle-availability'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast(`Item ${data.menuItem.isAvailable ? 'enabled' : 'disabled'} successfully`);
        fetchMenuData(); // Refresh data
      } else {
        showToast(data.message || 'Failed to update item availability', 'error');
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      showToast('Failed to update item availability', 'error');
    }
  };

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Menu Management</h1>
          <p className="text-gray-400 mt-1">Manage your restaurant menu items and categories</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Menu Items</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalItems}</p>
            </div>
            <div className="bg-orange-500/10 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Available Items</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.availableItems}</p>
            </div>
            <div className="bg-orange-500/10 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Restaurants</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalRestaurants}</p>
            </div>
            <div className="bg-orange-500/10 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Categories</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.categories}</p>
            </div>
            <div className="bg-orange-500/10 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedRestaurant}
                onChange={(e) => setSelectedRestaurant(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {restaurants.map(restaurant => (
                  <option key={restaurant._id} value={restaurant._id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <button className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-2 rounded-lg transition-colors">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div key={item._id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-orange-500 font-bold text-lg">{item.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{item.name}</h3>
                        <p className="text-gray-400 text-sm capitalize">{item.category}</p>
                        <p className="text-gray-500 text-xs">{item.restaurantName}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.isAvailable 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-white">${item.price}</p>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setSelectedItem(item);
                        setShowEditModal(true);
                      }}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleToggleAvailability(item)}
                      className="bg-gray-600 hover:bg-gray-500 text-gray-300 p-2 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && menuItems.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No items found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                Previous
              </button>
              
              <span className="text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <MenuItemModal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setSelectedItem(null);
        }}
        onSubmit={showEditModal ? handleEditItem : handleAddItem}
        item={selectedItem}
        restaurants={restaurants}
      />
    </div>
  );
}
