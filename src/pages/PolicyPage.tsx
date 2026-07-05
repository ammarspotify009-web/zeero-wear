import React from 'react';
import { useParams, Link } from 'react-router-dom';

const policies: Record<string, { title: string; content: React.ReactNode }> = {
  shipping: {
    title: 'Shipping Policy',
    content: (
      <>
        <h3>Delivery Timeframe</h3>
        <p>We deliver all across Pakistan. Standard delivery takes <strong>3-5 business days</strong> depending on your location. Express delivery is available for Karachi and select cities within 1-2 business days.</p>

        <h3>Order Processing</h3>
        <p>Orders placed before <strong>2:00 PM</strong> are typically processed the same day (Monday to Saturday). Orders placed on Sundays or public holidays will be processed on the next business day.</p>

        <h3>Shipping Charges</h3>
        <ul>
          <li>Free shipping on all orders above <strong>PKR 3,000</strong></li>
          <li>Karachi: PKR 150 flat rate</li>
          <li>Other cities: PKR 200–250 depending on weight</li>
        </ul>

        <h3>Tracking Your Order</h3>
        <p>Once your order is dispatched, you will receive a WhatsApp message with your tracking number. You can track your parcel via the courier's website.</p>

        <h3>Contact Us</h3>
        <p>For any shipping-related queries, please WhatsApp us at <strong>0311 709 6337</strong> or email <strong>zeerowear4@gmail.com</strong>.</p>
      </>
    )
  },
  terms: {
    title: 'Terms and Conditions',
    content: (
      <>
        <h3>Acceptance of Terms</h3>
        <p>By accessing and using the Zeero Wear website, you agree to comply with and be bound by these terms and conditions. If you do not agree to these terms, please do not use our website.</p>

        <h3>Product Information</h3>
        <p>We make every effort to display accurate product descriptions, sizes, and colors. However, due to photography and screen settings, actual product colors may vary slightly. All products are 100% authentic and imported.</p>

        <h3>Pricing</h3>
        <p>All prices listed are in Pakistani Rupees (PKR). Zeero Wear reserves the right to change prices at any time without prior notice. The price at the time of your order will be honored.</p>

        <h3>Intellectual Property</h3>
        <p>All content on this site including images, text, logos, and designs are the property of Zeero Wear and may not be reproduced without written permission.</p>

        <h3>Limitation of Liability</h3>
        <p>Zeero Wear shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website.</p>

        <h3>Governing Law</h3>
        <p>These terms are governed by the laws of Pakistan. Any disputes shall be subject to the exclusive jurisdiction of the courts in Karachi.</p>
      </>
    )
  },
  privacy: {
    title: 'Privacy Policy',
    content: (
      <>
        <h3>Information We Collect</h3>
        <p>When you place an order, we collect your name, phone number, email address, and delivery address. This information is solely used to process and deliver your order.</p>

        <h3>How We Use Your Information</h3>
        <ul>
          <li>To process and fulfill your orders</li>
          <li>To send you order updates via WhatsApp or SMS</li>
          <li>To respond to your inquiries and provide customer support</li>
          <li>To improve our product offerings and website experience</li>
        </ul>

        <h3>Data Security</h3>
        <p>We take data security seriously. Your personal information is stored securely and is never sold or shared with third parties for marketing purposes.</p>

        <h3>Cookies</h3>
        <p>Our website may use cookies to enhance your browsing experience. You can disable cookies in your browser settings, but this may affect some functionality.</p>

        <h3>Your Rights</h3>
        <p>You have the right to request access to your personal data, request corrections, or ask for its deletion. Please contact us at <strong>zeerowear4@gmail.com</strong> for such requests.</p>

        <h3>Contact</h3>
        <p>For any privacy-related concerns, contact us at <strong>0311 709 6337</strong> or <strong>zeerowear4@gmail.com</strong>.</p>
      </>
    )
  },
  'return-refund': {
    title: 'Return & Refund Policy',
    content: (
      <>
        <h3>7-Day Return Window</h3>
        <p>We offer a hassle-free <strong>7-day return and exchange policy</strong> from the date of delivery. If you are not completely satisfied with your purchase, you may return or exchange the item.</p>

        <h3>Conditions for Return</h3>
        <ul>
          <li>Items must be in their original, unused condition with all tags attached</li>
          <li>Items must be unwashed and unaltered</li>
          <li>Items must be in their original packaging where applicable</li>
          <li>Proof of purchase (order confirmation) must be provided</li>
        </ul>

        <h3>Non-Returnable Items</h3>
        <p>The following items cannot be returned or exchanged: sale/discounted items, items damaged due to misuse, and items without original tags.</p>

        <h3>Damaged or Incorrect Items</h3>
        <p>If you receive a damaged, defective, or incorrect item, please contact us within <strong>48 hours</strong> of delivery via WhatsApp at <strong>0311 709 6337</strong> with photos of the item.</p>

        <h3>Refund Process</h3>
        <p>Once we receive and inspect the returned item, refunds will be processed within <strong>7-10 business days</strong> via bank transfer or the original payment method. You will be notified via WhatsApp once the refund is initiated.</p>

        <h3>How to Initiate a Return</h3>
        <p>WhatsApp us at <strong>0311 709 6337</strong> or email <strong>zeerowear4@gmail.com</strong> with your order number and reason for return. Our team will guide you through the process.</p>
      </>
    )
  }
};

const PolicyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const policy = id ? policies[id] : null;

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!policy) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Policy Not Found</h2>
        <Link to="/" className="btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>Return Home</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '60px 20px', background: 'var(--bg-cream)', minHeight: '70vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '40px 48px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
        <div style={{ marginBottom: '24px', fontSize: '13px', color: 'var(--text-light)' }}>
          <Link to="/" style={{ color: 'var(--primary)', fontWeight: 500 }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{policy.title}</span>
        </div>
        <h1 style={{ fontSize: '32px', color: 'var(--dark)', fontFamily: 'var(--font-display)', marginBottom: '24px', borderBottom: '2px solid var(--border)', paddingBottom: '16px' }}>
          {policy.title}
        </h1>
        <div style={{ fontSize: '15px', color: 'var(--text-light)', lineHeight: '1.9' }}
          className="policy-body"
        >
          {policy.content}
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;
