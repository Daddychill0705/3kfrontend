import React, { useEffect, useRef } from 'react';

export default function SuccessModal({ message, onClose, title = 'Done', duration = 3000 }) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onCloseRef.current?.(), duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  if (!message) return null;

  return (
    <div className="success-feedback-overlay fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <section
        role="status"
        aria-modal="true"
        aria-live="polite"
        aria-atomic="true"
        aria-labelledby="success-modal-title"
        aria-describedby="success-modal-message"
        className="success-feedback-panel w-full max-w-md rounded-[2rem] border border-white/70 bg-[#fffdf8] px-7 py-8 text-center shadow-2xl sm:px-10 sm:py-10"
      >
        <div className="success-feedback-ring mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-emerald-600 text-emerald-600 sm:h-32 sm:w-32" aria-hidden="true">
          <svg viewBox="0 0 64 64" className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" fill="none">
            <path className="success-feedback-check" d="m12 33 14 14L53 18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 id="success-modal-title" className="mb-4 text-3xl font-semibold text-emerald-700">{title}</h2>
        <p id="success-modal-message" className="mx-auto max-w-sm text-lg leading-8 text-gray-700">{message}</p>
        <div className="mx-auto mt-7 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-emerald-100" aria-hidden="true"><div className="success-feedback-progress h-full rounded-full bg-emerald-600" style={{ animationDuration: `${duration}ms` }} /></div>
      </section>
    </div>
  );
}
