import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const { cart } = useCart();
  const [orders, setOrders] = useState([]);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_URL}/api/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setOrders(data.slice(0, 3)); 
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    if (user && user.role !== 'guest') fetchRecentOrders();
  }, [user, API_URL]);

  if (!user) {
    return (
      <div className="min-h-screen bg-3k-bg flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">You are not logged in</h2>
        <Link to="/login" className="bg-3k-red text-white px-6 py-2 rounded-lg font-bold hover:bg-3k-red-hover transition-colors shadow-md">Go to Sign In</Link>
      </div>
    );
  }

  return (
    <div className="bg-3k-bg min-h-screen py-12 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">My Profile</h1>
          <p className="text-gray-700 font-medium mt-2">Manage your details, view your cart, and track orders.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#FFB5AB]/30 lg:col-span-1 h-fit">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 bg-[#FFD3AC] text-[#E39A7B] rounded-full flex items-center justify-center text-2xl font-black">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <span className="text-sm font-bold text-[#E39A7B] bg-[#FFB5AB]/20 px-3 py-1 rounded-full mt-1 inline-block">
                  {user.role.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Email</label>
                <p className="text-gray-900 font-semibold">{user.email}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Phone</label>
                <p className="text-gray-900 font-semibold">+63 900 000 0000</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#FFB5AB]/30">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
                <Link to="/order" className="text-sm font-bold text-[#E39A7B] hover:text-[#DBB06B] hover:underline">View All</Link>
              </div>
              
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <p className="text-gray-500 font-medium">No recent orders found.</p>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 border border-[#FFB5AB]/40 rounded-xl bg-[#FFD3AC]/10 gap-4">
                      <div>
                        <p className="font-bold text-gray-900">Order #{order.id}</p>
                        <p className="text-sm text-gray-600 font-medium">{order.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-white text-[#E39A7B] border border-[#E39A7B] font-bold text-sm rounded-full">
                          {order.status}
                        </span>
                        <span className="font-black text-gray-900">₱{parseFloat(order.total).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#FFB5AB]/30">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Current Cart</h3>
                <Link to="/cart" className="text-sm font-bold text-[#E39A7B] hover:text-[#DBB06B] hover:underline">Go to Checkout</Link>
              </div>
              
              <div className="divide-y divide-gray-100">
                {cart.length === 0 ? (
                  <p className="text-gray-500 font-medium py-2">Your cart is currently empty.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FFD3AC] rounded-lg flex items-center justify-center font-bold text-xl">🍽️</div>
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500 font-medium">Qty: {item.qty}</p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-900">₱{parseInt(item.price) * item.qty}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}