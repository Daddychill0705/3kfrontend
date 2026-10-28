import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, updateUserData } = useAuth();
  const { cart } = useCart();
  const [orders, setOrders] = useState([]);
  
  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    dob: user?.dob ? user.dob.split('T')[0] : ''
  });
  const [updateError, setUpdateError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setIsUpdating(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update the user context with new data and a new last_updated timestamp
      updateUserData({
        email: editForm.email,
        phone: editForm.phone,
        dob: editForm.dob,
        last_updated: new Date().toISOString()
      });

      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setUpdateError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

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
          
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#FFB5AB]/30 lg:col-span-1 h-fit relative">
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
            
            {user.role !== 'guest' && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="absolute top-6 right-6 text-sm font-bold text-[#E39A7B] hover:underline"
              >
                Edit
              </button>
            )}

            {!isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Email</label>
                  <p className="text-gray-900 font-semibold">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Phone Number</label>
                  <p className="text-gray-900 font-semibold">{user.phone || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Date of Birth</label>
                  <p className="text-gray-900 font-semibold">
                    {user.dob ? new Date(user.dob).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
                {user.last_updated && (
                  <p className="text-[10px] text-gray-400 mt-4 pt-4 border-t border-gray-100">
                    Last updated: {new Date(user.last_updated).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {updateError && <p className="text-xs font-bold text-red-500 mb-2">{updateError}</p>}
                
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 block">Email</label>
                  <input type="email" required value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-[#E39A7B]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 block">Phone Number</label>
                  <input type="text" placeholder="e.g. +63 900 000 0000" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-[#E39A7B]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 block">Date of Birth</label>
                  <input type="date" value={editForm.dob} onChange={e => setEditForm({...editForm, dob: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-[#E39A7B]" />
                </div>
                
                <p className="text-[10px] text-gray-500 italic mt-2">Note: You can only update your profile once every 30 days.</p>
                
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={isUpdating} className="flex-1 px-4 py-2 bg-[#E39A7B] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#DBB06B] disabled:opacity-50">
                    {isUpdating ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}
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