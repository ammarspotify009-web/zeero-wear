import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <>
      {/* PROMO BANNER */}
      <div className="promo-banner">
        <h2>Summer Sale — Up to 40% Off!</h2>
        <p>Limited time offer on selected styles. Don't miss out on the best deals for your little ones.</p>
        <Link to="/category/sale" className="btn-white"><i className="fas fa-bolt"></i> Shop the Sale</Link>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/logo.png" alt="Zeero Wear" className="logo-color-shift" style={{ height: '140px', width: 'auto', objectFit: 'contain', margin: '-40px 0 -20px -20px' }} />
            <p className="footer-desc">Pakistan's leading kids clothing brand. 100% authentic &amp; imported clothes, shoes, and accessories for babies and kids aged 0–10 years.</p>
            <div className="footer-contact">
              <p><i className="fas fa-map-marker-alt"></i> GROUND FLOOR, Old Sunset Boulevard, Phase 2, Defence, Karachi</p>
              <p><i className="fas fa-envelope"></i> zeerowear4@gmail.com</p>
              <p><i className="fas fa-phone"></i> 0311 709 6337</p>
            </div>
            <div className="social-links">
              <a href="https://www.facebook.com/share/1GWyAUokmK/?mibextid=wwXIfr" className="social-btn" target="_blank" rel="noreferrer"><i className="fab fa-facebook-f"></i></a>
              <a href="https://www.instagram.com/zeero.wear?igsh=MTF3NzVwbGxhc2IydQ==" className="social-btn" target="_blank" rel="noreferrer"><i className="fab fa-instagram"></i></a>
              <a href="https://www.tiktok.com/@zeero.wear?_r=1&_t=ZS-97jS1nHrfzL" className="social-btn" target="_blank" rel="noreferrer"><i className="fab fa-tiktok"></i></a>
              <a href="https://wa.me/923117096337" className="social-btn" target="_blank" rel="noreferrer"><i className="fab fa-whatsapp"></i></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/policies/shipping">Shipping Policy</Link></li>
              <li><Link to="/policies/terms">Terms and Conditions</Link></li>
              <li><Link to="/policies/privacy">Privacy Policy</Link></li>
              <li><Link to="/policies/return-refund">Return & Refund Policy</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/category/new-born">Newborn</Link></li>
              <li><Link to="/category/baby-boy">Baby Boy</Link></li>
              <li><Link to="/category/baby-girl">Baby Girl</Link></li>
              <li><Link to="/category/boy">Boys (2–10)</Link></li>
              <li><Link to="/category/girl">Girls (2–10)</Link></li>
              <li><Link to="/category/footwear">Footwear</Link></li>
              <li><Link to="/category/accessories">Accessories</Link></li>
              <li><Link to="/category/hadid">Eastern Wear</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Newsletter</h4>
            <p style={{ fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>Subscribe to our newsletter and get the latest updates, offers and new arrivals.</p>
            <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Subscribed! Thank you.'); }}>
              <input type="email" placeholder="Your email address" required />
              <button type="submit">Subscribe <i className="fas fa-paper-plane"></i></button>
            </form>
          </div>
        </div>

        <div className="footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '40px', padding: '20px 24px', maxWidth: '1300px', marginLeft: 'auto', marginRight: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>© 2026 Zeero Wear. All rights reserved.</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Made with ❤️ by Traficore Agency</p>
        </div>
      </footer>

      {/* WHATSAPP FAB */}
      <a href="https://wa.me/923117096337" className="whatsapp-fab" title="Chat on WhatsApp" target="_blank" rel="noreferrer">
        <i className="fab fa-whatsapp"></i>
      </a>

      {/* MOBILE BOTTOM BAR */}
      <div className="mobile-bottom-bar">
        <Link to="/"><i className="fas fa-home"></i>Home</Link>
        <Link to="/category/baby-boy"><i className="fas fa-th-large"></i>Categories</Link>
        <Link to="/contact"><i className="fas fa-envelope"></i>Contact</Link>
      </div>
    </>
  );
};

export default Footer;
