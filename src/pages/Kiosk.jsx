import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';

export default function Kiosk() {
  // Flow States
  const [kioskBranch, setKioskBranch] = useState(localStorage.getItem('kiosk_active_branch') || '');
  const [orderType, setOrderType] = useState(''); // 'Dine-in' or 'Take-out'
  const [branches, setBranches] = useState([]);
  const [customerName, setCustomerName] = useState('');
  
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const categories = [
    { id: 'ALL', icon: '🍽️', label: 'All' },
    { id: '3k Ala-Carte', icon: '🍗', label: 'Ala-Carte' },
    { id: '3k Originals', icon: '🥘', label: 'Originals' },
    { id: '3k Specials', icon: '🥩', label: 'Specials' },
    { id: '3k Budget Meals', icon: '🍱', label: 'Budget' },
    { id: 'Rice and Extras', icon: '🍚', label: 'Extras' },
    { id: '3k Sets/Extras', icon: '🥟', label: 'Sets' }
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [menuRes, branchRes] = await Promise.all([
          fetch(`${API_URL}/api/menu`),
          fetch(`${API_URL}/api/branches`)
        ]);
        
        if (menuRes.ok) setMenuItems(await menuRes.json());
        if (branchRes.ok) {
          const branchData = await branchRes.json();
          setBranches(branchData.filter(b => b.is_active));
        }
      } catch (error) { 
        console.error('Failed to load initial kiosk data:', error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchInitialData();
  }, [API_URL]);

  const filteredItems = activeCategory === 'ALL' ? menuItems : menuItems.filter(item => item.category === activeCategory);

  const addToCart = (item) => {
    if (item.is_sold_out) return;
    setCart(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
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
    
    // Require the Kiosk user to enter their name so the Cashier isn't confused
    if (!customerName.trim()) {
      alert("Please enter your name for the order receipt.");
      return;
    }

    setCheckoutLoading(true);
    try {
      // Kiosk walk-ins always use a guest session, regardless of any staff/customer login in this browser.
      const guestResponse = await fetch(`${API_URL}/api/guest`, { method: 'POST' });
      const guestData = await guestResponse.json().catch(() => ({}));
      if (!guestResponse.ok || !guestData.token) {
        throw new Error(guestData.error || 'Could not start a kiosk guest session. Please try again.');
      }

      const payload = {
        items: JSON.stringify(cart),
        totalAmount: cartTotal,
        orderType,
        branch: kioskBranch,
        paymentMethod: 'Cash on delivery',
        address: `Kiosk Customer: ${customerName.trim()}`,
        phone: '',
        notes: ''
      };

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${guestData.token}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = responseData.error || `Checkout failed (HTTP ${response.status}).`;
        throw new Error(responseData.code ? `${message} (${responseData.code})` : message);
      }
      
      setCart([]);
      setIsCartOpen(false);
      setSuccessOrder({ id: responseData.orderId, customerName: customerName.trim() });
    } catch (error) { alert(error.message); } 
    finally { setCheckoutLoading(false); }
  };

  const handleCancel = () => {
    setCart([]);
    setOrderType('');
    setCustomerName('');
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-gray-500">Loading Kiosk System...</div>;

  // 1. ORDER TYPE SELECTION SCREEN (No Password Lock)
  if (!orderType) {
    return (
      <div className="min-h-screen bg-[#F5EFE3] flex flex-col items-center justify-center p-4 font-sans relative">
        <button onClick={() => navigate('/home')} className="absolute top-8 left-8 text-sm font-bold text-gray-400 hover:text-gray-900 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm transition-all">
          ← Back to website
        </button>
        
        <div className="absolute top-8 right-8 flex items-center gap-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Branch:</label>
          <select 
            value={kioskBranch} 
            onChange={(e) => {
              setKioskBranch(e.target.value);
              localStorage.setItem('kiosk_active_branch', e.target.value);
            }} 
            className="bg-white border border-gray-200 text-gray-700 text-sm font-bold py-2 px-4 rounded-lg shadow-sm focus:outline-none focus:border-[#815633] cursor-pointer"
          >
            <option value="">Select a branch...</option>
            {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
        </div>
        
        <img src={logoImg} alt="3K Kitchen" className="w-24 h-24 rounded-full mb-8 shadow-md border-2 border-white animate-[bounce_3s_ease-in-out_infinite]" />
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-12 tracking-tight">Dine in or take out?</h1>
        
        <div className="flex flex-col sm:flex-row gap-6">
          <button onClick={() => {
             if (!kioskBranch) return alert("Please select a branch at the top right first.");
             setOrderType('Dine-in');
          }} className="bg-white p-10 rounded-3xl shadow-lg border border-[#C9A77C]/30 hover:border-[#815633] hover:shadow-xl hover:-translate-y-2 transition-all flex flex-col items-center gap-4 w-56">
            <div className="w-20 h-20 bg-[#E6D4B8]/40 rounded-full flex items-center justify-center text-4xl border-2 border-[#815633]">🏪</div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">Dine in</h2>
              <p className="text-xs font-bold text-gray-500 mt-1">Eat here at the terminal</p>
            </div>
          </button>
          
          <button onClick={() => {
             if (!kioskBranch) return alert("Please select a branch at the top right first.");
             setOrderType('Take-out');
          }} className="bg-white p-10 rounded-3xl shadow-lg border border-[#C9A77C]/30 hover:border-[#815633] hover:shadow-xl hover:-translate-y-2 transition-all flex flex-col items-center gap-4 w-56">
            <div className="w-20 h-20 bg-[#E6D4B8]/40 rounded-full flex items-center justify-center text-4xl border-2 border-[#815633]">🛍️</div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">Take out</h2>
              <p className="text-xs font-bold text-gray-500 mt-1">Pack it to go</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // 2. MAIN MENU SCREEN
  return (
    <div className="h-screen w-full bg-3k-bg flex flex-col font-sans overflow-hidden relative">
      <div className="flex justify-between items-center p-4 md:px-8 shrink-0 bg-white/50 backdrop-blur-md shadow-sm border-b border-[#C9A77C]/30 z-20">
        <div className="flex items-center gap-4">
          <img src={logoImg} alt="3K Kitchen" className="w-12 h-12 md:w-16 md:h-16 rounded-full shadow-md border-2 border-white" />
          <h1 className="text-xl md:text-2xl font-black text-[#815633] tracking-widest uppercase hidden sm:block">3K Kiosk</h1>
        </div>
        
        <div className="hidden md:flex flex-1 max-w-xl mx-8 bg-gradient-to-r from-white to-[#E6D4B8]/50 border border-[#C9A77C]/40 rounded-full h-12 items-center justify-center shadow-sm">
           <p className="text-[#815633] font-bold text-sm tracking-widest uppercase">✨ Welcome to 3K Kitchen ✨</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => setOrderType('')} className="bg-white text-gray-700 border border-gray-200 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm shadow-sm hover:bg-gray-50 transition-colors uppercase tracking-wider">
            Change: {orderType}
          </button>
          <button onClick={handleCancel} className="bg-white text-red-500 border-2 border-red-200 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm shadow-sm hover:bg-red-50 hover:border-red-300 transition-colors uppercase tracking-wider">
            Cancel Order
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-row overflow-hidden p-4 md:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto w-full relative z-10">
        <div className="w-32 md:w-56 shrink-0 flex flex-col h-full bg-white/40 p-2 md:p-3 rounded-3xl shadow-sm border border-[#C9A77C]/20">
          <h2 className="text-xs md:text-sm font-black text-gray-700 uppercase tracking-widest mb-4 pl-2 text-center md:text-left mt-2">Categories</h2>
          <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-3 pb-32 pr-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-4 md:px-6 md:py-5 rounded-2xl text-xs md:text-sm font-bold transition-all duration-300 cursor-pointer text-center md:text-left shadow-sm border flex flex-col md:flex-row items-center gap-2 
                  ${activeCategory === category.id ? 'bg-[#815633] text-white shadow-md md:scale-105 border-[#815633]' : 'bg-white text-gray-700 border-[#C9A77C]/30 hover:border-[#815633] hover:text-[#815633]'}`}
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
                <div className={`bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 group flex flex-col border border-transparent ${item.is_sold_out ? 'opacity-60 grayscale' : 'hover:-translate-y-1.5 hover:shadow-lg hover:border-[#C9A77C]'}`} key={item.id}>
                  <div className="h-[160px] md:h-[200px] bg-[#E6D4B8]/30 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={item.image_url?.startsWith('http') ? item.image_url : (item.image_url?.startsWith('/') ? item.image_url : `${API_URL}${item.image_url}`)} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="text-6xl opacity-40">🍽️</div>'; }}
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] md:text-xs font-bold text-[#815633] shadow-sm max-w-[80%] truncate">
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
                    <div className="text-xl md:text-2xl font-black text-[#815633] mb-4 mt-2">₱{parseFloat(item.price).toFixed(2)}</div>
                    <button 
                      onClick={() => addToCart(item)}
                      disabled={item.is_sold_out}
                      className={`w-full py-3 rounded-lg text-sm font-bold transition-all duration-300 shadow-sm ${item.is_sold_out ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent' : 'bg-[#815633] text-white border-transparent hover:bg-[#62432B] hover:shadow-md hover:-translate-y-0.5'}`}
                    >
                      Add to Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-[#C9A77C]/40 shadow-[0_-10px_40px_rgba(227,154,123,0.2)] z-20 p-4 md:p-6 flex justify-center">
         <div className="max-w-[1400px] w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setIsCartOpen(true)}>
               <div className="relative w-14 h-14 md:w-16 md:h-16 bg-[#E6D4B8]/40 rounded-full flex items-center justify-center border-2 border-[#815633] text-2xl shadow-sm hover:bg-[#E6D4B8] transition-colors">
                 🛒
                 <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center shadow-md animate-pulse">
                   {cartCount}
                 </span>
               </div>
               <div className="hidden sm:block">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Tray</p>
                 <p className="text-sm font-medium text-gray-800 hover:text-[#815633] transition-colors">{cartCount} items selected</p>
               </div>
            </div>

            <div className="flex items-center gap-4 md:gap-10">
               <div className="text-right">
                 <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Amount</p>
                 <p className="text-2xl md:text-4xl font-black text-[#815633] leading-none">₱{cartTotal.toFixed(2)}</p>
               </div>
               <button 
                 onClick={() => setIsCartOpen(true)}
                 className="bg-[#815633] hover:bg-[#62432B] text-white px-6 md:px-12 py-3 md:py-5 rounded-full font-black text-sm md:text-xl tracking-wide shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 uppercase border-2 border-transparent"
               >
                 View My Tray
               </button>
            </div>
         </div>
      </div>

      <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm cursor-pointer" onClick={() => setIsCartOpen(false)}></div>
        
        <div className={`absolute top-0 right-0 h-full w-full sm:w-[450px] bg-[#F5EFE3] shadow-2xl flex flex-col transition-transform duration-500 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 bg-white border-b border-[#C9A77C]/30 flex justify-between items-center shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛒</span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Your Tray</h2>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 bg-gray-100 text-gray-500 hover:bg-[#C9A77C] hover:text-white rounded-full flex items-center justify-center text-xl font-bold transition-colors">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 hide-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <span className="text-6xl opacity-50">🍽️</span>
                <p className="font-bold text-lg">Your tray is empty.</p>
                <button onClick={() => setIsCartOpen(false)} className="text-[#815633] font-bold text-sm hover:underline">Start adding food</button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-[#C9A77C]/30 flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#E6D4B8]/30 shrink-0">
                    <img src={item.image_url?.startsWith('http') ? item.image_url : (item.image_url?.startsWith('/') ? item.image_url : `${API_URL}${item.image_url}`)} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1 pr-4">{item.name}</h4>
                    <p className="text-[#815633] font-black text-sm">₱{(parseFloat(item.price) * item.qty).toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors text-xs font-bold uppercase tracking-wider">Remove</button>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg border border-gray-200 p-1 mt-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center font-bold text-gray-600 hover:text-[#815633] hover:border-[#815633] border border-transparent transition-colors">-</button>
                      <span className="font-black text-sm w-4 text-center text-gray-800">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center font-bold text-gray-600 hover:text-[#815633] hover:border-[#815633] border border-transparent transition-colors">+</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-6 bg-white border-t border-[#C9A77C]/40 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            
            {/* NAME FIELD ADDED HERE FOR KIOSK ORDERS */}
            {cart.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Your Name (for order calling)</label>
                  <input 
                     type="text" 
                     required 
                     value={customerName} 
                     onChange={(e) => setCustomerName(e.target.value)} 
                     placeholder="Enter your name" 
                     className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#815633] text-sm font-medium"
                  />
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Grand Total</span>
              <span className="text-3xl font-black text-[#815633]">₱{cartTotal.toFixed(2)}</span>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkoutLoading}
              className={`w-full py-4 rounded-2xl font-black text-lg shadow-md transition-all duration-300 uppercase tracking-wide 
                 ${cart.length > 0 && !checkoutLoading ? 'bg-[#815633] hover:bg-[#62432B] text-white hover:-translate-y-1' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {checkoutLoading ? 'Processing...' : 'Send to Kitchen'}
            </button>
          </div>
        </div>
      </div>
      {successOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="presentation">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="kiosk-order-success-title">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-black text-green-700">✓</div>
            <h2 id="kiosk-order-success-title" className="mb-3 text-2xl font-black text-gray-900">Order received!</h2>
            <p className="mb-2 text-gray-700">
              {successOrder.customerName}, your order{successOrder.id ? ` #${successOrder.id}` : ''} was sent to the cashier.
            </p>
            <p className="mb-7 text-sm text-gray-500">The kitchen will start preparing it shortly.</p>
            <button
              onClick={() => {
                setSuccessOrder(null);
                setOrderType('');
                setCustomerName('');
              }}
              className="w-full rounded-xl bg-[#815633] py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-[#62432B]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
