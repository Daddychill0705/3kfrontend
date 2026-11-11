import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, showToast]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const loggedInUser = await login(email, password);
      showToast(`Welcome${loggedInUser.firstname ? `, ${loggedInUser.firstname}` : ' back'}!`);
      
      // Role-based redirection directly to dashboards
      if (loggedInUser.role === 'admin') navigate('/admin');
      else if (loggedInUser.role === 'cashier') navigate('/cashier');
      else if (loggedInUser.role === 'rider') navigate('/driver');
      else navigate('/home');
    } catch (err) {
      showToast(err.message || 'Invalid email or password', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-80px)] bg-3k-bg">
      <div className="flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:order-1 order-2 lg:border-r border-[#C9A77C]/20">
        <div className="relative isolate w-full max-w-[440px] rounded-2xl border border-[#C9A77C]/35 bg-[#FBFAF4] p-5 sm:p-7 lg:p-9 shadow-[0_18px_55px_rgba(74,52,34,0.14)] before:content-[''] before:absolute before:inset-4 before:-z-10 before:rounded-3xl before:bg-[#815633]/20 before:blur-2xl">
          <p className="text-sm text-gray-600 mb-7 leading-relaxed font-medium">
            Sign in so you can start ordering!
          </p>

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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#815633] focus:ring-2 focus:ring-[#815633]/20 transition-all font-medium"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#815633] focus:ring-2 focus:ring-[#815633]/20 transition-all font-medium"
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
          </form>
          
          <p className="text-center text-sm text-gray-600 font-medium">
            Don&apos;t have an account? <Link to="/register" className="text-3k-red font-black hover:text-3k-red-hover transition-colors">Create one</Link>
          </p>
        </div>
      </div>
      
      <div className="relative z-10 bg-gradient-to-br from-[#E6D4B8] to-[#C9A77C] flex-col justify-center items-center p-12 overflow-hidden hidden lg:flex lg:order-2">
        <div className="text-center z-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Welcome To The 3K Kitchen</h2>
          <p className="text-lg text-gray-800 font-medium leading-relaxed mb-8">
            Experience the taste of the Philippines with our handcrafted dishes.
          </p>
          <div className="w-[300px] h-[300px] bg-[radial-gradient(ellipse_at_50%_50%,#C9A77C,#E6D4B8)] rounded-full flex justify-center items-center mx-auto shadow-xl animate-[bounce_3s_ease-in-out_infinite] border-4 border-white/20">
            <img src={logoImg} alt="3K Kitchen Logo" className="max-w-[300px] h-auto drop-shadow-md rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
