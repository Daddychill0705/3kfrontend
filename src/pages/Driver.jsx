import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { io } from 'socket.io-client';
import { isOrderChatOpen, useOrderChatClock } from '../hooks/useOrderChatExpiry';
import { formatOrderNumber } from '../utils/orderNumber';

export default function Driver() {
  const [orders, setOrders] = useState([]);
  const chatNow = useOrderChatClock(orders);
  const [activeTab, setActiveTab] = useState('Available');
  const [chatOrder, setChatOrder] = useState(null);
  const [deliveryModalOrder, setDeliveryModalOrder] = useState(null);
  const [deliveryProofPhoto, setDeliveryProofPhoto] = useState(null);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [assistanceModalOrder, setAssistanceModalOrder] = useState(null);
  const [assistanceMessage, setAssistanceMessage] = useState('');
  const [isSubmittingAssistance, setIsSubmittingAssistance] = useState(false);
  const [acceptingAssistanceId, setAcceptingAssistanceId] = useState(null);
  const [incomingAssistanceRequests, setIncomingAssistanceRequests] = useState([]);
  const [myAssistanceRequests, setMyAssistanceRequests] = useState([]);
  const [availableRiderCount, setAvailableRiderCount] = useState(null);
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [unreadChatOrders, setUnreadChatOrders] = useState({});
  const [socket, setSocket] = useState(null);
  const chatOrderRef = useRef(null);
  const orderFetchSequence = useRef(0);
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!user || (user.role !== 'rider' && user.role !== 'admin')) {
      navigate('/login');
      return;
    }
    const newSocket = io(API_URL, { auth: { token: localStorage.getItem('token') } });
    setSocket(newSocket);

    const fetchAssistance = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${API_URL}/api/rider/assistance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setIncomingAssistanceRequests(data.incomingRequests || []);
          setMyAssistanceRequests(data.myRequests || []);
          setAvailableRiderCount(data.availableRiderCount ?? 0);
        }
      } catch (error) { console.error('Failed to fetch rider assistance requests', error); }
    };
    
    const fetchOrders = async () => {
      const requestSequence = ++orderFetchSequence.current;
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${API_URL}/api/admin/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const allOrders = await response.json();
          if (requestSequence !== orderFetchSequence.current) return;
          setOrders(allOrders);
          allOrders.forEach(order => {
            if (order.order_type === 'Delivery' && Number(order.assigned_rider_id) === Number(user.id) && (order.status === 'Out for Delivery' || (order.status === 'Completed' && isOrderChatOpen(order)))) {
              newSocket.emit('join_order', order.id);
            }
          });
        }
      } catch (error) { console.error('Failed to fetch orders', error); }
    };
    
    fetchOrders();
    fetchAssistance();
    newSocket.on('dashboard_refresh', fetchOrders);
    newSocket.on('connect', fetchAssistance);
    newSocket.on('rider_assistance_refresh', fetchAssistance);
    newSocket.on('rider_availability_update', ({ availableRiderCount: count }) => setAvailableRiderCount(count));
    newSocket.on('rider_assistance_request', request => {
      setIncomingAssistanceRequests(current => current.some(item => Number(item.id) === Number(request.id)) ? current : [request, ...current]);
      showToast(`${request.requester_name} needs help with ${request.order_number || 'a delivery'}.`);
    });
    newSocket.on('rider_assistance_resolved', ({ requestId }) => {
      setIncomingAssistanceRequests(current => current.filter(request => Number(request.id) !== Number(requestId)));
    });
    newSocket.on('rider_assistance_accepted', ({ requestId, orderId, orderNumber, riderName, riderId }) => {
      setMyAssistanceRequests(current => current.some(request => Number(request.id) === Number(requestId))
        ? current.map(request => Number(request.id) === Number(requestId)
          ? { ...request, status: 'Accepted', order_number: orderNumber, accepted_firstname: riderName, accepted_by_rider_id: riderId }
          : request)
        : [{ id: requestId, order_id: orderId, order_number: orderNumber, status: 'Accepted', accepted_firstname: riderName, accepted_by_rider_id: riderId }, ...current]);
      setOrders(current => current.map(order => Number(order.id) === Number(orderId)
        ? { ...order, assigned_rider_id: riderId }
        : order));
      setActiveTab('Available');
      showToast(`${riderName} accepted your request and took over ${orderNumber || 'the delivery'}.`);
    });
    
    newSocket.on('receive_message', (data) => {
      if (String(chatOrderRef.current) === String(data.orderId)) {
        setChatLog(prev => [...prev, data]);
      } else if (data.sender !== user.name) {
        setUnreadChatOrders(prev => ({ ...prev, [data.orderId]: true }));
      }
    });
    newSocket.on('chat_closed', ({ orderId }) => {
      if (String(chatOrderRef.current) === String(orderId)) {
        setChatOrder(null);
        chatOrderRef.current = null;
      }
    });
    return () => newSocket.close();
  }, [user, navigate, API_URL, showToast]);

  useEffect(() => {
    if (chatOrder === null) return;
    const order = orders.find(item => String(item.id) === String(chatOrder));
    if (order && !isOrderChatOpen(order, chatNow)) {
      setChatOrder(null);
      chatOrderRef.current = null;
    }
  }, [chatOrder, orders, chatNow]);

  const claimDelivery = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/rider/orders/${id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders(currentOrders => currentOrders.map(order => order.id === id ? { ...order, status: 'Out for Delivery', assigned_rider_id: user.id } : order));
        setActiveTab('My deliveries');
        return true;
      }
      const result = await res.json().catch(() => ({}));
      showToast(result.error || 'Could not update this delivery status.', 'error');
    } catch (error) {
      console.error('Error updating status', error);
      showToast(error.message || 'Could not update this delivery status.', 'error');
    }
    return false;
  };

  const submitDeliveryProof = async () => {
    if (!deliveryModalOrder || !deliveryProofPhoto || isSubmittingDelivery) return;
    setIsSubmittingDelivery(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || !uploadPreset) throw new Error('Photo upload is not configured. Please contact an administrator.');

      const uploadData = new FormData();
      uploadData.append('file', deliveryProofPhoto);
      uploadData.append('upload_preset', uploadPreset);
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: uploadData });
      const uploadResult = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok || !uploadResult.secure_url) throw new Error(uploadResult.error?.message || 'Could not upload the proof photo. Please try again.');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/rider/orders/${deliveryModalOrder.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ proofUrl: uploadResult.secure_url })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not complete this delivery.');

      setOrders(currentOrders => currentOrders.map(order => order.id === deliveryModalOrder.id
        ? { ...order, status: 'Completed', delivery_proof_url: uploadResult.secure_url }
        : order));
      setDeliveryModalOrder(null);
      setDeliveryProofPhoto(null);
      setActiveTab('History');
      showToast('Delivery marked as delivered. You can claim another order now.');
      return true;
    } catch (error) {
      showToast(error.message || 'Could not submit delivery proof.', 'error');
      return false;
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  const requestAssistance = async () => {
    if (!assistanceModalOrder || !assistanceMessage.trim() || isSubmittingAssistance) return;
    setIsSubmittingAssistance(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/rider/assistance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orderId: assistanceModalOrder.id, message: assistanceMessage.trim() })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 409 && result.availableRiderCount === 0) setAvailableRiderCount(0);
        throw new Error(result.error || 'Could not send your assistance request.');
      }
      setMyAssistanceRequests(current => [result.request, ...current.filter(request => Number(request.id) !== Number(result.request.id))]);
      setAvailableRiderCount(result.availableRiderCount ?? availableRiderCount);
      setAssistanceModalOrder(null);
      setAssistanceMessage('');
      showToast(`Assistance request sent to ${result.availableRiderCount} available rider${result.availableRiderCount === 1 ? '' : 's'}.`);
    } catch (error) {
      showToast(error.message || 'Could not send your assistance request.', 'error');
    } finally {
      setIsSubmittingAssistance(false);
    }
  };

  const cancelAssistance = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/rider/assistance/${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not cancel the assistance request.');
      setMyAssistanceRequests(current => current.filter(request => Number(request.id) !== Number(requestId)));
      showToast('Assistance request cancelled.');
    } catch (error) {
      showToast(error.message || 'Could not cancel the assistance request.', 'error');
    }
  };

  const acceptAssistance = async (request) => {
    if (hasActiveDelivery || acceptingAssistanceId) return;
    setAcceptingAssistanceId(request.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/rider/assistance/${request.id}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not accept this assistance request.');
      setIncomingAssistanceRequests(current => current.filter(item => Number(item.id) !== Number(request.id)));
      setOrders(current => current.map(order => Number(order.id) === Number(result.orderId)
        ? { ...order, assigned_rider_id: user.id }
        : order));
      setActiveTab('My deliveries');
      showToast('You accepted the request and took over the delivery.');
    } catch (error) {
      showToast(error.message || 'Could not accept this assistance request.', 'error');
    } finally {
      setAcceptingAssistanceId(null);
    }
  };

  const openChat = async (orderId) => {
    setChatOrder(orderId);
    chatOrderRef.current = orderId;
    setUnreadChatOrders(prev => ({ ...prev, [orderId]: false }));
    setChatLog([]); // Clear previous chat context immediately
    if (socket) socket.emit('join_order', orderId);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders/${orderId}/chat`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setChatLog(await res.json());
    } catch (err) { console.error(err); }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket && chatOrder) {
      const msgData = {
         orderId: chatOrder,
         sender: user.name,
         text: message,
         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      socket.emit('send_message', msgData);
      setMessage('');
    }
  };

  const availableDeliveries = orders.filter(o => o.status === 'Ready' && o.order_type === 'Delivery' && !o.assigned_rider_id);
  const activeDeliveries = orders.filter(o => o.status === 'Out for Delivery' && o.order_type === 'Delivery' && Number(o.assigned_rider_id) === Number(user?.id));
  const historyDeliveries = orders.filter(o => o.status === 'Completed' && o.order_type === 'Delivery' && Number(o.assigned_rider_id) === Number(user?.id));
  const hasActiveDelivery = activeDeliveries.length > 0;
  const pendingAssistanceByOrder = new Map(myAssistanceRequests.filter(request => request.status === 'Pending').map(request => [Number(request.order_id), request]));
  const latestAcceptedAssistance = myAssistanceRequests.find(request => request.status === 'Accepted');

  const displayList = activeTab === 'Available' ? availableDeliveries : activeTab === 'My deliveries' ? activeDeliveries : historyDeliveries;

  return (
    <div className="bg-[#F5EFE3] min-h-screen pb-16 font-sans">
      <div className="bg-white border-b border-gray-200 flex items-center justify-between p-4 sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-black text-gray-900">Driver</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">3K Kitchen</p>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
             <Link to="/admin" className="text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg mr-2 bg-gray-50">← Back to Admin</Link>
          )}
          <span className="text-sm font-bold text-gray-600 hidden sm:block">{user.email}</span>
          <button onClick={() => { logout(); showToast('You have been logged out.'); navigate('/login'); }} className="text-sm font-bold text-red-500 hover:underline cursor-pointer">Sign out</button>
        </div>
      </div>

      <div className="flex justify-center gap-2 py-6">
        <button onClick={() => setActiveTab('Available')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'Available' ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>Available ({availableDeliveries.length})</button>
        <button onClick={() => setActiveTab('My deliveries')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'My deliveries' ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>My deliveries</button>
        <button onClick={() => setActiveTab('History')} className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'History' ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>History</button>
      </div>

      {hasActiveDelivery && activeTab !== 'My deliveries' && (
        <p className="mx-auto -mt-3 mb-5 max-w-[800px] px-4 text-center text-sm font-bold text-[#815633]">
          Complete your current delivery and submit its proof photo before claiming another order.
        </p>
      )}

      {latestAcceptedAssistance && (
        <div className="mx-auto mb-5 max-w-[800px] px-4">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <strong>{latestAcceptedAssistance.accepted_firstname} {latestAcceptedAssistance.accepted_lastname}</strong> accepted your assistance request for {latestAcceptedAssistance.order_number || 'a delivery'} and took over the order.
          </div>
        </div>
      )}

      {incomingAssistanceRequests.length > 0 && (
        <section className="mx-auto mb-6 max-w-[800px] space-y-3 px-4" aria-label="Rider assistance requests">
          <h2 className="text-lg font-black text-gray-900">Riders requesting assistance</h2>
          {incomingAssistanceRequests.map(request => (
            <article key={request.id} className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-gray-900">{request.requester_name} needs help with {request.order_number || 'a delivery'}</p>
                  <p className="mt-1 text-xs font-bold text-gray-500">{request.customer_name} · {request.branch}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase text-amber-800">Needs help</span>
              </div>
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-gray-700"><strong>Message for assistance:</strong> {request.message}</p>
              <button type="button" onClick={() => acceptAssistance(request)} disabled={hasActiveDelivery || acceptingAssistanceId !== null} className="mt-4 w-full rounded-xl bg-[#815633] py-3 font-bold text-white shadow-sm hover:bg-[#62432B] disabled:cursor-not-allowed disabled:opacity-50">
                {hasActiveDelivery ? 'Finish your current delivery before accepting' : acceptingAssistanceId === request.id ? 'Taking over delivery...' : 'Accept and take over delivery'}
              </button>
            </article>
          ))}
        </section>
      )}

      <div className="max-w-[800px] mx-auto px-4 space-y-6">
        {displayList.length === 0 ? (
          <div className="bg-[#F5EFE3] p-16 text-center mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No active deliveries</h3>
            <p className="text-gray-500 text-sm font-medium">Claim an order from the Available tab.</p>
          </div>
        ) : (
          displayList.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-1">{formatOrderNumber(order)}</h3>
                  <p className="text-sm font-bold text-gray-600">{order.customerName}</p>
                  <p className="text-xs font-bold text-gray-400 mt-1">{order.date.split(',')[0]}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-gray-900 block mb-2">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${['GCash', 'Cash'].includes(order.payment_method) ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                    {['GCash', 'Cash'].includes(order.payment_method) ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex gap-3 text-sm font-bold text-gray-700">
                  <span className="text-red-500">📍</span>
                  <div>
                    <p>{order.delivery_address}</p>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery_address)}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">Open in Maps ↗</a>
                  </div>
                </div>
                <div className="flex gap-3 text-sm font-bold text-gray-700">
                  <span className="text-red-500">📞</span>
                  <p>{order.contact_number}</p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-bold text-gray-500 mb-2">Order Items:</p>
                  <p className="text-sm font-bold text-gray-800">{order.items}</p>
                </div>
              </div>

              <div className="flex gap-3">
                {order.status === 'Ready' && (
                  <button onClick={() => claimDelivery(order.id)} disabled={hasActiveDelivery} className="w-full bg-[#815633] text-white py-3.5 rounded-xl font-bold shadow-sm hover:bg-[#62432B] transition-colors disabled:cursor-not-allowed disabled:opacity-50">{hasActiveDelivery ? 'Finish your current delivery first' : 'Claim this delivery'}</button>
                )}
                {order.status === 'Out for Delivery' && (
                  <>
                    <button onClick={() => openChat(order.id)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3.5 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2">
                      💬 Chat
                      {unreadChatOrders[order.id] && <span className="w-2.5 h-2.5 rounded-full bg-red-600" aria-label="Unread messages" />}
                    </button>
                    {user.role === 'rider' && (
                      <button
                        type="button"
                        onClick={() => { setAssistanceMessage(''); setAssistanceModalOrder(order); }}
                        disabled={pendingAssistanceByOrder.has(Number(order.id))}
                        className="flex-1 rounded-xl border border-amber-300 bg-amber-50 py-3.5 text-sm font-bold text-amber-900 shadow-sm hover:bg-amber-100 disabled:cursor-default disabled:opacity-70"
                      >
                        {pendingAssistanceByOrder.has(Number(order.id)) ? 'Assistance requested' : 'Need Help?'}
                      </button>
                    )}
                    <button onClick={() => { setDeliveryProofPhoto(null); setDeliveryModalOrder(order); }} className="flex-[2] bg-[#815633] text-white py-3.5 rounded-xl font-bold shadow-sm hover:bg-[#62432B] transition-colors">Mark delivered</button>
                  </>
                )}
                {order.status === 'Completed' && order.delivery_proof_url && (
                  <a href={order.delivery_proof_url} target="_blank" rel="noreferrer" className="w-full rounded-xl border border-gray-300 bg-white py-3 text-center text-sm font-bold text-[#815633] hover:bg-gray-50">View delivery proof photo</a>
                )}
                {order.status === 'Completed' && isOrderChatOpen(order, chatNow) && (
                  <button onClick={() => openChat(order.id)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3.5 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2">
                    💬 Chat
                    {unreadChatOrders[order.id] && <span className="w-2.5 h-2.5 rounded-full bg-red-600" aria-label="Unread messages" />}
                  </button>
                )}
              </div>
              {user.role === 'rider' && order.status === 'Out for Delivery' && pendingAssistanceByOrder.has(Number(order.id)) && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Waiting for an available rider to accept your request.
                  <button type="button" onClick={() => cancelAssistance(pendingAssistanceByOrder.get(Number(order.id)).id)} className="ml-2 font-black underline">Cancel request</button>
                </div>
              )}
              {user.role === 'rider' && order.status === 'Out for Delivery' && availableRiderCount === 0 && !pendingAssistanceByOrder.has(Number(order.id)) && (
                <p className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs font-semibold text-gray-600">No other riders are currently online and available.</p>
              )}
            </div>
          ))
        )}
      </div>

      {deliveryModalOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setDeliveryModalOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl">✕</button>
            <h3 className="text-xl font-black text-gray-900 mb-2">Deliver {formatOrderNumber(deliveryModalOrder)}</h3>
            <p className="text-gray-600 font-medium mb-6 text-sm">
              {['GCash', 'Cash'].includes(deliveryModalOrder.payment_method)
                 ? 'This order is already paid. Confirm that it was handed over.' 
                 : `This order is unpaid. Collect ₱${parseFloat(deliveryModalOrder.total_amount).toFixed(2)} from the customer before handing it over.`}
            </p>
            <label className="mb-5 block text-sm font-bold text-gray-700">
              Proof of delivery photo <span className="text-red-600">*</span>
              <input type="file" accept="image/*" capture="environment" required onChange={event => {
                const file = event.target.files?.[0];
                if (!file) { setDeliveryProofPhoto(null); return; }
                if (!file.type.startsWith('image/')) { setDeliveryProofPhoto(null); showToast('Choose an image file for delivery proof.', 'error'); return; }
                if (file.size > 10 * 1024 * 1024) { setDeliveryProofPhoto(null); showToast('The proof photo must be 10 MB or smaller.', 'error'); return; }
                setDeliveryProofPhoto(file);
              }} className="mt-2 block w-full rounded-lg border border-gray-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#815633] file:px-3 file:py-2 file:font-bold file:text-white" />
              <span className="mt-1 block text-xs font-medium text-gray-500">Take or choose a clear photo. Maximum size: 10 MB.</span>
            </label>
            <button onClick={submitDeliveryProof} disabled={!deliveryProofPhoto || isSubmittingDelivery} className="w-full bg-[#815633] text-white py-3.5 rounded-xl font-bold shadow-sm hover:bg-[#62432B] disabled:cursor-wait disabled:opacity-60">
              {isSubmittingDelivery ? 'Uploading proof...' : 'Submit proof and mark delivered'}
            </button>
          </div>
        </div>
      )}

      {assistanceModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form onSubmit={event => { event.preventDefault(); requestAssistance(); }} className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <button type="button" disabled={isSubmittingAssistance} onClick={() => setAssistanceModalOrder(null)} aria-label="Close assistance request" className="absolute right-4 top-3 text-xl font-bold text-gray-400 hover:text-gray-900 disabled:opacity-50">×</button>
            <h3 className="pr-8 text-xl font-black text-gray-900">Request rider assistance</h3>
            <p className="text-sm font-medium text-gray-600">Delivery {formatOrderNumber(assistanceModalOrder)} will be offered to online riders who are available. A rider who accepts will take over the delivery.</p>
            {availableRiderCount === 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">No other riders are currently online and available.</p>
            ) : (
              <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-900">{availableRiderCount ?? 'Checking'} other rider{availableRiderCount === 1 ? '' : 's'} available now.</p>
            )}
            <label className="block text-sm font-bold text-gray-700">
              Message for assistance <span className="text-red-600">*</span>
              <textarea required maxLength={1000} rows={4} value={assistanceMessage} onChange={event => setAssistanceMessage(event.target.value)} placeholder="Tell the other rider what help you need..." className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 font-medium outline-none focus:border-[#815633]" />
            </label>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button type="button" disabled={isSubmittingAssistance} onClick={() => setAssistanceModalOrder(null)} className="rounded-lg border border-gray-200 px-4 py-2.5 font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isSubmittingAssistance || availableRiderCount === 0 || !assistanceMessage.trim()} className="rounded-lg bg-[#815633] px-4 py-2.5 font-bold text-white hover:bg-[#62432B] disabled:cursor-not-allowed disabled:opacity-50">{isSubmittingAssistance ? 'Sending...' : 'Send request'}</button>
            </div>
          </form>
        </div>
      )}

      {chatOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col h-[500px] overflow-hidden relative">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-gray-900 text-lg">Chat - {formatOrderNumber(orders.find(order => String(order.id) === String(chatOrder)) || chatOrder)}</h3>
              <button onClick={() => { setChatOrder(null); chatOrderRef.current = null; }} className="text-gray-400 hover:text-gray-900 font-bold text-xl">✕</button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F5EFE3]">
              {chatLog.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === user.name ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm font-bold shadow-sm ${msg.sender === user.name ? 'bg-[#815633] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 mt-1">{msg.sender} • {msg.time}</span>
                </div>
              ))}
              {chatLog.length === 0 && <p className="text-center text-gray-400 text-sm font-bold mt-10">Message the customer about the delivery.</p>}
            </div>
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#815633] text-sm font-medium" />
              <button type="submit" className="bg-[#815633] text-white px-5 rounded-xl font-bold shadow-sm hover:bg-[#62432B]">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
