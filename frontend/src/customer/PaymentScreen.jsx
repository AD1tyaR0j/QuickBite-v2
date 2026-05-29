import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentScreen() {
  const { shopId, itemId } = useParams();
  const navigate = useNavigate();
  const { cartByShop, clearCart, setActiveOrder, addToast } = useApp();

  const [shop, setShop] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [ept, setEpt] = useState(15);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Payment Selection State
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'Card' | 'Wallet' | 'Cash'
  const [upiProvider, setUpiProvider] = useState('GPay'); // 'GPay' | 'PhonePe' | 'Paytm' | 'Custom'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [walletProvider, setWalletProvider] = useState('Paytm Wallet');

  // Processing States
  const [paymentStatus, setPaymentStatus] = useState('editing'); // 'editing' | 'processing' | 'success' | 'failed'
  const [processingStep, setProcessingStep] = useState(0);
  const [txnId, setTxnId] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  const isCartMode = itemId === 'cart';

  const steps = [
    'Securing connections...',
    'Contacting card network / bank...',
    'Authorizing transaction...',
    'Confirming with cafeteria kitchen...'
  ];

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const shopRes = await fetch(`/api/shops/${shopId}`);
        const shopJson = await shopRes.json();
        if (shopJson.success) setShop(shopJson.data);

        if (isCartMode) {
          const cart = cartByShop[shopId];
          const entries = cart ? Object.values(cart.items) : [];
          if (!entries.length) {
            setLoadingDetails(false);
            return;
          }
          setCartItems(entries);
          const itemsPayload = entries.map(entry => ({
            menuItemId: entry.item.id,
            qty: entry.qty,
          }));
          const eptRes = await fetch('/api/ept-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shopId, items: itemsPayload }),
          });
          const eptJson = await eptRes.json();
          if (eptJson.success) setEpt(eptJson.data.ept);
        } else {
          const menuRes = await fetch(`/api/shops/${shopId}/menu`);
          const menuJson = await menuRes.json();
          if (menuJson.success) {
            const found = menuJson.data.find(m => m.id === itemId);
            setMenuItem(found);
          }
          const eptRes = await fetch(`/api/ept?shopId=${shopId}&menuItemId=${itemId}`);
          const eptJson = await eptRes.json();
          if (eptJson.success) setEpt(eptJson.data.ept);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDetails(false);
      }
    };
    loadDetails();
  }, [shopId, itemId, isCartMode, cartByShop]);

  // Payment Processing Step Animation Loop
  useEffect(() => {
    if (paymentStatus !== 'processing') return;

    const interval = setInterval(() => {
      setProcessingStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          finalizeOrder();
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentStatus]);

  const platformFee = 5;
  const totalBase = isCartMode
    ? cartItems.reduce((sum, entry) => sum + entry.item.price * entry.qty, 0)
    : menuItem
    ? menuItem.price
    : 0;
  const total = totalBase + platformFee;

  const handleCardNumberChange = (e) => {
    // Format card number with spaces every 4 digits
    let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = v.match(/\d{4,16}/g);
    let match = (matches && matches[0]) || '';
    let parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(v);
    }
  };

  const handleExpiryChange = (e) => {
    let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      setCardExpiry(v.substring(0, 2) + '/' + v.substring(2, 4));
    } else {
      setCardExpiry(v);
    }
  };

  const triggerPayment = (e) => {
    e.preventDefault();

    // Validation
    if (paymentMethod === 'UPI' && upiProvider === 'Custom' && !upiId.includes('@')) {
      addToast('Validation Error', 'Please enter a valid UPI ID (e.g. user@okaxis).', 'error');
      return;
    }
    if (paymentMethod === 'Card') {
      if (cardNumber.replace(/\s+/g, '').length < 16) {
        addToast('Validation Error', 'Please enter a valid 16-digit card number.', 'error');
        return;
      }
      if (cardExpiry.length < 5) {
        addToast('Validation Error', 'Expiry date must be in MM/YY format.', 'error');
        return;
      }
      if (cardCvv.length < 3) {
        addToast('Validation Error', 'CVV must be 3 or 4 digits.', 'error');
        return;
      }
      if (!cardName.trim()) {
        addToast('Validation Error', 'Please enter the cardholder\'s name.', 'error');
        return;
      }
    }

    setProcessingStep(0);
    setPaymentStatus('processing');
  };

  const finalizeOrder = async () => {
    const generatedTxnId = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000) + '-QB';
    setTxnId(generatedTxnId);

    try {
      const orderPayload = isCartMode
        ? {
            shopId,
            items: cartItems.map(entry => ({
              menuItemId: entry.item.id,
              name: entry.item.name,
              price: entry.item.price,
              prepTime: entry.item.prepTime,
              imageUrl: entry.item.imageUrl,
              qty: entry.qty,
            })),
            paymentMethod,
            paymentStatus: paymentMethod === 'Cash' ? 'Pending' : 'Paid',
            transactionId: paymentMethod === 'Cash' ? null : generatedTxnId
          }
        : { 
            shopId, 
            menuItemId: itemId, 
            qty: 1, 
            paymentMethod, 
            paymentStatus: paymentMethod === 'Cash' ? 'Pending' : 'Paid', 
            transactionId: paymentMethod === 'Cash' ? null : generatedTxnId 
          };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const json = await res.json();
      if (json.success) {
        setPlacedOrder(json.data);
        if (isCartMode) {
          clearCart(shopId);
        }
        setPaymentStatus('success');
      } else {
        setPaymentStatus('failed');
      }
    } catch (e) {
      console.error(e);
      setPaymentStatus('failed');
    }
  };

  const trackOrder = () => {
    if (placedOrder) {
      setActiveOrder(placedOrder);
      navigate(`/customer/track/${placedOrder.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D1A] font-body text-on-background flex justify-center">
      <div className="w-full max-w-md bg-white dark:bg-[#16213E] min-h-screen shadow-2xl relative flex flex-col justify-between overflow-x-hidden">
        
        {/* HEADER */}
        <header className="px-6 py-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800/40 flex items-center gap-3">
          <button 
            disabled={paymentStatus === 'processing'}
            onClick={() => navigate(-1)} 
            className="text-orange-600 dark:text-orange-400 active:scale-95 transition-transform disabled:opacity-50"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline font-bold text-lg text-orange-600 dark:text-orange-400">
            Secure Payment
          </h1>
        </header>

        {/* LOADING SCREEN */}
        {loadingDetails && (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">Securing your payment portal...</p>
          </div>
        )}

        {/* PAYMENT FORMS */}
        {!loadingDetails && paymentStatus === 'editing' && (
          <div className="flex-1 p-6 space-y-6">
            <div>
              <h2 className="font-headline text-2xl font-black text-on-surface dark:text-white">Choose Payment</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total payable: <span className="font-bold text-primary">₹{total}</span></p>
            </div>

            {/* Selector Grid */}
            <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-[#0D0D1A] p-1.5 rounded-2xl">
              {['UPI', 'Card', 'Wallet', 'Cash'].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-3 text-xs font-bold rounded-xl transition-all ${paymentMethod === method ? 'bg-primary text-white shadow-md' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                >
                  {method === 'Card' ? 'Card' : method === 'Cash' ? 'Cash' : method}
                </button>
              ))}
            </div>

            <form onSubmit={triggerPayment} className="space-y-6">
              
              {/* UPI PANEL */}
              {paymentMethod === 'UPI' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {['GPay', 'PhonePe', 'Custom'].map(app => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setUpiProvider(app)}
                        className={`py-3 text-xs font-semibold border rounded-xl flex items-center justify-center gap-1.5 transition-all ${upiProvider === app ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-slate-200 dark:border-[#2E2E5E]/40 text-zinc-500 dark:text-zinc-400'}`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {app === 'Custom' ? 'badge' : 'bolt'}
                        </span>
                        {app}
                      </button>
                    ))}
                  </div>

                  {upiProvider === 'Custom' ? (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">UPI ID</label>
                      <input
                        type="text"
                        required
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3.5 text-sm dark:text-white focus:ring-2 focus:ring-primary/50"
                        placeholder="username@upi"
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-[#0D0D1A] p-4 rounded-2xl text-center text-sm text-zinc-500 dark:text-zinc-400">
                      Will redirect to your preferred <span className="font-bold text-on-surface dark:text-white">{upiProvider}</span> application.
                    </div>
                  )}
                </div>
              )}

              {/* CARD PANEL */}
              {paymentMethod === 'Card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50"
                      placeholder="Alex Johnson"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Card Number</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength="19"
                      className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 font-mono"
                      placeholder="4000 1234 5678 9010"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        maxLength="5"
                        className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 font-mono"
                        placeholder="08/29"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">CVV</label>
                      <input
                        type="password"
                        required
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength="4"
                        className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 font-mono"
                        placeholder="•••"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* WALLET PANEL */}
              {paymentMethod === 'Wallet' && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Select Wallet</label>
                  <select
                    value={walletProvider}
                    onChange={(e) => setWalletProvider(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3.5 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 font-semibold"
                  >
                    <option>Paytm Wallet</option>
                    <option>PhonePe Wallet</option>
                    <option>Amazon Pay</option>
                  </select>
                </div>
              )}

              {/* CASH ON PICKUP PANEL */}
              {paymentMethod === 'Cash' && (
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 p-5 rounded-2xl text-center space-y-2">
                  <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-3xl">payments</span>
                  <h4 className="font-headline font-bold text-orange-800 dark:text-orange-300">Cash On Pickup</h4>
                  <p className="text-xs text-orange-700/80 dark:text-orange-400/80 leading-relaxed">
                    Confirm your order now. You will pay in cash or via QR code directly at the cafeteria counter during pickup.
                  </p>
                </div>
              )}

              {/* BOTTOM PAYMENT BUTTON */}
              <button
                type="submit"
                className="w-full bg-primary-gradient text-white font-headline text-base font-extrabold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all mt-6"
              >
                {paymentMethod === 'Cash' ? 'Confirm Order' : `Pay ₹${total}`}
              </button>

            </form>
          </div>
        )}

        {/* PROCESSING ANIMATION OVERLAY */}
        {paymentStatus === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-[#16213E]">
            <div className="relative w-28 h-28 mb-8">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="material-symbols-outlined absolute top-7 left-7 text-4xl text-primary animate-pulse">lock</span>
            </div>

            <h3 className="font-headline text-xl font-bold text-on-surface dark:text-white mb-2">
              Processing Payment
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 min-h-[3rem] font-medium max-w-xs mx-auto animate-pulse">
              {steps[processingStep]}
            </p>
          </div>
        )}

        {/* PAYMENT SUCCESS CONFIRMATION */}
        {paymentStatus === 'success' && (
          <div className="flex-1 flex flex-col justify-between p-6 bg-white dark:bg-[#16213E]">
            <div className="space-y-6 pt-8 text-center flex-1 flex flex-col justify-center">
              
              {/* SUCCESS ICON */}
              <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 mb-2">
                <span className="material-symbols-outlined text-white text-5xl font-black">check</span>
              </div>

              <div>
                <h3 className="font-headline text-2xl font-black text-green-600">Payment Successful</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Thank you! Your order has been placed.</p>
              </div>

              {/* TRANSACTION INFO CARD */}
              <div className="bg-slate-50 dark:bg-[#0D0D1A] rounded-2xl p-5 text-left space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Transaction ID</span>
                  <span className="font-mono font-bold text-on-surface dark:text-white">{txnId || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Order ID</span>
                  <span className="font-bold text-on-surface dark:text-white">{placedOrder?.displayId || '#0000'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Estimated Prep Time</span>
                  <span className="font-headline font-bold text-primary text-sm">{ept} mins wait</span>
                </div>
                
                {/* Itemized receipt details */}
                <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Digital Receipt</p>
                  <div className="space-y-1.5">
                    {isCartMode ? (
                      cartItems.map((entry, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-medium">
                          <span className="text-zinc-500 dark:text-zinc-400">{entry.qty}x {entry.item.name}</span>
                          <span className="text-on-surface dark:text-white">₹{entry.item.price * entry.qty}</span>
                        </div>
                      ))
                    ) : (
                      menuItem && (
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-zinc-500 dark:text-zinc-400">1x {menuItem.name}</span>
                          <span className="text-on-surface dark:text-white">₹{menuItem.price}</span>
                        </div>
                      )
                    )}
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-500 dark:text-zinc-400">Platform Fee</span>
                      <span className="text-on-surface dark:text-white">₹{platformFee}</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold border-t border-slate-200 dark:border-slate-800 pt-2 text-primary">
                      <span>Total Paid</span>
                      <span>₹{total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="space-y-3 pt-6">
              <button
                onClick={trackOrder}
                className="w-full bg-primary-gradient text-white font-headline text-base font-extrabold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                Track Live Order
              </button>
              <button
                onClick={() => navigate('/customer/home')}
                className="w-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-sm font-bold py-2 active:scale-95 transition-transform"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* PAYMENT FAILURE */}
        {paymentStatus === 'failed' && (
          <div className="flex-1 flex flex-col justify-center p-6 text-center space-y-6 bg-white dark:bg-[#16213E]">
            <div className="mx-auto w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="material-symbols-outlined text-white text-5xl font-black">close</span>
            </div>
            <div>
              <h3 className="font-headline text-2xl font-black text-red-600">Order Placement Failed</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                We couldn't connect to the cafeteria database. Please try again.
              </p>
            </div>
            <button
              onClick={() => setPaymentStatus('editing')}
              className="w-full bg-primary-gradient text-white font-headline text-base font-extrabold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Retry Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
