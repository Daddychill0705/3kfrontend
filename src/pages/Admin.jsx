import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const [activeModule, setActiveModule] = useState('Sales');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('All branches');
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [riders, setRiders] = useState([]);
  const [staff, setStaff] = useState([]);
  
  // Add Product States
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '3k Ala-Carte', price: '' });
  const [productImage, setProductImage] = useState(null);

  // Edit Product States
  const [editingProduct, setEditingProduct] = useState(null);
  const [editImage, setEditImage] = useState(null);

  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', code: '', address: '', phone: '' });
  const [showAddRider, setShowAddRider] = useState(false);
  const [newRider, setNewRider] = useState({ firstname: '', lastname: '', email: '', password: '' });
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ firstname: '', lastname: '', email: '', password: '', role: 'cashier' });
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [ordersRes, menuRes, branchRes, riderRes, staffRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/orders`, { headers }),
          fetch(`${API_URL}/api/menu`),
          fetch(`${API_URL}/api/branches`),
          fetch(`${API_URL}/api/admin/riders`, { headers }),
          fetch(`${API_URL}/api/admin/users`, { headers })
        ]);
        
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (menuRes.ok) setMenuItems(await menuRes.json());
        if (branchRes.ok) setBranches(await branchRes.json());
        if (riderRes.ok) setRiders(await riderRes.json());
        if (staffRes.ok) setStaff(await staffRes.json());
      } catch (error) {
        console.error('Failed to fetch admin data', error);
      }
    };

    fetchData();
  }, [user, navigate, API_URL]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const toggleSoldOut = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/menu/${id}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_sold_out: !currentStatus })
      });
      if (response.ok) {
        setMenuItems(menuItems.map(item => item.id === id ? { ...item, is_sold_out: !currentStatus } : item));
      }
    } catch (error) {
      console.error('Failed to toggle stock', error);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/menu/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setMenuItems(menuItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete product', error);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      let uploadedImageUrl = '';
      
      // Upload new image to Cloudinary if provided
      if (editImage) {
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', editImage);
        cloudinaryFormData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: cloudinaryFormData
        });
        
        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          uploadedImageUrl = cloudData.secure_url;
        } else {
          return alert('Failed to upload new image to Cloudinary.');
        }
      }
      
      const payload = {
        name: editingProduct.name,
        category: editingProduct.category,
        price: editingProduct.price,
        image_url: uploadedImageUrl 
      };

      const response = await fetch(`${API_URL}/api/admin/menu/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setEditingProduct(null);
        setEditImage(null);
        const menuRes = await fetch(`${API_URL}/api/menu`);
        if (menuRes.ok) setMenuItems(await menuRes.json());
      } else {
         alert("Failed to update menu item.");
      }
    } catch (error) {
      alert('Error updating product');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      let uploadedImageUrl = '';
      
      if (productImage) {
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', productImage);
        cloudinaryFormData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: cloudinaryFormData
        });
        
        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          uploadedImageUrl = cloudData.secure_url;
        } else {
          return alert('Failed to upload image to Cloudinary.');
        }
      }
      
      const payload = {
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        image_url: uploadedImageUrl 
      };

      const response = await fetch(`${API_URL}/api/admin/menu`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setShowAddProduct(false);
        setProductImage(null);
        setNewProduct({ name: '', category: '3k Ala-Carte', price: '' });
        const menuRes = await fetch(`${API_URL}/api/menu`);
        if (menuRes.ok) setMenuItems(await menuRes.json());
      } else {
         alert("Failed to save menu item.");
      }
    } catch (error) {
      alert('Error adding product');
    }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm('Delete this account permanently?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setStaff(staff.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete account', error);
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newBranch)
      });
      if (response.ok) {
        setShowAddBranch(false);
        const res = await fetch(`${API_URL}/api/branches`);
        if (res.ok) setBranches(await res.json());
      }
    } catch (error) {
      alert('Failed to add branch');
    }
  };

  const handleAddRider = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRider, role: 'rider' })
      });
      if (response.ok) {
        setShowAddRider(false);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/admin/riders`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setRiders(await res.json());
      }
    } catch (error) {
      alert('Failed to add rider');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newStaff)
      });
      if (response.ok) {
        setShowAddStaff(false);
        const res = await fetch(`${API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setStaff(await res.json());
      } else {
        alert('Failed to add account. Email may already exist.');
      }
    } catch (error) {
      alert('Failed to add account');
    }
  };

  const filteredOrders = selectedBranch === 'All branches' ? orders : orders.filter(o => o.branch === selectedBranch);
  const completedOrders = filteredOrders.filter(o => o.status === 'Completed');
  const totalRevenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);

  const modules = [
    { id: 'Sales', name: 'Sales' },
    { id: 'Orders', name: 'Orders' },
    { id: 'Menu', name: 'Menu' },
    { id: 'Branches', name: 'Branches' },
    { id: 'Accounts', name: 'Accounts & Access' },
    { id: 'Riders', name: 'Riders' }
  ];

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#fffaf7] font-sans">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      <aside className={`fixed md:static inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} w-64 bg-white flex flex-col shadow-lg border-r border-[#FFB5AB]/30 shrink-0`}>
        <div className="p-6 border-b border-gray-100">
          <button className="md:hidden absolute top-4 right-4 text-gray-400" onClick={() => setIsSidebarOpen(false)}>✕</button>
          <h2 className="text-xl font-black text-gray-900">Super admin</h2>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">3K Kitchen System</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 hide-scrollbar">
          <ul className="space-y-1">
            {modules.map((module) => (
              <li key={module.id}>
                <button
                  onClick={() => { setActiveModule(module.id); setIsSidebarOpen(false); }}
                  className={`w-full text-left px-6 py-3 text-sm font-bold transition-all duration-300 ${activeModule === module.id ? 'bg-[#4a3b32] text-white rounded-r-full mr-4' : 'text-gray-600 hover:text-[#4a3b32] hover:bg-gray-50'}`}
                >
                  {module.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden z-10 relative">
        <header className="flex justify-between items-center p-4 md:px-6 lg:px-8 border-b border-gray-200 bg-white shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-gray-600" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <h1 className="text-2xl font-black text-gray-900 truncate">{activeModule}</h1>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none hidden sm:block cursor-pointer"
            >
              <option>All branches</option>
              {branches.map(b => <option key={b.id}>{b.name}</option>)}
            </select>
            <span className="text-sm font-bold text-gray-600 hidden md:block">{user.email}</span>
            <Link to="/login" className="text-sm font-bold text-red-500 hover:underline">Sign out</Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          
          {/* SALES MODULE */}
          {activeModule === 'Sales' && (
            <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
              <div className="flex gap-4 mb-6">
                <button className="px-4 py-1.5 rounded-full text-sm font-bold bg-[#4a3b32] text-white">Today</button>
                <button className="px-4 py-1.5 rounded-full text-sm font-bold text-gray-500 hover:bg-gray-100">7 days</button>
                <button className="px-4 py-1.5 rounded-full text-sm font-bold text-gray-500 hover:bg-gray-100">30 days</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sales</h3>
                  <p className="text-2xl font-black text-gray-900">₱{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Orders</h3>
                  <p className="text-2xl font-black text-gray-900">{completedOrders.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Average Order</h3>
                  <p className="text-2xl font-black text-gray-900">₱{completedOrders.length > 0 ? (totalRevenue / completedOrders.length).toFixed(2) : '0.00'}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Items Sold</h3>
                  <p className="text-2xl font-black text-gray-900">{completedOrders.reduce((sum, order) => sum + (order.itemsData?.reduce((s, i) => s + i.qty, 0) || 0), 0)}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-64 flex flex-col justify-between">
                <h3 className="text-sm font-bold text-gray-600 mb-4">Sales per day</h3>
                <div className="flex-1 flex items-end justify-around gap-2 px-4 pb-2 border-b border-gray-100">
                  {[10, 0, 0, 0, 0, 0, 100].map((h, i) => (
                    <div key={i} className="w-full max-w-[40px] bg-red-600/80 rounded-t-sm transition-all" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
                <div className="flex justify-around mt-2 text-[10px] font-bold text-gray-400">
                  <span>Oct 7</span><span>Oct 8</span><span>Oct 9</span><span>Oct 10</span><span>Oct 11</span><span>Oct 12</span><span>Oct 13</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-6">Cash vs GCash</h3>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-red-600 w-[100%]"></div>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>🔵 GCash • 2 orders • 100%</span>
                    <span className="text-gray-900">₱810.00</span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-6">By channel</h3>
                  <div className="flex justify-between text-sm font-bold border-b border-gray-100 pb-2">
                    <span className="text-gray-800">Online</span>
                    <span className="text-gray-500">₱810.00 <span className="font-medium text-xs ml-2">2 orders</span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS MODULE */}
          {activeModule === 'Orders' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in flex flex-col">
              <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50">
                <select className="px-3 py-2 rounded border border-gray-300 text-sm font-bold outline-none flex-1">
                  <option>Any status</option><option>Pending</option><option>Completed</option>
                </select>
                <select className="px-3 py-2 rounded border border-gray-300 text-sm font-bold outline-none flex-1">
                  <option>Any payment</option><option>GCash</option><option>Cash on delivery</option>
                </select>
                <select className="px-3 py-2 rounded border border-gray-300 text-sm font-bold outline-none flex-1 hidden sm:block">
                  <option>Any channel</option><option>Online</option><option>Kiosk</option>
                </select>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[900px]">
                  <thead className="bg-[#FFD3AC]/20">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Order</th>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Customer</th>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Type</th>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Status</th>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-black text-gray-900">O-{String(order.id).padStart(4, '0')}</p>
                          <p className="text-[10px] text-gray-500 font-bold">{order.branch}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{order.customerName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-700">{order.order_type}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                            ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                               order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                               'bg-blue-100 text-blue-700'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-gray-900">₱{parseFloat(order.total).toFixed(2)}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 inline-block ${order.payment_method === 'GCash' && order.status !== 'Pending' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-yellow-50 text-yellow-600 border border-yellow-200'}`}>
                            {order.payment_method === 'GCash' && order.status !== 'Pending' ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MENU MODULE */}
          {activeModule === 'Menu' && (
            <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm font-bold text-gray-600">Every branch shares one menu and price list.</p>
                <button onClick={() => setShowAddProduct(true)} className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-700">+ Product</button>
              </div>

              {/* Add Product Modal */}
              {showAddProduct && (
                <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-bold mb-2">Product Name</label><input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-400" /></div>
                  <div><label className="block text-sm font-bold mb-2">Category</label>
                    <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-400">
                      {['3k Ala-Carte', '3k Originals', '3k Specials', '3k Budget Meals', 'Rice and Extras', '3k Sets/Extras'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-bold mb-2">Price (₱)</label><input type="number" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-400" /></div>
                  <div><label className="block text-sm font-bold mb-2">Image</label><input type="file" accept="image/*" onChange={e => setProductImage(e.target.files[0])} className="text-sm w-full pt-2" /></div>
                  <div className="sm:col-span-2 flex justify-end gap-4"><button type="button" onClick={() => setShowAddProduct(false)} className="px-6 py-2 font-bold text-gray-500 hover:bg-gray-50 rounded-lg border">Cancel</button><button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg shadow-sm">Save</button></div>
                </form>
              )}
              
              {/* Edit Product Modal */}
              {editingProduct && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                  <form onSubmit={handleEditProduct} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 w-full max-w-md space-y-4 relative">
                    <button type="button" onClick={() => { setEditingProduct(null); setEditImage(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl">✕</button>
                    <h2 className="text-xl font-black text-gray-900 mb-4">Edit Product</h2>
                    
                    <div><label className="block text-sm font-bold mb-2">Product Name</label>
                      <input type="text" required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-400" />
                    </div>
                    <div><label className="block text-sm font-bold mb-2">Category</label>
                      <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-400">
                        {['3k Ala-Carte', '3k Originals', '3k Specials', '3k Budget Meals', 'Rice and Extras', '3k Sets/Extras'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-sm font-bold mb-2">Price (₱)</label>
                      <input type="number" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-400" />
                    </div>
                    <div><label className="block text-sm font-bold mb-2">Change Image (Leave empty to keep current)</label>
                      <input type="file" accept="image/*" onChange={e => setEditImage(e.target.files[0])} className="text-sm w-full pt-2" />
                    </div>
                    
                    <div className="flex justify-end gap-4 mt-6">
                      <button type="button" onClick={() => { setEditingProduct(null); setEditImage(null); }} className="px-6 py-2 font-bold text-gray-500 hover:bg-gray-50 rounded-lg border">Cancel</button>
                      <button type="submit" className="px-6 py-2 bg-[#E39A7B] text-white font-bold rounded-lg shadow-sm hover:bg-[#DBB06B]">Update</button>
                    </div>
                  </form>
                </div>
              )}

              {['3k Ala-Carte', '3k Originals', '3k Specials', '3k Budget Meals', 'Rice and Extras', '3k Sets/Extras'].map(category => {
                const categoryItems = menuItems.filter(item => item.category === category);
                if (categoryItems.length === 0) return null;
                return (
                  <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <h3 className="text-lg font-black text-gray-900 p-4 border-b border-gray-200 bg-gray-50/50">{category}</h3>
                    <div className="divide-y divide-gray-100 p-2">
                      {categoryItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <img src={item.image_url?.startsWith('http') ? item.image_url : (item.image_url?.startsWith('/') ? item.image_url : `${API_URL}${item.image_url}`)} alt={item.name} className={`w-12 h-12 rounded-full object-cover ${item.is_sold_out ? 'grayscale opacity-50' : ''}`} />
                            <div>
                              <p className={`font-bold text-gray-900 ${item.is_sold_out ? 'line-through text-gray-400' : ''}`}>{item.name}</p>
                              <p className="text-sm text-gray-500 font-medium">₱{parseFloat(item.price).toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-green-600 mr-2 bg-green-50 px-2 py-1 rounded hidden md:block">On the menu</span>
                            <button onClick={() => toggleSoldOut(item.id, item.is_sold_out)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${item.is_sold_out ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                              {item.is_sold_out ? 'Available' : 'Sold Out'}
                            </button>
                            <button onClick={() => setEditingProduct(item)} className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50">Edit</button>
                            <button onClick={() => deleteProduct(item.id)} className="text-red-500 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 border border-red-100">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* BRANCHES MODULE */}
          {activeModule === 'Branches' && (
            <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm font-bold text-gray-600">Every active branch appears on the landing page map and can take orders.</p>
                <button onClick={() => setShowAddBranch(true)} className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-700">+ New branch</button>
              </div>

              {showAddBranch && (
                <form onSubmit={handleAddBranch} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-bold mb-2">Branch Name</label><input type="text" required value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-2">Code</label><input type="text" required value={newBranch.code} onChange={e => setNewBranch({...newBranch, code: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div className="sm:col-span-2 flex justify-end gap-4"><button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg shadow-sm">Save Branch</button></div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {branches.map(branch => (
                  <div key={branch.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-black text-gray-900 mb-1">{branch.name} <span className="text-gray-400 font-medium text-xs">({branch.code})</span></h3>
                      <p className="text-xs text-gray-500 font-bold mb-1">No address yet</p>
                      <p className="text-xs text-gray-500 font-bold">8:00 AM - 8:00 PM</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACCOUNTS & ACCESS MODULE */}
          {activeModule === 'Accounts' && (
            <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm font-bold text-gray-600">Manage dashboard admins and branch cashiers.</p>
                <button onClick={() => setShowAddStaff(true)} className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-700">+ New Account</button>
              </div>

              {showAddStaff && (
                <form onSubmit={handleAddStaff} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-bold mb-2">First Name</label><input type="text" required value={newStaff.firstname} onChange={e => setNewStaff({...newStaff, firstname: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-2">Last Name</label><input type="text" required value={newStaff.lastname} onChange={e => setNewStaff({...newStaff, lastname: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-2">Email Username</label><input type="email" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-2">Password</label><input type="password" required value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Role</label>
                    <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none cursor-pointer">
                      <option value="cashier">Cashier</option>
                      <option value="admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex justify-end gap-4 mt-2">
                    <button type="button" onClick={() => setShowAddStaff(false)} className="px-6 py-2 font-bold text-gray-500 hover:bg-gray-50 rounded-lg border">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg shadow-sm">Save Account</button>
                  </div>
                </form>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100 p-2">
                  {staff.map(member => (
                    <div key={member.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${member.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                          {member.firstname.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{member.firstname} {member.lastname}</p>
                          <p className="text-sm text-gray-500 font-medium">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${member.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                          {member.role}
                        </span>
                        {user.email !== member.email && (
                          <button onClick={() => deleteStaff(member.id)} className="text-red-400 bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-100">Delete</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {staff.length === 0 && <p className="text-center text-gray-500 py-6 font-bold">No staff accounts found.</p>}
                </div>
              </div>
            </div>
          )}

          {/* RIDERS MODULE */}
          {activeModule === 'Riders' && (
            <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm font-bold text-gray-600">Manage delivery personnel.</p>
                <button onClick={() => setShowAddRider(true)} className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-700">+ New Rider</button>
              </div>

              {showAddRider && (
                <form onSubmit={handleAddRider} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-bold mb-2">First Name</label><input type="text" required value={newRider.firstname} onChange={e => setNewRider({...newRider, firstname: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-2">Last Name</label><input type="text" required value={newRider.lastname} onChange={e => setNewRider({...newRider, lastname: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-2">Email Username</label><input type="email" required value={newRider.email} onChange={e => setNewRider({...newRider, email: e.target.value})} placeholder="rider@3k.local" className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-2">Password</label><input type="password" required value={newRider.password} onChange={e => setNewRider({...newRider, password: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div className="sm:col-span-2 flex justify-end gap-4 mt-2">
                    <button type="button" onClick={() => setShowAddRider(false)} className="px-6 py-2 border rounded-lg font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold shadow-sm">Register Rider</button>
                  </div>
                </form>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100 p-2">
                  {riders.map(rider => (
                    <div key={rider.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xl">
                          {rider.firstname.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{rider.firstname} {rider.lastname}</p>
                          <p className="text-sm text-gray-500 font-medium">{rider.email}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wider">Active</span>
                    </div>
                  ))}
                  {riders.length === 0 && <p className="text-center text-gray-500 py-6 font-bold">No riders registered.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}