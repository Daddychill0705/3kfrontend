import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';

export default function ForgotPassword() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState('request');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const submit = async event => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/forgot-password/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not send the reset email.');
      setMessage(result.message || 'If an account exists for that email, a reset code has been sent.');
      setStage('verify');
    } catch (requestError) {
      setError(requestError.message || 'Could not send the reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyAndReset = async event => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not reset your password.');
      setMessage(result.message || 'Password reset successfully. You can now sign in.');
      setStage('done');
    } catch (requestError) {
      setError(requestError.message || 'Could not reset your password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-80px)] grid-cols-1 bg-3k-bg lg:grid-cols-2">
      <div className="z-10 order-2 flex flex-col items-center justify-center border-r border-[#C9A77C]/20 bg-white px-6 py-12 shadow-xl lg:order-1">
        <div className="w-full max-w-[400px]">
          <h1 className="mb-2 text-3xl font-extrabold text-gray-900">{stage === 'done' ? 'Password Updated' : 'Forgot Password'}</h1>
          <p className="mb-8 text-sm font-medium leading-relaxed text-gray-600">{stage === 'request' ? 'Enter your email address and we\u2019ll send you a verification code.' : stage === 'verify' ? `Enter the code sent to ${email} and choose a new password.` : 'Your password has been updated.'}</p>
          {location.state?.accountRecoveryMessage && <p role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">{location.state.accountRecoveryMessage}</p>}
          {message && <p role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">{message}</p>}
          {error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          {stage !== 'done' && <form onSubmit={stage === 'request' ? submit : verifyAndReset}>
            <div className="mb-6">
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-gray-800">Email Address</label>
              <input type="email" id="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" required autoComplete="email" readOnly={stage === 'verify'} className="w-full rounded-lg border border-gray-300 px-4 py-3 font-medium transition-all focus:border-[#815633] focus:outline-none focus:ring-2 focus:ring-[#815633]/20 read-only:bg-gray-100" />
            </div>
            {stage === 'verify' && <>
              <div className="mb-5">
                <label htmlFor="reset-otp" className="mb-2 block text-sm font-bold text-gray-800">Verification code</label>
                <input type="text" id="reset-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" required className="w-full rounded-lg border border-gray-300 px-4 py-3 tracking-[0.3em] focus:border-[#815633] focus:outline-none" />
              </div>
              <div className="mb-5">
                <label htmlFor="new-password" className="mb-2 block text-sm font-bold text-gray-800">New password</label>
                <input type="password" id="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#815633] focus:outline-none" />
              </div>
              <div className="mb-6">
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-bold text-gray-800">Confirm new password</label>
                <input type="password" id="confirm-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#815633] focus:outline-none" />
              </div>
            </>}
            <button type="submit" disabled={isSubmitting} className="mb-6 w-full rounded-lg bg-3k-red py-3 font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-3k-red-hover disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? (stage === 'request' ? 'Sending...' : 'Updating password...') : (stage === 'request' ? 'Send Verification Code' : 'Reset Password')}
            </button>
          </form>}
          <div className="mb-6 border-t border-[#C9A77C]/25 pt-5 text-center">
            <Link to="/account-recovery" className="text-sm font-bold text-[#815633] underline decoration-[#C9A77C] underline-offset-4 hover:text-[#62432B]">I don&apos;t have access to this account</Link>
          </div>
          <p className="text-center text-sm font-medium text-gray-600">Remember your password? <Link to="/login" className="font-black text-3k-red transition-colors hover:text-3k-red-hover">Back to Sign In</Link></p>
        </div>
      </div>
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#E6D4B8] to-[#C9A77C] p-12 lg:flex lg:order-2">
        <div className="z-10 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900">Reset Your Password</h2>
          <p className="mb-8 text-lg font-medium leading-relaxed text-gray-800">Don&apos;t worry, it happens to the best of us. We&apos;ll help you get back into your account quickly.</p>
          <div className="mx-auto flex h-[300px] w-[300px] animate-[bounce_3s_ease-in-out_infinite] items-center justify-center rounded-full border-4 border-white/20 bg-[radial-gradient(ellipse_at_50%_50%,#C9A77C,#E6D4B8)] shadow-xl">
            <img src={logoImg} alt="3K Kitchen Logo" className="max-w-[300px] rounded-full drop-shadow-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
