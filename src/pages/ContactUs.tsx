import React, { useState } from 'react';
import { saveQuery, type Query } from '../data/queries';
import { getPKTDateString } from '../lib/dateUtils';

const ContactUs: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, message }),
      });

      if (response.ok) {
        // Save to Supabase for the admin panel to view
        const newQuery: Query = {
          id: 'Q-' + Date.now(),
          name,
          email,
          phone,
          message,
          date: getPKTDateString(),
          status: 'Unread'
        };

        await saveQuery(newQuery);
        setSubmitted(true);
        
        // Clear form
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="contact-us-page" style={{ padding: '60px 20px', background: 'var(--bg-cream)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', color: 'var(--dark)', fontFamily: 'var(--font-display)', marginBottom: '12px' }}>Contact Us</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '16px' }}>Have a question about our products or your order? We'd love to hear from you!</p>
        </div>

        {submitted ? (
          <div style={{ background: '#e6f4ea', border: '1px solid #ceead6', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <i className="fas fa-check-circle" style={{ fontSize: '48px', color: 'var(--success)', marginBottom: '16px' }}></i>
            <h2 style={{ color: 'var(--dark)', fontSize: '24px', marginBottom: '8px' }}>Message Sent Successfully!</h2>
            <p style={{ color: 'var(--text-light)' }}>Thank you for reaching out. Our team will get back to you shortly at your provided email.</p>
            <button 
              onClick={() => setSubmitted(false)}
              className="btn-primary"
              style={{ marginTop: '24px', padding: '12px 24px' }}
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)', marginBottom: '8px', display: 'block' }}>Your Name *</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ali Raza"
                  required
                  style={{ width: '100%', padding: '14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }}
                />
              </div>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)', marginBottom: '8px', display: 'block' }}>Email Address *</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ali@example.com"
                  required
                  style={{ width: '100%', padding: '14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)', marginBottom: '8px', display: 'block' }}>Phone Number (Optional)</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0300-1234567"
                style={{ width: '100%', padding: '14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '30px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)', marginBottom: '8px', display: 'block' }}>Your Message *</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help you today?"
                required
                rows={5}
                style={{ width: '100%', padding: '14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14.5px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 700 }}>
              <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i> Send Message
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-light)', marginTop: '16px' }}>
              <i className="fas fa-info-circle"></i> We typically reply within 24 hours via email.
            </p>
          </form>
        )}

      </div>
    </div>
  );
};

export default ContactUs;
