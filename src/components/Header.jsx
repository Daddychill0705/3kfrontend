import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isGuest = user?.role === 'guest' || user?.email === 'guest@3kkitchen.local';
  const canAccessKiosk = isGuest;
  const canBrowseCustomerPages = Boolean(user) && !isGuest;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path 
    ? "text-[#815633] border-b-2 border-[#815633] pb-1"
    : "text-gray-800 hover:text-[#C9A77C] transition-colors duration-300";

  const handleLogout = () => {
    logout();
    showToast('You have been logged out.');
    navigate('/login');
  };

  return (
    <header className="bg-white px-4 md:px-8 py-2 md:py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link to="/home" className="text-[1.25rem] md:text-[1.8rem] font-bold text-[#815633] tracking-[2px] no-underline hover:text-[#62432B] transition-colors">
          3K <span className="text-gray-400 font-light tracking-[0.5px] ml-1">K<span className="inline-flex h-[1em] w-[0.5em] translate-y-[0.12em] items-center align-baseline" aria-hidden="true"><svg viewBox="0 0 18 32" className="h-full w-full" fill="none"><path d="M3 2v8c0 3.8 2.4 6.2 6 6.2s6-2.4 6-6.2V2M6 2v8M9 2v8M12 2v8M9 16.2V30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>TCHEN</span>
        </Link>
        <Link to="/kiosk" className={`${canAccessKiosk ? 'hidden sm:block' : 'hidden'}`}>
          <button className="bg-gradient-to-r from-[#E6D4B8] to-[#C9A77C] text-[#815633] border border-[#815633] px-4 py-1.5 rounded-full font-black text-xs tracking-wider shadow-sm hover:shadow-md hover:scale-105 transition-all flex items-center gap-2">
            <span className="text-base">🍔</span> KIOSK UI
          </button>
        </Link>
      </div>

      <button
        type="button"
        aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileMenuOpen}
        onClick={() => setMobileMenuOpen(open => !open)}
        className="md:hidden relative z-[70] flex w-10 h-10 items-center justify-center rounded-lg text-[#4A3422] hover:bg-[#F1E7D7] transition-colors"
      >
        <span className="text-2xl leading-none">{mobileMenuOpen ? '×' : '☰'}</span>
      </button>

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-[60] bg-black/25 md:hidden"
        />
      )}

      <nav className={`fixed inset-y-0 right-0 z-[65] flex w-[min(82vw,320px)] flex-col items-stretch justify-start gap-1 overflow-y-auto rounded-l-2xl border-l border-[#C9A77C]/30 bg-[#FBFAF4] px-4 pb-5 pt-[30vh] shadow-2xl transition-transform duration-300 ease-out md:static md:inset-auto md:w-auto md:flex-row md:items-center md:justify-start md:gap-12 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:translate-x-0 md:pointer-events-auto ${mobileMenuOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'}`}>
        <Link to="/kiosk" onClick={() => setMobileMenuOpen(false)} className={`${canAccessKiosk ? 'w-full sm:hidden mb-1' : 'hidden'}`}>
          <button className="min-h-12 w-full bg-gradient-to-r from-[#E6D4B8] to-[#C9A77C] text-[#815633] border border-[#815633] px-4 py-3 rounded-md font-black text-sm md:min-h-0 md:py-2 md:text-sm tracking-wider shadow-sm flex items-center justify-center gap-2">
            <span className="text-sm md:text-base">🍔</span> ENTER KIOSK UI
          </button>
        </Link>
        
        <Link to="/home" onClick={() => setMobileMenuOpen(false)} className={`min-h-12 w-full px-4 py-3 text-left text-base md:min-h-0 md:w-auto md:px-0 md:py-0 md:text-center md:text-base font-medium ${isActive('/home')}`}>Home</Link>
        {canBrowseCustomerPages && (
          <Link to="/menu" onClick={() => setMobileMenuOpen(false)} className={`min-h-12 w-full px-4 py-3 text-left text-base md:min-h-0 md:w-auto md:px-0 md:py-0 md:text-center md:text-base font-medium ${isActive('/menu')}`}>Menu</Link>
        )}
        
        {canBrowseCustomerPages ? (
          <>
            <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className={`min-h-12 w-full px-4 py-3 text-left text-base md:min-h-0 md:w-auto md:px-0 md:py-0 md:text-center md:text-base font-medium ${isActive('/cart')}`}>Cart ({cartCount})</Link>
            <Link to="/order" onClick={() => setMobileMenuOpen(false)} className={`min-h-12 w-full px-4 py-3 text-left text-base md:min-h-0 md:w-auto md:px-0 md:py-0 md:text-center md:text-base font-medium ${isActive('/order')}`}>Orders</Link>
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className={`min-h-12 w-full px-4 py-3 text-left text-base md:min-h-0 md:w-auto md:px-0 md:py-0 md:text-center md:text-base font-medium ${isActive('/profile')}`}>Profile</Link>
            <button onClick={handleLogout} className="min-h-12 w-full px-4 py-3 text-left text-base md:min-h-0 md:w-auto md:px-0 md:py-0 md:text-center md:text-base text-gray-600 hover:text-[#62432B] font-medium cursor-pointer transition-colors duration-300">Logout</button>
          </>
        ) : (
          <>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className={`min-h-12 w-full px-4 py-3 text-left text-base md:min-h-0 md:w-auto md:px-0 md:py-0 md:text-center md:text-base font-medium ${isActive('/about')}`}>About</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className={`min-h-12 w-full px-4 py-3 text-left text-base md:min-h-0 md:w-auto md:px-0 md:py-0 md:text-center md:text-base font-medium ${isActive('/contact')}`}>Contact</Link>
            {!user && (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full md:w-auto mt-4 md:mt-0">
                <button className="min-h-12 border-[1.5px] border-[#4A3422] px-6 py-3 rounded-md cursor-pointer text-base md:min-h-0 md:py-2 md:text-sm font-semibold transition-all duration-300 bg-transparent text-[#4A3422] hover:bg-[#C9A77C] hover:border-[#C9A77C] hover:text-white w-full md:w-auto">
                  Sign In
                </button>
              </Link>
            )}
            {isGuest && (
              <button
                onClick={handleLogout}
                className="min-h-12 w-full px-4 py-3 text-left text-base md:min-h-0 md:w-auto md:px-0 md:py-0 md:text-center md:text-base text-gray-600 hover:text-[#62432B] font-medium cursor-pointer transition-colors duration-300"
              >
                Log out
              </button>
            )}
          </>
        )}
      </nav>
    </header>
  );
}
