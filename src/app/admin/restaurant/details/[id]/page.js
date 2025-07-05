'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Star,
  Plus,
  Check,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  ArrowLeft,
  Edit,
  Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar, ComposedChart } from 'recharts';
import { getCurrentUser } from '@/actions/authActions';

const RestaurantDetails = () => {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id;
  
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('Last Day');
  const [sortBy, setSortBy] = useState('Popular - Best Seller');
  const [uploadDate, setUploadDate] = useState('Upload Date - Newest');
  const [rating, setRating] = useState('Rating - Average');
  const [orderStats, setOrderStats] = useState([]);
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
        
        if (restaurantId) {
          await fetchRestaurantDetails();
          await fetchOrderStats();
        }
      } catch (error) {
        console.error('Error initializing page:', error);
        router.push('/login');
      }
    };

    initializePage();
  }, [restaurantId, router]);

  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRestaurant(data.restaurant);
        if (data.restaurant.reviews) {
          setReviews(data.restaurant.reviews);
        }
      } else {
        setError(data.message || 'Failed to fetch restaurant details');
      }
    } catch (err) {
      setError('Error fetching restaurant details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const response = await fetch(`/api/admin/orders?action=stats&restaurantId=${restaurantId}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setOrderStats(data.stats || []);
      }
    } catch (err) {
      console.error('Error fetching order stats:', err);
    }
  };

  const handleEdit = () => {
    router.push(`/admin/restaurant/edit/${restaurantId}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this restaurant? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert('Restaurant deleted successfully');
          router.push('/admin/restaurant/list');
        } else {
          alert(data.message || 'Failed to delete restaurant');
        }
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        alert('Error deleting restaurant');
      }
    }
  };

  const handleDeleteMenuItem = async (menuItemId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        const response = await fetch(`/api/admin/menu-items/${menuItemId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert('Menu item deleted successfully');
          await fetchRestaurantDetails();
        } else {
          alert(data.message || 'Failed to delete menu item');
        }
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Error deleting menu item');
      }
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-500 text-yellow-500" style={{clipPath: 'inset(0 50% 0 0)'}} />);
      stars.push(<Star key="half-empty" className="w-4 h-4 text-gray-300 absolute" />);
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  const formatOperatingHours = (operatingHours) => {
    if (!operatingHours) return 'Not specified';
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const openDays = days.filter(day => operatingHours[day] && !operatingHours[day].isClosed);
    
    if (openDays.length === 0) return 'Closed';
    if (openDays.length === 7) {
      const firstDay = operatingHours[openDays[0]];
      return `Daily ${firstDay.open} - ${firstDay.close}`;
    }
    
    return `${openDays.length} days/week`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold mb-2">Restaurant Not Found</h2>
          <p className="text-gray-400">The requested restaurant could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {restaurant ? restaurant.name : 'Restaurant Details'}
              </h1>
              <p className="text-gray-400">View detailed information about the restaurant</p>
            </div>
          </div>
          {restaurant && (
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
        <div className="mb-6">
          <div className="relative h-48 rounded-lg overflow-hidden mb-4" 
               style={{
                 backgroundImage: restaurant.images && restaurant.images.length > 0 
                   ? `url(${restaurant.images[0]})` 
                   : `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200"><rect width="800" height="200" fill="%23f59e0b"/><path d="M0,100 Q200,50 400,100 T800,100 L800,200 L0,200 Z" fill="%23f97316"/></svg>')`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
               }}>
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
            <div className="absolute bottom-4 left-4 flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-3xl">
                {restaurant.logo ? (
                  <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  '🍽️'
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{restaurant.name}</h2>
                <p className="text-white/80">{restaurant.description || 'Restaurant'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Orders & Revenue Analytics</h3>
                <select 
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
                >
                  <option>Last Day</option>
                  <option>Last Week</option>
                  <option>Last Month</option>
                </select>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={orderStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="period" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-400">Orders</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-400">Revenue</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Menu Items</h3>
                <button 
                  onClick={() => router.push(`/admin/dishes/add?restaurantId=${restaurantId}`)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Menu Item</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-4 mb-6">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  <option>Popular - Best Seller</option>
                  <option>Price - Low to High</option>
                  <option>Price - High to Low</option>
                </select>
                <select 
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  <option>Upload Date - Newest</option>
                  <option>Upload Date - Oldest</option>
                </select>
                <select 
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                >
                  <option>Rating - Average</option>
                  <option>Rating - Highest</option>
                  <option>Rating - Lowest</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">
                        <input type="checkbox" className="rounded" />
                      </th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">Dish</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">Category</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">Price</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">Available</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">Rating</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurant.menu && restaurant.menu.length > 0 ? (
                      restaurant.menu.map((item) => (
                        <tr key={item._id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                          <td className="py-4 px-2">
                            <input type="checkbox" className="rounded" />
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center text-lg overflow-hidden">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  '🍽️'
                                )}
                              </div>
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-gray-300">{item.category}</td>
                          <td className="py-4 px-2 text-gray-300">${item.price}</td>
                          <td className="py-4 px-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center space-x-1">
                              {renderStars(4.5)}
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => router.push(`/admin/dishes/edit/${item._id}`)}
                                className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                title="Edit menu item"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMenuItem(item._id)}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                title="Delete menu item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-400">
                          No menu items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Restaurant Information</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Address</p>
                    <p className="text-sm">
                      {restaurant.address ? (
                        `${restaurant.address.street}, ${restaurant.address.city}, ${restaurant.address.state} ${restaurant.address.zipCode}`
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <p className="text-sm">{restaurant.phone || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-sm">{restaurant.email || 'Not specified'}</p>
                  </div>
                </div>
                
                {restaurant.website && (
                  <div className="flex items-start space-x-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Website</p>
                      <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300">
                        {restaurant.website}
                      </a>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Operating Hours</p>
                    <p className="text-sm">{formatOperatingHours(restaurant.operatingHours)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Price Range</p>
                    <p className="text-sm">{restaurant.priceRange || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        restaurant.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {restaurant.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        restaurant.isVerified ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {restaurant.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Owner Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Owner Name:</span>
                  <span>{restaurant.owner?.firstName} {restaurant.owner?.lastName || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-sm">{restaurant.owner?.email || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone:</span>
                  <span>{restaurant.owner?.phone || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Orders:</span>
                  <span>{restaurant.totalOrders || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Revenue:</span>
                  <span>${restaurant.totalRevenue || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
              
              <div className="flex items-center space-x-4 mb-6">
                <div>
                  <div className="text-2xl font-bold">
                    {restaurant.rating?.average?.toFixed(1) || '0.0'} ⭐
                  </div>
                  <div className="text-sm text-gray-400">
                    {restaurant.rating?.count || 0} rated
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">91%</div>
                  <div className="text-sm text-gray-400">Recommended</div>
                </div>
              </div>

              <div className="space-y-4">
                {reviews && reviews.length > 0 ? (
                  reviews.slice(0, 3).map((review) => (
                    <div key={review._id} className="border-b border-gray-700 pb-4 last:border-b-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          {review.user?.firstName?.charAt(0) || '👤'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {review.user?.firstName} {review.user?.lastName}
                            </span>
                            <div className="flex items-center space-x-1">
                              <Check className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-green-500">Verified</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No reviews yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;