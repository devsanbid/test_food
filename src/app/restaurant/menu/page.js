'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChefHat, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  Eye, 
  EyeOff,
  Upload,
  Save,
  X,
  Star,
  DollarSign,
  Clock,
  Users,
  ArrowLeft
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

export default function MenuManagement() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    preparationTime: '',
    ingredients: '',
    allergens: '',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isAvailable: true,
    image: null
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData || userData.role !== 'restaurant') {
          router.push('/login');
          return;
        }
        setUser(userData);
        
        // Mock data for categories
        setCategories([
          { id: 'appetizers', name: 'Appetizers', count: 8 },
          { id: 'mains', name: 'Main Courses', count: 15 },
          { id: 'desserts', name: 'Desserts', count: 6 },
          { id: 'beverages', name: 'Beverages', count: 12 },
          { id: 'salads', name: 'Salads', count: 5 }
        ]);
        
        // Mock data for menu items
        setMenuItems([
          {
            id: 1,
            name: 'Chicken Biryani',
            description: 'Aromatic basmati rice cooked with tender chicken and traditional spices',
            price: 25.00,
            category: 'mains',
            preparationTime: 30,
            ingredients: 'Chicken, Basmati Rice, Onions, Spices, Yogurt',
            allergens: 'Dairy',
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: true,
            isAvailable: true,
            rating: 4.8,
            orders: 156,
            image: '🍛'
          },
          {
            id: 2,
            name: 'Margherita Pizza',
            description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
            price: 18.50,
            category: 'mains',
            preparationTime: 15,
            ingredients: 'Pizza Dough, Mozzarella, Tomato Sauce, Basil',
            allergens: 'Gluten, Dairy',
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: false,
            isAvailable: true,
            rating: 4.6,
            orders: 89,
            image: '🍕'
          },
          {
            id: 3,
            name: 'Caesar Salad',
            description: 'Fresh romaine lettuce with parmesan cheese and croutons',
            price: 12.00,
            category: 'salads',
            preparationTime: 10,
            ingredients: 'Romaine Lettuce, Parmesan, Croutons, Caesar Dressing',
            allergens: 'Dairy, Gluten',
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: false,
            isAvailable: false,
            rating: 4.3,
            orders: 45,
            image: '🥗'
          },
          {
            id: 4,
            name: 'Chocolate Brownie',
            description: 'Rich chocolate brownie served with vanilla ice cream',
            price: 8.50,
            category: 'desserts',
            preparationTime: 5,
            ingredients: 'Chocolate, Flour, Butter, Eggs, Sugar, Vanilla Ice Cream',
            allergens: 'Gluten, Dairy, Eggs',
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: false,
            isAvailable: true,
            rating: 4.9,
            orders: 78,
            image: '🍫'
          }
        ]);
        
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      // Update existing item
      setMenuItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...formData, id: editingItem.id }
          : item
      ));
    } else {
      // Add new item
      const newItem = {
        ...formData,
        id: Date.now(),
        rating: 0,
        orders: 0,
        image: '🍽️'
      };
      setMenuItems(prev => [...prev, newItem]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      preparationTime: '',
      ingredients: '',
      allergens: '',
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isAvailable: true,
      image: null
    });
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      preparationTime: item.preparationTime.toString(),
      ingredients: item.ingredients,
      allergens: item.allergens,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      isGlutenFree: item.isGlutenFree,
      isAvailable: item.isAvailable,
      image: null
    });
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      setMenuItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const toggleAvailability = (id) => {
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
    ));
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
                <ChefHat className="h-6 w-6 text-orange-500" />
                <span className="text-xl font-bold">Menu Management</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Item</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4">Search & Filter</h3>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCategory === 'all' 
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                      : 'bg-gray-700/50 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>All Items</span>
                    <span className="text-sm text-gray-400">{menuItems.length}</span>
                  </div>
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedCategory === category.id 
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                        : 'bg-gray-700/50 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <span className="text-sm text-gray-400">{category.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:w-3/4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-3xl">{item.image}</div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleAvailability(item.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.isAvailable 
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                        title={item.isAvailable ? 'Available' : 'Unavailable'}
                      >
                        {item.isAvailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-green-400">${item.price}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm">{item.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{item.preparationTime} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{item.orders} orders</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.isVegetarian && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Vegetarian</span>
                    )}
                    {item.isVegan && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Vegan</span>
                    )}
                    {item.isGlutenFree && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Gluten-Free</span>
                    )}
                  </div>
                  
                  <div className={`text-center py-2 rounded-lg text-sm font-medium ${
                    item.isAvailable 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </div>
                </div>
              ))}
            </div>
            
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-xl font-semibold mb-2">No menu items found</h3>
                <p className="text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Add Your First Item
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Item Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter item name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describe your dish"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Preparation Time (minutes) *</label>
                  <input
                    type="number"
                    name="preparationTime"
                    value={formData.preparationTime}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="15"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Ingredients</label>
                <input
                  type="text"
                  name="ingredients"
                  value={formData.ingredients}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="List main ingredients separated by commas"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Allergens</label>
                <input
                  type="text"
                  name="allergens"
                  value={formData.allergens}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="List allergens separated by commas"
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isVegetarian"
                    checked={formData.isVegetarian}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm">Vegetarian</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isVegan"
                    checked={formData.isVegan}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm">Vegan</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isGlutenFree"
                    checked={formData.isGlutenFree}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm">Gluten-Free</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm">Available</span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingItem ? 'Update Item' : 'Add Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}