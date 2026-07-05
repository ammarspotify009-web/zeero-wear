import { Link, useLocation } from 'react-router-dom';

const categories = [
  { path: '/category/new-born',    icon: 'fas fa-baby',        label: 'Newborn' },
  { path: '/category/baby-boy',    icon: 'fas fa-child',       label: 'Baby Boy' },
  { path: '/category/baby-girl',   icon: 'fas fa-child',       label: 'Baby Girl' },
  { path: '/category/boy',         icon: 'fas fa-tshirt',      label: 'Boys 2–10' },
  { path: '/category/girl',        icon: 'fas fa-tshirt',      label: 'Girls 2–10' },
  { path: '/category/hadid',       icon: 'fas fa-layer-group', label: 'Eastern Wear' },
  { path: '/category/footwear',    icon: 'fas fa-shoe-prints', label: 'Footwear' },
  { path: '/category/accessories', icon: 'fas fa-gem',         label: 'Accessories' },
];

const Categories = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const getPillClass = (path: string) =>
    currentPath === path ? 'cat-pill active' : 'cat-pill';

  // Duplicate items so the loop is seamless
  const items = [...categories, ...categories, ...categories];

  return (
    <div className="categories-strip">
      <div className="categories-marquee-outer">
        <div className="categories-marquee-track">
          {items.map((cat, i) => (
            <Link
              key={i}
              to={cat.path}
              className={getPillClass(cat.path)}
            >
              <i className={cat.icon}></i> {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
