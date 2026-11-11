import React from 'react';

export default function SuccessModal({ message, onClose, title = 'Oh Yeah!' }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="success-modal-title"
        aria-describedby="success-modal-message"
        className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white px-7 py-8 text-center shadow-2xl sm:px-10 sm:py-10"
        onClick={event => event.stopPropagation()}
      >
        <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-emerald-600 text-emerald-600 sm:h-32 sm:w-32" aria-hidden="true">
          <svg viewBox="0 0 64 64" className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" fill="none">
            <path d="m12 33 14 14L53 18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 id="success-modal-title" className="mb-4 text-3xl font-medium text-emerald-700">{title}</h2>
        <p id="success-modal-message" className="mx-auto mb-8 max-w-sm text-lg leading-8 text-gray-700">{message}</p>
        <button type="button" autoFocus onClick={onClose} className="rounded-lg bg-emerald-700 px-7 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200">
          OK
        </button>
      </section>
    </div>
  );
}
