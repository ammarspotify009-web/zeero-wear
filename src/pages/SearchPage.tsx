import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { Product } from '../data/products';
import type { CartItem } from '../types';

type SearchPageProps = {
  products: Product[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
};

// Friendly Category name mapping for sidebar (reusing from category page)
const CATEGORY_NAMES: Record<string, string> = {
  'new-arrivals': 'New Arrivals',
  'new-born': 'Newborn Collection (0-3 Months)',
  'baby-boy': 'Baby Boy Collection (0-2 Years)',
  'baby-girl': 'Baby Girl Collection (0-2 Years)',
  'boy': 'Boys Collection (2-10 Years)',
  'girl': 'Girls Collection (2-12 Years)',
  'hadid': 'Hadid Eastern Wear',
  'footwear': 'Premium Footwear',
  'accessories': 'Kids Accessories',
  'trending': 'Trending Products',
  'sale': 'End of Season Sale',
  'bestsellers': 'Best Sellers'
};

const SearchPage: React.FC<SearchPageProps> = ({ products, addToCart }) => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const normalizedQuery = query.toLowerCase().trim();

  // Filter products by search query
  const filteredProducts = products.filter(product => {
    if (!normalizedQuery) return false;
    
    return (
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery) ||
      (product.tags && product.tags.some(t => t.toLowerCase().includes(normalizedQuery))) ||
      (product.categories && product.categories.some(c => c.toLowerCase().includes(normalizedQuery)))
    );
  });

  // Scroll to top and set dynamic SEO when search query changes
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Dynamic SEO Metadata
    const seoTitle = `Search Results for "${query}" | Zeero Kids`;
    document.title = seoTitle;
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', `Search results for ${query} at Zeero Kids. Shop comfortable and durable clothes for your little ones.`);
  }, [query]);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      size: product.sizes[0] || 'Standard',
      image: product.images[0]
    });
  };

  return (
    <div className="category-page" style={{ background: 'var(--bg-cream)', minHeight: '80vh', paddingBottom: '80px' }}>
      
      {/* Search Banner */}
      <div style={{
        background: 'var(--primary)',
        color: 'var(--white)',
        padding: '60px 24px',
        textAlign: 'center',
        marginBottom: '40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative circles */}
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }}></div>
        <div style={{ position: 'absolute', bottom: '-80px', right: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }}></div>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, marginBottom: '8px' }}>Zeero Wear Shop</div>
          {/* SEO Optimized H1 */}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, margin: '0 0 12px 0' }}>
            Search Results for "{query}"
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
            Found {filteredProducts.length} premium {filteredProducts.length === 1 ? 'item' : 'items'} for kids & babies
          </p>
        </div>
      </div>

      <div className="section-inner" style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Breadcrumbs */}
        <div style={{ marginBottom: '24px', fontSize: '13px', color: 'var(--text-light)' }}>
          <Link to="/" style={{ color: 'var(--primary)', fontWeight: 500 }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>Search</span>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--dark)', fontWeight: 600 }}>"{query}"</span>
        </div>

        {/* Main Grid Layout */}
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          
          {/* Sidebar Filters */}
          <div style={{ flex: '1 1 250px', minWidth: '240px' }}>
            <div style={{
              background: 'var(--white)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid var(--border)',
              position: 'sticky',
              top: '90px'
            }}>
              <h3 style={{ fontSize: '16px', color: 'var(--dark)', borderBottom: '1.5px solid var(--border)', paddingBottom: '12px', marginBottom: '16px', fontWeight: 700 }}>
                Categories
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                  <Link 
                    key={key} 
                    to={`/category/${key}`}
                    style={{
                      fontSize: '14px',
                      color: 'var(--text)',
                      fontWeight: 500,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'transparent',
                      transition: '0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{name.split(' (')[0]}</span>
                    <i className="fas fa-chevron-right" style={{ fontSize: '10px', opacity: 0.3 }}></i>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Product Grid Area */}
          <div style={{ flex: '3 1 700px' }}>
            {filteredProducts.length === 0 ? (
              <div style={{
                background: 'var(--white)',
                borderRadius: '12px',
                padding: '60px 24px',
                textAlign: 'center',
                border: '1px solid var(--border)'
              }}>
                <i className="fas fa-box-open" style={{ fontSize: '48px', color: 'var(--border)', marginBottom: '16px' }}></i>
                <h3 style={{ fontSize: '18px', color: 'var(--dark)', marginBottom: '8px' }}>No Products Found</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '20px' }}>
                  There are no products in this category right now. We are uploading more items soon!
                </p>
                <Link to="/" className="btn-primary" style={{ display: 'inline-block', padding: '10px 20px' }}>
                  Back to Home
                </Link>
              </div>
            ) : (
              <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {filteredProducts.map(product => (
                  <div className="product-card" key={product.id} style={{ position: 'relative' }}>
                    <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <div className="product-img-wrap">
                        <img src={product.images[0]} alt={product.name} loading="lazy" />
                        {product.badge === 'sale' || (product.badge !== 'none' && product.oldPrice && !product.badge) ? (
                          <span className="product-badge sale">Sale</span>
                        ) : product.badge === 'best-seller' ? (
                          <span className="product-badge" style={{ background: '#d4940a' }}>Best Seller</span>
                        ) : product.badge === 'new-arrival' ? (
                          <span className="product-badge">New Arrival</span>
                        ) : product.badge === 'sold-out' ? (
                          <span className="product-badge" style={{ background: '#888' }}>Sold Out</span>
                        ) : null}
                        <button className="product-wishlist" onClick={(e) => { e.preventDefault(); alert('Added to Wishlist!'); }}>
                          <i className="far fa-heart"></i>
                        </button>
                        {product.badge === 'sold-out' ? (
                          <div className="product-quick-shop" onClick={(e) => e.preventDefault()} style={{ background: '#888', cursor: 'not-allowed' }}>
                            Sold Out
                          </div>
                        ) : (
                          <div className="product-quick-shop" onClick={(e) => handleAddToCart(e, product)}>
                            Quick Add
                          </div>
                        )}
                      </div>
                      <div className="product-sizes">
                        {product.badge === 'sold-out' ? null : (
                          product.sizes.map(size => (
                            <span key={size} className="size-dot">{size}</span>
                          ))
                        )}
                      </div>
                      <div className="product-info">
                        <div className="product-name" style={{ minHeight: '38px' }}>{product.name}</div>
                        <div className="product-price">
                          Rs. {product.price.toLocaleString()}
                          {product.oldPrice && (
                            <span className="old-price" style={{ textDecoration: 'line-through', color: 'var(--text-light)', marginLeft: '8px', fontSize: '12px' }}>
                              Rs. {product.oldPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default SearchPage;
