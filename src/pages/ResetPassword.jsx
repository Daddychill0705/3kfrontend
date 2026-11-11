import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function ResetPassword() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async event => {
    event.preventDefault();
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not reset the password.');
      navigate('/login', { replace: true, state: { message: result.message || 'Password reset successfully. You can now sign in.' } });
    } catch (requestError) {
      showToast(requestError.message || 'Could not reset the password. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-3k-bg px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#C9A77C]/35 bg-[#FBFAF4] p-6 shadow-[0_18px_55px_rgba(74,52,34,0.14)] sm:p-8">
        <h1 className="text-2xl font-black text-gray-900">Set a new password</h1>
        <p className="mt-2 text-sm text-gray-600">Choose a password with 8 to 128 characters.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-gray-800">New password
            <input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-medium focus:border-[#815633] focus:outline-none" />
          </label>
          <label className="block text-sm font-bold text-gray-800">Confirm new password
            <input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 font-medium focus:border-[#815633] focus:outline-none" />
          </label>
          <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-[#815633] py-3 font-bold text-white shadow-sm hover:bg-[#62432B] disabled:opacity-60">{isSubmitting ? 'Saving...' : 'Reset password'}</button>
        </form>
        <p className="mt-5 text-center text-sm text-gray-600"><Link to="/login" className="font-bold text-[#815633] hover:underline">Back to Sign In</Link></p>
      </div>
    </div>
  );
}
