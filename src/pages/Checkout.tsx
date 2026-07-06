import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CartItem } from '../types';
import { loadOrders, saveOrders, addOrderToSupabase, type Order } from '../data/orders';

type CheckoutProps = {
  cartItems: CartItem[];
  clearCart: () => void;
};

const DELIVERY_FEE = 199;
const FREE_DELIVERY_THRESHOLD = 3000;

type FormData = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  paymentMethod: 'cod';
};



const Checkout: React.FC<CheckoutProps> = ({ cartItems, clearCart }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedStats, setCompletedStats] = useState({ total: 0, totalItems: 0 });

  // Scroll to top when page loads
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);


  const [form, setForm] = useState<FormData>(() => {
    const saved = localStorage.getItem('zeero_wear_checkout_form');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore JSON parse error
      }
    }
    return {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      notes: '',
      paymentMethod: 'cod' as const,
    };
  });

  React.useEffect(() => {
    localStorage.setItem('zeero_wear_checkout_form', JSON.stringify(form));
  }, [form]);

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
    if (!form.firstName.trim()) { setError('First name is required.'); return false; }
    if (!form.lastName.trim()) { setError('Last name is required.'); return false; }
    if (!form.phone.trim()) { setError('Phone number is required.'); return false; }
    if (!/^[0-9+\-\s]{10,15}$/.test(form.phone.trim())) {
      setError('Please enter a valid phone number.');
      return false;
    }
    if (!form.address.trim()) { setError('Delivery address is required.'); return false; }
    if (!form.city.trim()) { setError('City is required.'); return false; }
    return true;
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setStep('confirm');
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
Name:     ${form.firstName} ${form.lastName}
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
Delivery:  Rs. ${deliveryFee === 0 ? 'FREE' : deliveryFee.toLocaleString()}
TOTAL:     Rs. ${total.toLocaleString()}

${form.notes ? `CUSTOMER NOTE:\n${form.notes}` : ''}
    `.trim();

    try {
      const orderRef = `ZW-${Date.now().toString(36).toUpperCase()}`;
      
      const newOrder: Order = {
        id: orderRef,
        customerName: `${form.firstName} ${form.lastName}`,
        customerPhone: form.phone,
        customerEmail: form.email || '',
        customerAddress: form.address,
        city: form.city,
        paymentMethod: 'Cash on Delivery',
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        totalAmount: total,
        items: cartItems,
        notes: form.notes,
        status: 'Pending',
        orderDate: new Date().toISOString().split('T')[0]
      };

      // 1. Save to Supabase (primary database)
      try {
        await addOrderToSupabase(newOrder);
      } catch (e) {
        console.error("Supabase insert failed, falling back to local storage:", e);
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
          customerName: `${form.firstName} ${form.lastName}`,
          phone: form.phone,
          email: form.email,
          address: `${form.address}, ${form.city}`,
          paymentMethod: 'Cash on Delivery',
          items: cartItems,
          subtotal,
          deliveryFee,
          total,
          notes: form.notes,
          orderText,
        }),
      }).catch(err => console.warn('Backend email notification failed:', err));

      clearCart();
      localStorage.removeItem('zeero_wear_checkout_form');
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
            Thank you, <strong>{form.firstName}</strong>! Your order has been received.
            Our team will contact you at <strong>{form.phone}</strong> to confirm delivery.
          </p>
          <div className="success-summary-box">
            <div className="success-row"><span>Payment</span><span>Cash on Delivery</span></div>
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
      {/* Progress Bar */}
      <div className="checkout-progress">
        <div className={`progress-step ${step === 'form' ? 'active' : 'done'}`}>
          <span className="step-num">{step === 'confirm' ? <i className="fas fa-check" /> : '1'}</span>
          <span className="step-label">Your Details</span>
        </div>
        <div className="progress-line" />
        <div className={`progress-step ${step === 'confirm' ? 'active' : ''}`}>
          <span className="step-num">2</span>
          <span className="step-label">Review & Pay</span>
        </div>
      </div>

      <div className="checkout-layout">
        {/* ─── FORM STEP ─── */}
        {step === 'form' && (
          <>
            <form className="checkout-form-card" onSubmit={handleReview} noValidate>
              <h2 className="checkout-section-title"><i className="fas fa-user" /> Contact & Delivery</h2>

              <div className="form-row-2">
                <div className="form-group">
                  <label>First Name <span className="req">*</span></label>
                  <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Ali" autoComplete="given-name" />
                </div>
                <div className="form-group">
                  <label>Last Name <span className="req">*</span></label>
                  <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Khan" autoComplete="family-name" />
                </div>
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
                <label>Street Address <span className="req">*</span></label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="House #, Street, Area" autoComplete="street-address" />
              </div>

              <div className="form-group">
                <label>City <span className="req">*</span></label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="Lahore" autoComplete="address-level2" />
              </div>

              <h2 className="checkout-section-title" style={{ marginTop: '28px' }}><i className="fas fa-wallet" /> Payment Method</h2>

              <div className="payment-options">
                <label className="payment-option selected">
                  <input type="radio" name="paymentMethod" value="cod" checked readOnly />
                  <i className="fas fa-money-bill-wave" />
                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>Pay when your order arrives</p>
                  </div>
                </label>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Order Notes <span className="optional">(optional)</span></label>
                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any special instructions for your order…" rows={3} />
              </div>

              {error && <div className="checkout-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

              <button type="submit" className="btn-primary btn-block checkout-submit">
                Review Order <i className="fas fa-arrow-right" />
              </button>
            </form>

            {/* Order Summary sidebar */}
            <aside className="checkout-summary-card">
              <OrderSummary cartItems={cartItems} subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
            </aside>
          </>
        )}

        {/* ─── CONFIRM STEP ─── */}
        {step === 'confirm' && (
          <>
            <div className="checkout-form-card">
              <h2 className="checkout-section-title"><i className="fas fa-clipboard-check" /> Review Your Order</h2>

              <div className="confirm-section">
                <h4>Delivery To</h4>
                <p>{form.firstName} {form.lastName}</p>
                <p>{form.phone}</p>
                <p>{form.address}, {form.city}</p>
              </div>

              <div className="confirm-section">
                <h4>Payment Method</h4>
                <p>💵 Cash on Delivery</p>
              </div>

              <div className="confirm-section">
                <h4>Items ({totalItems})</h4>
                {cartItems.map((item, idx) => (
                  <div className="confirm-item" key={`${item.id}-${item.size}-${idx}`}>
                    <img src={item.image} alt={item.name} className="confirm-item-img" />
                    <div className="confirm-item-info">
                      <span className="confirm-item-name">{item.name}</span>
                      <span className="confirm-item-meta">Size: {item.size} · Qty: {item.quantity}</span>
                    </div>
                    <span className="confirm-item-price">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {form.notes && (
                <div className="confirm-section">
                  <h4>Note</h4>
                  <p style={{ fontStyle: 'italic', color: 'var(--text-light)' }}>{form.notes}</p>
                </div>
              )}

              {error && <div className="checkout-error"><i className="fas fa-exclamation-circle" /> {error}</div>}

              <div className="confirm-actions">
                <button className="btn-outline" onClick={() => setStep('form')} disabled={isLoading}>
                  <i className="fas fa-arrow-left" /> Edit Details
                </button>
                <button className="btn-primary" onClick={handlePlaceOrder} disabled={isLoading}>
                  {isLoading ? <><i className="fas fa-spinner fa-spin" /> Placing…</> : <><i className="fas fa-check" /> Place Order</>}
                </button>
              </div>
            </div>

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
