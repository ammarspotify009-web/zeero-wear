import { Link } from 'react-router-dom';

const ShopByAge = () => {
  return (
    <section className="section" style={{ background: 'var(--bg-light)' }}>
      <div className="section-inner">
        <div className="section-header">
          <h2 className="section-title">Shop by Category</h2>
        </div>
        <div className="age-grid">
          <Link to="/category/boy" className="age-card">
            <div className="age-img-wrapper">
              <img src="/images/boys.jpeg" alt="Boys" />
            </div>
            <div className="age-card-label">Boys</div>
          </Link>
          <Link to="/category/girl" className="age-card">
            <div className="age-img-wrapper">
              <img src="/images/girls.jpeg" alt="Girls" />
            </div>
            <div className="age-card-label">Girls</div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ShopByAge;

