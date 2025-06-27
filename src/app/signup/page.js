"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction } from "@/actions/authActions";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      const result = await registerAction(formData);
      
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
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full p-8">
        {/* Left Section */}
        <div className="space-y-10">
          <h1 className="text-3xl ">Food Sewa</h1>
          <h2 className="text-4xl font-bold">Craving something delicious?</h2>
          <div className="space-y-6 text-sm  w-[300px]">
            <div>
              <Image src="/inviteicon.png" width={20} height={20} alt="invite icon" />{" "}
              Invite your friends and family
              <p className="text-gray-400 my-1.5">
                Share the joy of easy ordering and discover new favorites
                together.
              </p>
            </div>
            <div>
            <Image src="/tickicon.png" width={20} height={20} alt="tick icon" />{" "}

              <p className="font-semibold flex items-center gap-2 my-1.5">
              Track your order in real-time
              </p>
              <p className="text-gray-400">
                Get live updates on your delivery and know exactly when to
                expect your food.
              </p>
            </div>
            <div>
            <Image src="/shieldicon.png" width={20} height={20} alt="shield icon" />{" "}

              <p className="font-semibold flex items-center gap-2 my-1.5">

                 Secure and reliable delivery
              </p>
              <p className="text-gray-400">
                We ensure your food arrives fresh and safely to your doorstep.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="bg-gray-900 p-8 rounded-xl shadow-md space-y-6">
          <div className="flex justify-between gap-4">
            <button className="bg-gray-700 w-full py-2 rounded-md flex justify-center items-center gap-2">
              <Image src="/Google.png" width={15} height={15} alt="google" />{" "}
              Google
            </button>
            <button className="bg-gray-700 w-full py-2 rounded-md flex justify-center items-center gap-2">
              <Image src="/Vector.png" width={15} height={15} alt="github" />{" "}
              Github
            </button>
            <button className="bg-gray-700 w-full py-2 rounded-md flex justify-center items-center gap-2">
              <Image src="/logo_art.png" width={15} height={15} alt="github" />
              Gitlab
            </button>
          </div>

          <div className="text-center text-gray-500">Or</div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-2 rounded mb-4">
              {success}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">First Name</label>
                <div className="bg-gray-800 p-2 rounded-md flex gap-1.5 items-center">
                  <Image
                    src="/firstnameicon.png"
                    width={15}
                    height={10}
                    alt="firstname"
                  />
                  <input 
                    type="text" 
                    name="firstName"
                    placeholder="First Name" 
                    className="bg-transparent outline-none w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2">Last Name</label>
                <div className="bg-gray-800 p-2 rounded-md flex gap-1.5 items-center">
                  <Image
                    src="/lastnameicon.png"
                    width={15}
                    height={10}
                    alt="lastname"
                  />
                  <input 
                    type="text" 
                    name="lastName"
                    placeholder="Last Name" 
                    className="bg-transparent outline-none w-full"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-2">Username</label>
          
              <div className="bg-gray-800 p-2 rounded-md flex gap-1.5 items-center">
                <Image
                  src="/usernameicon.png"
                  width={15}
                  height={10}
                  alt="username"
                />
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  className="bg-transparent outline-none w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-2">Email</label>
              <div className="bg-gray-800 p-2 rounded-md flex gap-1.5 items-center">
                <Image
                  src="/email.png"
                  width={15}
                  height={10}
                  alt="email icon"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="bg-transparent outline-none w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-2">Password</label>
              <div className="bg-gray-800 p-2 rounded-md flex gap-1.5 items-center">
                <Image
                  src="/lock-01.png"
                  width={15}
                  height={10}
                  alt="password icon"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  className="bg-transparent outline-none w-full"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-2">Confirm Password</label>
              <div className="bg-gray-800 p-2 rounded-md flex gap-1.5 items-center">
                <Image
                  src="/lock-01.png"
                  width={15}
                  height={10}
                  alt="confirm password icon"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="bg-transparent outline-none w-full"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum length is 6 characters.
              </p>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#EA7C69] hover:bg-orange-600 text-white py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-xs text-center text-gray-500 mt-4">
            By creating an account, you agree to the{" "}
            <Link href="#" className="underline">
              Terms of Service
            </Link>
            .
          </p>

          <p className="text-sm text-center text-gray-400 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-orange-400 underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
