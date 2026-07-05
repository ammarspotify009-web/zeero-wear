import { Link } from 'react-router-dom';

const ShopByAge = () => {
  return (
    <section className="section" style={{ background: 'var(--bg-light)' }}>
      <div className="section-inner">
        <div className="section-header">
          <div className="section-eyebrow">For Every Age</div>
          <h2 className="section-title">Shop By Age</h2>
        </div>
        <div className="age-grid">
          <Link to="/category/baby-boy" className="age-card">
            <div className="age-img-wrapper">
              <img src="/images/baby boy.jpeg" alt="Baby Boy" />
            </div>
            <div className="age-card-label">Baby Boy (0–2)</div>
          </Link>
          <Link to="/category/baby-girl" className="age-card">
            <div className="age-img-wrapper">
              <img src="/images/baby girl.jpeg" alt="Baby Girl" />
            </div>
            <div className="age-card-label">Baby Girl (0–2)</div>
          </Link>
          <Link to="/category/boy" className="age-card">
            <div className="age-img-wrapper">
              <img src="/images/boys.jpeg" alt="Boys" />
            </div>
            <div className="age-card-label">Boys (2–10)</div>
          </Link>
          <Link to="/category/girl" className="age-card">
            <div className="age-img-wrapper">
              <img src="/images/girls.jpeg" alt="Girls" />
            </div>
            <div className="age-card-label">Girls (2–10)</div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ShopByAge;

