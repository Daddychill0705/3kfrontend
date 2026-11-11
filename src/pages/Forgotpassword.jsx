import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';

const EMAIL_KEY = '3k-password-reset-email';
const TOKEN_KEY = '3k-password-reset-token';

export default function ForgotPassword() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const location = useLocation();
  const navigate = useNavigate();
  const isVerifyPage = location.pathname === '/forgot-password/verify';
  const isNewPasswordPage = location.pathname === '/forgot-password/new-password';
  const [email, setEmail] = useState(() => sessionStorage.getItem(EMAIL_KEY) || '');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isVerifyPage && !sessionStorage.getItem(EMAIL_KEY)) navigate('/forgot-password', { replace: true });
    if (isNewPasswordPage && !sessionStorage.getItem(TOKEN_KEY)) navigate('/forgot-password', { replace: true });
  }, [isNewPasswordPage, isVerifyPage, navigate]);

  const requestCode = async event => {
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
      if (!response.ok) throw new Error(result.error || 'Could not send the reset code.');
      sessionStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
      sessionStorage.removeItem(TOKEN_KEY);
      navigate('/forgot-password/verify');
    } catch (requestError) {
      setError(requestError.message || 'Could not send the reset code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async event => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not verify the code.');
      sessionStorage.setItem(TOKEN_KEY, result.resetToken);
      setResetToken(result.resetToken);
      navigate('/forgot-password/new-password');
    } catch (requestError) {
      setError(requestError.message || 'Could not verify the code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setNewPassword = async event => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/forgot-password/reset-with-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, password })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not reset your password.');
      sessionStorage.removeItem(EMAIL_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      navigate('/login', { replace: true, state: { message: result.message || 'Password reset successfully. You can now sign in.' } });
    } catch (requestError) {
      setError(requestError.message || 'Could not reset your password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isVerifyPage ? 'Verify Your Email' : isNewPasswordPage ? 'Create a New Password' : 'Forgot Password';
  const description = isVerifyPage
    ? `Enter the verification code sent to ${email}.`
    : isNewPasswordPage
      ? 'Your email is verified. Choose a new password for your account.'
      : 'Enter your email address and we’ll send you a verification code.';

  return (
    <div className="grid min-h-[calc(100vh-80px)] grid-cols-1 bg-3k-bg lg:grid-cols-2">
      <div className="z-10 order-2 flex flex-col items-center justify-center border-r border-[#C9A77C]/20 bg-white px-6 py-12 shadow-xl lg:order-1">
        <div className="w-full max-w-[400px]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#A77A50]">
            Step {isVerifyPage ? '2' : isNewPasswordPage ? '3' : '1'} of 3
          </p>
          <h1 className="mb-2 text-3xl font-extrabold text-gray-900">{title}</h1>
          <p className="mb-8 text-sm font-medium leading-relaxed text-gray-600">{description}</p>
          {location.state?.accountRecoveryMessage && !isVerifyPage && !isNewPasswordPage && <p role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">{location.state.accountRecoveryMessage}</p>}
          {message && <p role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">{message}</p>}
          {error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

          {!isVerifyPage && !isNewPasswordPage && <form onSubmit={requestCode}>
            <div className="mb-8">
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-gray-800">Email Address</label>
              <input type="email" id="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" required autoComplete="email" className="w-full rounded-lg border border-gray-300 px-4 py-3 font-medium transition-all focus:border-[#815633] focus:outline-none focus:ring-2 focus:ring-[#815633]/20" />
            </div>
            <button type="submit" disabled={isSubmitting} className="mb-6 w-full rounded-lg bg-3k-red py-3 font-bold text-white shadow-md transition-all hover:bg-3k-red-hover disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Sending code...' : 'Send Verification Code'}
            </button>
          </form>}

          {isVerifyPage && <form onSubmit={verifyCode}>
            <div className="mb-6">
              <label htmlFor="reset-otp" className="mb-2 block text-sm font-bold text-gray-800">Verification Code</label>
              <input type="text" id="reset-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" required className="w-full rounded-lg border border-gray-300 px-4 py-3 tracking-[0.3em] focus:border-[#815633] focus:outline-none" />
            </div>
            <button type="submit" disabled={isSubmitting} className="mb-4 w-full rounded-lg bg-3k-red py-3 font-bold text-white shadow-md transition-all hover:bg-3k-red-hover disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </button>
            <button type="button" onClick={() => navigate('/forgot-password')} className="mb-6 w-full text-sm font-bold text-[#815633] hover:underline">Back to email</button>
          </form>}

          {isNewPasswordPage && <form onSubmit={setNewPassword}>
            <div className="mb-5">
              <label htmlFor="new-password" className="mb-2 block text-sm font-bold text-gray-800">New Password</label>
              <input type="password" id="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#815633] focus:outline-none" />
            </div>
            <div className="mb-6">
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-bold text-gray-800">Confirm New Password</label>
              <input type="password" id="confirm-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#815633] focus:outline-none" />
            </div>
            <button type="submit" disabled={isSubmitting} className="mb-6 w-full rounded-lg bg-3k-red py-3 font-bold text-white shadow-md transition-all hover:bg-3k-red-hover disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Updating password...' : 'Save New Password'}
            </button>
          </form>}

          {!isVerifyPage && !isNewPasswordPage && <div className="mb-6 border-t border-[#C9A77C]/25 pt-5 text-center">
            <Link to="/account-recovery" className="text-sm font-bold text-[#815633] underline decoration-[#C9A77C] underline-offset-4 hover:text-[#62432B]">I don&apos;t have access to this account</Link>
          </div>}
          <p className="text-center text-sm font-medium text-gray-600">Remember your password? <Link to="/login" className="font-black text-3k-red transition-colors hover:text-3k-red-hover">Back to Sign In</Link></p>
        </div>
      </div>
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#E6D4B8] to-[#C9A77C] p-12 lg:flex lg:order-2">
        <div className="z-10 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900">Reset Your Password</h2>
          <p className="mb-8 text-lg font-medium leading-relaxed text-gray-800">Verify your email, then choose a new password to get back into your account.</p>
          <div className="mx-auto flex h-[300px] w-[300px] animate-[bounce_3s_ease-in-out_infinite] items-center justify-center rounded-full border-4 border-white/20 bg-[radial-gradient(ellipse_at_50%_50%,#C9A77C,#E6D4B8)] shadow-xl">
            <img src={logoImg} alt="3K Kitchen Logo" className="max-w-[300px] rounded-full drop-shadow-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
