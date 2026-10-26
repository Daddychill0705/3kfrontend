import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const handleAddToCart = (item) => {
    if (item.is_sold_out) return;
    addToCart({ ...item, qty: 1 });
    alert(`${item.name} added to cart!`);
  };

  const handleBuyNow = (item) => {
    if (item.is_sold_out) return;
    addToCart({ ...item, qty: 1 });
    if (!user) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading Menu...</div>;

  return (
    <div className="bg-3k-bg min-h-screen pb-16">
      <div className="max-w-[1400px] mx-auto py-16 px-4 md:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-[2.5rem] font-bold text-gray-900 mb-4">Our Menu</h1>
          <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto font-medium">
            Discover our handcrafted Filipino comfort food, made with love and authentic ingredients from GMA Cavite.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer shadow-sm
                ${activeCategory === category 
                  ? 'bg-[#E39A7B] text-white shadow-md scale-105 border border-[#E39A7B]' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-[#E39A7B] hover:text-[#E39A7B]'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.map(item => (
            <div className={`bg-white rounded-2xl overflow-hidden shadow-md transition-all duration-300 flex flex-col border border-transparent ${item.is_sold_out ? 'opacity-60 grayscale' : 'hover:-translate-y-1.5 hover:shadow-xl hover:border-[#FFB5AB]'}`} key={item.id}>
              
              <div className="h-[220px] bg-[#FFD3AC]/30 flex items-center justify-center relative overflow-hidden">
                <img 
                  src={item.image_url?.startsWith('http') ? item.image_url : (item.image_url?.startsWith('/') ? item.image_url : `${API_URL}${item.image_url}`)} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="text-6xl opacity-40">🍽️</div>'; }}
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#E39A7B] shadow-sm">
                  {item.category}
                </div>
                {item.is_sold_out ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                     <span className="bg-red-500 text-white font-black px-6 py-2 rounded-lg tracking-widest uppercase transform -rotate-12 shadow-xl border-2 border-red-600">Sold Out</span>
                  </div>
                ) : null}
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{item.name}</h3>
                <div className="flex-grow"></div>
                <div className="text-2xl font-black text-[#E39A7B] mb-5 mt-4">
                  ₱{parseFloat(item.price).toFixed(2)}
                </div>
                
                <div className="flex flex-col gap-2 mt-auto">
                  <button 
                    onClick={() => handleAddToCart(item)}
                    disabled={item.is_sold_out}
                    className={`w-full py-3 rounded-lg text-sm font-bold transition-all duration-300 ${item.is_sold_out ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#FFD3AC]/20 text-gray-900 border-[1.5px] border-[#E39A7B] hover:bg-[#E39A7B] hover:text-white'}`}
                  >
                    Add to Cart
                  </button>
                  <button 
                    onClick={() => handleBuyNow(item)}
                    disabled={item.is_sold_out}
                    className={`w-full py-3 rounded-lg text-sm font-bold transition-all duration-300 shadow-sm ${item.is_sold_out ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#E39A7B] text-white border border-transparent hover:bg-[#DBB06B]'}`}
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