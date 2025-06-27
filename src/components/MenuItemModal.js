'use client';
import React, { useState, useEffect } from 'react';
import { X, Upload, AlertCircle, Store, DollarSign, Clock, Flame, Camera, Utensils, Shield, Leaf, Heart, Plus } from 'lucide-react';

const MenuItemModal = ({ isOpen, onClose, onSubmit, item = null, restaurants = [] }) => {
  const [formData, setFormData] = useState({
    restaurantId: '',
    name: '',
    description: '',
    price: '',
    category: 'main',
    image: '',
    ingredients: [],
    allergens: [],
    preparationTime: 15,
    isVegetarian: false,
    isVegan: false,
    spiceLevel: 'mild'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      // Edit mode - populate form with existing data
      setFormData({
        restaurantId: item.restaurantId || '',
        name: item.name || '',
        description: item.description || '',
        price: item.price?.toString() || '',
        category: item.category || 'main',
        image: item.image || '',
        ingredients: item.ingredients || [],
        allergens: item.allergens || [],
        preparationTime: item.preparationTime || 15,
        isVegetarian: item.isVegetarian || false,
        isVegan: item.isVegan || false,
        spiceLevel: item.spiceLevel || 'mild'
      });
    } else {
      // Add mode - reset form
      setFormData({
        restaurantId: '',
        name: '',
        description: '',
        price: '',
        category: 'main',
        image: '',
        ingredients: [],
        allergens: [],
        preparationTime: 15,
        isVegetarian: false,
        isVegan: false,
        spiceLevel: 'mild'
      });
    }
    setErrors({});
  }, [item, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.restaurantId) {
      newErrors.restaurantId = 'Restaurant selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        price: parseFloat(formData.price),
        ingredients: formData.ingredients.filter(ing => ing.trim()),
        allergens: formData.allergens.filter(all => all.trim())
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArrayInput = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [field]: items }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-orange-600 to-red-600 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Utensils size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {item ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-gray-900">
          {/* Restaurant Selection */}
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Store size={18} className="text-orange-500" />
              Restaurant *
            </label>
            <select
              value={formData.restaurantId}
              onChange={(e) => setFormData(prev => ({ ...prev, restaurantId: e.target.value }))}
              className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 transition-all ${
                errors.restaurantId ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-600'
              }`}
              disabled={!!item}
            >
              <option value="" className="bg-gray-700">Select a restaurant</option>
              {restaurants.filter(r => r._id !== 'all').map(restaurant => (
                <option key={restaurant._id} value={restaurant._id} className="bg-gray-700">
                  {restaurant.name}
                </option>
              ))}
            </select>
            {errors.restaurantId && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-2 bg-red-900 bg-opacity-30 p-2 rounded-lg">
                <AlertCircle size={16} />
                {errors.restaurantId}
              </p>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Utensils size={18} className="text-orange-500" />
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 transition-all ${
                  errors.name ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter delicious item name"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-2 flex items-center gap-2 bg-red-900 bg-opacity-30 p-2 rounded-lg">
                  <AlertCircle size={16} />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <DollarSign size={18} className="text-green-500" />
                Price *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className={`w-full pl-8 pr-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 transition-all ${
                    errors.price ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-600'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="text-red-400 text-sm mt-2 flex items-center gap-2 bg-red-900 bg-opacity-30 p-2 rounded-lg">
                  <AlertCircle size={16} />
                  {errors.price}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Heart size={18} className="text-pink-500" />
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className={`w-full px-4 py-3 bg-gray-700 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 transition-all resize-none ${
                errors.description ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-600'
              }`}
              placeholder="Describe what makes this dish special and irresistible..."
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-2 bg-red-900 bg-opacity-30 p-2 rounded-lg">
                <AlertCircle size={16} />
                {errors.description}
              </p>
            )}
          </div>

          {/* Category and Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Utensils size={18} className="text-blue-500" />
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition-all"
              >
                <option value="appetizer" className="bg-gray-700">🥗 Appetizer</option>
                <option value="main" className="bg-gray-700">🍽️ Main Course</option>
                <option value="dessert" className="bg-gray-700">🍰 Dessert</option>
                <option value="beverage" className="bg-gray-700">🥤 Beverage</option>
                <option value="side" className="bg-gray-700">🍟 Side Dish</option>
              </select>
            </div>

            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Clock size={18} className="text-yellow-500" />
                Prep Time (min)
              </label>
              <input
                type="number"
                min="1"
                value={formData.preparationTime}
                onChange={(e) => setFormData(prev => ({ ...prev, preparationTime: parseInt(e.target.value) || 15 }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 transition-all"
                placeholder="15"
              />
            </div>

            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Flame size={18} className="text-red-500" />
                Spice Level
              </label>
              <select
                value={formData.spiceLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, spiceLevel: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition-all"
              >
                <option value="mild" className="bg-gray-700">🟢 Mild</option>
                <option value="medium" className="bg-gray-700">🟡 Medium</option>
                <option value="hot" className="bg-gray-700">🟠 Hot</option>
                <option value="extra-hot" className="bg-gray-700">🔴 Extra Hot</option>
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Camera size={18} className="text-purple-500" />
              Image URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 transition-all"
                placeholder="https://example.com/delicious-food-image.jpg"
              />
              {formData.image && (
                <div className="mt-3 relative">
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg border border-gray-600"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Ingredients and Allergens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Leaf size={18} className="text-green-500" />
                Ingredients (comma-separated)
              </label>
              <textarea
                value={formData.ingredients.join(', ')}
                onChange={(e) => handleArrayInput('ingredients', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 transition-all resize-none"
                placeholder="fresh tomatoes, mozzarella cheese, basil leaves, olive oil"
              />
            </div>

            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Shield size={18} className="text-red-500" />
                Allergens (comma-separated)
              </label>
              <textarea
                value={formData.allergens.join(', ')}
                onChange={(e) => handleArrayInput('allergens', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 transition-all resize-none"
                placeholder="dairy, gluten, nuts, shellfish"
              />
            </div>
          </div>

          {/* Dietary Options */}
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
              <Leaf size={18} className="text-green-500" />
              Dietary Options
            </label>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.isVegetarian}
                    onChange={(e) => setFormData(prev => ({ ...prev, isVegetarian: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all ${
                    formData.isVegetarian 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-500 group-hover:border-green-400'
                  }`}>
                    {formData.isVegetarian && (
                      <svg className="w-4 h-4 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="ml-3 text-sm text-gray-300 group-hover:text-white transition-colors">🌱 Vegetarian</span>
              </label>

              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.isVegan}
                    onChange={(e) => setFormData(prev => ({ ...prev, isVegan: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all ${
                    formData.isVegan 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-500 group-hover:border-green-400'
                  }`}>
                    {formData.isVegan && (
                      <svg className="w-4 h-4 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="ml-3 text-sm text-gray-300 group-hover:text-white transition-colors">🌿 Vegan</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 hover:text-white transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {item ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  {item ? (
                    <>
                      <Upload size={20} />
                      Update Item
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Add Item
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuItemModal;