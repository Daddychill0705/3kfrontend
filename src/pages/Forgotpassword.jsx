import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';

export default function ForgotPassword() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [recoveryForm, setRecoveryForm] = useState({ accountName: '', accountEmail: '', registeredPhone: '', registeredDob: '', newEmail: '', accountDetails: '' });
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [isRecoverySubmitting, setIsRecoverySubmitting] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not send the reset email.');
      setMessage(result.message || 'If an account exists for that email, a reset link has been sent.');
    } catch (requestError) {
      setError(requestError.message || 'Could not send the reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRecoveryRequest = async event => {
    event.preventDefault();
    setIsRecoverySubmitting(true);
    setRecoveryMessage('');
    setRecoveryError('');
    try {
      const response = await fetch(`${API_URL}/api/account-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recoveryForm)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not submit the recovery request.');
      setRecoveryMessage(result.message || 'Your request was sent for admin review.');
      setRecoveryForm({ accountName: '', accountEmail: '', registeredPhone: '', registeredDob: '', newEmail: '', accountDetails: '' });
    } catch (requestError) {
      setRecoveryError(requestError.message || 'Could not submit the recovery request. Please try again.');
    } finally {
      setIsRecoverySubmitting(false);
    }
  };

  const updateRecoveryField = event => setRecoveryForm(previous => ({ ...previous, [event.target.name]: event.target.value }));

  return (
    <div className="grid min-h-[calc(100vh-80px)] grid-cols-1 bg-3k-bg lg:grid-cols-2">
      <div className="z-10 order-2 flex flex-col items-center justify-center border-r border-[#C9A77C]/20 bg-white px-6 py-12 shadow-xl lg:order-1">
        <div className="w-full max-w-[400px]">
          <h1 className="mb-2 text-3xl font-extrabold text-gray-900">Forgot Password</h1>
          <p className="mb-8 text-sm font-medium leading-relaxed text-gray-600">Enter your email address and we&apos;ll send you a link to reset your password.</p>
          {message && <p role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">{message}</p>}
          {error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <form onSubmit={submit}>
            <div className="mb-8">
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-gray-800">Email Address</label>
              <input type="email" id="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" required autoComplete="email" className="w-full rounded-lg border border-gray-300 px-4 py-3 font-medium transition-all focus:border-[#815633] focus:outline-none focus:ring-2 focus:ring-[#815633]/20" />
            </div>
            <button type="submit" disabled={isSubmitting} className="mb-8 w-full rounded-lg bg-3k-red py-3 font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-3k-red-hover disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mb-6 border-t border-[#C9A77C]/25 pt-5 text-center">
            <button type="button" onClick={() => { setShowRecoveryForm(open => !open); setRecoveryError(''); setRecoveryMessage(''); }} aria-expanded={showRecoveryForm} className="text-center text-sm font-bold text-[#815633] underline decoration-[#C9A77C] underline-offset-4 hover:text-[#62432B]">
              I don&apos;t have access to this account
            </button>
            {showRecoveryForm && (
              <form onSubmit={submitRecoveryRequest} className="mt-5 space-y-4 rounded-xl border border-[#C9A77C]/30 bg-[#FBFAF4] p-4">
                <div>
                  <h2 className="font-black text-gray-900">Account recovery request</h2>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">An admin will compare these details with your account. Never enter your password or payment information here.</p>
                </div>
                {recoveryMessage && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-800">{recoveryMessage}</p>}
                {recoveryError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{recoveryError}</p>}
                <label className="block text-xs font-bold text-gray-700">Full name on account
                  <input name="accountName" required maxLength={255} value={recoveryForm.accountName} onChange={updateRecoveryField} autoComplete="name" className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium focus:border-[#815633] focus:outline-none" />
                </label>
                <label className="block text-xs font-bold text-gray-700">Email address on account
                  <input name="accountEmail" type="email" required value={recoveryForm.accountEmail} onChange={updateRecoveryField} autoComplete="email" className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium focus:border-[#815633] focus:outline-none" />
                </label>
                <label className="block text-xs font-bold text-gray-700">Phone number registered to the account
                  <input name="registeredPhone" type="tel" required maxLength={50} value={recoveryForm.registeredPhone} onChange={updateRecoveryField} autoComplete="tel" className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium focus:border-[#815633] focus:outline-none" />
                </label>
                <label className="block text-xs font-bold text-gray-700">Date of birth registered to the account
                  <input name="registeredDob" type="date" value={recoveryForm.registeredDob} onChange={updateRecoveryField} autoComplete="bday" className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium focus:border-[#815633] focus:outline-none" />
                </label>
                <label className="block text-xs font-bold text-gray-700">New email address you can access
                  <input name="newEmail" type="email" required value={recoveryForm.newEmail} onChange={updateRecoveryField} autoComplete="email" className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium focus:border-[#815633] focus:outline-none" />
                </label>
                <label className="block text-xs font-bold text-gray-700">Other details to help verify account ownership
                  <textarea name="accountDetails" maxLength={1000} rows={3} value={recoveryForm.accountDetails} onChange={updateRecoveryField} placeholder="For example, approximate account creation date or recent order details" className="mt-1.5 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium focus:border-[#815633] focus:outline-none" />
                </label>
                <button type="submit" disabled={isRecoverySubmitting} className="w-full rounded-lg bg-[#815633] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#62432B] disabled:cursor-wait disabled:opacity-60">
                  {isRecoverySubmitting ? 'Submitting...' : 'Submit for admin review'}
                </button>
              </form>
            )}
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
