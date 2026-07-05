import React from 'react';
import { Link } from 'react-router-dom';
import type { CartItem } from '../types';
import type { Product } from '../data/products';

type Props = {
  products: Product[];
  addToCart?: (item: Omit<CartItem, 'quantity'>) => void;
  toggleWishlist?: (product: Product) => void;
  wishlistItems?: Product[];
};

const Footwear: React.FC<Props> = ({ products, addToCart, toggleWishlist, wishlistItems = [] }) => {
  const handleAddToCart = (e: React.MouseEvent, id: string, name: string, price: number, image: string, size: string) => {
    e.preventDefault();
    if (addToCart) {
      addToCart({ id, name, price, image, size });
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (toggleWishlist) {
      toggleWishlist(product);
    }
  };

  const isWishlisted = (id: string) => wishlistItems.some(i => i.id === id);

  const footwearProducts = products.filter(p => p.categories?.includes('footwear')).slice(0, 4);

  if (footwearProducts.length === 0) return null;

  return (
    <section className="section">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-eyebrow">Step in Style</div>
          <h2 className="section-title">Premium Footwear</h2>
          <p className="section-subtitle">Perfect Pairs for Little Feet!</p>
        </div>
        <div className="products-grid">

          {footwearProducts.map(prod => {
            const hasDiscount = prod.oldPrice && prod.oldPrice > prod.price;
            return (
              <div className="product-card" key={prod.id}>
                <div className="product-img-wrap">
                  <Link to={`/product/${prod.id}`}>
                    <img src={prod.images[0]} alt={prod.name} loading="lazy" />
                  </Link>
                  {prod.badge === 'sale' || (prod.badge !== 'none' && hasDiscount && !prod.badge) ? (
                    <span className="product-badge sale">Sale</span>
                  ) : prod.badge === 'best-seller' ? (
                    <span className="product-badge" style={{ background: '#d4940a' }}>Best Seller</span>
                  ) : prod.badge === 'new-arrival' ? (
                    <span className="product-badge">New Arrival</span>
                  ) : prod.badge === 'sold-out' ? (
                    <span className="product-badge" style={{ background: '#888' }}>Sold Out</span>
                  ) : null}
                  <button 
                    className="product-wishlist" 
                    onClick={(e) => handleToggleWishlist(e, prod)} 
                    style={isWishlisted(prod.id) ? {color: '#d32f2f'} : {}}
                  >
                    <i className={`${isWishlisted(prod.id) ? 'fas' : 'far'} fa-heart`}></i>
                  </button>
                  {prod.badge === 'sold-out' ? (
                    <div className="product-quick-shop" style={{ background: '#888', cursor: 'not-allowed' }}>
                      Sold Out
                    </div>
                  ) : (
                    <div 
                      className="product-quick-shop" 
                      onClick={(e) => handleAddToCart(e, prod.id, prod.name, prod.price, prod.images[0], prod.sizes[0] || 'OS')}
                    >
                      Quick Shop
                    </div>
                  )}
                </div>
                <div className="product-sizes">
                  {prod.badge === 'sold-out' ? null : (
                    <>
                      {prod.sizes.slice(0, 4).map(size => (
                        <span 
                          key={size} 
                          className="size-dot" 
                          onClick={(e) => handleAddToCart(e, prod.id, prod.name, prod.price, prod.images[0], size)}
                        >
                          {size}
                        </span>
                      ))}
                      {prod.sizes.length > 4 && <span className="size-dot">+{prod.sizes.length - 4}</span>}
                    </>
                  )}
                </div>
                <div className="product-info">
                  <Link to={`/product/${prod.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="product-name">{prod.name}</div>
                  </Link>
                  <div className="product-price">
                    Rs. {prod.price.toLocaleString()} 
                    {hasDiscount && <span className="old-price">Rs. {prod.oldPrice!.toLocaleString()}</span>}
                  </div>
                </div>
              </div>
            );
          })}

        </div>
        <div className="view-all-wrap">
          <Link to="/category/footwear" className="btn-primary">View All Footwear <i className="fas fa-arrow-right"></i></Link>
        </div>
      </div>
    </section>
  );
};

export default Footwear;

