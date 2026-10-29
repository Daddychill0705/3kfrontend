import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  const isActive = (path) => location.pathname === path 
    ? "text-[#E39A7B] border-b-2 border-[#E39A7B] pb-1" 
    : "text-gray-800 hover:text-[#FFB5AB] transition-colors duration-300";

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white px-4 md:px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link to="/home" className="text-[1.8rem] font-bold text-[#E39A7B] tracking-[2px] no-underline hover:text-[#DBB06B] transition-colors">
          3K <span className="text-gray-400 font-light tracking-[0.5px] ml-1">KITCHEN</span>
        </Link>
        <Link to="/kiosk" className="hidden sm:block">
          <button className="bg-gradient-to-r from-[#FFD3AC] to-[#FFB5AB] text-[#E39A7B] border border-[#E39A7B] px-4 py-1.5 rounded-full font-black text-xs tracking-wider shadow-sm hover:shadow-md hover:scale-105 transition-all flex items-center gap-2">
            <span className="text-base">🍔</span> KIOSK UI
          </button>
        </Link>
      </div>

      <input type="checkbox" id="menu-toggle" className="hidden peer" />
      <label htmlFor="menu-toggle" className="md:hidden flex flex-col cursor-pointer gap-1 z-50 hover:opacity-70">
        <span className="w-6 h-[3px] bg-gray-800 transition-all duration-300 peer-checked:rotate-45 peer-checked:translate-y-[6px]"></span>
        <span className="w-6 h-[3px] bg-gray-800 transition-all duration-300 peer-checked:opacity-0"></span>
        <span className="w-6 h-[3px] bg-gray-800 transition-all duration-300 peer-checked:-rotate-45 peer-checked:-translate-y-[6px]"></span>
      </label>

      <nav className="absolute md:static top-full left-0 w-full md:w-auto bg-white flex-col md:flex-row gap-4 md:gap-12 p-4 md:p-0 shadow-md md:shadow-none hidden peer-checked:flex md:flex items-center transition-all">
        <Link to="/kiosk" className="w-full sm:hidden mb-2">
          <button className="w-full bg-gradient-to-r from-[#FFD3AC] to-[#FFB5AB] text-[#E39A7B] border border-[#E39A7B] px-4 py-2 rounded-lg font-black text-sm tracking-wider shadow-sm flex items-center justify-center gap-2">
            <span className="text-base">🍔</span> ENTER KIOSK UI
          </button>
        </Link>
        
        <Link to="/home" className={`text-base font-medium ${isActive('/home')}`}>Home</Link>
        <Link to="/menu" className={`text-base font-medium ${isActive('/menu')}`}>Menu</Link>
        
        {user ? (
          <>
            <Link to="/cart" className={`text-base font-medium ${isActive('/cart')}`}>Cart ({cartCount})</Link>
            <Link to="/order" className={`text-base font-medium ${isActive('/order')}`}>Orders</Link>
            <Link to="/profile" className={`text-base font-medium ${isActive('/profile')}`}>Profile</Link>
            <button onClick={handleLogout} className="text-gray-600 hover:text-[#DBB06B] font-medium cursor-pointer transition-colors duration-300">Logout</button>
          </>
        ) : (
          <>
            <Link to="/about" className={`text-base font-medium ${isActive('/about')}`}>About</Link>
            <Link to="/contact" className={`text-base font-medium ${isActive('/contact')}`}>Contact</Link>
            <Link to="/login">
              <button className="border-[1.5px] border-gray-800 px-6 py-2 rounded-md cursor-pointer text-sm font-semibold transition-all duration-300 bg-transparent text-gray-800 hover:bg-[#FFB5AB] hover:border-[#FFB5AB] hover:text-white w-full md:w-auto mt-2 md:mt-0">
                Sign In
              </button>
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}