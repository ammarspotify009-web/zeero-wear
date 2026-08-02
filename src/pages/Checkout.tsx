import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CartItem } from '../types';
import { loadOrders, saveOrders, addOrderToSupabase, type Order } from '../data/orders';
import { getPKTDateString } from '../lib/dateUtils';
import { saveAbandonedCart, deleteAbandonedCart } from '../data/abandonedCarts';

declare global {
  interface Window {
    Xpay: any;
  }
}
type CheckoutProps = {
  cartItems: CartItem[];
  clearCart: () => void;
};

const DELIVERY_FEE = 199;
const FREE_DELIVERY_THRESHOLD = 3000;

type FormData = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  paymentMethod: 'cod' | 'card' | 'jazzcash';
};



const Checkout: React.FC<CheckoutProps> = ({ cartItems, clearCart }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedStats, setCompletedStats] = useState({ total: 0, totalItems: 0 });

  // Scroll to top when page loads and fire InitiateCheckout event
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof (window as any).fbq === 'function') {
      (window as any).fbq('track', 'InitiateCheckout');
    }
  }, []);


  const [cartSessionId] = useState(`AC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);

  const [form, setForm] = useState<FormData>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: '',
    paymentMethod: 'cod' as const,
  });

  const [xpayInstances, setXpayInstances] = useState<{card: any, jazzcash: any} | null>(null);
  const xpayInitRef = React.useRef(false);

  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const initXpay = () => {
      if (window.Xpay) {
        if (xpayInitRef.current) return;
        
        try {
          const pubKey = import.meta.env.VITE_XPAY_PUBLIC_KEY;
          const accountId = import.meta.env.VITE_XPAY_ACCOUNT_ID;
          
          if (!pubKey || !accountId) {
            console.warn("XPay keys missing in environment");
            return;
          }

          xpayInitRef.current = true;
          
          // XPay SDK only requires publishable credentials
          const xpayCard = new window.Xpay(pubKey, accountId);
          const xpayJazzcash = new window.Xpay(pubKey, accountId);

          const options = {
            override: true,
            style: {
              ".input": {},
              ".invalid": {},
              ".label": {},
            },
          };
          
          // Clear any existing iframes (useful for HMR)
          const cardEl = document.getElementById('card-element');
          const jazzEl = document.getElementById('jazzcash-element');
          if (cardEl) cardEl.innerHTML = '';
          if (jazzEl) jazzEl.innerHTML = '';

          xpayCard.element('#card-element', { ...options, paymentMethods: ['card'] });
          xpayJazzcash.element('#jazzcash-element', { ...options, paymentMethods: ['jazzcash'] });

          setXpayInstances({ card: xpayCard, jazzcash: xpayJazzcash });
        } catch (err) {
          console.error("XPay Element init error:", err);
          xpayInitRef.current = false;
        }
      } else {
        timeoutId = setTimeout(initXpay, 500);
      }
    };
    
    if (step === 'form') {
      initXpay();
    }
    
    return () => clearTimeout(timeoutId);
  }, [step]);

  // ── 3DS Modal Customizer & Close Button ──
  React.useEffect(() => {
    if (step !== 'form') return;
    
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          const popup = document.getElementById('3ds-popup-main');
          if (popup && !document.getElementById('custom-3ds-close')) {
            const closeBtn = document.createElement('button');
            closeBtn.id = 'custom-3ds-close';
            closeBtn.className = 'custom-3ds-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.title = 'Cancel Verification';
            closeBtn.onclick = () => {
              popup.remove();
              setIsLoading(false);
              setError("Payment verification was cancelled.");
            };
            const innerPopup = document.getElementById('threeDsPopup');
            if (innerPopup) {
              innerPopup.appendChild(closeBtn);
            }
          }
        }
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [step]);

  React.useEffect(() => {
    // Only save if some contact info is filled
    if (!form.fullName && !form.phone && !form.email) return;

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const total = subtotal + deliveryFee;

    const timeoutId = setTimeout(() => {
      saveAbandonedCart({
        id: cartSessionId,
        customerName: form.fullName,
        customerPhone: form.phone,
        customerEmail: form.email,
        customerAddress: form.address,
        city: form.city,
        items: cartItems,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        totalAmount: total,
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [form, cartItems, cartSessionId]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = (): boolean => {
    if (!form.fullName.trim()) { setError('Full name is required.'); return false; }
    if (!form.phone.trim()) { setError('Phone number is required.'); return false; }
    if (!/^[0-9+\-\s]{10,15}$/.test(form.phone.trim())) {
      setError('Please enter a valid phone number.');
      return false;
    }
    if (!form.address.trim()) { setError('Delivery address is required.'); return false; }
    if (!form.city.trim()) { setError('City is required.'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await handlePlaceOrder();
    }
  };

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    setError('');

    const orderLines = cartItems
      .map(item => `  - ${item.name} (Size: ${item.size}) x${item.quantity} — Rs. ${(item.price * item.quantity).toLocaleString()}`)
      .join('\n');

    const orderText = `
NEW ORDER RECEIVED — Zeero Wear
================================

CUSTOMER DETAILS
----------------
Name:     ${form.fullName}
Phone:    ${form.phone}
Email:    ${form.email || 'Not provided'}

DELIVERY ADDRESS
----------------
${form.address}
${form.city}

PAYMENT METHOD
--------------
${form.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Bank Transfer'}

ORDER ITEMS
-----------
${orderLines}

ORDER SUMMARY
-------------
Subtotal:  Rs. ${subtotal.toLocaleString()}
Delivery:  ${deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee.toLocaleString()}`}
TOTAL:     Rs. ${total.toLocaleString()}

${form.notes ? `CUSTOMER NOTE:\n${form.notes}` : ''}
    `.trim();

    try {
      const orderRef = `ZW-${Date.now().toString(36).toUpperCase()}`;

      if (form.paymentMethod !== 'cod') {
        if (!xpayInstances) {
          throw new Error("Payment system is initializing. Please wait a moment and try again.");
        }
        
        // 1. Create Payment Intent via Backend
        console.log("Fetching /api/create-payment-intent with total:", total, "orderRef:", orderRef);
        const intentRes = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            currency: "PKR",
            orderRef: orderRef,
            customer: {
              name: form.fullName,
              phone: form.phone,
              email: form.email || "customer@zeerowear.com"
            }
          })
        });
        
        const intentData = await intentRes.json();
        console.log("Intent API Response Status:", intentRes.status);
        console.log("Intent API Response Data:", intentData);
        
        if (!intentRes.ok) {
          console.error("Intent API Error:", intentData);
          throw new Error(intentData.error || "Failed to initialize payment");
        }

        // 2. Confirm Payment via SDK
        const activeXpay = form.paymentMethod === 'card' ? xpayInstances.card : xpayInstances.jazzcash;
        console.log("Calling confirmPayment with method:", form.paymentMethod);
        console.log("Client Secret:", intentData.clientSecret);
        
        let confirmResult;
        try {
          confirmResult = await activeXpay.confirmPayment(
            form.paymentMethod,
            intentData.clientSecret,
            { name: form.fullName, email: form.email || "customer@zeerowear.com", phone: form.phone },
            intentData.encryptionKey
          );
          console.log("confirmPayment result:", confirmResult);
        } catch (sdkError) {
          console.error("Exception thrown by activeXpay.confirmPayment:", sdkError);
          throw sdkError;
        }
        
        const { error, message } = confirmResult;
        if (error || (message && message.toLowerCase().includes('fail'))) {
           console.error("Payment declined by SDK. Error flag:", error, "Message:", message);
           throw new Error(message || "Payment declined");
        }
      }
      
      const newOrder: Order = {
        id: orderRef,
        customerName: form.fullName,
        customerPhone: form.phone,
        customerEmail: form.email || '',
        customerAddress: form.address,
        city: form.city,
        paymentMethod: form.paymentMethod === 'cod' ? 'Cash on Delivery' : (form.paymentMethod === 'card' ? 'Credit/Debit Card' : 'JazzCash'),
        payment_status: form.paymentMethod === 'cod' ? 'not_applicable' : 'paid', // card/jazzcash reach here only after successful confirmPayment
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        totalAmount: total,
        items: cartItems,
        notes: form.notes,
        status: 'Pending',
        orderDate: getPKTDateString()
      };

      // 1. Save to Supabase (primary database)
      const success = await addOrderToSupabase(newOrder);
      if (!success) {
        throw new Error("Unable to save your order. Please check your internet connection and try again.");
      }
      
      // 2. Update local storage (for admin panel fallback if Supabase fails)
      const existing = await loadOrders();
      saveOrders([newOrder, ...existing]);

      setCompletedStats({ total, totalItems });

      // 3. Try to send email via backend (non-blocking)
      fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.fullName,
          phone: form.phone,
          email: form.email,
          address: `${form.address}, ${form.city}`,
          paymentMethod: form.paymentMethod === 'cod' ? 'Cash on Delivery' : (form.paymentMethod === 'card' ? 'Credit/Debit Card' : 'JazzCash'),
          items: cartItems,
          subtotal,
          deliveryFee,
          total,
          notes: form.notes,
          orderText,
        }),
      }).catch(err => console.warn('Backend email notification failed:', err));

      clearCart();
      
      // Delete the abandoned cart now that they successfully checked out
      await deleteAbandonedCart(cartSessionId);
      
      if (typeof (window as any).fbq === 'function') {
        (window as any).fbq('track', 'Purchase', {
          value: total,
          currency: 'PKR',
          content_type: 'product',
          content_ids: cartItems.map(item => String(item.id)),
          contents: cartItems.map(item => ({
            id: String(item.id),
            quantity: item.quantity,
            item_price: item.price,
          })),
          num_items: cartItems.reduce((acc, item) => acc + item.quantity, 0)
        });
      }

      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Empty cart redirect ──
  if (cartItems.length === 0 && step !== 'success') {
    return (
      <div className="checkout-empty">
        <div className="checkout-empty-inner">
          <i className="fas fa-shopping-bag" />
          <h2>Your cart is empty</h2>
          <p>Add some items before checking out.</p>
          <Link to="/" className="btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  // ── Success Screen ──
  if (step === 'success') {
    return (
      <div className="checkout-success">
        <div className="checkout-success-card">
          <div className="success-icon-wrap">
            <i className="fas fa-check-circle" />
          </div>
          <h1>Order Placed!</h1>
          <p className="success-sub">
            Thank you, <strong>{form.fullName}</strong>! Your order has been received.
            Our team will contact you at <strong>{form.phone}</strong> to confirm delivery.
          </p>
          <div className="success-summary-box">
            <div className="success-row"><span>Payment</span><span>{form.paymentMethod === 'cod' ? 'Cash on Delivery' : (form.paymentMethod === 'card' ? 'Credit/Debit Card' : 'JazzCash')}</span></div>
            <div className="success-row"><span>Items</span><span>{completedStats.totalItems} item{completedStats.totalItems > 1 ? 's' : ''}</span></div>
            <div className="success-row"><span>Order Total</span><span>Rs. {completedStats.total.toLocaleString()}</span></div>
          </div>
          <button className="btn-primary" style={{ marginTop: '24px', width: '100%' }} onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-layout">
        {/* ─── FORM STEP ─── */}
        {step === 'form' && (
          <>
            <form className="checkout-form-card" onSubmit={handleSubmit} noValidate>
              <h2 className="checkout-section-title"><i className="fas fa-user" /> Contact & Delivery</h2>

              <div className="form-group">
                <label>Full Name <span className="req">*</span></label>
                <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Ali Khan" autoComplete="name" />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Phone Number <span className="req">*</span></label>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="03XX-XXXXXXX" autoComplete="tel" />
                </div>
                <div className="form-group">
                  <label>Email <span className="optional">(optional)</span></label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
                </div>
              </div>

              <div className="form-group">
                <label>Complete Address <span className="req">*</span></label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="House #, Street, Area" autoComplete="street-address" />
              </div>

              <div className="form-group">
                <label>City <span className="req">*</span></label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="Lahore" autoComplete="address-level2" />
              </div>

              <h2 className="checkout-section-title" style={{ marginTop: '28px' }}><i className="fas fa-wallet" /> Payment Method</h2>

              <div className="payment-options">
                <label className={`payment-option ${form.paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input type="radio" name="paymentMethod" value="cod" checked={form.paymentMethod === 'cod'} onChange={handleChange} />
                  <i className="fas fa-money-bill-wave" />
                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>Pay when your order arrives</p>
                  </div>
                </label>
                
                <label className={`payment-option ${form.paymentMethod === 'card' ? 'selected' : ''}`}>
                  <input type="radio" name="paymentMethod" value="card" checked={form.paymentMethod === 'card'} onChange={handleChange} />
                  <i className="fas fa-credit-card" />
                  <div>
                    <strong>Credit / Debit Card</strong>
                    <p>Pay securely via XPay</p>
                  </div>
                </label>
                <div id="card-element" style={{ display: form.paymentMethod === 'card' ? 'block' : 'none', marginTop: '10px' }}></div>

                <label className={`payment-option ${form.paymentMethod === 'jazzcash' ? 'selected' : ''}`}>
                  <input type="radio" name="paymentMethod" value="jazzcash" checked={form.paymentMethod === 'jazzcash'} onChange={handleChange} />
                  <i className="fas fa-mobile-alt" />
                  <div>
                    <strong>JazzCash</strong>
                    <p>Pay via JazzCash Wallet</p>
                  </div>
                </label>
                <div id="jazzcash-element" style={{ display: form.paymentMethod === 'jazzcash' ? 'block' : 'none', marginTop: '10px' }}></div>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Order Notes <span className="optional">(optional)</span></label>
                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any special instructions for your order…" rows={3} />
              </div>

              {error && <div className="checkout-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

              <button type="submit" className="btn-primary btn-block checkout-submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin" /> Placing…</> : <><i className="fas fa-check" /> Place Order</>}
              </button>
            </form>

            {/* Order Summary sidebar */}
            <aside className="checkout-summary-card">
              <OrderSummary cartItems={cartItems} subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
            </aside>
          </>
        )}
      </div>
    </div>
  );
};

// ── Reusable Order Summary sidebar ──
const OrderSummary: React.FC<{
  cartItems: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}> = ({ cartItems, subtotal, deliveryFee, total }) => (
  <div className="order-summary-inner">
    <h3>Order Summary</h3>
    <div className="summary-items">
      {cartItems.map((item, idx) => (
        <div className="summary-item" key={`${item.id}-${item.size}-${idx}`}>
          <div className="summary-item-img-wrap">
            <img src={item.image} alt={item.name} />
            <span className="summary-item-qty">{item.quantity}</span>
          </div>
          <div className="summary-item-info">
            <span className="summary-item-name">{item.name}</span>
            <span className="summary-item-size">Size: {item.size}</span>
          </div>
          <span className="summary-item-price">Rs. {(item.price * item.quantity).toLocaleString()}</span>
        </div>
      ))}
    </div>
    <div className="summary-divider" />
    <div className="summary-row"><span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span></div>
    <div className="summary-row">
      <span>Delivery</span>
      <span>{deliveryFee === 0 ? <span className="free-tag">FREE</span> : `Rs. ${deliveryFee.toLocaleString()}`}</span>
    </div>
    {deliveryFee > 0 && (
      <p className="free-delivery-hint">
        Add Rs. {(FREE_DELIVERY_THRESHOLD - subtotal + deliveryFee).toLocaleString()} more for free delivery
      </p>
    )}
    <div className="summary-divider" />
    <div className="summary-row summary-total"><span>Total</span><span>Rs. {total.toLocaleString()}</span></div>
  </div>
);

export default Checkout;
