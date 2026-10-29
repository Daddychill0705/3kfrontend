import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const loggedInUser = await login(email, password);
      
      // Role-based redirection
      if (loggedInUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedInUser.role === 'cashier') {
        navigate('/cashier');
      } else if (loggedInUser.role === 'rider') {
        navigate('/driver');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/home');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-80px)] bg-3k-bg">
      <div className="bg-white flex flex-col justify-center items-center py-12 px-6 lg:order-1 order-2 border-r border-[#FFB5AB]/20 shadow-xl z-10">
        <div className="w-full max-w-[400px]">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed font-medium">
            Sign in to your account to continue ordering delicious Filipino comfort food.
          </p>
          
          {error && <p className="text-red-500 text-sm mb-4 font-bold">{error}</p>}
          
          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">Email Address</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" 
                required 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E39A7B] focus:ring-2 focus:ring-[#E39A7B]/20 transition-all font-medium" 
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-2">Password</label>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E39A7B] focus:ring-2 focus:ring-[#E39A7B]/20 transition-all font-medium" 
              />
            </div>
            <div className="flex justify-between items-center mb-8 text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-medium">
                <input type="checkbox" className="w-4 h-4 cursor-pointer accent-3k-red" /> Remember me
              </label>
              <Link to="/forgot-password" className="text-3k-red font-bold hover:text-3k-red-hover transition-colors">Forgot password?</Link>
            </div>
            <button type="submit" className="w-full bg-3k-red text-white font-bold py-3 rounded-lg shadow-md hover:bg-3k-red-hover hover:-translate-y-1 transition-all duration-300 mb-4">
              Sign In
            </button>
            <button 
              type="button" 
              onClick={handleGuestLogin}
              className="w-full bg-[#FFD3AC]/30 text-[#E39A7B] font-bold py-3 rounded-lg border border-[#E39A7B]/50 hover:bg-[#FFD3AC]/60 hover:-translate-y-1 transition-all duration-300 mb-6">
              Continue as Guest
            </button>
          </form>
          
          <div className="flex items-center mb-6 gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-400 font-bold">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          
          <div className="flex gap-4 mb-8">
            <button className="flex-1 py-3 border border-gray-300 rounded-lg bg-white cursor-pointer text-sm font-bold transition-all duration-300 hover:border-[#E39A7B] hover:bg-[#FFD3AC]/20 hover:text-[#E39A7B] flex items-center justify-center gap-2">
              Google
            </button>
            <button className="flex-1 py-3 border border-gray-300 rounded-lg bg-white cursor-pointer text-sm font-bold transition-all duration-300 hover:border-[#E39A7B] hover:bg-[#FFD3AC]/20 hover:text-[#E39A7B] flex items-center justify-center gap-2">
              Facebook
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-600 font-medium">
            Don't have an account? <Link to="/register" className="text-3k-red font-black hover:text-3k-red-hover transition-colors">Create one</Link>
          </p>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-[#FFD3AC] to-[#FFB5AB] flex-col justify-center items-center p-12 relative overflow-hidden hidden lg:flex lg:order-2">
        <div className="text-center z-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Welcome To The 3K Kitchen</h2>
          <p className="text-lg text-gray-800 font-medium leading-relaxed mb-8">
            Experience the taste of the Philippines with our handcrafted dishes.
          </p>
          <div className="w-[300px] h-[300px] bg-[radial-gradient(ellipse_at_50%_50%,#FFB5AB,#FFD3AC)] rounded-full flex justify-center items-center mx-auto shadow-xl animate-[bounce_3s_ease-in-out_infinite] border-4 border-white/20">
            <img src={logoImg} alt="3K Kitchen Logo" className="max-w-[300px] h-auto drop-shadow-md rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}