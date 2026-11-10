import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const INITIAL_FORM = { accountName: '', accountEmail: '', registeredPhone: '', registeredDob: '', newEmail: '', accountDetails: '' };

export default function AccountRecovery() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/account-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not submit the recovery request.');
      navigate('/forgot-password', {
        replace: true,
        state: { accountRecoveryMessage: result.message || 'Your request was sent for admin review.' }
      });
    } catch (requestError) {
      setError(requestError.message || 'Could not submit the recovery request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
  const fieldClass = 'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium focus:border-[#815633] focus:outline-none';

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-3k-bg px-4 py-10">
      <main className="w-full max-w-xl rounded-2xl border border-[#C9A77C]/35 bg-[#FBFAF4] p-5 shadow-[0_18px_55px_rgba(74,52,34,0.14)] sm:p-8">
        <Link to="/forgot-password" className="mb-5 inline-flex text-sm font-bold text-[#815633] hover:underline">← Back to forgot password</Link>
        <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">Account Recovery</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">If you can&apos;t access your account email, send these details for admin review. An admin will compare them with the account information before deciding.</p>
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">Never enter your password or payment information here. If approved, the reset link will be sent to the new email address you provide.</p>
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-gray-700">Full name on account
            <input name="accountName" required maxLength={255} value={form.accountName} onChange={updateField} autoComplete="name" className={fieldClass} />
          </label>
          <label className="block text-sm font-bold text-gray-700">Email address on account
            <input name="accountEmail" type="email" required maxLength={255} value={form.accountEmail} onChange={updateField} autoComplete="email" className={fieldClass} />
          </label>
          <label className="block text-sm font-bold text-gray-700">Phone number registered to the account
            <input name="registeredPhone" type="tel" required maxLength={50} value={form.registeredPhone} onChange={updateField} autoComplete="tel" className={fieldClass} />
          </label>
          <label className="block text-sm font-bold text-gray-700">Date of birth registered to the account <span className="font-normal text-gray-400">(if added)</span>
            <input name="registeredDob" type="date" value={form.registeredDob} onChange={updateField} autoComplete="bday" className={fieldClass} />
          </label>
          <label className="block text-sm font-bold text-gray-700">New email address you can access
            <input name="newEmail" type="email" required maxLength={255} value={form.newEmail} onChange={updateField} autoComplete="email" className={fieldClass} />
          </label>
          <label className="block text-sm font-bold text-gray-700">Other details to help verify account ownership <span className="font-normal text-gray-400">(optional)</span>
            <textarea name="accountDetails" maxLength={1000} rows={4} value={form.accountDetails} onChange={updateField} placeholder="For example, approximate account creation date or recent order details" className={`${fieldClass} resize-y`} />
          </label>
          <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-[#815633] py-3 font-bold text-white shadow-md transition hover:bg-[#62432B] disabled:cursor-wait disabled:opacity-60">
            {isSubmitting ? 'Submitting...' : 'Submit for admin review'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm font-medium text-gray-600">Need to reset a password using your current email? <Link to="/forgot-password" className="font-black text-[#815633] hover:underline">Forgot Password</Link></p>
      </main>
    </div>
  );
}
