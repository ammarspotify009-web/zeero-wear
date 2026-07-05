export interface Category {
  id: string; // The slug, e.g. 'baby-boy'
  name: string; // Display name, e.g. 'Baby Boy Collection'
  parentId: string | null; // null if top-level
  showInSidebar: boolean;
  order: number; // for sorting
  badge?: string; // e.g. '0-2 Years'
  badgeColor?: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'new-arrivals', name: 'New Arrivals', parentId: null, showInSidebar: true, order: 1 },
  { id: 'new-born', name: 'New Born', parentId: null, showInSidebar: true, order: 2, badge: '0-3 Months', badgeColor: 'badge-teal' },
  { id: 'baby-boy', name: 'Baby Boy Collection', parentId: null, showInSidebar: true, order: 3, badge: '0-2 Years', badgeColor: 'badge-teal' },
  { id: 'rompers', name: 'Rompers', parentId: 'baby-boy', showInSidebar: true, order: 1 },
  { id: 'sets', name: 'Sets', parentId: 'baby-boy', showInSidebar: true, order: 2 },
  { id: 't-shirts', name: 'T-Shirts', parentId: 'baby-boy', showInSidebar: true, order: 3 },
  { id: 'polos', name: 'Polos', parentId: 'baby-boy', showInSidebar: true, order: 4 },
  { id: 'shirts', name: 'Shirts', parentId: 'baby-boy', showInSidebar: true, order: 5 },
  { id: 'formal-suits', name: 'Formal Suits', parentId: 'baby-boy', showInSidebar: true, order: 6 },
  
  { id: 'baby-girl', name: 'Baby Girl Collection', parentId: null, showInSidebar: true, order: 4, badge: '0-2 Years', badgeColor: 'badge-teal' },
  { id: 'boy', name: 'Boys Collection', parentId: null, showInSidebar: true, order: 5, badge: '2 - 10 Years', badgeColor: 'badge-teal' },
  { id: 'girl', name: 'Girls Collection', parentId: null, showInSidebar: true, order: 6, badge: '2 - 12 Years', badgeColor: 'badge-teal' },
  { id: 'hadid', name: 'Hadid Eastern Wear', parentId: null, showInSidebar: true, order: 7, badge: '3 - 12 Years', badgeColor: 'badge-teal' },
  { id: 'footwear', name: 'Premium Footwear', parentId: null, showInSidebar: true, order: 8 },
  
  { id: 'accessories', name: 'Kids Accessories', parentId: null, showInSidebar: true, order: 9 },
  // Let owner add custom accessories here later. E.g. 'sunglasses', 'socks'.
  { id: 'sunglasses', name: 'Sunglasses', parentId: 'accessories', showInSidebar: true, order: 1 },
  { id: 'socks', name: 'Socks', parentId: 'accessories', showInSidebar: false, order: 2 }, // Ex: owner decided not to show in sidebar
  
  { id: 'trending', name: 'Trending Products', parentId: null, showInSidebar: true, order: 10, badge: 'Hot 🔥🔥', badgeColor: 'badge-teal' },
  { id: 'sale', name: 'End of Season Sale', parentId: null, showInSidebar: true, order: 11, badge: '30% Off to 50% Off', badgeColor: 'badge-red' },
  { id: 'summer-sale', name: 'Summer Sale', parentId: 'sale', showInSidebar: true, order: 1 },
  { id: 'bestsellers', name: 'Best Sellers', parentId: null, showInSidebar: true, order: 12, badge: 'Premium Quality', badgeColor: 'badge-red' },
];

export const loadCategories = (): Category[] => {
  try {
    const stored = localStorage.getItem('zeero_categories');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load categories from local storage", e);
  }
  // If not in local storage, save the defaults and return them
  saveCategories(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
};

export const saveCategories = (categories: Category[]) => {
  try {
    localStorage.setItem('zeero_categories', JSON.stringify(categories));
  } catch (e) {
    console.error("Failed to save categories to local storage", e);
  }
};

export const addCategory = (category: Category) => {
  const current = loadCategories();
  saveCategories([...current, category]);
};

export const updateCategory = (updated: Category) => {
  const current = loadCategories();
  saveCategories(current.map(c => c.id === updated.id ? updated : c));
};

export const deleteCategory = (id: string) => {
  const current = loadCategories();
  saveCategories(current.filter(c => c.id !== id));
};
