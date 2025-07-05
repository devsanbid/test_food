"use client"

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Upload,
  X,
  Save
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

export default function EditDish() {
  const router = useRouter();
  const params = useParams();
  const dishId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    restaurant: '',
    image: '',
    ingredients: [],
    allergens: [],
    nutritionalInfo: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    },
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: 'mild',
    preparationTime: '',
    status: 'active'
  });

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch dish data and restaurants
  useEffect(() => {
    if (user && dishId) {
      fetchDishData();
      fetchRestaurants();
    }
  }, [user, dishId]);

  const checkAuth = async () => {
    try {
      const userData = await getCurrentUser();
      if (!userData || userData.role !== 'admin') {
        router.push('/auth/login');
        return;
      }
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/login');
    }
  };

  const fetchDishData = async () => {
    try {
  
      const response = await fetch(`/api/admin/dishes/${dishId}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const dish = await response.json();
        setFormData({
          name: dish.name || '',
          description: dish.description || '',
          category: dish.category || '',
          price: dish.price?.toString() || '',
          restaurant: dish.restaurant?._id || dish.restaurant || '',
          image: dish.image || '',
          ingredients: dish.ingredients || [],
          allergens: dish.allergens || [],
          nutritionalInfo: dish.nutritionalInfo || {
            calories: '',
            protein: '',
            carbs: '',
            fat: ''
          },
          isVegetarian: dish.isVegetarian || false,
          isVegan: dish.isVegan || false,
          isGlutenFree: dish.isGlutenFree || false,
          spiceLevel: dish.spiceLevel || 'mild',
          preparationTime: dish.preparationTime?.toString() || '',
          status: dish.status || 'active'
        });
        if (dish.image) {
          setImagePreview(dish.image);
        }
      } else {
        console.error('Failed to fetch dish data');
        router.push('/admin/dishes/list');
      }
    } catch (error) {
      console.error('Error fetching dish:', error);
      router.push('/admin/dishes/list');
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const response = await fetch('/api/admin/restaurants', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRestaurants(data);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleArrayInput = (field, value) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [field]: arrayValue }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = formData.image;
      
      // Upload new image if selected
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);
        
        const imageResponse = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData
        });
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.url;
        }
      }

      // Update dish
      const response = await fetch(`/api/admin/dishes/${dishId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          image: imageUrl,
          price: parseFloat(formData.price),
          preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null
        })
      });

      if (response.ok) {
        router.push('/admin/dishes/list');
      } else {
        const errorData = await response.json();
        console.error('Failed to update dish:', errorData.message);
      }
    } catch (error) {
      console.error('Error updating dish:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading dish data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Page Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/dishes/list')}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dishes</span>
            </button>
            <div className="h-6 w-px bg-slate-600"></div>
            <div>
              <h1 className="text-xl font-semibold">Edit Dish</h1>
              <p className="text-sm text-slate-400">Update dish information and details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6">
        <div className="space-y-8">
          {/* Image Upload Section */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Dish Image</h3>
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Dish preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center">
                    <Upload className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </label>
                <p className="text-sm text-slate-400 mt-2">
                  Upload a high-quality image of the dish. Recommended size: 800x600px
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Dish Name *</label>
                <input
                  type="text"
                  placeholder="Enter dish name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Restaurant *</label>
                <select
                  value={formData.restaurant}
                  onChange={(e) => handleInputChange('restaurant', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Select Restaurant</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant._id} value={restaurant._id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="appetizer">Appetizer</option>
                  <option value="main-course">Main Course</option>
                  <option value="dessert">Dessert</option>
                  <option value="beverage">Beverage</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preparation Time (minutes)</label>
                <input
                  type="number"
                  placeholder="15"
                  value={formData.preparationTime}
                  onChange={(e) => handleInputChange('preparationTime', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Spice Level</label>
                <select
                  value={formData.spiceLevel}
                  onChange={(e) => handleInputChange('spiceLevel', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="mild">Mild</option>
                  <option value="medium">Medium</option>
                  <option value="hot">Hot</option>
                  <option value="very-hot">Very Hot</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                placeholder="Enter dish description..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Ingredients (comma separated)</label>
                <input
                  type="text"
                  placeholder="tomato, cheese, basil..."
                  value={formData.ingredients.join(', ')}
                  onChange={(e) => handleArrayInput('ingredients', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Allergens (comma separated)</label>
                <input
                  type="text"
                  placeholder="nuts, dairy, gluten..."
                  value={formData.allergens.join(', ')}
                  onChange={(e) => handleArrayInput('allergens', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Dietary Options */}
            <div className="mt-6">
              <h4 className="text-md font-medium mb-3">Dietary Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.isVegetarian}
                    onChange={(e) => handleInputChange('isVegetarian', e.target.checked)}
                    className="w-4 h-4 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500"
                  />
                  <span>Vegetarian</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.isVegan}
                    onChange={(e) => handleInputChange('isVegan', e.target.checked)}
                    className="w-4 h-4 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500"
                  />
                  <span>Vegan</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.isGlutenFree}
                    onChange={(e) => handleInputChange('isGlutenFree', e.target.checked)}
                    className="w-4 h-4 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500"
                  />
                  <span>Gluten Free</span>
                </label>
              </div>
            </div>

            {/* Nutritional Information */}
            <div className="mt-6">
              <h4 className="text-md font-medium mb-3">Nutritional Information (per serving)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Calories</label>
                  <input
                    type="number"
                    placeholder="250"
                    value={formData.nutritionalInfo.calories}
                    onChange={(e) => handleInputChange('nutritionalInfo.calories', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Protein (g)</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={formData.nutritionalInfo.protein}
                    onChange={(e) => handleInputChange('nutritionalInfo.protein', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={formData.nutritionalInfo.carbs}
                    onChange={(e) => handleInputChange('nutritionalInfo.carbs', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Fat (g)</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={formData.nutritionalInfo.fat}
                    onChange={(e) => handleInputChange('nutritionalInfo.fat', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-700 mt-8">
          <button
            type="button"
            onClick={() => router.push('/admin/dishes/list')}
            className="px-6 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Update Dish</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>

  );
};

