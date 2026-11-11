import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import SuccessModal from '../components/SuccessModal';

const ADMIN_PAGE_SIZE = 20;

function AdminPagination({ page, itemCount, onPageChange }) {
  const pageCount = Math.ceil(itemCount / ADMIN_PAGE_SIZE);
  if (pageCount <= 1) return null;

  const firstItem = (page - 1) * ADMIN_PAGE_SIZE + 1;
  const lastItem = Math.min(page * ADMIN_PAGE_SIZE, itemCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-4 py-3">
      <p className="text-xs font-medium text-gray-500">Showing {firstItem}–{lastItem} of {itemCount}</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
        <span className="min-w-16 text-center text-xs font-bold text-gray-600">Page {page} of {pageCount}</span>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

export default function Admin() {
  const [activeModule, setActiveModule] = useState('Sales');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('All branches');
  const [salesPeriod, setSalesPeriod] = useState('today');
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [riders, setRiders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [accountRecoveryRequests, setAccountRecoveryRequests] = useState([]);
  const [pendingRecoveryReview, setPendingRecoveryReview] = useState(null);
  const [recoveryAdminPassword, setRecoveryAdminPassword] = useState('');
  const [recoveryReviewNote, setRecoveryReviewNote] = useState('');
  const [recoveryReviewError, setRecoveryReviewError] = useState('');
  const [isReviewingRecovery, setIsReviewingRecovery] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Product States
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '3k Ala-Carte', price: '' });
  const [productImage, setProductImage] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editImage, setEditImage] = useState(null);

  // Branch States
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', code: '', address: '', phone: '' });

  // Rider States
  const [showAddRider, setShowAddRider] = useState(false);
  const [newRider, setNewRider] = useState({ firstname: '', lastname: '', email: '', password: '' });
  const [editingRider, setEditingRider] = useState(null);
  const [editRiderPass, setEditRiderPass] = useState('');

  // Staff States
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ firstname: '', lastname: '', email: '', password: '', role: 'cashier', branch: '' });
  const [newAccountAdminPassword, setNewAccountAdminPassword] = useState('');
  const [editingStaff, setEditingStaff] = useState(null);
  const [editStaffPass, setEditStaffPass] = useState('');
  const [editStaffAdminPassword, setEditStaffAdminPassword] = useState('');
  const [pendingAdminDeletion, setPendingAdminDeletion] = useState(null);
  const [adminDeletePassword, setAdminDeletePassword] = useState('');

  // Customer Profile State
  const [viewCustomer, setViewCustomer] = useState(null);

  const { user, logout } = useAuth();
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
        
        const [ordersRes, menuRes, branchRes, riderRes, staffRes, logRes, customersRes, recoveryRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/orders`, { headers }),
          fetch(`${API_URL}/api/menu`),
          fetch(`${API_URL}/api/branches`),
          fetch(`${API_URL}/api/admin/riders`, { headers }),
          fetch(`${API_URL}/api/admin/users`, { headers }),
          fetch(`${API_URL}/api/admin/activity-logs`, { headers }),
          fetch(`${API_URL}/api/admin/customers`, { headers }),
          fetch(`${API_URL}/api/admin/account-recovery`, { headers })
        ]);
        
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (menuRes.ok) setMenuItems(await menuRes.json());
        if (branchRes.ok) setBranches(await branchRes.json());
        if (riderRes.ok) setRiders(await riderRes.json());
        if (staffRes.ok) setStaff(await staffRes.json());
        if (logRes.ok) setActivityLogs(await logRes.json());
        if (customersRes.ok) setCustomers(await customersRes.json());
        if (recoveryRes.ok) setAccountRecoveryRequests(await recoveryRes.json());
      } catch (error) {
        console.error('Failed to fetch admin data', error);
      }
    };
    fetchData();
  }, [user, navigate, API_URL]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return undefined;

    const socket = io(API_URL);
    const refreshSalesOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/admin/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) setOrders(await response.json());
      } catch (error) {
        console.error('Failed to refresh sales data', error);
      }
    };

    socket.on('dashboard_refresh', refreshSalesOrders);
    return () => socket.disconnect();
  }, [user, API_URL]);

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
        setSuccessMessage(`Order status updated to ${newStatus}.`);
      }
    } catch (error) { console.error('Failed to update status', error); }
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
        setSuccessMessage(currentStatus ? 'Product is available again.' : 'Product marked as sold out.');
      }
    } catch (error) { console.error('Failed to toggle stock', error); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/menu/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setMenuItems(menuItems.filter(item => item.id !== id));
        setSuccessMessage('Product deleted successfully.');
      }
    } catch (error) { console.error('Failed to delete product', error); }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      let uploadedImageUrl = '';
      
      if (editImage) {
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', editImage);
        cloudinaryFormData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST', body: cloudinaryFormData
        });
        
        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          uploadedImageUrl = cloudData.secure_url;
        } else {
          return alert('Failed to upload new image to Cloudinary.');
        }
      }
      
      const payload = {
        name: editingProduct.name, category: editingProduct.category,
        price: editingProduct.price, image_url: uploadedImageUrl 
      };
      const response = await fetch(`${API_URL}/api/admin/menu/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setEditingProduct(null); setEditImage(null);
        const menuRes = await fetch(`${API_URL}/api/menu`);
        if (menuRes.ok) setMenuItems(await menuRes.json());
        setSuccessMessage('Product changes saved successfully.');
      } else alert("Failed to update menu item.");
    } catch (error) { alert('Error updating product'); }
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
          method: 'POST', body: cloudinaryFormData
        });
        
        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          uploadedImageUrl = cloudData.secure_url;
        } else return alert('Failed to upload image to Cloudinary.');
      }
      
      const payload = {
        name: newProduct.name, category: newProduct.category,
        price: newProduct.price, image_url: uploadedImageUrl 
      };
      const response = await fetch(`${API_URL}/api/admin/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setShowAddProduct(false); setProductImage(null);
        setNewProduct({ name: '', category: '3k Ala-Carte', price: '' });
        const menuRes = await fetch(`${API_URL}/api/menu`);
        if (menuRes.ok) setMenuItems(await menuRes.json());
        setSuccessMessage('New product added successfully.');
      } else alert("Failed to save menu item.");
    } catch (error) { alert('Error adding product'); }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/branches`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newBranch)
      });
      if (response.ok) {
        setShowAddBranch(false);
        const res = await fetch(`${API_URL}/api/branches`);
        if (res.ok) setBranches(await res.json());
        setNewBranch({ name: '', code: '', address: '', phone: '' });
        setSuccessMessage('New branch added successfully.');
      }
    } catch (error) { alert('Failed to add branch'); }
  };

  const handleAddRider = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/riders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newRider, role: 'rider' })
      });
      if (response.ok) {
        setShowAddRider(false);
        const res = await fetch(`${API_URL}/api/admin/riders`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setRiders(await res.json());
        setNewRider({ firstname: '', lastname: '', email: '', password: '' });
        setSuccessMessage('Rider account created successfully.');
      } else {
        const result = await response.json().catch(() => ({}));
        alert(result.error || 'Failed to add rider.');
      }
    } catch (error) { alert('Failed to add rider'); }
  };

  const handleEditRider = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { ...editingRider, password: editRiderPass, role: 'rider' };
      const response = await fetch(`${API_URL}/api/admin/users/${editingRider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setEditingRider(null); setEditRiderPass('');
        const res = await fetch(`${API_URL}/api/admin/riders`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setRiders(await res.json());
        setSuccessMessage('Rider details saved successfully.');
      } else alert('Failed to update rider.');
    } catch (error) { alert('Failed to update rider'); }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newStaff, adminPassword: newAccountAdminPassword })
      });
      if (response.ok) {
        setShowAddStaff(false);
        setNewAccountAdminPassword('');
        setNewStaff({ firstname: '', lastname: '', email: '', password: '', role: 'cashier', branch: '' });
        const res = await fetch(`${API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setStaff(await res.json());
        setSuccessMessage('Staff account created successfully.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to add account. Email may already exist.');
      }
    } catch (error) { alert('Failed to add account'); }
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { ...editingStaff, password: editStaffPass, adminPassword: editStaffAdminPassword };
      const response = await fetch(`${API_URL}/api/admin/users/${editingStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setEditingStaff(null); setEditStaffPass(''); setEditStaffAdminPassword('');
        const res = await fetch(`${API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setStaff(await res.json());
        setSuccessMessage('Account changes saved successfully.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to update account.');
      }
    } catch (error) { alert('Failed to update account'); }
  };

  const submitRecoveryDecision = async event => {
    event.preventDefault();
    if (!pendingRecoveryReview || !recoveryAdminPassword || isReviewingRecovery) return;
    setIsReviewingRecovery(true);
    setRecoveryReviewError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/account-recovery/${pendingRecoveryReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          decision: pendingRecoveryReview.decision,
          adminPassword: recoveryAdminPassword,
          reviewNote: recoveryReviewNote
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not review this recovery request.');
      const refreshed = await fetch(`${API_URL}/api/admin/account-recovery`, { headers: { Authorization: `Bearer ${token}` } });
      if (refreshed.ok) setAccountRecoveryRequests(await refreshed.json());
      setPendingRecoveryReview(null);
      setRecoveryAdminPassword('');
      setRecoveryReviewNote('');
      setSuccessMessage(result.message || 'Recovery request reviewed and email notification sent.');
    } catch (error) {
      setRecoveryReviewError(error.message || 'Could not review this recovery request.');
    } finally {
      setIsReviewingRecovery(false);
    }
  };

  const deleteStaff = async (id, adminPassword) => {
    const targetAccount = [...staff, ...riders].find(account => Number(account.id) === Number(id));
    if (targetAccount?.role === 'admin' && adminPassword === undefined) {
      setAdminDeletePassword('');
      setPendingAdminDeletion(targetAccount);
      return;
    }
    if (targetAccount?.role !== 'admin' && !window.confirm('Delete this account permanently?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ adminPassword })
      });
      if (response.ok) {
        setStaff(staff.filter(s => s.id !== id));
        setRiders(riders.filter(s => s.id !== id));
        setPendingAdminDeletion(null);
        setAdminDeletePassword('');
        setSuccessMessage('Account deleted successfully.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to delete account.');
        if (targetAccount?.role === 'admin') setAdminDeletePassword('');
      }
    } catch (error) { console.error('Failed to delete account', error); }
  };

  const filteredOrders = selectedBranch === 'All branches' ? orders : orders.filter(o => o.branch === selectedBranch);
  const activeOrdersList = filteredOrders.filter(o => !['Completed', 'Cancelled'].includes(o.status));
  const completedOrders = filteredOrders.filter(o => o.status === 'Completed');
  const salesRangeDays = salesPeriod === 'today' ? 1 : salesPeriod === '7days' ? 7 : 30;
  const currentSalesDate = new Date();
  const salesStartDate = new Date(currentSalesDate.getFullYear(), currentSalesDate.getMonth(), currentSalesDate.getDate() - salesRangeDays + 1);
  const salesOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.created_at);
    return Number.isFinite(orderDate.getTime()) && orderDate >= salesStartDate && orderDate <= currentSalesDate;
  });
  const salesRevenue = salesOrders.reduce((sum, order) => sum + Number(order.total_amount || order.total || 0), 0);
  const salesItemCount = salesOrders.reduce((sum, order) => sum + (order.itemsData?.reduce((itemSum, item) => itemSum + Number(item.qty || 0), 0) || 0), 0);
  const chartPointCount = salesPeriod === 'today' ? 12 : salesRangeDays;
  const salesChartPoints = Array.from({ length: chartPointCount }, (_, index) => {
    let pointDate;
    let pointOrders;

    if (salesPeriod === 'today') {
      const hourStart = index * 2;
      pointDate = new Date(currentSalesDate.getFullYear(), currentSalesDate.getMonth(), currentSalesDate.getDate(), hourStart);
      pointOrders = salesOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getHours() >= hourStart && orderDate.getHours() < hourStart + 2;
      });
    } else {
      pointDate = new Date(salesStartDate.getFullYear(), salesStartDate.getMonth(), salesStartDate.getDate() + index);
      const pointDateKey = `${pointDate.getFullYear()}-${pointDate.getMonth()}-${pointDate.getDate()}`;
      pointOrders = salesOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return `${orderDate.getFullYear()}-${orderDate.getMonth()}-${orderDate.getDate()}` === pointDateKey;
      });
    }

    return {
      date: pointDate,
      orders: pointOrders.length,
      sales: pointOrders.reduce((sum, order) => sum + Number(order.total_amount || order.total || 0), 0)
    };
  });
  const maxDailySales = Math.max(...salesChartPoints.map(point => point.sales), 0);
  const gcashOrders = salesOrders.filter(order => String(order.payment_method || '').toLowerCase().includes('gcash'));
  const cashOrders = salesOrders.filter(order => /cash/i.test(order.payment_method || ''));
  const gcashSales = gcashOrders.reduce((sum, order) => sum + Number(order.total_amount || order.total || 0), 0);
  const cashSales = cashOrders.reduce((sum, order) => sum + Number(order.total_amount || order.total || 0), 0);
  const paymentTotal = gcashSales + cashSales;
  const onlineOrders = salesOrders.filter(order => ['Delivery', 'Pick-up'].includes(order.order_type));
  const inStoreOrders = salesOrders.filter(order => ['Dine-in', 'Take-out'].includes(order.order_type));
  const onlineSales = onlineOrders.reduce((sum, order) => sum + Number(order.total_amount || order.total || 0), 0);
  const inStoreSales = inStoreOrders.reduce((sum, order) => sum + Number(order.total_amount || order.total || 0), 0);
  const historyOrdersList = filteredOrders.filter(o => o.status === 'Completed' || o.status === 'Cancelled');
  const visibleHistoryOrders = historyOrdersList.slice((historyPage - 1) * ADMIN_PAGE_SIZE, historyPage * ADMIN_PAGE_SIZE);
  const searchedPaymentOrders = completedOrders.filter(order => {
    const search = paymentSearch.trim().toLowerCase();
    if (!search) return true;
    return `${order.customerName || ''} ${order.email || ''}`.toLowerCase().includes(search);
  });
  const visiblePaymentOrders = searchedPaymentOrders.slice((paymentPage - 1) * ADMIN_PAGE_SIZE, paymentPage * ADMIN_PAGE_SIZE);
  const visibleActivityLogs = activityLogs.slice((activityPage - 1) * ADMIN_PAGE_SIZE, activityPage * ADMIN_PAGE_SIZE);

  const modules = [
    { id: 'Sales', name: 'Sales' },
    { id: 'Orders', name: 'Active Orders' },
    { id: 'Order History', name: 'Order History' },
    { id: 'Payment Logs', name: 'Payment Logs' },
    { id: 'Activity Logs', name: 'Activity Logs' },
    { id: 'Customers', name: 'Customers' },
    { id: 'Menu', name: 'Menu' },
    { id: 'Branches', name: 'Branches' },
    { id: 'Accounts', name: 'Accounts & Access' },
    { id: 'Account Recovery', name: `Account Recovery${accountRecoveryRequests.some(request => request.status === 'Pending') ? ' •' : ''}` },
    { id: 'Riders', name: 'Rider Accounts' }
  ];

  return (
    <div className="flex h-screen bg-[#F5EFE3] font-sans">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      <aside className={`fixed md:static inset-y-0 right-0 left-auto z-50 md:z-auto transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} w-[min(82vw,320px)] md:w-64 bg-[#FBFAF4] flex flex-col overflow-hidden rounded-l-2xl md:rounded-none shadow-xl md:shadow-lg border-l md:border-l-0 md:border-r border-[#C9A77C]/30 shrink-0`}>
        <div className="p-4 md:p-6 border-b border-[#C9A77C]/15">
          <button aria-label="Close navigation" className="md:hidden absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-[#F1E7D7] hover:text-[#4a3b32]" onClick={() => setIsSidebarOpen(false)}>✕</button>
          <h2 className="text-base md:text-xl font-black text-gray-900">Super admin</h2>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">3K Kitchen System</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 hide-scrollbar">
          <ul className="space-y-0 md:space-y-1">
            {modules.map((module) => (
              <li key={module.id}>
                <button
                  onClick={() => { setActiveModule(module.id); setIsSidebarOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-xs md:px-6 md:py-3 md:text-sm font-bold transition-all duration-300 ${activeModule === module.id ? 'bg-[#4a3b32] text-white rounded-l-full ml-2 px-2 md:rounded-l-none md:ml-0 md:px-6 md:rounded-r-full md:mr-4' : 'text-gray-600 hover:text-[#4a3b32] hover:bg-gray-50'}`}
                >
                  {module.name}
                </button>
              </li>
            ))}
            
            <li className="mt-4 border-t border-gray-100 pt-4">
              <Link to="/cashier" className="w-full block text-left px-4 py-2 text-xs md:px-6 md:py-3 md:text-sm font-bold text-gray-600 hover:text-[#4a3b32] hover:bg-gray-50">
                  ↪ Open Cashier System
              </Link>
            </li>
            <li>
              <Link to="/driver" className="w-full block text-left px-4 py-2 text-xs md:px-6 md:py-3 md:text-sm font-bold text-gray-600 hover:text-[#4a3b32] hover:bg-gray-50">
                  ↪ Open Driver System
              </Link>
            </li>
            <li>
              <Link to="/kiosk" className="w-full block text-left px-4 py-2 text-xs md:px-6 md:py-3 md:text-sm font-bold text-gray-600 hover:text-[#4a3b32] hover:bg-gray-50">
                  ↪ Open Kiosk
              </Link>
            </li>
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
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setPaymentPage(1);
                setHistoryPage(1);
              }}
              className="text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none hidden sm:block cursor-pointer"
            >
              <option>All branches</option>
              {branches.map(b => <option key={b.id}>{b.name}</option>)}
            </select>
            <span className="text-sm font-bold text-gray-600 hidden md:block">{user.email}</span>
            <button onClick={() => { logout(); navigate('/login'); }} className="text-sm font-bold text-red-500 hover:underline cursor-pointer">Sign out</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          
          {/* SALES MODULE */}
          {activeModule === 'Sales' && (
            <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-6" role="group" aria-label="Sales date range">
                {[
                  ['today', 'Today'],
                  ['7days', '7 days'],
                  ['30days', '30 days']
                ].map(([period, label]) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSalesPeriod(period)}
                    aria-pressed={salesPeriod === period}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${salesPeriod === period ? 'bg-[#4a3b32] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sales</h3>
                  <p className="text-2xl font-black text-gray-900">₱{salesRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Orders</h3>
                  <p className="text-2xl font-black text-gray-900">{salesOrders.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Average Order</h3>
                  <p className="text-2xl font-black text-gray-900">₱{salesOrders.length > 0 ? (salesRevenue / salesOrders.length).toFixed(2) : '0.00'}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Items Sold</h3>
                  <p className="text-2xl font-black text-gray-900">{salesItemCount}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{salesPeriod === 'today' ? 'Sales by hour' : 'Sales per day'}</h3>
                    <p className="mt-1 text-xs font-medium text-gray-500">
                      {salesPeriod === 'today' ? 'Today, in 2-hour intervals' : salesPeriod === '7days' ? 'Daily totals for the last 7 days' : 'Daily totals for the last 30 days'}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-[#815633]">Peak: {String.fromCharCode(8369)}{maxDailySales.toFixed(2)}</p>
                </div>
                <div className="overflow-x-auto pb-1">
                  <div className={`flex h-56 min-w-[560px] items-end gap-1 border-b border-gray-100 px-1 sm:min-w-0 ${salesPeriod === '30days' ? 'sm:gap-1' : 'sm:gap-3'}`}>
                    {salesChartPoints.map((point, index) => {
                      const isLabeled = salesPeriod !== '30days' || index % 5 === 0 || index === salesChartPoints.length - 1;
                      const label = salesPeriod === 'today'
                        ? point.date.toLocaleTimeString([], { hour: 'numeric' }).replace(' ', '').toLowerCase()
                        : point.date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                      const barHeight = maxDailySales > 0 && point.sales > 0 ? Math.max((point.sales / maxDailySales) * 100, 3) : 0;

                      return (
                        <div key={point.date.toISOString()} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                          <span className="mb-1 hidden whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] font-bold text-white group-hover:block">
                            {label}: {String.fromCharCode(8369)}{point.sales.toFixed(2)} · {point.orders} orders
                          </span>
                          <div className="flex h-[80%] w-full items-end justify-center">
                            <div
                              title={`${label}: ${String.fromCharCode(8369)}${point.sales.toFixed(2)} (${point.orders} orders)`}
                              aria-label={`${label}: ${String.fromCharCode(8369)}${point.sales.toFixed(2)}, ${point.orders} completed orders`}
                              className={`w-full max-w-10 rounded-t-sm bg-red-600/85 transition-all duration-300 ${point.sales > 0 ? 'group-hover:bg-red-700' : ''}`}
                              style={{ height: `${barHeight}%` }}
                            />
                          </div>
                          <span className="mt-2 h-4 whitespace-nowrap text-[9px] font-bold text-gray-500 sm:text-[10px]">
                            {isLabeled ? label : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {salesOrders.length === 0 && <p className="mt-3 text-center text-xs font-medium text-gray-400">No completed sales for this period.</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-6">Cash vs GCash</h3>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${paymentTotal > 0 ? (gcashSales / paymentTotal) * 100 : 0}%` }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-bold">
                    <span className="text-gray-600">GCash · {gcashOrders.length} orders</span>
                    <span className="text-right text-gray-900">{String.fromCharCode(8369)}{gcashSales.toFixed(2)}</span>
                    <span className="text-gray-600">Cash / COD · {cashOrders.length} orders</span>
                    <span className="text-right text-gray-900">{String.fromCharCode(8369)}{cashSales.toFixed(2)}</span>
                  </div>
                  {paymentTotal === 0 && <p className="mt-3 text-xs text-gray-400">No payment totals for this period.</p>}
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-5">Sales by channel</h3>
                  {[
                    { label: 'Online', orders: onlineOrders, sales: onlineSales },
                    { label: 'In-store', orders: inStoreOrders, sales: inStoreSales }
                  ].map(channel => (
                    <div key={channel.label} className="flex justify-between gap-3 border-b border-gray-100 py-3 text-sm last:border-0">
                      <div>
                        <p className="font-bold text-gray-800">{channel.label}</p>
                        <p className="mt-0.5 text-xs font-medium text-gray-500">{channel.orders.length} completed orders</p>
                      </div>
                      <p className="font-bold text-gray-700">{String.fromCharCode(8369)}{channel.sales.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE ORDERS MODULE */}
          {activeModule === 'Orders' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in flex flex-col">
              <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50">
                <select className="px-3 py-2 rounded border border-gray-300 text-sm font-bold outline-none flex-1">
                  <option>Any status</option><option>Pending</option><option>Preparing</option>
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
                  <thead className="bg-[#E6D4B8]/20">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Order</th>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Customer</th>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Type</th>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Status</th>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeOrdersList.map((order, i) => (
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
                                 bg-blue-100 text-blue-700`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-gray-900">₱{parseFloat(order.total_amount || order.total || 0).toFixed(2)}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 inline-block ${['GCash', 'Cash'].includes(order.payment_method) ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-yellow-50 text-yellow-600 border border-yellow-200'}`}>
                            {['GCash', 'Cash'].includes(order.payment_method) ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {activeOrdersList.length === 0 && (
                        <tr><td colSpan="5" className="text-center py-8 text-gray-400 font-bold">No active orders right now.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORDER HISTORY MODULE */}
          {activeModule === 'Order History' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in flex flex-col">
              <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50">
                  <h2 className="font-bold text-gray-700">Completed & Cancelled Orders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[900px]">
                  <thead className="bg-[#E6D4B8]/20">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Order</th>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Customer</th>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Type</th>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Status</th>
                      <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleHistoryOrders.map((order, i) => (
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
                             ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-gray-900">₱{parseFloat(order.total_amount || order.total || 0).toFixed(2)}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 inline-block ${['GCash', 'Cash'].includes(order.payment_method) ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-yellow-50 text-yellow-600 border border-yellow-200'}`}>
                            {['GCash', 'Cash'].includes(order.payment_method) ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {historyOrdersList.length === 0 && (
                        <tr><td colSpan="5" className="text-center py-8 text-gray-400 font-bold">No historical orders found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
                <AdminPagination page={historyPage} itemCount={historyOrdersList.length} onPageChange={setHistoryPage} />
            </div>
          )}

          {/* PAYMENT LOGS MODULE */}
          {activeModule === 'Payment Logs' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in flex flex-col">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50">
                  <h2 className="font-bold text-gray-700">Payment Transactions (Completed Orders)</h2>
                  <input
                    type="search"
                    value={paymentSearch}
                    onChange={event => {
                      setPaymentSearch(event.target.value);
                      setPaymentPage(1);
                    }}
                    placeholder="Search customer name or email"
                    aria-label="Search payment logs by customer name or email"
                    className="w-full sm:max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#815633]"
                  />
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[700px]">
                      <thead className="bg-[#E6D4B8]/20">
                          <tr>
                              <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Order ID</th>
                              <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Customer</th>
                              <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Method</th>
                              <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Amount</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {visiblePaymentOrders.map(order => (
                              <tr key={order.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 font-black text-gray-900">O-{String(order.id).padStart(4, '0')}</td>
                                  <td className="px-6 py-4 font-bold text-gray-900">
                                    <span className="block">{order.customerName || 'Unknown customer'}</span>
                                    {order.email && <span className="mt-0.5 block text-xs font-medium text-gray-500">{order.email}</span>}
                                  </td>
                                  <td className="px-6 py-4 font-bold text-gray-700">{order.payment_method}</td>
                                  <td className="px-6 py-4 font-black text-[#815633]">₱{parseFloat(order.total_amount || order.total || 0).toFixed(2)}</td>
                              </tr>
                          ))}
                          {searchedPaymentOrders.length === 0 && (
                              <tr><td colSpan="4" className="text-center py-8 text-gray-400 font-bold">{paymentSearch ? 'No matching customer payments found.' : 'No completed payments found.'}</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
              <AdminPagination page={paymentPage} itemCount={searchedPaymentOrders.length} onPageChange={setPaymentPage} />
            </div>
          )}

          {/* ACTIVITY LOGS MODULE */}
          {activeModule === 'Activity Logs' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in flex flex-col">
                <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50">
                    <h2 className="font-bold text-gray-700">System Activity Logs</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[900px]">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Date & Time</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">User</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Role</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {visibleActivityLogs.map((log, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{log.user_name}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider">{log.role}</span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{log.action}</td>
                                </tr>
                            ))}
                            {activityLogs.length === 0 && (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-400 font-bold">No activity logged yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <AdminPagination page={activityPage} itemCount={activityLogs.length} onPageChange={setActivityPage} />
            </div>
          )}

          {/* CUSTOMERS MODULE */}
          {activeModule === 'Customers' && (
            <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div>
                  <h2 className="text-lg font-black text-gray-900">Registered Customers</h2>
                  <p className="text-sm font-bold text-gray-500">Total Customer Accounts: {customers.length}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[900px]">
                        <thead className="bg-[#E6D4B8]/20">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Name</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Email</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Phone</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Joined</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[10px] uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {customers.map((c, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-gray-900">{c.firstname} {c.lastname}</td>
                                    <td className="px-6 py-4 font-medium text-gray-700">{c.email}</td>
                                    <td className="px-6 py-4 font-medium text-gray-700">{c.phone || 'N/A'}</td>
                                    <td className="px-6 py-4 font-bold text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => setViewCustomer(c)} className="bg-white border border-gray-300 text-[#815633] px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">View Profile & Logs</button>
                                    </td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr><td colSpan="5" className="text-center py-8 text-gray-400 font-bold">No registered customers found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
                      <button type="submit" className="px-6 py-2 bg-[#815633] text-white font-bold rounded-lg shadow-sm hover:bg-[#62432B]">Update</button>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wider text-orange-700">POS / Cashier</p>
                  <p className="mt-1 text-2xl font-black text-gray-900">{staff.filter(account => account.role === 'cashier').length}</p>
                  <p className="mt-1 text-xs text-gray-500">Staff accounts for POS and cashier access.</p>
                </div>
                <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-wider text-purple-700">Admin</p>
                  <p className="mt-1 text-2xl font-black text-gray-900">{staff.filter(account => account.role === 'admin').length}</p>
                  <p className="mt-1 text-xs text-gray-500">Accounts with admin dashboard access.</p>
                </div>
                <button type="button" onClick={() => setActiveModule('Riders')} className="rounded-xl border border-blue-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-400 hover:bg-blue-50/40">
                  <p className="text-xs font-black uppercase tracking-wider text-blue-700">Rider Accounts</p>
                  <p className="mt-1 text-2xl font-black text-gray-900">{riders.length}</p>
                  <p className="mt-1 text-xs font-bold text-blue-700">Manage rider logins →</p>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-600">Create and manage Admin and POS/Cashier staff accounts. Rider accounts are managed separately.</p>
                <button onClick={() => { setNewAccountAdminPassword(''); setShowAddStaff(true); }} className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-700">+ New Admin / POS Account</button>
              </div>

              {/* Add Staff Modal */}
              {showAddStaff && (
                <form onSubmit={handleAddStaff} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-bold mb-2">First Name</label><input type="text" required value={newStaff.firstname} onChange={e => setNewStaff({...newStaff, firstname: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-2">Last Name</label><input type="text" required value={newStaff.lastname} onChange={e => setNewStaff({...newStaff, lastname: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-2">Email Username</label><input type="email" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-2">Password</label><input type="password" required value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold mb-2">Confirm your current admin password</label>
                    <input type="password" required autoComplete="current-password" value={newAccountAdminPassword} onChange={e => setNewAccountAdminPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-[#815633]" />
                    <p className="mt-1 text-xs text-gray-500">Required to authorize creating a dashboard account.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Role</label>
                    <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none cursor-pointer">
                      <option value="cashier">POS / Cashier Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  {newStaff.role === 'cashier' && (
                    <div>
                      <label className="block text-sm font-bold mb-2">Assign Branch</label>
                      <select value={newStaff.branch} onChange={e => setNewStaff({...newStaff, branch: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none cursor-pointer" required>
                        <option value="">Select a branch...</option>
                        {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="sm:col-span-2 flex justify-end gap-4 mt-2">
                    <button type="button" onClick={() => { setShowAddStaff(false); setNewAccountAdminPassword(''); }} className="px-6 py-2 font-bold text-gray-500 hover:bg-gray-50 rounded-lg border">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg shadow-sm">Save Account</button>
                  </div>
                </form>
              )}

              {/* Edit Staff Modal */}
              {editingStaff && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                  <form onSubmit={handleEditStaff} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
                    <button type="button" onClick={() => { setEditingStaff(null); setEditStaffPass(''); setEditStaffAdminPassword(''); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl">✕</button>
                    <h2 className="text-xl font-black text-gray-900 mb-2 sm:col-span-2">Edit Staff Account</h2>
                    
                    <div><label className="block text-sm font-bold mb-2">First Name</label><input type="text" required value={editingStaff.firstname} onChange={e => setEditingStaff({...editingStaff, firstname: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-bold mb-2">Last Name</label><input type="text" required value={editingStaff.lastname} onChange={e => setEditingStaff({...editingStaff, lastname: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-bold mb-2">Email Username</label><input type="email" required value={editingStaff.email} onChange={e => setEditingStaff({...editingStaff, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Password</label>
                      <input type="password" value={editStaffPass} onChange={e => setEditStaffPass(e.target.value)} placeholder="Leave blank to keep current" className="w-full px-4 py-2 border rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Role</label>
                      <select value={editingStaff.role} onChange={e => setEditingStaff({...editingStaff, role: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none cursor-pointer">
                        <option value="cashier">POS / Cashier Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {editingStaff.role === 'admin' && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold mb-2">Confirm your current admin password</label>
                        <input type="password" required autoComplete="current-password" value={editStaffAdminPassword} onChange={e => setEditStaffAdminPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-[#815633]" />
                        <p className="mt-1 text-xs text-gray-500">Required to save an admin account or grant admin access.</p>
                      </div>
                    )}
                    
                    {editingStaff.role === 'cashier' && (
                      <div>
                        <label className="block text-sm font-bold mb-2">Assign Branch</label>
                        <select value={editingStaff.branch || ''} onChange={e => setEditingStaff({...editingStaff, branch: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none cursor-pointer" required>
                          <option value="">Select a branch...</option>
                          {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                      </div>
                    )}
                    
                    <div className="sm:col-span-2 flex justify-end gap-4 mt-4">
                      <button type="button" onClick={() => { setEditingStaff(null); setEditStaffPass(''); setEditStaffAdminPassword(''); }} className="px-6 py-2 font-bold text-gray-500 hover:bg-gray-50 rounded-lg border">Cancel</button>
                      <button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg shadow-sm">Save Changes</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto touch-pan-x">
                <div className="min-w-[560px] divide-y divide-gray-100 p-2">
                  {staff.map(member => (
                    <div key={member.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${member.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                          {member.firstname.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {member.firstname} {member.lastname} 
                            {member.branch && <span className="text-xs text-gray-500 font-medium ml-2">({member.branch})</span>}
                          </p>
                          <p className="text-sm text-gray-500 font-medium">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${member.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-orange-50 text-orange-700 border border-orange-200'} mr-4`}>
                          {member.role === 'cashier' ? 'POS / CASHIER' : 'ADMIN'}
                        </span>
                        
                        {/* Edit and Delete Buttons */}
                        <button onClick={() => { setEditStaffPass(''); setEditStaffAdminPassword(''); setEditingStaff(member); }} className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50">Edit</button>
                        {user.email !== member.email && (
                          <button onClick={() => deleteStaff(member.id)} className="text-red-400 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 border border-red-100">Delete</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {staff.length === 0 && <p className="text-center text-gray-500 py-6 font-bold">No staff accounts found.</p>}
                </div>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'Account Recovery' && (
            <div className="mx-auto max-w-5xl space-y-5 animate-fade-in">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="font-black text-gray-900">Account recovery requests</h2>
                <p className="mt-1 text-sm text-gray-600">Compare the submitted information with the existing account before deciding. Approval changes the account email and sends a password reset link to the new address. Your admin password is required for every decision.</p>
              </div>
              {accountRecoveryRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm font-semibold text-gray-500">No recovery requests yet.</div>
              ) : accountRecoveryRequests.map(request => (
                <article key={request.id} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Request #{request.id}</p>
                      <h3 className="mt-1 text-lg font-black text-gray-900">{request.account_name}</h3>
                      <p className="text-xs text-gray-500">Submitted {new Date(request.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${request.status === 'Pending' ? 'border-amber-200 bg-amber-50 text-amber-700' : request.status === 'Approved' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{request.status}</span>
                  </header>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <p><span className="block text-xs font-bold uppercase text-gray-400">Account email</span><span className="font-semibold text-gray-800">{request.account_email}</span></p>
                    <p><span className="block text-xs font-bold uppercase text-gray-400">Requested new email</span><span className="font-semibold text-gray-800">{request.new_email}</span></p>
                    <p><span className="block text-xs font-bold uppercase text-gray-400">Registered phone</span><span className="font-semibold text-gray-800">{request.registered_phone}</span></p>
                    <p><span className="block text-xs font-bold uppercase text-gray-400">Registered birth date</span><span className="font-semibold text-gray-800">{request.registered_dob || 'Not provided'}</span></p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <p className="text-xs font-black uppercase tracking-wider text-blue-800">Existing account details for comparison</p>
                    {request.matched_account_id ? <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                      <p><span className="block text-xs font-bold text-blue-700/70">Account name</span><span className="font-semibold text-gray-800">{request.matched_firstname} {request.matched_lastname}</span></p>
                      <p><span className="block text-xs font-bold text-blue-700/70">Account email</span><span className="font-semibold text-gray-800">{request.account_email}</span></p>
                      <p><span className="block text-xs font-bold text-blue-700/70">Phone on account</span><span className="font-semibold text-gray-800">{request.matched_phone || 'Not set'}</span></p>
                      <p><span className="block text-xs font-bold text-blue-700/70">Birth date on account</span><span className="font-semibold text-gray-800">{request.matched_dob || 'Not set'}</span></p>
                    </div> : <p className="mt-2 text-sm font-semibold text-red-700">No account currently matches this email. Approval is unavailable until the account can be identified.</p>}
                  </div>
                  <div className="rounded-xl bg-[#FBFAF4] p-3">
                    <p className="text-xs font-bold uppercase text-gray-400">Additional verification details</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">{request.account_details || 'None provided'}</p>
                  </div>
                  {request.review_note && <p className="text-sm text-gray-600"><span className="font-bold">Admin note:</span> {request.review_note}</p>}
                  {request.status === 'Pending' && <div className="flex flex-wrap justify-end gap-2">
                    <button type="button" onClick={() => { setPendingRecoveryReview({ ...request, decision: 'Denied' }); setRecoveryAdminPassword(''); setRecoveryReviewNote(''); setRecoveryReviewError(''); }} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Deny</button>
                    <button type="button" disabled={!request.matched_account_id} onClick={() => { setPendingRecoveryReview({ ...request, decision: 'Approved' }); setRecoveryAdminPassword(''); setRecoveryReviewNote(''); setRecoveryReviewError(''); }} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40">Approve & send reset link</button>
                  </div>}
                </article>
              ))}
            </div>
          )}

          {/* RIDERS MODULE */}
          {activeModule === 'Riders' && (
            <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm font-bold text-gray-600">Create and manage rider login accounts and delivery access.</p>
                <button onClick={() => setShowAddRider(true)} className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-700">+ New Rider</button>
              </div>

              {/* Add Rider Modal */}
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

              {/* Edit Rider Modal */}
              {editingRider && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                  <form onSubmit={handleEditRider} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
                    <button type="button" onClick={() => { setEditingRider(null); setEditRiderPass(''); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl">✕</button>
                    <h2 className="text-xl font-black text-gray-900 mb-2 sm:col-span-2">Edit Rider Account</h2>
                    
                    <div><label className="block text-sm font-bold mb-2">First Name</label><input type="text" required value={editingRider.firstname} onChange={e => setEditingRider({...editingRider, firstname: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-bold mb-2">Last Name</label><input type="text" required value={editingRider.lastname} onChange={e => setEditingRider({...editingRider, lastname: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-bold mb-2">Email Username</label><input type="email" required value={editingRider.email} onChange={e => setEditingRider({...editingRider, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Password</label>
                      <input type="password" value={editRiderPass} onChange={e => setEditRiderPass(e.target.value)} placeholder="Leave blank to keep current" className="w-full px-4 py-2 border rounded-lg outline-none" />
                    </div>
                    
                    <div className="sm:col-span-2 flex justify-end gap-4 mt-4">
                      <button type="button" onClick={() => { setEditingRider(null); setEditRiderPass(''); }} className="px-6 py-2 font-bold text-gray-500 hover:bg-gray-50 rounded-lg border">Cancel</button>
                      <button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg shadow-sm">Save Changes</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto touch-pan-x">
                <div className="min-w-[520px] divide-y divide-gray-100 p-2">
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
                      
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wider mr-4">Active</span>
                        
                        <button onClick={() => setEditingRider(rider)} className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50">Edit</button>
                        <button onClick={() => deleteStaff(rider.id)} className="text-red-400 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 border border-red-100">Delete</button>
                      </div>
                    </div>
                  ))}
                  {riders.length === 0 && <p className="text-center text-gray-500 py-6 font-bold">No riders registered.</p>}
                </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      
      {/* CUSTOMER PROFILE MODAL */}
      {viewCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col h-[600px] overflow-hidden relative">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-black text-gray-900 text-xl">Customer Profile</h3>
              <button onClick={() => setViewCustomer(null)} className="text-gray-400 hover:text-gray-900 font-bold text-xl">✕</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6 bg-[#F5EFE3]">
               <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Account Details</h4>
                 <div className="grid grid-cols-2 gap-4">
                     <p className="text-sm font-medium text-gray-700"><strong className="text-gray-900 block mb-1">Name</strong> {viewCustomer.firstname} {viewCustomer.lastname}</p>
                     <p className="text-sm font-medium text-gray-700"><strong className="text-gray-900 block mb-1">Email</strong> {viewCustomer.email}</p>
                     <p className="text-sm font-medium text-gray-700"><strong className="text-gray-900 block mb-1">Phone</strong> {viewCustomer.phone || 'N/A'}</p>
                     <p className="text-sm font-medium text-gray-700"><strong className="text-gray-900 block mb-1">Member Since</strong> {new Date(viewCustomer.created_at).toLocaleDateString()}</p>
                 </div>
               </div>
               
               <div>
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Activity Logs & Orders</h4>
                 <div className="space-y-2">
                   {activityLogs.filter(log => log.user_name === `${viewCustomer.firstname} ${viewCustomer.lastname}`).length > 0 ? (
                     activityLogs.filter(log => log.user_name === `${viewCustomer.firstname} ${viewCustomer.lastname}`).map(log => (
                       <div key={log.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col gap-1">
                         <span className="text-[10px] text-gray-400 font-bold">{new Date(log.created_at).toLocaleString()}</span>
                         <span className="font-medium text-gray-800 text-sm">{log.action}</span>
                       </div>
                     ))
                   ) : (
                     <div className="p-8 bg-white rounded-xl border border-gray-100 text-center">
                         <p className="text-sm text-gray-500 font-bold">No activity logs found for this user.</p>
                     </div>
                   )}
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {pendingRecoveryReview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <form onSubmit={submitRecoveryDecision} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <header>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#815633]">Account recovery review</p>
              <h2 className="mt-1 text-xl font-black text-gray-900">{pendingRecoveryReview.decision} request for {pendingRecoveryReview.account_name}</h2>
              <p className="mt-2 text-sm text-gray-600">{pendingRecoveryReview.decision === 'Approved' ? `The account email will change to ${pendingRecoveryReview.new_email} and a reset link will be sent there.` : `A denial email will be sent to ${pendingRecoveryReview.new_email}.`}</p>
            </header>
            {pendingRecoveryReview.decision === 'Denied' && <label className="block text-sm font-bold text-gray-700">Reason to include in the email <span className="font-normal text-gray-400">(optional)</span>
              <textarea maxLength={1000} rows={3} value={recoveryReviewNote} onChange={event => setRecoveryReviewNote(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium outline-none focus:border-[#815633]" />
            </label>}
            <label className="block text-sm font-bold text-gray-700">Confirm your admin password
              <input type="password" required autoComplete="current-password" value={recoveryAdminPassword} onChange={event => setRecoveryAdminPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium outline-none focus:border-[#815633]" />
            </label>
            {recoveryReviewError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{recoveryReviewError}</p>}
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button type="button" disabled={isReviewingRecovery} onClick={() => setPendingRecoveryReview(null)} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-60">Cancel</button>
              <button type="submit" disabled={isReviewingRecovery || !recoveryAdminPassword} className={`rounded-lg px-4 py-2.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60 ${pendingRecoveryReview.decision === 'Approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {isReviewingRecovery ? 'Sending email...' : `Confirm ${pendingRecoveryReview.decision}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {pendingAdminDeletion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={event => {
              event.preventDefault();
              deleteStaff(pendingAdminDeletion.id, adminDeletePassword);
            }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-black text-gray-900">Confirm admin deletion</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              You are deleting <strong>{pendingAdminDeletion.firstname} {pendingAdminDeletion.lastname}</strong>. Enter your current admin password to authorize this action.
            </p>
            <label htmlFor="admin-delete-password" className="mt-5 block text-sm font-bold text-gray-700">Current admin password</label>
            <input
              id="admin-delete-password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              value={adminDeletePassword}
              onChange={event => setAdminDeletePassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#815633]"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setPendingAdminDeletion(null); setAdminDeletePassword(''); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={!adminDeletePassword} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">Delete admin</button>
            </div>
          </form>
        </div>
      )}

      <SuccessModal message={successMessage} onClose={() => setSuccessMessage('')} />
    </div>
  );
}
