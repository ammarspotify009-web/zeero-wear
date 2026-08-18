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

const BestSellersSection: React.FC<Props> = ({ products, addToCart, toggleWishlist, wishlistItems = [] }) => {
  const handleAddToCart = (e: React.MouseEvent, prod: Product, size: string) => {
    e.preventDefault();
    if (addToCart) {
      addToCart({ id: prod.id, name: prod.name, price: prod.price, image: prod.images[0], size });
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (toggleWishlist) {
      toggleWishlist(product);
    }
  };

  const isWishlisted = (id: string) => wishlistItems.some(i => i.id === id);

  const bestSellers = products
    .filter(p => p.badge === 'best-seller' || p.categories?.includes('bestsellers'))
    .slice(0, 4);

  if (bestSellers.length === 0) return null;

  return (
    <section className="section" id="best-sellers">
      <div className="section-inner">
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', fontSize: '36px', color: '#1a1a2e', fontFamily: 'var(--font-main)', fontWeight: 700, margin: 0 }}>
            <span style={{ height: '2px', width: '60px', background: '#000', display: 'inline-block' }}></span>
            Best Sellers
            <span style={{ height: '2px', width: '60px', background: '#000', display: 'inline-block' }}></span>
          </h2>
          <p style={{ fontStyle: 'italic', color: '#7a8b9a', fontSize: '20px', fontFamily: 'var(--font-display)', marginTop: '8px' }}>Our most loved items!</p>
        </div>

        <div className="products-grid">
          {bestSellers.map(prod => {
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
                    style={isWishlisted(prod.id) ? { color: '#d32f2f' } : {}}
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
                      onClick={(e) => handleAddToCart(e, prod, prod.sizes[0] || 'OS')}
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
                          onClick={(e) => handleAddToCart(e, prod, size)}
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
          <Link to="/category/bestsellers" className="btn-primary">
            View All Best Sellers <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BestSellersSection;
