'use client';
import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { forgotPasswordAction, resetPasswordAction } from "@/actions/authActions";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get('token');

  React.useEffect(() => {
    if (resetToken) {
      setStep(2);
    }
  }, [resetToken]);

  const handleForgotPassword = async (formData) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await forgotPasswordAction(formData);
      
      if (result.success) {
        setSuccess('Password reset link sent to your email!');
        setEmail(formData.get('email'));
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (formData) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    const resetFormData = new FormData();
    resetFormData.append('resetToken', resetToken);
    resetFormData.append('newPassword', newPassword);
    
    try {
      const result = await resetPasswordAction(resetFormData);
      
      if (result.success) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-300 to-yellow-300 flex items-center justify-center p-4">
      {step === 1 ? (
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Forgot Password</h2>
          <p className="text-center text-gray-600 mb-6">Enter your email address and we'll send you a reset link</p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          <form action={handleForgotPassword}>
            <input
              type="email"
              name="email"
              placeholder="Enter email address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              required
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <Link href="/login" className="text-orange-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Reset Password</h2>
          <div className="bg-blue-100 text-blue-800 text-sm rounded-lg p-3 mb-6">
            Please create a new password that you don't use on any other site.
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          <form action={handleResetPassword}>
            <input
              type="password"
              name="newPassword"
              placeholder="Create new password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              required
              minLength={6}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              required
              minLength={6}
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <Link href="/login" className="text-orange-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
