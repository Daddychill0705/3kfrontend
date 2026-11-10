import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Notification State
  const [notification, setNotification] = useState(null);

  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const categories = ['ALL', '3k Ala-Carte', '3k Originals', '3k Specials', '3k Budget Meals', 'Rice and Extras', '3k Sets/Extras'];
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${API_URL}/api/menu`);
        if (response.ok) {
          const data = await response.json();
          setMenuItems(data);
        }
      } catch (error) {
        console.error('Failed to load menu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [API_URL]);

  const filteredItems = activeCategory === 'ALL'
     ? menuItems
     : menuItems.filter(item => item.category === activeCategory);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Identify if the user is completely logged out OR using the guest account
  const isGuest = !user || user?.email === 'guest@3kkitchen.local';

  const handleAddToCart = (item) => {
    if (item.is_sold_out) return;
    
    // Check if user is a guest or logged out
    if (isGuest) {
      showNotification("You must be logged in or create an account first to add items to your cart.");
      return;
    }

    addToCart({ ...item, qty: 1 });
    showNotification(`${item.name} added to cart!`);
  };

  const handleBuyNow = (item) => {
    if (item.is_sold_out) return;
    
    // Check if user is a guest or logged out
    if (isGuest) {
      showNotification("You must be logged in or create an account first to place an order.");
      setTimeout(() => navigate('/login'), 2000); // Redirect after showing the message
      return;
    }

    addToCart({ ...item, qty: 1 });
    navigate('/checkout');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading Menu...</div>;

  return (
    <div className="bg-3k-bg min-h-screen pb-16 relative">
      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100vw-1.5rem)] max-w-[360px] bg-gray-900 text-white px-4 sm:px-6 py-3 rounded-2xl shadow-xl font-bold text-sm z-50 animate-fade-in flex items-center justify-center gap-2 text-center leading-snug">
          <span className="shrink-0">🔔</span>
          <span className="min-w-0 break-words">{notification}</span>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto py-8 sm:py-16 px-3 sm:px-4 md:px-8">
        <div className="text-center mb-7 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-[2.5rem] font-bold text-gray-900 mb-3 sm:mb-4">Our Menu</h1>
          <p className="text-sm sm:text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto font-medium">
            Discover our handcrafted Filipino comfort food, made with love and authentic ingredients from GMA Cavite.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer shadow-sm
                ${activeCategory === category 
                   ? 'bg-[#815633] text-white shadow-md scale-105 border border-[#815633]'
                   : 'bg-white text-gray-700 border border-gray-200 hover:border-[#815633] hover:text-[#815633]'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {filteredItems.map(item => (
            <div className={`bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm sm:shadow-md sm:transition-all sm:duration-300 flex flex-col border border-transparent ${item.is_sold_out ? 'opacity-60 grayscale' : 'sm:hover:-translate-y-1.5 sm:hover:shadow-xl sm:hover:border-[#C9A77C]'}`} key={item.id}>
              
              <div className="h-28 sm:h-[220px] bg-[#E6D4B8]/30 flex items-center justify-center relative overflow-hidden">
                <img 
                  src={item.image_url?.startsWith('http') ? item.image_url : (item.image_url?.startsWith('/') ? item.image_url : `${API_URL}${item.image_url}`)} 
                  alt={item.name} 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover sm:transition-transform sm:duration-500 sm:hover:scale-110"
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="text-6xl opacity-40">🍽️</div>'; }}
                />
                <div className="absolute top-2 left-2 max-w-[calc(100%-1rem)] truncate bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-xs font-bold text-[#815633] shadow-sm">
                  {item.category}
                </div>
                {item.is_sold_out ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                     <span className="bg-red-500 text-white font-black px-6 py-2 rounded-lg tracking-widest uppercase transform -rotate-12 shadow-xl border-2 border-red-600">Sold Out</span>
                  </div>
                ) : null}
              </div>
              
              <div className="p-3 sm:p-6 flex flex-col flex-grow">
                <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-2 leading-snug line-clamp-2 min-h-[2.5rem] sm:min-h-0">{item.name}</h3>
                <div className="flex-grow"></div>
                <div className="text-lg sm:text-2xl font-black text-[#815633] mb-2 sm:mb-5 mt-2 sm:mt-4">
                  ₱{parseFloat(item.price).toFixed(2)}
                </div>
                
                <div className="flex flex-col gap-1.5 sm:gap-2 mt-auto">
                  <button 
                    onClick={() => handleAddToCart(item)}
                    disabled={item.is_sold_out}
                    className={`w-full py-2 sm:py-3 rounded-lg text-[11px] sm:text-sm font-bold transition-all duration-300 ${item.is_sold_out ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#E6D4B8]/20 text-gray-900 border-[1.5px] border-[#815633] hover:bg-[#815633] hover:text-white'}`}
                  >
                    Add to Cart
                  </button>
                  <button 
                    onClick={() => handleBuyNow(item)}
                    disabled={item.is_sold_out}
                    className={`w-full py-2 sm:py-3 rounded-lg text-[11px] sm:text-sm font-bold transition-all duration-300 shadow-sm ${item.is_sold_out ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#815633] text-white border border-transparent hover:bg-[#62432B]'}`}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
