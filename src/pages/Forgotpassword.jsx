import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';

export default function ForgotPassword() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-80px)] bg-3k-bg">
      <div className="bg-white flex flex-col justify-center items-center py-12 px-6 lg:order-1 order-2 border-r border-[#FFB5AB]/20 shadow-xl z-10">
        <div className="w-full max-w-[400px]">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Forgot Password</h1>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed font-medium">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <form>
            <div className="mb-8">
              <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">Email Address</label>
              <input type="email" id="email" placeholder="name@example.com" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E39A7B] focus:ring-2 focus:ring-[#E39A7B]/20 transition-all font-medium" />
            </div>
            
            <button type="submit" className="w-full bg-3k-red text-white font-bold py-3 rounded-lg shadow-md hover:bg-3k-red-hover hover:-translate-y-1 transition-all duration-300 mb-8">
              Send Reset Link
            </button>
          </form>
          
          <p className="text-center text-sm text-gray-600 font-medium">
            Remember your password? <Link to="/login" className="text-3k-red font-black hover:text-3k-red-hover transition-colors">Back to Sign In</Link>
          </p>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-[#FFD3AC] to-[#FFB5AB] flex-col justify-center items-center p-12 relative overflow-hidden hidden lg:flex lg:order-2">
        <div className="text-center z-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Reset Your Password</h2>
          <p className="text-lg text-gray-800 font-medium leading-relaxed mb-8">
            Don't worry, it happens to the best of us. We'll help you get back into your account quickly.
          </p>
          <div className="w-[300px] h-[300px] bg-[radial-gradient(ellipse_at_50%_50%,#FFB5AB,#FFD3AC)] rounded-full flex justify-center items-center mx-auto shadow-xl animate-[bounce_3s_ease-in-out_infinite] border-4 border-white/20">
            <img src={logoImg} alt="3K Kitchen Logo" className="max-w-[300px] h-auto drop-shadow-md rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}