import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('details');
  const [otp, setOtp] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return showToast('Passwords do not match.', 'error');
    }
    if (!termsAccepted) return showToast('Please agree to the Terms and Conditions and Privacy Policy.', 'error');

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/register/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password,
          termsAccepted
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setStage('verify');
    } catch (err) {
      showToast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/register/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not verify the code.');
      navigate('/login', { state: { message: 'Your account is verified. You can now sign in.' } });
    } catch (err) {
      showToast(err.message || 'Could not verify the code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-80px)] bg-3k-bg">
      <div className="bg-white flex flex-col justify-center items-center py-12 px-6 lg:order-1 order-2 border-r border-[#C9A77C]/20">
        <div className="w-full max-w-[450px]">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{stage === 'verify' ? 'Verify Your Email' : 'Create Account'}</h1>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed font-medium">
            {stage === 'verify' ? `Enter the 6-digit code sent to ${formData.email}.` : 'Sign up to start ordering your favorite Filipino dishes.'}
          </p>
          
          <form onSubmit={stage === 'verify' ? handleVerifyOtp : handleRegister}>
            {stage === 'verify' ? (
              <div className="mb-6">
                <label htmlFor="registration-otp" className="block text-sm font-bold text-gray-800 mb-2">Email verification code</label>
                <input id="registration-otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required placeholder="6-digit code" className="w-full px-4 py-3 border border-gray-300 rounded-lg tracking-[0.3em] focus:outline-none focus:border-[#815633]" />
              </div>
            ) : <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="firstname" className="block text-sm font-bold text-gray-800 mb-2">First Name</label>
                <input type="text" id="firstname" value={formData.firstname} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#815633]" />
              </div>
              <div>
                <label htmlFor="lastname" className="block text-sm font-bold text-gray-800 mb-2">Last Name</label>
                <input type="text" id="lastname" value={formData.lastname} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#815633]" />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">Email Address</label>
              <input type="email" id="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#815633]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-2">Password</label>
                <input type="password" id="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#815633]" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-800 mb-2">Confirm</label>
                <input type="password" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#815633]" />
              </div>
            </div>

            <div className="flex items-start gap-3 mb-8 text-sm">
              <input
                type="checkbox"
                id="terms"
                required
                checked={termsAccepted}
                onChange={event => setTermsAccepted(event.target.checked)}
                aria-label="I agree to the Terms and Conditions and Privacy Policy"
                className="mt-1 w-4 h-4 cursor-pointer accent-3k-red shrink-0"
              />
              <p className="text-gray-600 font-medium leading-relaxed">
                I have read and agree to the{' '}
                <Link to="/terms" target="_blank" rel="noreferrer" className="text-3k-red font-bold underline underline-offset-2 hover:text-3k-red-hover">Terms and Conditions</Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" rel="noreferrer" className="text-3k-red font-bold underline underline-offset-2 hover:text-3k-red-hover">Privacy Policy</Link>.
              </p>
            </div>
            </>}
            
            <button type="submit" disabled={loading} className="w-full bg-3k-red text-white font-bold py-3 rounded-lg shadow-md hover:bg-3k-red-hover transition-all mb-6">
              {loading ? (stage === 'verify' ? 'Verifying...' : 'Sending code...') : (stage === 'verify' ? 'Verify and Create Account' : 'Send Verification Code')}
            </button>
          </form>

          {stage === 'verify' && <button type="button" onClick={() => { setStage('details'); setOtp(''); }} className="mb-5 w-full text-sm font-bold text-[#815633] hover:underline">Back to account details</button>}

          <p className="text-center text-sm text-gray-600 font-medium">
            Already have an account? <Link to="/login" className="text-3k-red font-black hover:text-3k-red-hover transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
      
      <div className="relative z-10 bg-gradient-to-br from-[#E6D4B8] to-[#C9A77C] flex-col justify-center items-center p-12 overflow-hidden hidden lg:flex lg:order-2">
        <div className="text-center z-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Join Our Community</h2>
          <div className="w-[300px] h-[300px] bg-[radial-gradient(ellipse_at_50%_50%,#C9A77C,#E6D4B8)] rounded-full flex justify-center items-center mx-auto shadow-xl animate-[bounce_3s_ease-in-out_infinite] border-4 border-white/20">
            <img src={logoImg} alt="3K Kitchen Logo" className="max-w-[300px] h-auto drop-shadow-md rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
