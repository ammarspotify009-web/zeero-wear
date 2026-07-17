import React, { useState } from 'react';

type AdminHomeCategoriesProps = {
  homeCategories: string[];
  setHomeCategories: React.Dispatch<React.SetStateAction<string[]>>;
};

const AVAILABLE_CATEGORIES = [
  { id: 'boy', name: 'Boys' },
  { id: 'girl', name: 'Girls' },
  { id: 'women', name: 'Women (Suits)' },
  { id: 'footwear', name: 'Shoes' },
  { id: 'accessories', name: 'Accessories' },
  { id: 'hadid', name: 'Eastern Wear' },
  { id: 'new-born', name: 'Newborn' },
  { id: 'baby-boy', name: 'Baby Boy' },
  { id: 'baby-girl', name: 'Baby Girl' },
  { id: 'rompers', name: 'Rompers' }
];

const AdminHomeCategories: React.FC<AdminHomeCategoriesProps> = ({ homeCategories, setHomeCategories }) => {
  const [categories, setCategories] = useState<string[]>(homeCategories);
  const [newCat, setNewCat] = useState(AVAILABLE_CATEGORIES[0].id);

  const handleAdd = () => {
    if (!categories.includes(newCat)) {
      setCategories([...categories, newCat]);
    }
  };

  const handleRemove = (catId: string) => {
    setCategories(categories.filter(c => c !== catId));
  };

  const handleSave = () => {
    setHomeCategories(categories);
    alert('Home categories updated successfully!');
  };

  return (
    <div style={{ background: 'var(--white)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Manage Home Page Categories</h2>
      
      <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '24px' }}>
        Configure the categories that appear in the "New Arrivals" section on the home page. They will appear exactly in the order you specify here.
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <select 
          value={newCat} 
          onChange={(e) => setNewCat(e.target.value)}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', flex: 1 }}
        >
          {AVAILABLE_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name} ({cat.id})</option>
          ))}
        </select>
        <button onClick={handleAdd} className="btn-primary" style={{ padding: '0 20px', borderRadius: '6px' }}>
          Add Category
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {categories.map((cat, index) => {
          const catInfo = AVAILABLE_CATEGORIES.find(c => c.id === cat);
          return (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8f9fa', border: '1px solid var(--border)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-light)' }}>{index + 1}.</span>
                <span style={{ fontWeight: 500 }}>{catInfo ? catInfo.name : cat}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-light)', background: '#e9ecef', padding: '2px 8px', borderRadius: '4px' }}>{cat}</span>
              </div>
              <button 
                onClick={() => handleRemove(cat)}
                style={{ background: 'none', border: 'none', color: 'var(--error, #dc3545)', cursor: 'pointer', padding: '4px' }}
                title="Remove"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          );
        })}
        {categories.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)', border: '1px dashed var(--border)', borderRadius: '6px' }}>
            No categories selected.
          </div>
        )}
      </div>

      <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} className="btn-primary">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default AdminHomeCategories;
