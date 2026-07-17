import { useState, useEffect } from 'react';

const Hero = () => {
  const images = [
    "/hero-image.jpeg",
    "/hero pic 2.jpeg",
    "/hero3.jpeg"
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="hero-banner" style={{ position: 'relative', overflow: 'hidden' }}>
      <a href="#new-arrivals">
        {images.map((src, index) => (
          <img 
            key={src}
            src={src} 
            alt={`Hero banner ${index + 1}`} 
            className="hero-banner-img" 
            style={{ 
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              position: index === 0 ? 'relative' : 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ))}
      </a>
      
      {/* Slider indicators */}
      <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              border: 'none',
              background: currentSlide === index ? 'var(--primary, #000)' : 'rgba(0,0,0,0.3)',
              cursor: 'pointer',
              padding: 0
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
