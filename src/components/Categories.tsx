import { Link, useLocation } from 'react-router-dom';

import type { Category } from '../data/categories';

const ICON_MAP: Record<string, string> = {
  'new-arrivals': 'fas fa-star',
  'new-born': 'fas fa-baby',
  'baby-boy': 'fas fa-child',
  'baby-girl': 'fas fa-child',
  'boy': 'fas fa-tshirt',
  'girl': 'fas fa-tshirt',
  'women': 'fas fa-female',
  'hadid': 'fas fa-layer-group',
  'footwear': 'fas fa-shoe-prints',
  'accessories': 'fas fa-gem',
  'trending': 'fas fa-fire',
  'sale': 'fas fa-tags',
  'bestsellers': 'fas fa-award'
};

type CategoriesProps = {
  categories?: Category[];
};

const Categories: React.FC<CategoriesProps> = ({ categories = [] }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const getPillClass = (path: string) =>
    currentPath === path ? 'cat-pill active' : 'cat-pill';

  const topLevelCategories = categories
    .filter(c => c.parentId === null && c.showInSidebar)
    .sort((a, b) => a.order - b.order)
    .map(c => ({
      path: `/category/${c.id}`,
      icon: ICON_MAP[c.id] || 'fas fa-box',
      label: c.name
    }));

  // Duplicate items so the loop is seamless
  const items = [...topLevelCategories, ...topLevelCategories, ...topLevelCategories];

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
