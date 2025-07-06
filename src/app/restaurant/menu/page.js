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
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';
import { checkRestaurantProfileComplete, ProfileIncompleteMessage } from '@/lib/restaurantProfileUtils';

export default function MenuManagement() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    color: '#f97316'
  });
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
    image: null,
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const router = useRouter();

  // API functions
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/restaurant/categories', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        return data.categories || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/restaurant/menu', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        return data.menuItems || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  };

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
        
        // Fetch real data from API
        const [categoriesData, menuItemsData] = await Promise.all([
          fetchCategories(),
          fetchMenuItems()
        ]);
        
        setCategories(categoriesData);
        setMenuItems(menuItemsData);
        setError(null);
        
      } catch (error) {
        console.error('Auth check failed:', error);
        setError('Failed to load menu data. Please refresh the page.');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const filteredItems = menuItems.filter(item => {
    if (!item) return false;
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'price' || name === 'preparationTime' ? parseFloat(value) || 0 :
              value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('File too large. Maximum size is 5MB.');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('type', 'menu-item');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.url;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image: ' + error.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Upload image first if there's a new image
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          setSubmitting(false);
          return; // Upload failed, don't proceed
        }
      }
      
      const method = editingItem ? 'PUT' : 'POST';
      const url = '/api/restaurant/menu';
      
      const requestBody = {
        ...formData,
        imageUrl: imageUrl,
        ingredients: formData.ingredients ? formData.ingredients.split(',').map(i => i.trim()) : [],
        allergens: formData.allergens ? formData.allergens.split(',').map(a => a.trim()) : []
      };
      
      if (editingItem) {
        requestBody.itemId = editingItem._id;
        requestBody.action = 'update';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (editingItem) {
          // Update existing item in state
          setMenuItems(prev => prev.map(item => 
            item._id === editingItem._id ? result.menuItem : item
          ));
        } else {
          // Add new item to state
          setMenuItems(prev => [...prev, result.menuItem]);
        }
        
        resetForm();
      } else {
        const error = await response.json();
        console.error('Error saving item:', error.message);
        alert('Error saving item: ' + error.message);
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
      image: null,
      imageUrl: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      preparationTime: item.preparationTime,
      ingredients: Array.isArray(item.ingredients) ? item.ingredients.join(', ') : item.ingredients || '',
      allergens: Array.isArray(item.allergens) ? item.allergens.join(', ') : item.allergens || '',
      isVegetarian: item.isVegetarian || false,
      isVegan: item.isVegan || false,
      isGlutenFree: item.isGlutenFree || false,
      isAvailable: item.isAvailable !== false,
      image: null,
      imageUrl: item.imageUrl || ''
    });
    // Set preview for existing image
    if (item.imageUrl) {
      setImagePreview(item.imageUrl);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`/api/restaurant/menu?itemId=${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          setMenuItems(prev => prev.filter(item => item._id !== id));
        } else {
          const error = await response.json();
          console.error('Error deleting item:', error.message);
          alert('Error deleting item: ' + error.message);
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
      }
    }
  };

  const toggleAvailability = async (id) => {
    try {
      const item = menuItems.find(item => item._id === id);
      
      const response = await fetch('/api/restaurant/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          itemId: id,
          action: 'toggle-availability',
          isAvailable: !item.isAvailable
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setMenuItems(prev => prev.map(item => 
          item._id === id ? result.menuItem : item
        ));
      } else {
        const error = await response.json();
        console.error('Error toggling availability:', error.message);
        alert('Error updating availability: ' + error.message);
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Error updating availability. Please try again.');
    }
  };

  // Category management functions
  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = '/api/restaurant/categories';
      
      const body = editingCategory 
        ? { categoryId: editingCategory.id, ...categoryFormData }
        : categoryFormData;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (editingCategory) {
          setCategories(prev => prev.map(cat => 
            cat.id === editingCategory.id ? result.category : cat
          ));
        } else {
          setCategories(prev => [...prev, result.category]);
        }
        
        resetCategoryForm();
      } else {
        const error = await response.json();
        console.error('Error saving category:', error.message);
        alert('Error saving category: ' + error.message);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
      color: '#f97316'
    });
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#f97316'
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const response = await fetch(`/api/restaurant/categories?categoryId=${categoryId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        } else {
          const error = await response.json();
          console.error('Error deleting category:', error.message);
          alert('Error deleting category: ' + error.message);
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

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
        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={resetCategoryForm}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  required
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter category name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describe this category"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <input
                  type="color"
                  name="color"
                  value={categoryFormData.color}
                  onChange={handleCategoryInputChange}
                  className="w-full h-12 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2 transition-colors"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>
                    {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Add Category'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Categories</h3>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
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
                {categories.map(category => {
                  const categoryId = category._id || category.id;
                  const categoryCount = menuItems.filter(item => item.category === categoryId).length;
                  return (
                    <div key={categoryId} className="relative group">
                      <button
                        onClick={() => setSelectedCategory(categoryId)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedCategory === categoryId 
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                            : 'bg-gray-700/50 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{category.name}</span>
                          <span className="text-sm text-gray-400">{categoryCount}</span>
                        </div>
                      </button>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCategory(category);
                            }}
                            className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 transition-colors"
                            title="Edit category"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(categoryId);
                            }}
                            className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:w-3/4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <div key={item._id} className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{item.image || '🍽️'}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleAvailability(item._id)}
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
                        onClick={() => handleDelete(item._id)}
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
              
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium mb-2">Item Image</label>
                <div className="space-y-4">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg px-4 py-2 flex items-center space-x-2 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">
                        {imagePreview ? 'Change Image' : 'Upload Image'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {uploadingImage && (
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-400">
                    Supported formats: JPEG, PNG, WebP. Max size: 5MB
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter category name"
                  />
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
                  disabled={submitting}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2 transition-colors"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>
                    {submitting ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}