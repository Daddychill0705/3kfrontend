import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import SuccessModal from '../components/SuccessModal';
import { useToast } from '../context/ToastContext';

const ADMIN_PAGE_SIZE = 20;
const ADMIN_MODULE_DESCRIPTIONS = {
  Sales: 'Review revenue, order volume, and how customers are ordering.',
  Orders: 'Keep an eye on new orders and update their progress for the team.',
  'Order History': 'Find completed and cancelled orders from every branch.',
  'Payment Logs': 'Review completed payments and search for customer records.',
  'Activity Logs': 'See recent changes and actions across the admin system.',
  Customers: 'Look up customer accounts and their order activity.',
  Menu: 'Manage products, categories, pricing, and availability.',
  'Accounts & Access': 'Manage administrator and POS access for your team.',
  'Account Recovery': 'Review and respond to customer account recovery requests.',
  'Rider Accounts': 'Manage rider access for delivery operations.'
};

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
  const [menuCategories, setMenuCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [riders, setRiders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [accountRecoveryRequests, setAccountRecoveryRequests] = useState([]);
  const [pendingRecoveryReview, setPendingRecoveryReview] = useState(null);
  const [recoveryAdminPassword, setRecoveryAdminPassword] = useState('');
  const [recoveryReviewNote, setRecoveryReviewNote] = useState('');
  const [isReviewingRecovery, setIsReviewingRecovery] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Product States
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showChooseProductCategory, setShowChooseProductCategory] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [addCategoryForProduct, setAddCategoryForProduct] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState('');
  const [categoryDeleteReplacement, setCategoryDeleteReplacement] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '' });
  const [productImage, setProductImage] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editImage, setEditImage] = useState(null);

  // Branch States
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', code: '', address: '', phone: '' });
  const [editingBranch, setEditingBranch] = useState(null);

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
  const { showToast } = useToast();
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
        
        const [ordersRes, menuRes, categoriesRes, branchRes, riderRes, staffRes, logRes, customersRes, recoveryRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/orders`, { headers }),
          fetch(`${API_URL}/api/menu`),
          fetch(`${API_URL}/api/menu/categories`),
          fetch(`${API_URL}/api/branches`),
          fetch(`${API_URL}/api/admin/riders`, { headers }),
          fetch(`${API_URL}/api/admin/users`, { headers }),
          fetch(`${API_URL}/api/admin/activity-logs`, { headers }),
          fetch(`${API_URL}/api/admin/customers`, { headers }),
          fetch(`${API_URL}/api/admin/account-recovery`, { headers })
        ]);
        
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (menuRes.ok) setMenuItems(await menuRes.json());
        if (categoriesRes.ok) {
          const fetchedCategories = await categoriesRes.json();
          const names = Array.isArray(fetchedCategories) ? fetchedCategories.map(category => typeof category === 'string' ? category : category.name).filter(Boolean) : [];
          setMenuCategories([...new Set(names)]);
        }
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
          return showToast('Failed to upload new image to Cloudinary.', 'error');
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
      } else showToast('Failed to update menu item.', 'error');
    } catch (error) { showToast(error.message || 'Error updating product.', 'error'); }
  };

  const openProductCategoryStep = () => {
    setNewProduct({ name: '', category: '', price: '' });
    setProductImage(null);
    setShowChooseProductCategory(true);
  };

  const continueToNewProduct = () => {
    if (!newProduct.category) return showToast('Please choose a category first.', 'error');
    setShowChooseProductCategory(false);
    setShowAddProduct(true);
  };

  const handleAddCategory = async (event) => {
    event.preventDefault();
    const name = newCategoryName.trim().replace(/\s+/g, ' ');
    if (!name) return showToast('Enter a category name.', 'error');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/menu/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to add category.');

      setMenuCategories(previous => [...new Set([...previous, result.name || name])]);
      setNewCategoryName('');
      setShowAddCategory(false);
      if (addCategoryForProduct) {
        setNewProduct(previous => ({ ...previous, category: result.name || name }));
        setShowChooseProductCategory(false);
        setShowAddProduct(true);
      } else {
        setSuccessMessage('New category added successfully.');
      }
      setAddCategoryForProduct(false);
    } catch (error) {
      showToast(error.message || 'Failed to add category.', 'error');
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/menu/categories`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: categoryToDelete, moveTo: categoryDeleteReplacement })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to delete category.');

      setMenuCategories(previous => previous.filter(category => category !== categoryToDelete));
      if (result.movedTo) setMenuItems(previous => previous.map(item => item.category === categoryToDelete ? { ...item, category: result.movedTo } : item));
      if (newProduct.category === categoryToDelete) setNewProduct(previous => ({ ...previous, category: '' }));
      showToast(result.movedProducts ? `Category deleted. ${result.movedProducts} product${result.movedProducts === 1 ? '' : 's'} moved to ${result.movedTo}.` : 'Category deleted successfully.');
      setCategoryToDelete('');
      setCategoryDeleteReplacement('');
    } catch (error) {
      showToast(error.message || 'Failed to delete category.', 'error');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.category) return showToast('Please choose a category first.', 'error');
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
        } else return showToast('Failed to upload image to Cloudinary.', 'error');
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
      } else showToast('Failed to save menu item.', 'error');
    } catch (error) { showToast(error.message || 'Error adding product.', 'error'); }
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
    } catch (error) { showToast(error.message || 'Failed to add branch.', 'error'); }
  };

  const handleEditBranch = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/branches/${editingBranch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: editingBranch.name,
          code: editingBranch.code,
          address: editingBranch.address || '',
          phone: editingBranch.phone || ''
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to update branch.');

      const branchesResponse = await fetch(`${API_URL}/api/branches`);
      if (branchesResponse.ok) setBranches(await branchesResponse.json());
      setEditingBranch(null);
      setSuccessMessage('Branch details updated successfully.');
    } catch (error) {
      showToast(error.message || 'Failed to update branch.', 'error');
    }
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
        showToast(result.error || 'Failed to add rider.', 'error');
      }
    } catch (error) { showToast(error.message || 'Failed to add rider.', 'error'); }
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
      } else showToast('Failed to update rider.', 'error');
    } catch (error) { showToast(error.message || 'Failed to update rider.', 'error'); }
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
        showToast(errorData.error || 'Failed to add account. Email may already exist.', 'error');
      }
    } catch (error) { showToast(error.message || 'Failed to add account.', 'error'); }
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
        showToast(errorData.error || 'Failed to update account.', 'error');
      }
    } catch (error) { showToast(error.message || 'Failed to update account.', 'error'); }
  };

  const submitRecoveryDecision = async event => {
    event.preventDefault();
    if (!pendingRecoveryReview || !recoveryAdminPassword || isReviewingRecovery) return;
    setIsReviewingRecovery(true);
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
      showToast(error.message || 'Could not review this recovery request.', 'error');
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
        showToast(errorData.error || 'Failed to delete account.', 'error');
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
  const productsInDeleteCategory = menuItems.filter(item => item.category === categoryToDelete);

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
      
      <aside className={`fixed md:static inset-y-0 right-0 left-auto z-50 md:z-auto transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} w-[min(82vw,320px)] md:w-64 bg-gradient-to-b from-[#34291f] via-[#30271f] to-[#241e19] text-white flex flex-col overflow-hidden rounded-l-2xl md:rounded-none shadow-2xl border-l md:border-l-0 md:border-r border-[#8c6a47]/45 shrink-0`}>
        <div className="relative overflow-hidden border-b border-white/10 p-4 md:p-6">
          <div className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-[#c9a77c]/10" aria-hidden="true" />
          <button aria-label="Close navigation" className="md:hidden absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-[#F1E7D7] hover:text-[#4a3b32]" onClick={() => setIsSidebarOpen(false)}>✕</button>
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d9b98d]/35 bg-gradient-to-br from-[#bd9362] to-[#815633] text-sm font-black text-white shadow-lg">3K</div>
            <div><h2 className="text-base font-black tracking-wide text-white md:text-lg">3K Kitchen</h2><span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#d8bd9c]">Admin workspace</span></div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 hide-scrollbar">
          <p className="px-5 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#c3a784]/65">Manage your kitchen</p>
          <ul className="space-y-1 px-2">
            {modules.map((module) => (
              <li key={module.id}>
                <button
                  onClick={() => { setActiveModule(module.id); setIsSidebarOpen(false); }}
                  className={`admin-nav-item relative w-full rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all duration-200 md:px-4 md:py-3 md:text-[13px] ${activeModule === module.id ? 'is-active bg-gradient-to-r from-[#bd9362] to-[#946c45] text-white shadow-lg shadow-black/15' : 'text-[#e7dccd]/80 hover:bg-white/[0.07] hover:text-white'}`}
                >
                  {module.name}
                </button>
              </li>
            ))}
            
            <li className="mt-5 border-t border-white/10 pt-4">
              <p className="px-3 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#c3a784]/65">Quick access</p>
              <Link to="/cashier" className="block w-full rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#e7dccd]/80 transition hover:bg-white/[0.07] hover:text-white md:px-4 md:py-3 md:text-[13px]">
                  ↪ Open Cashier System
              </Link>
            </li>
            <li>
              <Link to="/driver" className="block w-full rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#e7dccd]/80 transition hover:bg-white/[0.07] hover:text-white md:px-4 md:py-3 md:text-[13px]">
                  ↪ Open Driver System
              </Link>
            </li>
            <li>
              <Link to="/kiosk" className="block w-full rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#e7dccd]/80 transition hover:bg-white/[0.07] hover:text-white md:px-4 md:py-3 md:text-[13px]">
                  ↪ Open Kiosk
              </Link>
            </li>
          </ul>
        </div>
      </aside>

      <main className="admin-dashboard-shell relative z-10 flex flex-1 flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 md:px-6 lg:px-8 border-b border-gray-200 bg-white shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-gray-600" onClick={() => setIsSidebarOpen(true)}>☰</button>
            <div className="leading-tight"><p className="hidden text-[9px] font-black uppercase tracking-[0.2em] text-[#9a7755] sm:block">3K Kitchen / Management</p><h1 className="admin-page-title truncate text-lg font-black text-[#33251b] md:text-xl">Admin Workspace</h1></div>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setPaymentPage(1);
                setHistoryPage(1);
              }}
              className="hidden cursor-pointer rounded-xl border border-[#d8bd9c] bg-[#fffdf8] px-3 py-2 text-xs font-bold text-[#5d4733] outline-none transition focus:border-[#815633] sm:block"
            >
              <option>All branches</option>
              {branches.map(b => <option key={b.id}>{b.name}</option>)}
            </select>
            <span className="hidden items-center gap-2 rounded-full border border-[#e8d9c4] bg-white/80 px-3 py-2 text-xs font-bold text-[#665442] md:inline-flex"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#815633] text-[10px] font-black text-white">{user.email?.[0]?.toUpperCase() || 'A'}</span>{user.email}</span>
            <button onClick={() => { logout(); navigate('/login'); }} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 cursor-pointer">Sign out</button>
          </div>
        </header>

        <div className="admin-dashboard-content flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {activeModule !== 'Branches' && (
            <section className="admin-module-intro mx-auto mb-6 flex max-w-[1500px] flex-col justify-between gap-4 rounded-2xl border border-[#d8bd9c]/55 bg-gradient-to-r from-[#fffdf8] via-[#fbf4e9] to-[#f2e3ce] p-5 shadow-[0_8px_22px_rgba(83,57,34,0.08)] sm:flex-row sm:items-center sm:p-6">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#946c45] to-[#62432b] text-white shadow-lg shadow-[#815633]/20"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true"><path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v5H4zM14 15h6v5h-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg></div>
                <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#a06d3f]">3K Kitchen · Admin</p><h2 className="mt-0.5 text-xl font-black text-[#33251b] sm:text-2xl">{activeModule}</h2><p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#705b46] sm:text-sm">{ADMIN_MODULE_DESCRIPTIONS[activeModule] || 'Manage your 3K Kitchen operations from one place.'}</p></div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-[#dfc9aa] bg-white/75 px-3 py-2 sm:self-auto"><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" /><span className="text-[10px] font-bold uppercase tracking-wider text-[#9a7755]">Branch</span><span className="max-w-40 truncate text-xs font-extrabold text-[#5d4733]">{selectedBranch}</span></div>
            </section>
          )}
          
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
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setAddCategoryForProduct(false); setNewCategoryName(''); setShowAddCategory(true); }} className="rounded-lg border border-[#C9A77C] bg-white px-4 py-2 text-sm font-bold text-[#815633] shadow-sm transition hover:bg-[#F5EFE3]">+ Add Category</button>
                  <button type="button" onClick={openProductCategoryStep} className="rounded-lg bg-[#815633] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#62432B]">+ New Product</button>
                </div>
              </div>

              {showChooseProductCategory && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                  <section className="w-full max-w-lg rounded-3xl border border-[#d8bd9c] bg-[#fffdf8] p-6 shadow-2xl sm:p-8">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#a06d3f]">Step 1 of 2</p><h2 className="mt-1 text-2xl font-black text-[#33251b]">Choose a category</h2><p className="mt-1 text-sm text-[#705b46]">Select where this product belongs before entering its details.</p></div>
                      <button type="button" onClick={() => setShowChooseProductCategory(false)} aria-label="Close category selection" className="rounded-lg px-2 py-1 text-xl font-bold text-gray-400 hover:bg-gray-100">×</button>
                    </div>
                    <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                      {menuCategories.map(category => (
                        <div key={category} className={`flex min-w-0 overflow-hidden rounded-xl border transition ${newProduct.category === category ? 'border-[#815633] bg-[#815633] text-white shadow-md' : 'border-[#e4d3bd] bg-white text-[#5d4733] hover:border-[#b98d61] hover:bg-[#f8f0e4]'}`}>
                          <button type="button" onClick={() => setNewProduct(previous => ({ ...previous, category }))} className="min-w-0 flex-1 px-3 py-3 text-left text-sm font-bold">{category}</button>
                          <button type="button" onClick={() => { setCategoryToDelete(category); setCategoryDeleteReplacement(menuCategories.find(option => option !== category) || ''); }} aria-label={`Delete ${category} category`} title="Delete category" className={`group/delete flex w-11 shrink-0 items-center justify-center border-l transition ${newProduct.category === category ? 'border-white/20 text-white/75 hover:bg-red-600 hover:text-white' : 'border-[#eee3d4] text-[#a16a59] hover:bg-red-50 hover:text-red-700'}`}>
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => { setAddCategoryForProduct(true); setNewCategoryName(''); setShowAddCategory(true); }} className="mt-3 w-full rounded-xl border border-dashed border-[#bc9368] bg-[#f8f0e4] px-4 py-3 text-sm font-extrabold text-[#815633] transition hover:bg-[#f0e2cd]">+ Create a new category</button>
                    <div className="mt-6 flex justify-end gap-3 border-t border-[#eadcc9] pt-5"><button type="button" onClick={() => setShowChooseProductCategory(false)} className="rounded-lg border border-[#d8bd9c] px-4 py-2 text-sm font-bold text-[#705b46] hover:bg-[#f7eddd]">Cancel</button><button type="button" onClick={continueToNewProduct} disabled={!newProduct.category} className="rounded-lg bg-[#815633] px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#62432B] disabled:cursor-not-allowed disabled:opacity-40">Continue</button></div>
                  </section>
                </div>
              )}

              {showAddCategory && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
                  <form onSubmit={handleAddCategory} className="w-full max-w-md rounded-3xl border border-[#d8bd9c] bg-[#fffdf8] p-6 shadow-2xl sm:p-8">
                    <div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#a06d3f]">Menu setup</p><h2 className="mt-1 text-2xl font-black text-[#33251b]">Add category</h2><p className="mt-1 text-sm text-[#705b46]">Create a reusable category for menu products.</p></div><button type="button" onClick={() => { setShowAddCategory(false); setAddCategoryForProduct(false); }} aria-label="Close add category" className="rounded-lg px-2 py-1 text-xl font-bold text-gray-400 hover:bg-gray-100">×</button></div>
                    <label className="mb-2 block text-sm font-bold" htmlFor="new-menu-category">Category name</label><input id="new-menu-category" type="text" maxLength={120} required autoFocus value={newCategoryName} onChange={event => setNewCategoryName(event.target.value)} placeholder="e.g. Bilao Specials" className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#815633]" />
                    <div className="mt-6 flex justify-end gap-3 border-t border-[#eadcc9] pt-5"><button type="button" onClick={() => { setShowAddCategory(false); setAddCategoryForProduct(false); }} className="rounded-lg border border-[#d8bd9c] px-4 py-2 font-bold text-[#705b46] hover:bg-[#f7eddd]">Cancel</button><button type="submit" className="rounded-lg bg-[#815633] px-5 py-2 font-bold text-white shadow-sm hover:bg-[#62432B]">Save Category</button></div>
                  </form>
                </div>
              )}

              {categoryToDelete && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                  <section className="w-full max-w-md rounded-2xl border border-red-200 bg-[#fffdf8] p-6 shadow-2xl">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-700"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                    <h2 className="text-xl font-black text-[#33251b]">Delete category?</h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#705b46]"><span className="font-bold">{categoryToDelete}</span> will be removed. {productsInDeleteCategory.length ? `${productsInDeleteCategory.length} product${productsInDeleteCategory.length === 1 ? ' is' : 's are'} currently in this category; choose where to move ${productsInDeleteCategory.length === 1 ? 'it' : 'them'}.` : 'No products will be affected.'}</p>
                    {productsInDeleteCategory.length > 0 && <label className="mt-4 block text-sm font-bold text-[#5d4733]">Move products to<select value={categoryDeleteReplacement} onChange={event => setCategoryDeleteReplacement(event.target.value)} className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 outline-none focus:border-[#815633]">{menuCategories.filter(category => category !== categoryToDelete).map(category => <option key={category} value={category}>{category}</option>)}</select></label>}
                    <div className="mt-6 flex justify-end gap-3 border-t border-[#eadcc9] pt-5"><button type="button" onClick={() => { setCategoryToDelete(''); setCategoryDeleteReplacement(''); }} className="rounded-lg border border-[#d8bd9c] px-4 py-2 text-sm font-bold text-[#705b46] hover:bg-[#f7eddd]">Cancel</button><button type="button" onClick={handleDeleteCategory} disabled={productsInDeleteCategory.length > 0 && !categoryDeleteReplacement} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">Delete category</button></div>
                  </section>
                </div>
              )}

              {showAddProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <form onSubmit={handleAddProduct} className="grid max-h-[90vh] w-full max-w-2xl grid-cols-1 gap-5 overflow-y-auto rounded-3xl border border-[#d8bd9c] bg-[#fffdf8] p-6 shadow-2xl sm:grid-cols-2 sm:p-8">
                  <div className="flex items-start justify-between gap-4 sm:col-span-2"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#a06d3f]">Step 2 of 2 · {newProduct.category}</p><h2 className="mt-1 text-2xl font-black text-[#33251b]">New product</h2><p className="mt-1 text-sm text-[#705b46]">Add the product details and save it to the shared menu.</p></div><button type="button" onClick={() => setShowAddProduct(false)} aria-label="Close new product" className="rounded-lg px-2 py-1 text-xl font-bold text-gray-400 hover:bg-gray-100">×</button></div>
                  <div><label className="block text-sm font-bold mb-2">Product Name</label><input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-400" /></div>
                  <div><label className="block text-sm font-bold mb-2">Selected Category</label><div className="flex min-h-10 items-center justify-between gap-2 rounded-lg border border-[#d8bd9c] bg-[#f8f0e4] px-3 py-2 text-sm font-bold text-[#704a2d]"><span>{newProduct.category}</span><button type="button" onClick={() => { setShowAddProduct(false); setShowChooseProductCategory(true); }} className="text-xs font-extrabold text-[#815633] underline">Change</button></div></div>
                  <div><label className="block text-sm font-bold mb-2">Price (₱)</label><input type="number" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-400" /></div>
                  <div><label className="block text-sm font-bold mb-2">Image</label><input type="file" accept="image/*" onChange={e => setProductImage(e.target.files[0])} className="text-sm w-full pt-2" /></div>
                  <div className="sm:col-span-2 flex justify-end gap-4"><button type="button" onClick={() => setShowAddProduct(false)} className="px-6 py-2 font-bold text-gray-500 hover:bg-gray-50 rounded-lg border">Cancel</button><button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg shadow-sm">Save</button></div>
                </form>
                </div>
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
                        {menuCategories.map(c => <option key={c}>{c}</option>)}
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

              {menuCategories.map(category => {
                const categoryItems = menuItems.filter(item => item.category === category);
                return (
                  <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <h3 className="text-lg font-black text-gray-900 p-4 border-b border-gray-200 bg-gray-50/50">{category}</h3>
                    <div className="divide-y divide-gray-100 p-2">
                      {categoryItems.length === 0 ? <p className="p-5 text-sm font-medium text-gray-500">No products in this category yet. Add a product to get started.</p> : categoryItems.map(item => (
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
            <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
              <div className="relative overflow-hidden rounded-2xl border border-[#C9A77C]/40 bg-gradient-to-r from-[#fffdf8] via-[#fbf4e8] to-[#f0dfc4] p-5 shadow-[0_8px_24px_rgba(83,57,34,0.09)] sm:p-6">
                <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[#815633]/[0.07]" aria-hidden="true" />
                <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#815633] text-white shadow-md shadow-[#815633]/20">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true"><path d="M4 20V8.5L12 4l8 4.5V20M8 20v-6h8v6M8 9h.01M12 9h.01M16 9h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black text-[#33251b]">Branch directory</h2>
                        <span className="rounded-full border border-[#C9A77C]/40 bg-white/80 px-2.5 py-0.5 text-[11px] font-black text-[#815633]">{branches.length} locations</span>
                      </div>
                      <p className="text-sm font-medium text-[#705b46]">Manage branch details shown to customers on the map and ordering pages.</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddBranch(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#815633] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#815633]/20 transition hover:-translate-y-0.5 hover:bg-[#62432B]"><span className="text-lg leading-none">+</span> New branch</button>
                </div>
              </div>
              {showAddBranch && (
                <form onSubmit={handleAddBranch} className="grid grid-cols-1 gap-6 rounded-2xl border border-[#C9A77C]/35 bg-[#fffdf8] p-6 shadow-lg shadow-[#533922]/10 sm:grid-cols-2">
                  <div><label className="block text-sm font-bold mb-2">Branch Name</label><input type="text" required value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div><label className="block text-sm font-bold mb-2">Code</label><input type="text" required value={newBranch.code} onChange={e => setNewBranch({...newBranch, code: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                  <div className="sm:col-span-2 flex justify-end gap-4"><button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg shadow-sm">Save Branch</button></div>
                </form>
              )}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {branches.map(branch => (
                  <article key={branch.id} className="group relative overflow-hidden rounded-2xl border border-[#C9A77C]/35 bg-gradient-to-br from-white via-[#fffdf8] to-[#f7eddd] p-5 shadow-[0_5px_16px_rgba(83,57,34,0.08)] transition duration-200 hover:-translate-y-1 hover:border-[#b98d61]/70 hover:shadow-[0_12px_28px_rgba(83,57,34,0.15)] sm:p-6">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#815633] via-[#d2a674] to-[#e7d2b2]" aria-hidden="true" />
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d8bd9c]/50 bg-[#f4e7d2] text-[#815633] shadow-inner">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true"><path d="M4 20V8.5L12 4l8 4.5V20M8 20v-6h8v6M8 9h.01M12 9h.01M16 9h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="break-words text-base font-black text-[#33251b]">{branch.name}</h3>
                            <span className="mt-1 inline-flex rounded-md bg-[#eee1cf] px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-[#815633]">{branch.code}</span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Active</span>
                        </div>
                        <div className="mt-4 space-y-2 border-t border-[#e9dccb] pt-3">
                          <p className="flex items-start gap-2 text-xs font-semibold leading-relaxed text-[#665442]">
                            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-[#a06d3f]" fill="none" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" /></svg>
                            <span>{branch.address || 'Address not set'}</span>
                          </p>
                          {branch.phone && <p className="flex items-center gap-2 text-xs font-semibold text-[#665442]"><span className="w-4 text-center text-[#a06d3f]" aria-hidden="true">☎</span>{branch.phone}</p>}
                          <p className="flex items-center gap-2 text-xs font-bold text-[#815633]"><svg viewBox="0 0 24 24" className="h-4 w-4 text-[#a06d3f]" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>8:00 AM - 8:00 PM</p>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button type="button" onClick={() => setEditingBranch({ ...branch, address: branch.address || '', phone: branch.phone || '' })} className="inline-flex items-center gap-2 rounded-lg border border-[#c8a77f] bg-white/80 px-3.5 py-2 text-xs font-extrabold text-[#704a2d] shadow-sm transition hover:border-[#815633] hover:bg-[#815633] hover:text-white">
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true"><path d="m14 5 5 5M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>Edit branch
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {editingBranch && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                  <form onSubmit={handleEditBranch} className="grid w-full max-w-2xl grid-cols-1 gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl sm:grid-cols-2">
                    <div className="flex items-center justify-between sm:col-span-2">
                      <h2 className="text-xl font-black text-gray-900">Edit Branch</h2>
                      <button type="button" onClick={() => setEditingBranch(null)} aria-label="Close edit branch" className="rounded-lg px-2 py-1 text-xl font-bold text-gray-400 hover:bg-gray-100 hover:text-gray-700">×</button>
                    </div>
                    <div><label className="mb-2 block text-sm font-bold">Branch Name</label><input type="text" required value={editingBranch.name} onChange={event => setEditingBranch({ ...editingBranch, name: event.target.value })} className="w-full rounded-lg border px-4 py-2 outline-none focus:border-[#815633]" /></div>
                    <div><label className="mb-2 block text-sm font-bold">Branch Code</label><input type="text" required value={editingBranch.code} onChange={event => setEditingBranch({ ...editingBranch, code: event.target.value })} className="w-full rounded-lg border px-4 py-2 outline-none focus:border-[#815633]" /></div>
                    <div className="sm:col-span-2"><label className="mb-2 block text-sm font-bold">Address</label><textarea rows={2} value={editingBranch.address} onChange={event => setEditingBranch({ ...editingBranch, address: event.target.value })} className="w-full resize-y rounded-lg border px-4 py-2 outline-none focus:border-[#815633]" /></div>
                    <div><label className="mb-2 block text-sm font-bold">Phone</label><input type="tel" value={editingBranch.phone} onChange={event => setEditingBranch({ ...editingBranch, phone: event.target.value })} className="w-full rounded-lg border px-4 py-2 outline-none focus:border-[#815633]" /></div>
                    <div className="flex items-end justify-end gap-3 sm:col-span-2">
                      <button type="button" onClick={() => setEditingBranch(null)} className="rounded-lg border px-5 py-2 font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                      <button type="submit" className="rounded-lg bg-[#815633] px-5 py-2 font-bold text-white shadow-sm hover:bg-[#62432B]">Save Changes</button>
                    </div>
                  </form>
                </div>
              )}
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
                    <button type="button" onClick={() => { setPendingRecoveryReview({ ...request, decision: 'Denied' }); setRecoveryAdminPassword(''); setRecoveryReviewNote(''); }} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Deny</button>
                    <button type="button" disabled={!request.matched_account_id} onClick={() => { setPendingRecoveryReview({ ...request, decision: 'Approved' }); setRecoveryAdminPassword(''); setRecoveryReviewNote(''); }} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40">Approve & send reset link</button>
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
