"use client"

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Shield, Key } from 'lucide-react';

export default function ResetPassword() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Email, 2: Code, 3: New Password, 4: Success
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Simulate timer countdown
  React.useEffect(() => {
    if (currentStep === 2 && timer > 0) {
      const countdown = setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, currentStep]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(2);
      setTimer(60);
      setCanResend(false);
    }, 1500);
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.code) {
      newErrors.code = 'Verification code is required';
    } else if (formData.code.length !== 6) {
      newErrors.code = 'Please enter the 6-digit code';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(3);
    }, 1000);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const passwordValidation = validatePassword(formData.newPassword);

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!passwordValidation.isValid) {
      newErrors.newPassword = 'Password does not meet requirements';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(4);
    }, 1500);
  };

  const handleResendCode = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setTimer(60);
      setCanResend(false);
    }, 1000);
  };

  const renderEmailStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <Mail className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-gray-400">Enter your email address and we'll send you a verification code</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 ${
                errors.email ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter your email address"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.email}
            </p>
          )}
        </div>

        <button
          onClick={handleEmailSubmit}
          disabled={isLoading}
          className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Verification Code'}
        </button>
      </div>
    </div>
  );

  const renderCodeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <Shield className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Enter Verification Code</h1>
        <p className="text-gray-400">
          We've sent a 6-digit code to <span className="text-orange-500">{formData.email}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white text-center text-lg tracking-widest ${
              errors.code ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="000000"
            maxLength="6"
          />
          {errors.code && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.code}
            </p>
          )}
        </div>

        <button
          onClick={handleCodeSubmit}
          disabled={isLoading}
          className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </button>

        <div className="text-center">
          {canResend ? (
            <button
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-orange-500 hover:text-orange-400 font-medium disabled:opacity-50"
            >
              Resend Code
            </button>
          ) : (
            <p className="text-gray-400">
              Didn't receive the code? Resend in {timer}s
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPasswordStep = () => {
    const passwordValidation = validatePassword(formData.newPassword);
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Key className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create New Password</h1>
          <p className="text-gray-400">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 ${
                  errors.newPassword ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Password Requirements */}
          {formData.newPassword && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Password Requirements:</h4>
              <div className="space-y-1 text-sm">
                <div className={`flex items-center ${passwordValidation.minLength ? 'text-green-400' : 'text-gray-400'}`}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  At least 8 characters
                </div>
                <div className={`flex items-center ${passwordValidation.hasUpperCase ? 'text-green-400' : 'text-gray-400'}`}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  One uppercase letter
                </div>
                <div className={`flex items-center ${passwordValidation.hasLowerCase ? 'text-green-400' : 'text-gray-400'}`}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  One lowercase letter
                </div>
                <div className={`flex items-center ${passwordValidation.hasNumbers ? 'text-green-400' : 'text-gray-400'}`}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  One number
                </div>
                <div className={`flex items-center ${passwordValidation.hasSpecialChar ? 'text-green-400' : 'text-gray-400'}`}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  One special character
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    );
  };

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Password Updated!</h1>
      <p className="text-gray-400 mb-6">
        Your password has been successfully updated. You can now log in with your new password.
      </p>
      
      <div className="space-y-3">
        <button
          onClick={() => window.location.href = '/login'}
          className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          Go to Login
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-500 w-10 h-10 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">Y</span>
              </div>
              <span className="text-white text-xl font-semibold">Yum</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Home</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Dishes</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Menu</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a>
            </nav>

            <button className="md:hidden text-gray-300 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          {/* Back Button */}
          {currentStep > 1 && currentStep < 4 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex items-center text-gray-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
          )}

          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= currentStep ? 'bg-orange-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
            {currentStep === 1 && renderEmailStep()}
            {currentStep === 2 && renderCodeStep()}
            {currentStep === 3 && renderPasswordStep()}
            {currentStep === 4 && renderSuccessStep()}
          </div>

          {/* Login Link */}
          {currentStep < 4 && (
            <div className="text-center mt-6">
              <p className="text-gray-400">
                Remember your password?{' '}
                <a href="#" className="text-orange-500 hover:text-orange-400 font-medium">
                  Sign in
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}