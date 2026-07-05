const Brands = () => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Brand clicked!');
  };

  return (
    <section className="brands-section" id="brands">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-eyebrow">Featured Brands</div>
          <h2 className="section-title">Shop By Brand</h2>
          <p className="section-subtitle">Authentic imported brands for your little ones</p>
        </div>
        <div className="brands-grid">
          <a href="#" className="brand-chip" onClick={handleClick}>Polo Ralph Lauren</a>
          <a href="#" className="brand-chip" onClick={handleClick}>Tommy Hilfiger</a>
          <a href="#" className="brand-chip" onClick={handleClick}>C&A</a>
          <a href="#" className="brand-chip" onClick={handleClick}>Reebok</a>
          <a href="#" className="brand-chip" onClick={handleClick}>Disney</a>
          <a href="#" className="brand-chip" onClick={handleClick}>Kiabi</a>
          <a href="#" className="brand-chip" onClick={handleClick}>George</a>
          <a href="#" className="brand-chip" onClick={handleClick}>NEXT</a>
          <a href="#" className="brand-chip" onClick={handleClick}>Primark</a>
          <a href="#" className="brand-chip" onClick={handleClick}>Carter's</a>
          <a href="#" className="brand-chip" onClick={handleClick}>Toms</a>
          <a href="#" className="brand-chip" onClick={handleClick}>Hudson</a>
        </div>
      </div>
    </section>
  );
};

export default Brands;
