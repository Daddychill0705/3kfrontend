import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    branchId: '',
    orderType: 'Delivery',
    phone: '',
    address: '',
    paymentMethod: 'Cash on delivery',
    notes: '',
    scheduleMode: 'As soon as possible',
    scheduleDay: 'Today',
    scheduleTime: '08:00 AM'
  });
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  // Define the dynamic API_URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        // Use the dynamic API_URL here
        const response = await fetch(`${API_URL}/api/branches`);
        if (response.ok) {
          const data = await response.json();
          const activeBranches = data.filter(b => b.is_active);
          setBranches(activeBranches);
          if (activeBranches.length > 0) {
            setFormData(prev => ({ ...prev, branchId: activeBranches[0].id }));
          }
        }
      } catch (error) {
        console.error('Failed to load branches', error);
      }
    };
    fetchBranches();
  }, [API_URL]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setReceipt(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.paymentMethod === 'GCash' && !receipt) {
      return alert('Please upload your GCash receipt.');
    }
    
    setLoading(true);
    const token = localStorage.getItem('token');
    const selectedBranch = branches.find(b => b.id === Number(formData.branchId));
    let uploadedReceiptUrl = null;

    // Upload receipt to Cloudinary
    if (receipt) {
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', receipt);
      cloudinaryFormData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      try {
        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: cloudinaryFormData
        });
        
        if (!cloudRes.ok) throw new Error('Cloudinary upload failed');
        const cloudData = await cloudRes.json();
        uploadedReceiptUrl = cloudData.secure_url;
      } catch (err) {
        setLoading(false);
        return alert('Failed to upload receipt image. Please try again.');
      }
    }

    const payload = {
      items: JSON.stringify(cart),
      totalAmount: cartTotal,
      orderType: formData.orderType,
      branch: selectedBranch ? selectedBranch.name : 'Unknown Branch',
      address: formData.address,
      phone: formData.phone,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
      receipt_url: uploadedReceiptUrl 
    };

    try {
      // Use the dynamic API_URL here
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Checkout failed');
      
      clearCart();
      navigate('/order');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) return navigate('/cart');

  return (
    <div className="bg-[#fffaf7] min-h-screen py-12 px-4 md:px-8 font-sans">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Checkout</h1>
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
            
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-900 mb-3">Which branch?</label>
              <div className="relative">
                <select name="branchId" value={formData.branchId} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#E39A7B] focus:bg-white outline-none font-bold text-gray-800 appearance-none cursor-pointer">
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} - Open now</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>
              <p className="text-xs font-bold text-gray-400 mt-2 ml-1">Open now: 8:00 AM - 8:00 PM</p>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-900 mb-4">When?</label>
              <div className="flex gap-3 mb-6">
                <button type="button" onClick={() => setFormData({...formData, scheduleMode: 'As soon as possible'})} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${formData.scheduleMode === 'As soon as possible' ? 'bg-[#E39A7B] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>As soon as possible</button>
                <button type="button" onClick={() => setFormData({...formData, scheduleMode: 'Schedule for later'})} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${formData.scheduleMode === 'Schedule for later' ? 'bg-[#E39A7B] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Schedule for later</button>
              </div>
              
              {formData.scheduleMode === 'Schedule for later' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Day</label>
                    <select name="scheduleDay" value={formData.scheduleDay} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl font-bold outline-none focus:border-[#E39A7B]">
                      <option>Today</option>
                      <option>Tomorrow</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Time</label>
                    <select name="scheduleTime" value={formData.scheduleTime} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl font-bold outline-none focus:border-[#E39A7B]">
                      <option>08:00 AM</option>
                      <option>09:00 AM</option>
                      <option>10:00 AM</option>
                      <option>11:00 AM</option>
                      <option>12:00 PM</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-900 mb-4">How would you like it?</label>
              <div className="flex gap-3 mb-6 bg-gray-100 p-1.5 rounded-xl w-fit">
                <button type="button" onClick={() => setFormData({...formData, orderType: 'Pick-up'})} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${formData.orderType === 'Pick-up' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Pickup</button>
                <button type="button" onClick={() => setFormData({...formData, orderType: 'Delivery'})} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${formData.orderType === 'Delivery' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Delivery</button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Mobile number</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="09000000000" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#E39A7B] outline-none font-medium" />
                </div>

                {formData.orderType === 'Delivery' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Delivery Address / Map Pin</label>
                    <div className="w-full h-48 bg-gray-200 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden border border-gray-200">
                      <div className="absolute inset-0 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                      <span className="text-4xl relative z-10 drop-shadow-md">📍</span>
                    </div>
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} required placeholder="Street, Barangay, City" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#E39A7B] outline-none font-medium" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-900 mb-4">Payment</label>
              <div className="flex gap-3 mb-6">
                <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'Cash on delivery'})} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${formData.paymentMethod === 'Cash on delivery' ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>Cash on delivery</button>
                <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'GCash'})} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${formData.paymentMethod === 'GCash' ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>GCash</button>
              </div>
              
              {formData.paymentMethod === 'GCash' && (
                <div className="bg-[#fffaf7] p-6 rounded-xl border border-[#FFB5AB]/40 text-center">
                  <div className="w-40 h-40 bg-white mx-auto mb-4 p-2 rounded-xl shadow-sm border border-gray-200 flex items-center justify-center text-4xl">QR</div>
                  <p className="font-black text-gray-900 text-lg">Ruchell Quesada</p>
                  <p className="text-sm font-bold text-gray-500 mb-4">0997 131 2386</p>
                  <p className="text-sm font-bold text-gray-800 mb-4">Send exactly <span className="text-[#E39A7B]">₱{cartTotal.toFixed(2)}</span></p>
                  
                  <div className="text-left space-y-4">
                    <input type="text" placeholder="Reference No. (e.g. 1012 345 678901)" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#E39A7B] outline-none font-medium text-sm" />
                    <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm font-medium text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#E39A7B] file:text-white hover:file:bg-[#DBB06B]" />
                  </div>
                </div>
              )}

              <div className="mt-6">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Notes for the kitchen</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#E39A7B] outline-none font-medium text-sm"></textarea>
              </div>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-lg font-black text-gray-900 mb-4 pb-4 border-b border-gray-100">Your order</h2>
            
            <div className="space-y-4 mb-6 max-h-[350px] overflow-y-auto pr-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 block">{item.name}</span>
                    <span className="font-bold text-gray-400">{item.qty} × ₱{parseFloat(item.price).toFixed(2)}</span>
                  </div>
                  <span className="font-black text-gray-900">₱{(parseFloat(item.price) * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-500 text-sm">Estimated total</span>
                <span className="text-xl font-black text-[#E39A7B]">₱{cartTotal.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Taxes included</p>
            </div>

            <button form="checkout-form" type="submit" disabled={loading} className="w-full bg-3k-red text-white py-4 rounded-xl font-black text-lg shadow-md hover:bg-3k-red-hover transition-all disabled:opacity-50">
              {loading ? 'Processing...' : 'Place order'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}