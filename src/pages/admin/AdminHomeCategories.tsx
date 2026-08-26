import React, { useState } from 'react';
import type { Category } from '../../data/categories';
import { addCategory } from '../../data/categories';

type AdminHomeCategoriesProps = {
  homeCategories: string[];
  setHomeCategories: React.Dispatch<React.SetStateAction<string[]>>;
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
};

const AdminHomeCategories: React.FC<AdminHomeCategoriesProps> = ({
  homeCategories,
  setHomeCategories,
  categories,
  onCategoriesChange
}) => {
  const [selectedHomeCategories, setSelectedHomeCategories] = useState<string[]>(homeCategories);
  
  // Available categories derived dynamically from master categories list
  const availableOptions = categories.map(c => ({ id: c.id, name: c.name }));
  const [selectedCatToAdd, setSelectedCatToAdd] = useState<string>(availableOptions[0]?.id || '');

  // Keep selectedCatToAdd in sync if categories list changes
  React.useEffect(() => {
    if (availableOptions.length > 0 && !availableOptions.some(o => o.id === selectedCatToAdd)) {
      setSelectedCatToAdd(availableOptions[0].id);
    }
  }, [categories]);

  // Modal / Form state for adding custom category directly
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customId, setCustomId] = useState('');
  const [customParentId, setCustomParentId] = useState('');
  const [customShowInSidebar, setCustomShowInSidebar] = useState(true);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  const handleAddHomeCategory = () => {
    if (!selectedCatToAdd) return;
    if (!selectedHomeCategories.includes(selectedCatToAdd)) {
      setSelectedHomeCategories([...selectedHomeCategories, selectedCatToAdd]);
    } else {
      alert("This category is already added to the home page list.");
    }
  };

  const handleRemoveHomeCategory = (catId: string) => {
    setSelectedHomeCategories(selectedHomeCategories.filter(c => c !== catId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...selectedHomeCategories];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setSelectedHomeCategories(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedHomeCategories.length - 1) return;
    const updated = [...selectedHomeCategories];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setSelectedHomeCategories(updated);
  };

  const handleSaveHomeCategories = () => {
    setHomeCategories(selectedHomeCategories);
    alert('Home page categories updated successfully!');
  };

  const handleCreateCustomCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customId) {
      alert("Please provide both Category Name and Category ID (slug).");
      return;
    }

    if (categories.some(c => c.id === customId)) {
      alert("A category with this ID already exists. Please enter a unique slug.");
      return;
    }

    setIsSubmittingCustom(true);
    const newCategory: Category = {
      id: customId,
      name: customName,
      parentId: customParentId || null,
      showInSidebar: customShowInSidebar,
      order: categories.length + 1
    };

    const success = await addCategory(newCategory);
    setIsSubmittingCustom(false);

    if (success) {
      const updatedCategories = [...categories, newCategory];
      onCategoriesChange(updatedCategories);
      setSelectedCatToAdd(newCategory.id);
      
      // Optionally add directly to home categories as well
      if (!selectedHomeCategories.includes(newCategory.id)) {
        setSelectedHomeCategories(prev => [...prev, newCategory.id]);
      }

      alert(`Category "${customName}" added successfully to website!`);
      // Reset form
      setCustomName('');
      setCustomId('');
      setCustomParentId('');
      setCustomShowInSidebar(true);
      setShowAddCustomModal(false);
    } else {
      alert("Failed to create category in database.");
    }
  };

  return (
    <div style={{ background: 'var(--white)', padding: '28px', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--dark)' }}>Manage Home Page Categories</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '6px', margin: 0 }}>
            Configure the categories that appear in the "New Arrivals" section on the home page. Only valid website categories are shown below.
          </p>
        </div>
        <button
          onClick={() => setShowAddCustomModal(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}
        >
          <i className="fas fa-plus"></i> Add Custom Category
        </button>
      </div>

      {/* ADD CATEGORY TO HOME SECTION */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <select 
          value={selectedCatToAdd} 
          onChange={(e) => setSelectedCatToAdd(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', flex: 1, fontSize: '14px', outline: 'none', background: '#fff' }}
        >
          {availableOptions.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name} ({cat.id})</option>
          ))}
        </select>
        <button onClick={handleAddHomeCategory} className="btn-primary" style={{ padding: '0 22px', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}>
          Add to Home Section
        </button>
      </div>

      {/* HOME CATEGORIES LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {selectedHomeCategories.map((catId, index) => {
          const catInfo = categories.find(c => c.id === catId);
          return (
            <div key={catId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: '#fff', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)', width: '24px' }}>{index + 1}.</span>
                <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--dark)' }}>
                  {catInfo ? catInfo.name : catId}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-light)', background: '#e9ecef', padding: '3px 10px', borderRadius: '20px', fontFamily: 'monospace' }}>
                  {catId}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  style={{ background: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 10px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.4 : 1 }}
                  title="Move Up"
                >
                  <i className="fas fa-arrow-up" style={{ fontSize: '12px', color: 'var(--dark)' }}></i>
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === selectedHomeCategories.length - 1}
                  style={{ background: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 10px', cursor: index === selectedHomeCategories.length - 1 ? 'not-allowed' : 'pointer', opacity: index === selectedHomeCategories.length - 1 ? 0.4 : 1 }}
                  title="Move Down"
                >
                  <i className="fas fa-arrow-down" style={{ fontSize: '12px', color: 'var(--dark)' }}></i>
                </button>
                <button 
                  onClick={() => handleRemoveHomeCategory(catId)}
                  style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '4px', cursor: 'pointer', padding: '6px 10px' }}
                  title="Remove"
                >
                  <i className="fas fa-trash" style={{ fontSize: '12px' }}></i>
                </button>
              </div>
            </div>
          );
        })}

        {selectedHomeCategories.length === 0 && (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)', border: '2px dashed var(--border)', borderRadius: '8px', fontSize: '14px' }}>
            No home page categories selected. Select a category above and click "Add to Home Section".
          </div>
        )}
      </div>

      <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSaveHomeCategories} className="btn-primary" style={{ padding: '12px 28px', fontSize: '15px', fontWeight: 600 }}>
          Save Home Page Changes
        </button>
      </div>

      {/* CUSTOM CATEGORY MODAL */}
      {showAddCustomModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--dark)' }}>Add New Custom Category</h3>
              <button onClick={() => setShowAddCustomModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-light)' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateCustomCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px' }}>Category Name *</label>
                <input 
                  type="text" 
                  value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value);
                    setCustomId(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                  }}
                  placeholder="e.g. Kids Winter Collection"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px' }}>Category ID (Slug) *</label>
                <input 
                  type="text" 
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder="e.g. kids-winter-collection"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px' }}>Parent Category (Optional)</label>
                <select
                  value={customParentId}
                  onChange={(e) => setCustomParentId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                >
                  <option value="">-- None (Top Level) --</option>
                  {categories.filter(c => !c.parentId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input 
                  type="checkbox" 
                  id="customSidebarCheck"
                  checked={customShowInSidebar} 
                  onChange={(e) => setCustomShowInSidebar(e.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="customSidebarCheck" style={{ fontSize: '14px', color: 'var(--dark)', cursor: 'pointer' }}>Show in Website Header / Sidebar</label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" disabled={isSubmittingCustom} className="btn-primary" style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600 }}>
                  {isSubmittingCustom ? 'Creating...' : 'Create Category'}
                </button>
                <button type="button" onClick={() => setShowAddCustomModal(false)} style={{ padding: '12px 20px', background: '#e2e8f0', color: 'var(--dark)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHomeCategories;
