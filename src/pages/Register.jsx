import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password
          // Note: Phone and Address can be added to your TiDB users table later
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      alert('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-80px)] bg-3k-bg">
      <div className="bg-white flex flex-col justify-center items-center py-12 px-6 lg:order-1 order-2 border-r border-[#FFB5AB]/20 shadow-xl z-10">
        <div className="w-full max-w-[450px]">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create Account</h1>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed font-medium">
            Sign up to start ordering your favorite Filipino dishes.
          </p>
          
          {error && <p className="text-red-500 text-sm mb-4 font-bold">{error}</p>}
          
          <form onSubmit={handleRegister}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="firstname" className="block text-sm font-bold text-gray-800 mb-2">First Name</label>
                <input type="text" id="firstname" value={formData.firstname} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E39A7B]" />
              </div>
              <div>
                <label htmlFor="lastname" className="block text-sm font-bold text-gray-800 mb-2">Last Name</label>
                <input type="text" id="lastname" value={formData.lastname} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E39A7B]" />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">Email Address</label>
              <input type="email" id="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E39A7B]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-2">Password</label>
                <input type="password" id="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E39A7B]" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-800 mb-2">Confirm</label>
                <input type="password" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E39A7B]" />
              </div>
            </div>

            <div className="flex items-start gap-3 mb-8 text-sm">
              <input type="checkbox" id="terms" required className="mt-1 w-4 h-4 cursor-pointer accent-3k-red shrink-0" />
              <label htmlFor="terms" className="text-gray-600 font-medium leading-relaxed cursor-pointer">
                I agree to the Terms and Conditions and Privacy Policy
              </label>
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-3k-red text-white font-bold py-3 rounded-lg shadow-md hover:bg-3k-red-hover transition-all mb-6">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 font-medium">
            Already have an account? <Link to="/login" className="text-3k-red font-black hover:text-3k-red-hover transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
      
      {/* Visual Side Panel Container */}
      <div className="bg-gradient-to-br from-[#FFD3AC] to-[#FFB5AB] flex-col justify-center items-center p-12 relative overflow-hidden hidden lg:flex lg:order-2">
        <div className="text-center z-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Join Our Community</h2>
          <div className="w-[300px] h-[300px] bg-[radial-gradient(ellipse_at_50%_50%,#FFB5AB,#FFD3AC)] rounded-full flex justify-center items-center mx-auto shadow-xl animate-[bounce_3s_ease-in-out_infinite] border-4 border-white/20">
            <img src={logoImg} alt="3K Kitchen Logo" className="max-w-[300px] h-auto drop-shadow-md rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}