import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const dismissToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setToast(null);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ id: Date.now(), message, type });
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex justify-center px-4 sm:justify-end sm:px-6" aria-live="polite" aria-atomic="true">
          <div className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-xl shadow-black/10 ${toast.type === 'error' ? 'border-red-300' : 'border-emerald-300'}`} role="status">
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black ${toast.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`} aria-hidden="true">
              {toast.type === 'error' ? '!' : '✓'}
            </span>
            <p className={`flex-1 text-sm font-semibold leading-5 ${toast.type === 'error' ? 'text-red-800' : 'text-emerald-800'}`}>{toast.message}</p>
            <button type="button" onClick={dismissToast} aria-label="Dismiss notification" className="-mr-1 -mt-1 rounded-md px-2 py-1 text-lg leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700">×</button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider.');
  return context;
}
