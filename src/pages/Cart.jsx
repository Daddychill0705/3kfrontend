import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleCheckout = async () => {
    if (!user) {
      alert('Please log in to place an order.');
      return navigate('/login');
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart,
          totalAmount: cartTotal,
          orderType: 'Pick-up' 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to checkout');
      }
      
      clearCart();
      alert('Order placed successfully!');
      navigate('/order');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="bg-3k-bg min-h-[calc(100vh-80px)] py-16 px-4 md:px-8">
        <div className="max-w-[1000px] mx-auto text-center bg-white rounded-2xl p-12 md:p-20 shadow-lg border border-[#FFB5AB]/30">
          <div className="text-6xl mb-6 opacity-80 drop-shadow-sm">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-base text-gray-600 mb-8 max-w-md mx-auto font-medium">
            Looks like you haven't added any items to your cart yet. Browse our menu to get started!
          </p>
          <Link to="/menu" className="inline-block bg-3k-red text-white py-3 px-8 rounded-lg font-bold hover:bg-3k-red-hover transition-all">Browse Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-3k-bg min-h-[calc(100vh-80px)] py-16 px-4 md:px-8">
      <div className="max-w-[1000px] mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Your Cart</h1>
        
        <div className="bg-white rounded-2xl shadow-lg border border-[#FFB5AB]/30 overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            {cart.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <img src={item.image_url?.startsWith('http') ? item.image_url : (item.image_url?.startsWith('/') ? item.image_url : `${API_URL}${item.image_url}`)} alt={item.name} className="w-24 h-24 object-cover rounded-xl bg-[#FFD3AC]/30" />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                  <p className="text-[#E39A7B] font-black mt-1">₱{parseInt(item.price)}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 font-bold hover:text-[#E39A7B]">-</button>
                    <span className="w-8 text-center font-bold">{item.qty}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 font-bold hover:text-[#E39A7B]">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 font-bold text-sm">Remove</button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-[#FFD3AC]/10 p-6 md:p-8 border-t border-[#FFB5AB]/30 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-500 font-bold uppercase">Grand Total</p>
              <p className="text-3xl font-black text-[#E39A7B]">₱{cartTotal.toFixed(2)}</p>
            </div>
            <Link to="/checkout">
              <button className="w-full sm:w-auto bg-3k-red text-white py-4 px-12 rounded-xl font-bold text-lg shadow-md hover:bg-3k-red-hover transition-all">
                Proceed to Checkout
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}