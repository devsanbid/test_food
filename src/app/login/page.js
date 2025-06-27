'use client';
import React, { useState } from "react";
import { FaGoogle, FaGithub, FaGitlab, FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "@/actions/authActions";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await loginAction(formData);
      
      if (result.success) {
        // Redirect based on user role
        if (result.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (result.user.role === 'restaurant') {
          router.push('/restaurant/dashboard');
        } else {
          router.push('/user/dashboard');
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white flex items-center justify-center px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl shadow-lg rounded-2xl bg-opacity-40 p-8">
        {/* Left Panel */}
        <div className="space-y-8">
          <h1 className="text-2xl font-semibold text-white-400">Food Sewa</h1>
          <h2 className="text-3xl font-bold">Craving something delicious?</h2>

          <div className="space-y-6 mt-10 w-[300px]">
            <div>
              <div className="flex-col items-center text-white-400">
                <Image src="/invite.png" width={15} height={15} alt="icon" />
                <h3 className="mt-2">Invite your friends and family</h3>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Share the joy of easy ordering and discover new favorites together.
              </p>
            </div>

            <div>
              <div className="flex-col items-center gap-3 text-white-400">
                <Image src="/track.png" width={15} height={15} alt="track" />
                <h3 className="mt-2">Track your order in real-time</h3>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Get live updates on your delivery and know exactly when to expect your food.
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-3 text-white-400">
                <Image src="/secure.png" width={15} height={15} alt="secure" />
                <h3 className="font-semibold">Secure and reliable delivery</h3>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                We ensure your food arrives fresh and safely to your doorstep.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Login with</h2>
          <div className="flex gap-4 mb-6">
            <button className="flex-1 py-2 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center gap-2">
              <Image src="/Google.png" width={15} height={15} alt="google" />
              Google
            </button>
            <button className="flex-1 py-2 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center gap-2">
              <FaGithub /> Github
            </button>
            <button className="flex-1 py-2 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center gap-2">
              <FaGitlab /> Gitlab
            </button>
          </div>

          <div className="text-center text-gray-500 mb-4">Or</div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-6">
            <div className="flex-col">
              <label className="block mb-2">Username or Email</label>
              <div className="py-2 px-2 pr-4 rounded mt-1.5 items-center justify-start bg-gray-800 text-white focus:outline-none flex gap-3">
                <FaUser />
                <input 
                  type="text" 
                  name="identifier"
                  placeholder="Username or Email" 
                  className="w-full bg-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex-col">
              <label className="block mb-2">Password</label>
              <div className="w-full py-2 px-2 rounded mt-1.5 bg-gray-800 text-white focus:outline-none flex gap-3 items-center">
                <FaLock />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  className="w-full bg-transparent outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-white"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <Link href="/forgetpassword" className="text-[#EA7C69] hover:underline">
                Forgot Password?
              </Link>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#EA7C69] hover:bg-orange-500 py-2 rounded font-semibold text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="text-center mt-6 text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-[#EA7C69] hover:underline">
              Sign up
            </Link>
          </div>
        </div>

          <p className="text-sm text-center text-gray-400 mt-4">
            No account?{" "}
            <a href="#" className="bg- hover:underline">
              Register here
            </a>
          </p>
        </div>
      </div>)
}
