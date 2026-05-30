import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { activeOrder, setActiveOrder, addToast, addNotification, fetchApi } = useApp();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [currentStep, setCurrentStep] = useState(0);

  // Review states
  const [ratingShop, setRatingShop] = useState(5);
  const [ratingFood, setRatingFood] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [activeOrderIds, setActiveOrderIds] = useState([]);

  // Cancel Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelList, setCancelList] = useState([]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [cancellingAll, setCancellingAll] = useState(false);

  const openCancelModal = async () => {
    try {
      const res = await fetchApi('/api/orders');
      const json = await res.json();
      if (json.success) {
        const active = json.data.filter(o => !['Cancelled', 'Completed', 'Ready', 'Almost Ready'].includes(o.status));
        setCancelList(active);
        setCheckedIds(active.map(o => o.id));
        setShowCancelModal(true);
      }
    } catch (e) {
      console.error("Failed to load active list for modal:", e);
    }
  };

  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const isHidden = useRef(false);
  const deadlineRef = useRef(null);
  const lastStatusRef = useRef(null);

  const resolvedOrderId = orderId || activeOrder?.id;

  // Setup SEO Headers
  useEffect(() => {
    document.title = 'Track Your Order | QuickBite';
  }, []);

  // 6 Tracking stages mapping
  const getStepIndex = (status) => {
    if (status === 'Pending') return 0;
    if (status === 'Preparing') return 2;
    if (status === 'Almost Ready') return 3;
    if (status === 'Ready') return 4;
    if (status === 'Completed') return 5;
    return 0;
  };

  const steps = [
    { label: 'Order Received', desc: 'Kitchen has received your ticket', icon: 'receipt_long' },
    { label: 'Vendor Accepted', desc: 'Order queued by kitchen manager', icon: 'thumb_up' },
    { label: 'Preparing', desc: 'Chef is crafting your fresh order', icon: 'restaurant' },
    { label: 'Almost Ready', desc: 'Final touches and packaging', icon: 'local_fire_department' },
    { label: 'Ready For Pickup', desc: 'Head to the counter for collection!', icon: 'shopping_bag' },
    { label: 'Completed', desc: 'Picked up and enjoyed!', icon: 'task_alt' }
  ];

  const fetchOrder = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/orders/${id}`);
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
        const step = getStepIndex(json.data.status);
        setCurrentStep(step);

        // Simulated notification on status transition
        if (lastStatusRef.current && lastStatusRef.current !== json.data.status) {
          const alertMsg = `Your order is now: ${json.data.status}!`;
          addToast('Order Update', alertMsg, 'info');
          addNotification('Order Status Update', `Order ${json.data.displayId} status changed to ${json.data.status}.`, 'info');
        }
        lastStatusRef.current = json.data.status;

        if (json.data.ept) {
          if (json.data.status === 'Pending') {
            deadlineRef.current = null;
            setTimeLeft(json.data.ept * 60);
          } else {
            const start = json.data.prepStartedAt ? new Date(json.data.prepStartedAt).getTime() : new Date(json.data.createdAt).getTime();
            const deadline = start + json.data.ept * 60000;
            deadlineRef.current = deadline;
            const remainingMs = deadline - Date.now();
            const remainingSeconds = Math.max(0, Math.round(remainingMs / 1000));
            setTimeLeft(remainingSeconds);
          }
        }

        // Stop polling when terminal status reached
        if (json.data.status === 'Completed' || json.data.status === 'Cancelled') {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          setTimeLeft(0);
        }
      }
    } catch (e) {
      console.error('Polling error:', e);
    }
  }, [addToast, addNotification]);

  useEffect(() => {
    if (!resolvedOrderId) {
      setLoading(false);
      return;
    }

    fetchOrder(resolvedOrderId).then(() => setLoading(false));

    // Poll every 5 seconds for fast response
    pollRef.current = setInterval(() => {
      fetchOrder(resolvedOrderId);
    }, 5000);

    const handleVisibility = () => {
      isHidden.current = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [resolvedOrderId, fetchOrder]);

  useEffect(() => {
    const fetchActiveOrdersCount = async () => {
      try {
        const res = await fetchApi('/api/orders');
        const json = await res.json();
        if (json.success) {
          const active = json.data.filter(o => !['Cancelled', 'Completed', 'Ready', 'Almost Ready'].includes(o.status));
          setActiveOrdersCount(active.length);
          setActiveOrderIds(active.map(o => o.id));
        }
      } catch (e) {
        console.error("Failed to load active orders count:", e);
      }
    };
    fetchActiveOrdersCount();
  }, [fetchApi, order]);

  // Countdown timer clock
  useEffect(() => {
    if (!order || !order.ept || order.status === 'Ready' || order.status === 'Completed' || order.status === 'Cancelled') return;
    if (!deadlineRef.current) return;

    timerRef.current = setInterval(() => {
      if (!isHidden.current) {
        const remainingMs = deadlineRef.current - Date.now();
        const remainingSeconds = Math.max(0, Math.round(remainingMs / 1000));
        setTimeLeft(remainingSeconds);
        if (remainingSeconds <= 0) {
          clearInterval(timerRef.current);
        }
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [order]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getEstCompletionTime = () => {
    if (!order) return '';
    if (order.status === 'Pending') return 'Awaiting acceptance';
    const start = order.prepStartedAt ? new Date(order.prepStartedAt).getTime() : new Date(order.createdAt).getTime();
    const wait = (order.ept || 10) * 60000;
    const est = new Date(start + wait);
    return est.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (submittingReview) return;
    setSubmittingReview(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('quickbite-token')}`
        },
        body: JSON.stringify({
          shopId: order.shopId,
          menuItemId: order.menuItemId,
          ratingFood,
          ratingShop,
          reviewText: reviewText.trim()
        })
      });
      const json = await res.json();
      if (json.success) {
        setReviewSubmitted(true);
        addToast('Review Submitted', 'Thank you for your rating!', 'success');
      } else {
        addToast('Error', json.error || 'Failed to submit review.', 'error');
      }
    } catch (err) {
      addToast('Error', 'Unable to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!resolvedOrderId && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D1A] font-body flex flex-col items-center justify-center px-6 pb-32 text-center">
        <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-700 mb-6">receipt_long</span>
        <h2 className="font-headline text-2xl font-extrabold text-on-surface dark:text-white mb-2">No Active Orders</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">Your current active orders will track here.</p>
        <button
          onClick={() => navigate('/customer/home')}
          className="bg-primary-gradient text-white font-bold px-8 py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          Browse Shops
        </button>
      </div>
    );
  }

  const totalSeconds = (order?.ept || 15) * 60;
  const strokeDashoffset = totalSeconds > 0 ? 251.2 * (1 - Math.min(totalSeconds, timeLeft) / totalSeconds) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-50 dark:bg-[#0D0D1A] font-body text-on-background flex justify-center"
    >
      <div className="w-full max-w-5xl bg-white dark:bg-[#16213E] min-h-screen shadow-2xl relative flex flex-col pb-28">
        
        {/* HEADER */}
        <header className="px-6 py-4 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/40 z-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/customer/home')}
              className="text-orange-600 dark:text-orange-400 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">home</span>
            </button>
            <h1 className="font-headline font-bold text-lg text-orange-600 dark:text-orange-400">
              Track Order
            </h1>
          </div>
          {order && (
            <div className="flex items-center gap-1.5">
              <span className="bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                {order.displayId}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(order.displayId);
                  addToast('ID Copied', 'Order ID copied to clipboard.', 'success');
                }}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-zinc-500 hover:text-orange-500 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                title="Copy Order ID"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
              </button>
            </div>
          )}
        </header>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex-grow flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* MAIN BODY */}
        {!loading && order && (
          <div className="p-6 space-y-6 flex-grow overflow-y-auto no-scrollbar">
            
            {/* COUNTDOWN / STATUS CARD */}
            <div className="bg-gradient-to-br from-primary to-orange-500 rounded-3xl p-6 text-slate-900 shadow-lg shadow-primary/20 relative overflow-hidden">
              <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[160px]">restaurant</span>
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Order from</span>
                    <h3 className="font-headline font-black text-xl leading-none mt-1">{order.itemName}</h3>
                  </div>
                  <span className="bg-slate-900/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
                    {order.status}
                  </span>
                </div>

                <div className="pt-2">
                  {order.status === 'Completed' ? (
                    <div>
                      <p className="text-xs opacity-90 mb-1">Delivered Successfully!</p>
                      <h2 className="text-3xl font-black font-headline">Order Collected</h2>
                    </div>
                  ) : order.status === 'Cancelled' ? (
                    <div>
                      <p className="text-xs opacity-90 mb-1">This order was cancelled.</p>
                      <h2 className="text-3xl font-black font-headline text-red-100">Cancelled</h2>
                    </div>
                  ) : order.status === 'Ready' ? (
                    <div>
                      <p className="text-xs opacity-90 mb-1">Hot & Ready to Collect!</p>
                      <h2 className="text-3xl font-black font-headline animate-bounce">At Counter</h2>
                    </div>
                  ) : (
                    <div className="flex items-center gap-6">
                      {/* Circular SVG Timer Gauge */}
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          {/* Background circle */}
                          <circle
                            className="text-white/20"
                            strokeWidth="6"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                          {/* Foreground circle with dash-offset */}
                          <motion.circle
                            className="text-white"
                            strokeWidth="6"
                            strokeDasharray="251.2"
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.5 }}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                        </svg>
                        {/* Inner Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                          <span className="text-lg font-black font-headline tracking-tighter">
                            {Math.ceil(timeLeft / 60)}
                          </span>
                          <span className="text-[8px] font-black uppercase opacity-80">min</span>
                        </div>
                      </div>
                      
                      <div className="flex-grow">
                        <p className="text-xs opacity-90 mb-0.5">
                          {order.status === 'Pending' ? 'Prep Time (Awaiting Acceptance)' : 'Estimated Prep Wait'}
                        </p>
                        <p id="countdown-timer" className="text-3xl font-black font-headline">
                          {formatTime(timeLeft)}
                        </p>
                        <div className="mt-1">
                          <span className="text-[10px] opacity-75 uppercase font-bold tracking-wider">Ready Around: {getEstCompletionTime()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TIMELINE TRACKER CONTAINER */}
            <div className="bg-slate-50 dark:bg-[#0D0D1A] rounded-3xl p-6 border border-slate-100 dark:border-slate-800/40">
              <div className="flex flex-col gap-8 relative">
                
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStep;
                  const isActive = idx === currentStep;
                  const isPending = idx > currentStep;

                  return (
                    <div key={step.label} className="flex gap-4 relative items-start">
                      
                      {/* Vertical connector line */}
                      {idx < steps.length - 1 && (
                        <div 
                          className={`absolute left-4 top-8 w-1 h-8 rounded-full ${
                            isCompleted ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'
                          }`} 
                        />
                      )}

                      {/* Timeline Dot Icon */}
                      <div className="relative flex-shrink-0 z-10">
                        {isActive && (
                          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping pointer-events-none" />
                        )}
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative ${
                            isCompleted 
                              ? 'bg-primary text-white shadow-md' 
                              : isActive 
                              ? 'bg-primary-gradient text-white shadow-lg shadow-primary/20' 
                              : 'bg-slate-200 dark:bg-slate-800 text-zinc-400'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm font-bold">
                            {isCompleted ? 'check' : step.icon}
                          </span>
                        </div>
                      </div>

                      {/* Description texts */}
                      <div className="space-y-0.5">
                        <h4 
                          className={`font-headline text-sm font-bold ${
                            isCompleted 
                              ? 'text-zinc-700 dark:text-zinc-300' 
                              : isActive 
                              ? 'text-primary font-black' 
                              : 'text-zinc-400'
                          }`}
                        >
                          {step.label}
                        </h4>
                        <p 
                          className={`text-xs ${
                            isActive 
                              ? 'text-orange-600 dark:text-orange-400 font-semibold' 
                              : isCompleted 
                              ? 'text-zinc-500/80 dark:text-zinc-400/80' 
                              : 'text-zinc-400/60'
                          }`}
                        >
                          {step.desc}
                        </p>
                      </div>

                    </div>
                  );
                })}

              </div>
            </div>

            {/* CANCEL ORDER BUTTON */}
            {order && !['Cancelled', 'Completed', 'Ready', 'Almost Ready'].includes(order.status) && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetchApi(`/api/orders/${order.id}/cancel`, {
                      method: 'PATCH',
                    });
                    const json = await res.json();
                    if (json.success) {
                      setOrder(json.data);
                      addToast('Order Cancelled', 'Your order has been cancelled.', 'success');
                    } else {
                      addToast('Error', json.error || 'Failed to cancel order.', 'error');
                    }
                  } catch (e) {
                    console.error("Cancel Order error:", e);
                    addToast('Error', `Unable to cancel order: ${e.message}`, 'error');
                  }
                }}
                className="w-full bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white dark:text-red-400 dark:hover:bg-red-950/40 border border-red-500/20 py-4 rounded-2xl font-headline font-extrabold active:scale-[0.98] transition-all cursor-pointer"
              >
                Cancel Order
              </button>
            )}

            {activeOrdersCount > 1 && (
              <button
                onClick={openCancelModal}
                className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-headline font-extrabold active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 text-xs"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                Cancel All Active Orders ({activeOrdersCount})
              </button>
            )}

            {/* ORDER COMPLETED FEEDBACK SYSTEM */}
            {order.status === 'Completed' && (
              <div className="bg-white dark:bg-[#16213E] rounded-3xl p-5 border border-slate-100 dark:border-[#2E2E5E]/40 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">reviews</span>
                  <h4 className="font-headline font-black text-base text-on-surface dark:text-white">How was your meal?</h4>
                </div>

                {reviewSubmitted ? (
                  <div className="text-center py-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-2xl p-4 text-green-700 dark:text-green-300">
                    <span className="material-symbols-outlined text-3xl mb-1">thumb_up</span>
                    <h5 className="font-bold text-sm">Review Submitted!</h5>
                    <p className="text-xs opacity-90 mt-0.5">Thank you for rating. Your response is live publicly.</p>
                  </div>
                ) : (
                  <form onSubmit={submitReview} className="space-y-4">
                    
                    {/* Star Rating Shop */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-500">Rate Cafeteria</span>
                      <div className="flex gap-1 text-orange-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingShop(star)}
                            className="hover:scale-110 active:scale-95 transition-transform"
                          >
                            <span className="material-symbols-outlined text-xl" style={star <= ratingShop ? { fontVariationSettings: "'FILL' 1" } : {}}>
                              {star <= ratingShop ? 'star' : 'star_border'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Star Rating Food */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-500">Rate Food Quality</span>
                      <div className="flex gap-1 text-orange-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingFood(star)}
                            className="hover:scale-110 active:scale-95 transition-transform"
                          >
                            <span className="material-symbols-outlined text-xl" style={star <= ratingFood ? { fontVariationSettings: "'FILL' 1" } : {}}>
                              {star <= ratingFood ? 'star' : 'star_border'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment text area */}
                    <div>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-2xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-primary/50 h-20 resize-none placeholder-zinc-400"
                        placeholder="Write your experience here..."
                        maxLength="150"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full bg-primary-gradient text-white font-headline font-bold text-xs py-3.5 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      {submittingReview ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Submit Review'
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* RETIRE / RE-ORDER DIALOG */}
            {order.status === 'Completed' && (
              <button
                onClick={() => {
                  setActiveOrder(null);
                  navigate('/customer/home');
                }}
                className="w-full border-2 border-slate-100 dark:border-slate-800 text-zinc-500 dark:text-zinc-300 font-headline font-extrabold py-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 active:scale-[0.98] transition-all"
              >
                Back to Cafeterias
              </button>
            )}

          </div>
        )}
      </div>
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelModal(false)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white dark:bg-[#16213E] rounded-3xl p-6 w-full max-w-md relative z-10 border border-slate-100 dark:border-slate-800/40 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-headline font-black text-xl text-on-surface dark:text-white">Cancel Orders</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Select which orders you want to cancel</p>
                </div>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 max-h-[45vh]">
                {cancelList.map(order => {
                  const isChecked = checkedIds.includes(order.id);
                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        if (isChecked) {
                          setCheckedIds(checkedIds.filter(id => id !== order.id));
                        } else {
                          setCheckedIds([...checkedIds, order.id]);
                        }
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        isChecked 
                          ? 'border-red-500/30 bg-red-50/10 dark:bg-red-950/10' 
                          : 'border-slate-100 dark:border-slate-800/40 bg-slate-50/30 dark:bg-zinc-900/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isChecked 
                            ? 'bg-red-500 border-red-500 text-white' 
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-zinc-950'
                        }`}>
                          {isChecked && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-headline font-black text-xs text-orange-600 dark:text-orange-400">{order.displayId}</span>
                            <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-on-surface dark:text-white mt-1 truncate">{order.itemName}</p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">₹{order.itemPrice || 0}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800/40 mt-4">
                <button
                  disabled={checkedIds.length === 0 || cancellingAll}
                  onClick={async () => {
                    if (checkedIds.length === 0) return;
                    setCancellingAll(true);
                    try {
                      const res = await fetchApi('/api/orders/cancel-all', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderIds: checkedIds })
                      });
                      const json = await res.json();
                      if (json.success) {
                        const currentUpdated = json.data.find(u => u.id === order?.id);
                        if (currentUpdated) {
                          setOrder(currentUpdated);
                        } else {
                          fetchOrder(resolvedOrderId);
                        }
                        addToast('Orders Updated', `${checkedIds.length} order(s) cancelled successfully.`, 'success');
                        setShowCancelModal(false);
                      } else {
                        addToast('Error', json.error || 'Failed to cancel orders.', 'error');
                      }
                    } catch (e) {
                      addToast('Error', `Unable to cancel orders: ${e.message}`, 'error');
                    } finally {
                      setCancellingAll(false);
                    }
                  }}
                  className={`w-full font-headline font-extrabold py-3.5 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-2 ${
                    checkedIds.length === 0 
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/10 active:scale-95'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  {cancellingAll ? 'Cancelling...' : `Cancel Checked Orders (${checkedIds.length})`}
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-300 font-bold py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Keep All & Go Back
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
