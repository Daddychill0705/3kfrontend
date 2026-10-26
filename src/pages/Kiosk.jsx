import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';

export default function Kiosk() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const navigate = useNavigate();

  const categories = [
    { id: 'ALL', icon: '🍽️', label: 'All' },
    { id: '3k Ala-Carte', icon: '🥘', label: 'Ala-Carte' },
    { id: '3k Originals', icon: '🍜', label: 'Originals' },
    { id: '3k Specials', icon: '🍲', label: 'Specials' },
    { id: '3k Budget Meals', icon: '🍛', label: 'Budget' },
    { id: 'Rice and Extras', icon: '🍚', label: 'Extras' },
    { id: '3k Sets/Extras', icon: '🍗', label: 'Sets' }
  ];

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/menu');
        if (response.ok) setMenuItems(await response.json());
      } catch (error) {
        console.error('Failed to load menu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const filteredItems = activeCategory === 'ALL' ? menuItems : menuItems.filter(item => item.category === activeCategory);

  const addToCart = (item) => {
    if (item.is_sold_out) return;
    setCart(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (id) => setCart(prev => prev.filter(item => item.id !== id));
  
  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);

    let token = localStorage.getItem('token');
    if (!token) {
      try {
        const res = await fetch('http://localhost:5000/api/guest', { method: 'POST' });
        const data = await res.json();
        token = data.token;
      } catch (e) {
        alert("Failed to initialize guest session.");
        setCheckoutLoading(false);
        return;
      }
    }

    const submitData = new FormData();
    submitData.append('items', JSON.stringify(cart));
    submitData.append('totalAmount', cartTotal);
    submitData.append('orderType', 'Dine-in'); 
    submitData.append('branch', 'GMA Terminal'); 
    submitData.append('paymentMethod', 'Cash on delivery'); 

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: submitData
      });

      if (!response.ok) throw new Error('Checkout failed');
      
      setCart([]);
      setIsCartOpen(false);
      alert('Order placed successfully! Please proceed to the counter to pay.');
    } catch (error) {
      alert(error.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-gray-500">Loading Kiosk System...</div>;

  return (
    <div className="h-screen w-full bg-3k-bg flex flex-col font-sans overflow-hidden relative">
      <div className="flex justify-between items-center p-4 md:px-8 shrink-0 bg-white/50 backdrop-blur-md shadow-sm border-b border-[#FFB5AB]/30 z-20">
        <div className="flex items-center gap-4">
          <img src={logoImg} alt="3K Kitchen" className="w-12 h-12 md:w-16 md:h-16 rounded-full shadow-md border-2 border-white" />
          <h1 className="text-xl md:text-2xl font-black text-[#E39A7B] tracking-widest uppercase hidden sm:block">3K Kiosk</h1>
        </div>
        <div className="hidden md:flex flex-1 max-w-xl mx-8 bg-gradient-to-r from-white to-[#FFD3AC]/50 border border-[#FFB5AB]/40 rounded-full h-12 items-center justify-center shadow-sm">
           <p className="text-[#E39A7B] font-bold text-sm tracking-widest uppercase">✨ Welcome to 3K Kitchen ✨</p>
        </div>
        <Link to="/home">
          <button className="bg-white text-red-500 border-2 border-red-200 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm shadow-sm hover:bg-red-50 hover:border-red-300 transition-colors uppercase tracking-wider">
            Cancel Order
          </button>
        </Link>
      </div>

      <div className="flex-1 flex flex-row overflow-hidden p-4 md:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto w-full relative z-10">
        <div className="w-32 md:w-56 shrink-0 flex flex-col h-full bg-white/40 p-2 md:p-3 rounded-3xl shadow-sm border border-[#FFB5AB]/20">
          <h2 className="text-xs md:text-sm font-black text-gray-700 uppercase tracking-widest mb-4 pl-2 text-center md:text-left mt-2">Categories</h2>
          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-3 pb-32 pr-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-4 md:px-6 md:py-5 rounded-2xl text-xs md:text-sm font-bold transition-all duration-300 cursor-pointer text-center md:text-left shadow-sm border flex flex-col md:flex-row items-center gap-2
                  ${activeCategory === category.id ? 'bg-[#E39A7B] text-white shadow-md md:scale-105 border-[#E39A7B]' : 'bg-white text-gray-700 border-[#FFB5AB]/30 hover:border-[#E39A7B] hover:text-[#E39A7B]'}`}
              >
                <span className="text-xl md:text-2xl">{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="flex justify-between items-center mb-6 pl-2">
             <h2 className="text-2xl md:text-4xl font-black text-gray-900 drop-shadow-sm tracking-tight">
               {activeCategory === 'ALL' ? 'Full Menu' : categories.find(c => c.id === activeCategory)?.label}
             </h2>
             <p className="text-sm font-bold text-gray-500 bg-white/60 px-4 py-1.5 rounded-full shadow-sm">{filteredItems.length} items</p>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar pb-32">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pr-2">
              {filteredItems.map(item => (
                <div className={`bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 group flex flex-col border border-transparent ${item.is_sold_out ? 'opacity-60 grayscale' : 'hover:-translate-y-1.5 hover:shadow-lg hover:border-[#FFB5AB]'}`} key={item.id}>
                  <div className="h-[160px] md:h-[200px] bg-[#FFD3AC]/30 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={item.image_url.startsWith('/') ? item.image_url : `http://localhost:5000${item.image_url}`} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="text-6xl opacity-40">🍽️</div>'; }}
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] md:text-xs font-bold text-[#E39A7B] shadow-sm max-w-[80%] truncate">
                      {item.category}
                    </div>
                    {item.is_sold_out && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                         <span className="bg-red-500 text-white font-black px-4 py-1 rounded-lg tracking-widest uppercase transform -rotate-12 border border-red-600">Sold Out</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 md:p-6 flex flex-col flex-grow">
                    <h3 className="text-base md:text-xl font-bold text-gray-900 mb-2 leading-tight">{item.name}</h3>
                    <div className="flex-grow"></div>
                    <div className="text-xl md:text-2xl font-black text-[#E39A7B] mb-4 mt-2">₱{parseFloat(item.price).toFixed(2)}</div>
                    <button 
                      onClick={() => addToCart(item)}
                      disabled={item.is_sold_out}
                      className={`w-full py-3 rounded-lg text-sm font-bold transition-all duration-300 shadow-sm ${item.is_sold_out ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent' : 'bg-[#E39A7B] text-white border-transparent hover:bg-[#DBB06B] hover:shadow-md hover:-translate-y-0.5'}`}
                    >
                      Add to Order
                    </button>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white/50 rounded-3xl">
                  <h3 className="text-xl text-[#E39A7B] font-bold">No items found in this category.</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-[#FFB5AB]/40 shadow-[0_-10px_40px_rgba(227,154,123,0.2)] z-20 p-4 md:p-6 flex justify-center">
         <div className="max-w-[1400px] w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setIsCartOpen(true)}>
               <div className="relative w-14 h-14 md:w-16 md:h-16 bg-[#FFD3AC]/40 rounded-full flex items-center justify-center border-2 border-[#E39A7B] text-2xl shadow-sm hover:bg-[#FFD3AC] transition-colors">
                 🛒
                 <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center shadow-md animate-pulse">
                   {cartCount}
                 </span>
               </div>
               <div className="hidden sm:block">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Tray</p>
                 <p className="text-sm font-medium text-gray-800 hover:text-[#E39A7B] transition-colors">{cartCount} items selected</p>
               </div>
            </div>
            <div className="flex items-center gap-4 md:gap-10">
               <div className="text-right">
                 <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Amount</p>
                 <p className="text-2xl md:text-4xl font-black text-[#E39A7B] leading-none">₱{cartTotal.toFixed(2)}</p>
               </div>
               <button 
                 onClick={() => setIsCartOpen(true)}
                 className="bg-[#E39A7B] hover:bg-[#DBB06B] text-white px-6 md:px-12 py-3 md:py-5 rounded-full font-black text-sm md:text-xl tracking-wide shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 uppercase border-2 border-transparent"
               >
                 View My Tray
               </button>
            </div>
         </div>
      </div>

      <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm cursor-pointer" onClick={() => setIsCartOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-full sm:w-[450px] bg-[#fffaf7] shadow-2xl flex flex-col transition-transform duration-500 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 bg-white border-b border-[#FFB5AB]/30 flex justify-between items-center shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧾</span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Your Tray</h2>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 bg-gray-100 text-gray-500 hover:bg-[#FFB5AB] hover:text-white rounded-full flex items-center justify-center text-xl font-bold transition-colors">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 hide-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <span className="text-6xl opacity-50">🍽️</span>
                <p className="font-bold text-lg">Your tray is empty.</p>
                <button onClick={() => setIsCartOpen(false)} className="text-[#E39A7B] font-bold text-sm hover:underline">Start adding food</button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-[#FFB5AB]/30 flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#FFD3AC]/30 shrink-0">
                    <img src={item.image_url?.startsWith('/') ? item.image_url : `http://localhost:5000${item.image_url}`} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1 pr-4">{item.name}</h4>
                    <p className="text-[#E39A7B] font-black text-sm">₱{(parseFloat(item.price) * item.qty).toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors text-xs font-bold uppercase tracking-wider">Remove</button>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-200 p-1 mt-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center font-bold text-gray-600 hover:text-[#E39A7B] hover:border-[#E39A7B] border border-transparent transition-colors">-</button>
                      <span className="font-black text-sm w-4 text-center text-gray-800">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center font-bold text-gray-600 hover:text-[#E39A7B] hover:border-[#E39A7B] border border-transparent transition-colors">+</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-6 bg-white border-t border-[#FFB5AB]/40 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Grand Total</span>
              <span className="text-3xl font-black text-[#E39A7B]">₱{cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkoutLoading}
              className={`w-full py-4 rounded-2xl font-black text-lg shadow-md transition-all duration-300 uppercase tracking-wide
                ${cart.length > 0 && !checkoutLoading ? 'bg-[#E39A7B] hover:bg-[#DBB06B] text-white hover:-translate-y-1' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {checkoutLoading ? 'Processing...' : 'Send to Kitchen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}