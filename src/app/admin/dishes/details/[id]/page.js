"use client"

'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Globe, 
  Maximize2, 
  Bell, 
  Star,
  Eye,
  Users,
  Wallet,
  FileText,
  Shield,
  AlertCircle,
  Zap,
  User,
  LogOut,
  Utensils,
  UtensilsCrossed,
  ArrowLeft,
  Edit,
  Trash2
} from 'lucide-react';
import { getCurrentUser } from '@/actions/authActions';

export default function DishDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dishId = params.id;
  
  const [dish, setDish] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initializePage = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        
        if (dishId) {
          await fetchDishDetails();
        }
      } catch (error) {
        console.error('Error initializing page:', error);
        router.push('/login');
      }
    };

    initializePage();
  }, [dishId, router]);

  const fetchDishDetails = async () => {
    try {
      setLoading(true);
  
      
      const response = await fetch(`/api/admin/dishes/${dishId}`, {
        headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDish(data.dish);
        setRestaurant(data.restaurant);
      } else {
        setError(data.message || 'Failed to fetch dish details');
      }
    } catch (err) {
      setError('Error fetching dish details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/admin/dishes/edit?id=${dishId}`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dish?')) return;
    
    try {
      const response = await fetch(`/api/admin/dishes/${dishId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.push('/admin/dishes/list');
      } else {
        alert(data.message || 'Failed to delete dish');
      }
    } catch (err) {
      console.error('Error deleting dish:', err);
      alert('Error deleting dish');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white text-xl">Loading dish details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white text-xl">Dish not found</div>
      </div>
    );
  }

  const dishImages = dish.image ? [dish.image] : [
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop'
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-white">
     

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
      

        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dishes/list')}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-white">{dish.name}</h1>
                <div className="flex items-center text-sm text-slate-400 mt-1">
                  <span>Dishes</span>
                  <span className="mx-2">›</span>
                  <span className="text-orange-400">{dish.name}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <img
                  src={dishImages[selectedImage]}
                  alt={dish.name}
                  className="w-full h-80 object-cover rounded-lg"
                />
              </div>

              {/* Thumbnail Images */}
              <div className="grid grid-cols-3 gap-4">
                {dishImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`bg-slate-800 rounded-lg p-2 border-2 ${
                      selectedImage === index ? 'border-orange-500' : 'border-slate-700'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${dish.name} ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side - Details */}
            <div className="space-y-6">
              {/* Title and Price */}
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{dish.name}</h1>
                <div className="flex items-center space-x-4 mb-2">
                  <span className="text-3xl font-bold text-white">${dish.price}</span>
                  {dish.originalPrice && (
                    <span className="text-xl text-slate-400 line-through">${dish.originalPrice}</span>
                  )}
                </div>
                <p className="text-slate-400">by <span className="text-white">{restaurant?.name || 'Restaurant'}</span></p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    dish.isAvailable 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {dish.isAvailable ? 'Available' : 'Not Available'}
                  </span>
                  <span className="text-slate-400">Category: {dish.category}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-300 leading-relaxed">
                {dish.description || 'No description available for this dish.'}
              </p>

              {/* Tags */}
              <div className="flex items-center flex-wrap gap-2">
                {dish.isVegetarian && (
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/30">
                    Vegetarian
                  </span>
                )}
                {dish.isVegan && (
                  <span className="bg-green-600/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-600/30">
                    Vegan
                  </span>
                )}
                {dish.spiceLevel && (
                  <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-500/30">
                    Spice Level: {dish.spiceLevel}
                  </span>
                )}
                <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm border border-slate-600">
                  {dish.category}
                </span>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dish.preparationTime && (
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <h4 className="text-white font-medium mb-2">Preparation Time</h4>
                    <p className="text-slate-300">{dish.preparationTime} minutes</p>
                  </div>
                )}
                
                {dish.allergens && dish.allergens.length > 0 && (
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <h4 className="text-white font-medium mb-2">Allergens</h4>
                    <div className="flex flex-wrap gap-2">
                      {dish.allergens.map((allergen, index) => (
                        <span key={index} className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-sm border border-red-500/30">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Ingredients */}
              {dish.ingredients && dish.ingredients.length > 0 && (
                <div>
                  <h3 className="text-white font-medium mb-3">Ingredients</h3>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div className="flex flex-wrap gap-2">
                      {dish.ingredients.map((ingredient, index) => (
                        <span key={index} className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm border border-slate-600">
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Nutrition Facts */}
              {dish.nutritionalInfo && (
                <div>
                  <h3 className="text-white font-medium mb-4">
                    Nutrition Facts <span className="text-slate-400 font-normal">(per serving)</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {dish.nutritionalInfo.calories && (
                      <div className="text-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <div className="text-2xl font-bold text-white">{dish.nutritionalInfo.calories}</div>
                        <div className="text-slate-400 text-sm">Calories</div>
                      </div>
                    )}
                    {dish.nutritionalInfo.fat && (
                      <div className="text-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <div className="text-2xl font-bold text-white">{dish.nutritionalInfo.fat}g</div>
                        <div className="text-slate-400 text-sm">Fat</div>
                      </div>
                    )}
                    {dish.nutritionalInfo.carbs && (
                      <div className="text-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <div className="text-2xl font-bold text-white">{dish.nutritionalInfo.carbs}g</div>
                        <div className="text-slate-400 text-sm">Carbs</div>
                      </div>
                    )}
                    {dish.nutritionalInfo.protein && (
                      <div className="text-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <div className="text-2xl font-bold text-white">{dish.nutritionalInfo.protein}g</div>
                        <div className="text-slate-400 text-sm">Protein</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 border-t border-slate-700 p-6">
          <div className="text-center text-slate-400 text-sm">
            Designed, crafted and coded with ❤️ by Coderthemes.com
          </div>
        </div>
      </div>
    </div>
  );
}