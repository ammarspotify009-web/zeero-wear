

const Hero = () => {
  return (
    <section className="hero-banner" style={{ position: 'relative', overflow: 'hidden' }}>
      <a href="#new-arrivals">
        <img 
          src="/hero-image.webp" 
          alt="Hero banner" 
          className="hero-banner-img" 
          fetchpriority="high"
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </a>
    </section>
  );
};

export default Hero;
