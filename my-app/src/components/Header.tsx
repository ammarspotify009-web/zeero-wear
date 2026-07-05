import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CartItem } from '../types';
import type { Product } from '../data/products';
import type { Category } from '../data/categories';

type HeaderProps = {
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAccountOpen: boolean;
  setIsAccountOpen: React.Dispatch<React.SetStateAction<boolean>>;
  removeFromCart: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, delta: number) => void;
  wishlistItems: Product[];
  isWishlistOpen: boolean;
  setIsWishlistOpen: React.Dispatch<React.SetStateAction<boolean>>;
  removeFromWishlist: (id: string) => void;
  activeCategories: string[];
  activeTags: string[];
  categories: Category[];
  isCheckoutRoute?: boolean;
};

const Header: React.FC<HeaderProps> = ({ 
  cartItems, isCartOpen, setIsCartOpen, isAccountOpen, setIsAccountOpen, removeFromCart, updateQuantity, wishlistItems, isWishlistOpen, setIsWishlistOpen, removeFromWishlist, activeCategories: _activeCategories, activeTags: _activeTags, categories, isCheckoutRoute: _isCheckoutRoute
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'MENU' | 'CATEGORIES'>('MENU');
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) setSearchQuery(''); // Clear on close
  };
  
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedAccordion(prev => prev === id ? null : id);
  };

  const topLevelCategories = categories
    .filter(c => !c.parentId && c.showInSidebar)
    .sort((a, b) => a.order - b.order);

  const getSubcategories = (parentId: string) => {
    return categories
      .filter(c => c.parentId === parentId && c.showInSidebar)
      .sort((a, b) => a.order - b.order);
  };

  return (
    <>
      {/* ANNOUNCEMENT BAR */}
      <div className="announcement-bar">
        100% <span>Authentic & Imported</span> &nbsp;|&nbsp; Free Delivery on orders above PKR <span>3,000/-</span>
      </div>

      {/* HEADER */}
      <header>
        <div className="header-inner">
          <button className="hamburger" onClick={toggleMenu}><i className="fas fa-bars"></i></button>
          
          <Link to="/" className="logo">
            <img src="/logo.png" alt="Zeero Wear" className="logo-color-shift" />
          </Link>

          <div className="header-actions">
            <a href="#" className="header-icon" onClick={(e) => { e.preventDefault(); toggleSearch(); }}>
              <i className="fas fa-search"></i>
              <span>Search</span>
            </a>
            <a href="#" className="header-icon" onClick={(e) => { e.preventDefault(); setIsAccountOpen(true); }}>
              <i className="far fa-user"></i>
              <span>Account</span>
            </a>
            <a href="#" className="header-icon" onClick={(e) => { e.preventDefault(); setIsWishlistOpen(true); }}>
              <i className="far fa-heart"></i>
              <span>Wishlist</span>
              <div className="badge">{wishlistItems.length}</div>
            </a>
            <a href="#" className="header-icon" onClick={(e) => { e.preventDefault(); setIsCartOpen(true); }}>
              <i className="fas fa-shopping-bag"></i>
              <span>Cart</span>
              <div className="badge">{cartCount}</div>
            </a>
          </div>
        </div>
        
        {/* Search Overlay Popup */}
        <div className={`search-overlay ${isSearchOpen ? 'open' : ''}`}>
          <input 
            type="text" 
            placeholder="Search for kids clothes, shoes..." 
            autoFocus 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          <button onClick={toggleSearch} style={{ marginLeft: '10px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
        </div>
      </header>

      {/* MOBILE MENU / SIDEBAR DRAWER */}
      <div className={`drawer-overlay ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}></div>
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <img src="/logo.png" alt="Zeero Wear" style={{ height: '55px', width: 'auto', objectFit: 'contain' }} />
          <button className="mobile-menu-close" onClick={toggleMenu}><i className="fas fa-times"></i></button>
        </div>
        
        <div className="sidebar-tabs">
          <div className={`sidebar-tab ${activeTab === 'MENU' ? 'active' : ''}`} onClick={() => setActiveTab('MENU')}>MENU</div>
          <div className={`sidebar-tab ${activeTab === 'CATEGORIES' ? 'active' : ''}`} onClick={() => setActiveTab('CATEGORIES')}>CATEGORIES</div>
        </div>

        <div className="sidebar-content">
          {activeTab === 'MENU' && (
            <div className="sidebar-list">
              {topLevelCategories.map(item => {
                const subs = getSubcategories(item.id);
                const hasSub = subs.length > 0;
                return hasSub ? (
                  <div className="sidebar-accordion" key={item.id}>
                    <div className="accordion-header" onClick={() => toggleAccordion(item.id)}>
                      <span>
                        {item.name} 
                        {item.badge && <span className={`sidebar-badge ${item.badgeColor || 'badge-teal'}`}>{item.badge}</span>}
                      </span>
                      <i className={`fas fa-${expandedAccordion === item.id ? 'minus' : 'plus'}`}></i>
                    </div>
                    <div className={`accordion-content ${expandedAccordion === item.id ? 'open' : ''}`}>
                      <Link to={`/category/${item.id}`} className="accordion-subitem" onClick={toggleMenu}>All</Link>
                      {subs.map(sub => (
                        <Link to={`/category/${sub.id}`} className="accordion-subitem" key={sub.id} onClick={toggleMenu}>{sub.name}</Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link to={`/category/${item.id}`} className="sidebar-item" key={item.id} onClick={toggleMenu}>
                    <span>
                      {item.name}
                      {item.badge && <span className={`sidebar-badge ${item.badgeColor || 'badge-teal'}`}>{item.badge}</span>}
                    </span>
                  </Link>
                )
              })}
              <Link to="/contact" className="sidebar-item" onClick={toggleMenu}>
                <span>
                  Contact Us
                  <i className="fas fa-envelope" style={{ marginLeft: 'auto', color: 'var(--text-light)' }}></i>
                </span>
              </Link>
            </div>
          )}
          {activeTab === 'CATEGORIES' && (
            <div className="sidebar-list">
               {topLevelCategories.filter(i => !['new-arrivals', 'trending', 'sale', 'bestsellers'].includes(i.id)).map(item => (
                 <Link key={item.id} to={`/category/${item.id}`} className="sidebar-item" onClick={toggleMenu}>
                   {item.name}
                 </Link>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* ACCOUNT DRAWER */}
      <div className={`drawer-overlay ${isAccountOpen ? 'open' : ''}`} onClick={() => setIsAccountOpen(false)}></div>
      <div className={`right-drawer ${isAccountOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>{isRegistering ? 'Create Account' : 'Account'}</h3>
          <button className="mobile-menu-close" onClick={() => setIsAccountOpen(false)}><i className="fas fa-times"></i></button>
        </div>
        <div className="drawer-body">
          {isRegistering ? (
            <>
              <div className="form-group">
                <label>First Name</label>
                <input type="text" placeholder="First Name" />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" placeholder="Last Name" />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="Enter your email" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="Enter your password" />
              </div>
              <button className="btn-primary btn-block" onClick={(e) => { e.preventDefault(); alert("Account Created!"); setIsAccountOpen(false); }}>Create</button>
              
              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                Already have an account? <button onClick={() => setIsRegistering(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="Enter your email" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="Enter your password" />
              </div>
              <a href="#" style={{ fontSize: '12px', color: 'var(--primary)', marginBottom: '16px', display: 'block' }}>Forgot Password?</a>
              <button className="btn-primary btn-block" onClick={(e) => { e.preventDefault(); alert("Logged in!"); setIsAccountOpen(false); }}>Sign In</button>
              
              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                New customer? <button onClick={() => setIsRegistering(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Create an account</button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* WISHLIST DRAWER */}
      <div className={`drawer-overlay ${isWishlistOpen ? 'open' : ''}`} onClick={() => setIsWishlistOpen(false)}></div>
      <div className={`right-drawer ${isWishlistOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>Your Wishlist</h3>
          <button className="mobile-menu-close" onClick={() => setIsWishlistOpen(false)}><i className="fas fa-times"></i></button>
        </div>
        <div className="drawer-body">
          {wishlistItems.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-light)' }}>
              <i className="far fa-heart" style={{ fontSize: '48px', marginBottom: '16px', color: '#eee' }}></i>
              <p>Your wishlist is currently empty.</p>
              <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setIsWishlistOpen(false)}>Explore Products</button>
            </div>
          ) : (
            wishlistItems.map((item, idx) => (
              <div className="cart-item" key={`${item.id}-${idx}`}>
                <img src={item.images[0]} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <div className="cart-item-title"><Link to={`/product/${item.id}`} onClick={() => setIsWishlistOpen(false)}>{item.name}</Link></div>
                  <div className="cart-item-price">Rs. {item.price.toLocaleString()}</div>
                  <div className="cart-item-actions">
                    <button className="cart-item-remove" onClick={() => removeFromWishlist(item.id)}>
                      <i className="far fa-trash-alt"></i> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CART DRAWER */}
      <div className={`drawer-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}></div>
      <div className={`right-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>Shopping Cart</h3>
          <button className="mobile-menu-close" onClick={() => setIsCartOpen(false)}><i className="fas fa-times"></i></button>
        </div>
        <div className="drawer-body">
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-light)' }}>
              <i className="fas fa-shopping-bag" style={{ fontSize: '48px', marginBottom: '16px', color: '#eee' }}></i>
              <p>Your cart is currently empty.</p>
              <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setIsCartOpen(false)}>Start Shopping</button>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div className="cart-item" key={`${item.id}-${item.size}-${idx}`}>
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <div className="cart-item-title">{item.name}</div>
                  <div className="cart-item-meta">Size: {item.size}</div>
                  <div className="cart-item-price">Rs. {item.price.toLocaleString()}</div>
                  <div className="cart-item-actions">
                    <div className="qty-controls">
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, item.size, -1)}>-</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, item.size, 1)}>+</button>
                    </div>
                    <button className="cart-item-remove" onClick={() => removeFromCart(item.id, item.size)}>
                      <i className="far fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 700, fontSize: '18px' }}>
              <span>Subtotal:</span>
              <span>Rs. {cartTotal.toLocaleString()}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '16px', textAlign: 'center' }}>Shipping and taxes calculated at checkout.</p>
            <button className="btn-primary btn-block" onClick={(e) => { e.preventDefault(); setIsCartOpen(false); navigate('/checkout'); }}>Checkout</button>
          </div>
        )}
      </div>
    </>
  );
};

export default Header;
