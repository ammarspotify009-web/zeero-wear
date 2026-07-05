import { useState } from 'react';

const reviewsData = [
  { avatar: 'N', name: 'Noor Omer', date: '06/25/2026', stars: '★★★★★', label: 'Satisfied', text: 'I ordered clothes for my daughter and every set is super amazing!', product: 'Baby Girl Mid Blue Embroidered Flower Short' },
  { avatar: 'H', name: 'Haseeb Ahmed', date: '06/23/2026', stars: '★★★★★', text: 'Amazing quality highly recommended', product: 'Baby Girl 3 Piece Set Watch Me Fly' },
  { avatar: 'K', name: 'Khalid Khan', date: '06/21/2026', stars: '★★★★★', text: 'Excellent quality', product: 'Baby Boy 4 Piece Plain Charcoal Grey Formal Suit' },
  { avatar: 'M', name: 'Maryam Shahid', date: '06/20/2026', stars: '★★★★☆', label: 'Good', text: 'Great, the stitching and fabric are really nice. Would order again!', product: 'Baby Boy White Print Shirt / Black Pant Formal Suit' },
  { avatar: 'S', name: 'Sharjeel Akhter', date: '06/07/2026', stars: '★★★★★', text: 'The suit looked great, the fabric was soft and summer friendly. The service was impeccable. Highly recommended!', product: 'Baby Boy Sea Green Waistcoat Formal Set' },
  { avatar: 'H', name: 'Hamza Ahmad', date: '06/01/2026', stars: '★★★★★', text: 'Very nice and beautiful products. Fabric is really soft.', product: 'Baby Boy 3pk Sleepsuits Explore' },
];

const Reviews = () => {
  const [showAll, setShowAll] = useState(false);
  const displayedReviews = showAll ? reviewsData : reviewsData.slice(0, 3);

  return (
    <>
      {/* TRUST BADGES */}
      <section className="trust-section">
        <div className="section-inner">
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon"><i className="fas fa-shipping-fast"></i></div>
              <h4>Free Shipping</h4>
              <p>Free shipping on all orders above PKR 3,000</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><i className="fas fa-headset"></i></div>
              <h4>Support 24/7</h4>
              <p>Contact us 24 hours a day, 7 days a week</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><i className="fas fa-undo-alt"></i></div>
              <h4>7 Days Return</h4>
              <p>Simply return it within 7 days for an exchange</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon"><i className="fas fa-lock"></i></div>
              <h4>100% Secure Payment</h4>
              <p>We ensure secure payment with PEV</p>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="section reviews-section">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-eyebrow">Customer Stories</div>
            <h2 className="section-title">Let Customers Speak For Us</h2>
          </div>

          <div className="rating-summary">
            <div className="rating-big">
              <div className="score">4.8</div>
              <div className="stars">★★★★★</div>
              <div className="count">847 reviews</div>
            </div>
            <div className="rating-bars">
              <div className="rating-bar-row">
                <span>5 ★</span>
                <div className="rating-bar-track"><div className="rating-bar-fill" style={{ width: '78%' }}></div></div>
                <span className="rating-bar-pct">78%</span>
              </div>
              <div className="rating-bar-row">
                <span>4 ★</span>
                <div className="rating-bar-track"><div className="rating-bar-fill" style={{ width: '12%' }}></div></div>
                <span className="rating-bar-pct">12%</span>
              </div>
              <div className="rating-bar-row">
                <span>3 ★</span>
                <div className="rating-bar-track"><div className="rating-bar-fill" style={{ width: '4%' }}></div></div>
                <span className="rating-bar-pct">4%</span>
              </div>
              <div className="rating-bar-row">
                <span>2 ★</span>
                <div className="rating-bar-track"><div className="rating-bar-fill" style={{ width: '2%' }}></div></div>
                <span className="rating-bar-pct">2%</span>
              </div>
              <div className="rating-bar-row">
                <span>1 ★</span>
                <div className="rating-bar-track"><div className="rating-bar-fill" style={{ width: '5%' }}></div></div>
                <span className="rating-bar-pct">5%</span>
              </div>
            </div>
          </div>

          <div className="reviews-grid">
            {displayedReviews.map((review, idx) => (
              <div className="review-card" key={idx}>
                <div className="review-header">
                  <div className="reviewer-avatar">{review.avatar}</div>
                  <div className="reviewer-info">
                    <h5>{review.name}</h5>
                    <span>{review.date}</span>
                  </div>
                </div>
                <div className="review-stars">{review.stars}</div>
                {review.label && <div className="review-label">{review.label}</div>}
                <div className="review-text">{review.text}</div>
                <div className="review-product">{review.product}</div>
              </div>
            ))}
          </div>
          
          {!showAll && (
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button 
                onClick={() => setShowAll(true)} 
                className="btn-primary" 
                style={{ padding: '12px 24px', borderRadius: '8px' }}
              >
                View All Reviews
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Reviews;
