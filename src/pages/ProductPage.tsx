import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import type { Product } from '../data/products';
import type { CartItem } from '../types';

type ProductPageProps = {
  products: Product[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  toggleWishlist?: (product: Product) => void;
  wishlistItems?: Product[];
};

const ProductPage: React.FC<ProductPageProps> = ({ products, addToCart, toggleWishlist, wishlistItems = [] }) => {
  const { id } = useParams<{ id: string }>();
  
  // Find product from props, default to first product if not found
  const product = products.find(p => p.id === id) || products[0] || {
    id: '1',
    name: 'All in Motion Unisex Black Slip on Sneakers',
    price: 3499,
    oldPrice: 5000,
    images: ['https://hipkids.pk/cdn/shop/files/7_70d2f093-9c86-455b-91cc-c66af6241b21.jpg?v=1719572621&width=800'],
    description: 'A stylish and comfortable slip-on sneaker for kids.',
    sizes: ['24', '25', '26'],
    categories: ['footwear'],
    tags: []
  };
  
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [emblaRef] = useEmblaCarousel({ loop: true });
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Update selected size when product changes, but leave empty initially to force selection
  useEffect(() => {
    setSelectedSize('');
  }, [product.id]);

  // Scroll to top on load and set SEO
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Dynamic SEO Metadata
    const seoTitle = `${product.name} | Comfortable Kids Clothes - Zeero Kids`;
    document.title = seoTitle;
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    
    // Create a clean SEO description using product details
    const cleanDesc = product.description.replace(/<[^>]*>?/gm, '').substring(0, 120);
    metaDescription.setAttribute('content', `Buy ${product.name} at Zeero Kids. ${cleanDesc}... Shop comfortable and durable kids clothing today.`);
  }, [id, product]);

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      return; // disabled
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize || 'Standard',
      image: product.images[0]
    });
  };

  // Find related products (same category, excluding current product)
  const productCategory = product.categories?.[0] || '';
  const relatedProducts = products
    .filter(p => p.categories?.some(c => product.categories?.includes(c)) && p.id !== product.id)
    .slice(0, 4);

  // Fallback to random products if same-category is empty
  const displayRelated = relatedProducts.length > 0 
    ? relatedProducts 
    : products.filter(p => p.id !== product.id).slice(0, 4);

  const isSoldOut = product.badge === 'sold-out';
  const isAddToCartDisabled = isSoldOut || (!selectedSize && product.sizes && product.sizes.length > 0);
  const isWishlisted = wishlistItems.some(item => item.id === product.id);

  const getBadgeStyle = (badge?: string) => {
    switch(badge) {
      case 'sale': return { bg: '#ff3b30', text: 'Sale' };
      case 'best-seller': return { bg: '#d4940a', text: 'Best Seller' };
      case 'new-arrival': return { bg: 'var(--primary)', text: 'New Arrival' };
      case 'sold-out': return { bg: '#888', text: 'Sold Out' };
      default: return null;
    }
  };
  const badgeInfo = getBadgeStyle(product.badge);

  return (
    <div className="product-page" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', background: 'var(--bg-cream)', minHeight: '80vh' }}>
      
      {/* Breadcrumbs */}
      <div style={{ marginBottom: '24px', fontSize: '13px', color: 'var(--text-light)' }}>
        <Link to="/" style={{ color: 'var(--primary)', fontWeight: 500 }}>Home</Link>
        <span style={{ margin: '0 8px' }}>/</span>
        <Link to={`/category/${productCategory}`} style={{ color: 'var(--primary)', fontWeight: 500, textTransform: 'capitalize' }}>
          {productCategory.replace('-', ' ')}
        </Link>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: 'var(--dark)', fontWeight: 600 }}>{product.name}</span>
      </div>

      <div className="product-layout" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* Image Carousel */}
        <div className="product-gallery" style={{ flex: '1 1 300px', overflow: 'hidden', position: 'relative' }}>
          {badgeInfo && (
            <div style={{
              position: 'absolute', top: '16px', left: '16px', zIndex: 10,
              background: badgeInfo.bg, color: '#fff', padding: '6px 12px',
              borderRadius: '6px', fontSize: '13px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}>
              {badgeInfo.text}
            </div>
          )}
          <div className="embla" ref={emblaRef} style={{ overflow: 'hidden', borderRadius: '12px', border: '1.5px solid var(--border)' }}>
            <div className="embla__container" style={{ display: 'flex' }}>
              {product.images && product.images.map((img, index) => (
                <div className="embla__slide" key={index} style={{ flex: '0 0 100%', minWidth: 0 }}>
                  <img src={img} alt={`${product.name} ${index + 1}`} style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--text-light)', fontWeight: 500 }}>
            <i className="fas fa-arrows-alt-h"></i> Swipe to see other pictures
          </div>
        </div>

        {/* Product Info */}
        <div className="product-details" style={{ flex: '1 1 300px' }}>
          <h1 style={{ fontSize: '28px', color: 'var(--dark)', marginBottom: '16px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{product.name}</h1>
          
          <div className="price-wrap" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--primary)' }}>Rs. {product.price.toLocaleString()}</span>
            {product.oldPrice && (
              <span style={{ fontSize: '18px', textDecoration: 'line-through', color: 'var(--text-light)', fontWeight: 400 }}>
                Rs. {product.oldPrice.toLocaleString()}
              </span>
            )}
          </div>

          <div style={{ borderBottom: '1.5px solid var(--border)', paddingBottom: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--dark)', fontWeight: 700, marginBottom: '8px' }}>Description</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '14.5px', lineHeight: 1.6, margin: 0 }}>
              {product.description}
            </p>
          </div>

          {product.sizes && product.sizes.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--dark)' }}>
                  Size: <span style={{ color: 'var(--primary)' }}>{selectedSize || 'Select a size'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {product.sizes.map(size => (
                  <button 
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      padding: '10px 18px',
                      border: `2px solid ${selectedSize === size ? 'var(--primary)' : 'var(--border)'}`,
                      background: selectedSize === size ? 'var(--primary)' : 'var(--white)',
                      color: selectedSize === size ? 'var(--white)' : 'var(--dark)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: '0.2s',
                      fontSize: '13.5px'
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
              
              {/* Inline Size Chart */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <button 
                  onClick={() => setShowSizeChart(!showSizeChart)} 
                  style={{ width: '100%', padding: '12px', background: '#f8fafc', border: 'none', textAlign: 'left', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span><i className="fas fa-ruler-horizontal" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>{product.categories?.includes('footwear') ? 'Shoe Size Chart' : 'Standard Kids Size Chart'}</span>
                  <i className={`fas fa-chevron-${showSizeChart ? 'up' : 'down'}`} style={{ color: 'var(--text-light)' }}></i>
                </button>
                
                {showSizeChart && (
                  <div style={{ padding: '12px', background: '#fff' }}>
                    {product.categories?.includes('footwear') ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '8px' }}>Size</th>
                            <th style={{ padding: '8px' }}>Inner Length (cm)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { size: '17', length: '11.5' },
                            { size: '18', length: '12.0' },
                            { size: '19', length: '12.5' },
                            { size: '20', length: '13.0' },
                            { size: '21', length: '13.5' },
                            { size: '22', length: '14.0' },
                            { size: '23', length: '14.5' },
                            { size: '24', length: '15.0' },
                          ].map((s, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>{s.size}</td>
                              <td style={{ padding: '8px' }}>{s.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '8px' }}>Age/Size</th>
                            <th style={{ padding: '8px' }}>Height (cm)</th>
                            <th style={{ padding: '8px' }}>Chest (cm)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { size: '0-3 Months (NB)', height: '56-62', chest: '43' },
                            { size: '3-6 Months', height: '62-68', chest: '45' },
                            { size: '6-9 Months', height: '68-74', chest: '47' },
                            { size: '9-12 Months', height: '74-80', chest: '49' },
                            { size: '1-2 Years', height: '86-92', chest: '53' },
                            { size: '3-4 Years', height: '98-104', chest: '57' },
                            { size: '5-6 Years', height: '110-116', chest: '61' },
                            { size: '7-8 Years', height: '122-128', chest: '66' },
                          ].map((s, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>{s.size}</td>
                              <td style={{ padding: '8px' }}>{s.height}</td>
                              <td style={{ padding: '8px' }}>{s.chest}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn-block" 
              style={{ 
                flex: 1,
                padding: '16px', 
                fontSize: '16px', 
                borderRadius: '8px', 
                fontWeight: 700,
                background: isAddToCartDisabled ? '#d3d3d3' : 'var(--primary)',
                color: isAddToCartDisabled ? '#888' : '#fff',
                border: 'none',
                cursor: isAddToCartDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s'
              }}
              onClick={handleAddToCart}
              disabled={isAddToCartDisabled}
            >
              <i className="fas fa-shopping-cart"></i> {isSoldOut ? 'Sold Out' : (!selectedSize && product.sizes && product.sizes.length > 0) ? 'Please Select a Size' : 'Add to Cart'}
            </button>

            <button 
              onClick={() => toggleWishlist && toggleWishlist(product)}
              style={{ 
                padding: '16px',
                width: '56px',
                borderRadius: '8px',
                border: '1.5px solid var(--border)',
                background: isWishlisted ? '#ffebee' : '#fff',
                color: isWishlisted ? '#d32f2f' : 'var(--dark)',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s'
              }}
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <i className={`${isWishlisted ? 'fas' : 'far'} fa-heart`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {displayRelated.length > 0 && (
        <div style={{ marginTop: '80px', borderTop: '1.5px solid var(--border)', paddingTop: '60px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '28px', fontFamily: 'var(--font-display)', color: 'var(--dark)', fontWeight: 700 }}>
            You May Also Like
          </h2>
          <div className="products-grid">
            {displayRelated.map(prod => (
              <Link key={prod.id} to={`/product/${prod.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="product-card" style={{ background: 'var(--white)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={prod.images[0]} alt={prod.name} style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
                  <div style={{ padding: '16px' }}>
                    <div className="product-name" style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: '8px', color: 'var(--dark)', minHeight: '38px' }}>{prod.name}</div>
                    <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '15px' }}>Rs. {prod.price.toLocaleString()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
