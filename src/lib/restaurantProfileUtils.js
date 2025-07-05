export const checkRestaurantProfileComplete = async () => {
  try {
    const response = await fetch('/api/restaurant/settings?section=general', {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!data.success || !data.settings) {
      return { isComplete: false, missingFields: ['Restaurant profile not found'] };
    }
    
    const settings = data.settings;
    const requiredFields = {
      name: 'Restaurant name',
      description: 'Restaurant description',
      cuisine: 'Cuisine type',
      phone: 'Phone number',
      email: 'Email address',
      address: 'Restaurant address'
    };
    
    const missingFields = [];
    
    Object.keys(requiredFields).forEach(field => {
      const value = settings[field];
      let isEmpty = false;
      
      if (!value) {
        isEmpty = true;
      } else if (typeof value === 'string') {
        isEmpty = value.trim() === '';
      } else if (Array.isArray(value)) {
        isEmpty = value.length === 0;
      } else if (typeof value === 'object') {
        // For address object, check if it has required properties
        if (field === 'address') {
          isEmpty = !value.street || !value.city || !value.state || !value.zipCode;
        } else {
          isEmpty = Object.keys(value).length === 0;
        }
      }
      
      if (isEmpty) {
        missingFields.push(requiredFields[field]);
      }
    });
    
    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  } catch (error) {
    console.error('Error checking restaurant profile:', error);
    return { isComplete: false, missingFields: ['Error checking profile'] };
  }
};

export const ProfileIncompleteModal = ({ isOpen, onClose, missingFields }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Complete Your Restaurant Profile</h3>
          <p className="text-gray-400 text-sm mb-4">
            Please complete your restaurant profile to access all features
          </p>
        </div>
        
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">Missing Information:</h4>
          <ul className="space-y-2">
            {missingFields.map((field, index) => (
              <li key={index} className="flex items-center text-gray-300 text-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                {field}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Later
          </button>
          <button
            onClick={() => window.location.href = '/restaurant/profile'}
            className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProfileIncompleteMessage = ({ missingFields }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 text-center">
          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Complete Your Restaurant Profile</h1>
          <p className="text-gray-400 text-lg mb-8">
            To access this feature, please complete your restaurant profile first.
          </p>
          
          <div className="bg-gray-700/50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4 text-orange-400">Missing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {missingFields.map((field, index) => (
                <div key={index} className="flex items-center text-gray-300">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span>{field}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/restaurant/dashboard'}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
            <button
              onClick={() => window.location.href = '/restaurant/profile'}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Complete Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};