import React, { useState } from 'react';
import type { Category } from '../../data/categories';
import { addCategory, updateCategory, deleteCategory } from '../../data/categories';

type AdminCategoriesProps = {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
};

const AdminCategories: React.FC<AdminCategoriesProps> = ({ categories, onCategoriesChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [showInSidebar, setShowInSidebar] = useState(true);
  const [order, setOrder] = useState<number>(0);
  const [badge, setBadge] = useState('');
  const [badgeColor, setBadgeColor] = useState('badge-teal');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name) {
      alert("Category ID (slug) and Name are required.");
      return;
    }

    const newCategory: Category = {
      id,
      name,
      parentId: parentId || null,
      showInSidebar,
      order,
      badge: badge || undefined,
      badgeColor: badge ? badgeColor : undefined
    };

    setIsSaving(true);
    let success = false;
    let updatedCategories: Category[];

    if (editingId) {
      success = await updateCategory(newCategory);
      updatedCategories = categories.map(c => c.id === newCategory.id ? newCategory : c);
      if (success) alert(`Category "${name}" updated successfully!`);
      else alert(`Failed to update category. Please try again.`);
    } else {
      if (categories.some(c => c.id === id)) {
        alert("A category with this ID already exists. Please choose a unique slug.");
        setIsSaving(false);
        return;
      }
      success = await addCategory(newCategory);
      updatedCategories = [...categories, newCategory];
      if (success) alert(`Category "${name}" added successfully!`);
      else alert(`Failed to add category. Please try again.`);
    }

    setIsSaving(false);
    if (success) {
      onCategoriesChange(updatedCategories);
      resetForm();
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setId(category.id);
    setName(category.name);
    setParentId(category.parentId || '');
    setShowInSidebar(category.showInSidebar);
    setOrder(category.order);
    setBadge(category.badge || '');
    setBadgeColor(category.badgeColor || 'badge-teal');
  };

  const handleDelete = async (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category? Sub-categories and products assigned to this category might be affected.")) {
      const success = await deleteCategory(categoryId);
      if (success) {
        onCategoriesChange(categories.filter(c => c.id !== categoryId));
      } else {
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setId('');
    setName('');
    setParentId('');
    setShowInSidebar(true);
    setOrder(0);
    setBadge('');
    setBadgeColor('badge-teal');
  };

  // Group by parent for display
  const topLevelCategories = categories.filter(c => !c.parentId).sort((a, b) => a.order - b.order);

  return (
    <div className="admin-categories-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#1a2238', margin: 0, fontWeight: 700 }}>Manage Categories</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '4px' }}>Add, edit, or delete categories and sub-categories.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* FORM SECTION */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '18px', color: '#1a2238', margin: '0 0 20px', fontWeight: 700 }}>
            {editingId ? 'Edit Category' : 'Add New Category'}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px' }}>Category Name *</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingId) {
                    setId(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                  }
                }}
                required 
                placeholder="e.g., Summer Sale" 
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px' }}>Category ID (Slug) *</label>
              <input 
                type="text" 
                value={id} 
                onChange={(e) => setId(e.target.value)} 
                required 
                disabled={!!editingId}
                placeholder="e.g., summer-sale" 
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', background: editingId ? '#f4f6fa' : '#fff' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px' }}>Parent Category (Optional)</label>
              <select 
                value={parentId} 
                onChange={(e) => setParentId(e.target.value)} 
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
              >
                <option value="">-- None (Top Level) --</option>
                {topLevelCategories.map(c => (
                  <option key={c.id} value={c.id} disabled={c.id === id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <input 
                type="checkbox" 
                id="showSidebar" 
                checked={showInSidebar} 
                onChange={(e) => setShowInSidebar(e.target.checked)} 
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="showSidebar" style={{ fontSize: '14px', color: 'var(--dark)', cursor: 'pointer' }}>Show in Website Sidebar</label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px' }}>Sort Order</label>
                <input 
                  type="number" 
                  value={order} 
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px' }}>Badge Text (Optional)</label>
                <input 
                  type="text" 
                  value={badge} 
                  onChange={(e) => setBadge(e.target.value)} 
                  placeholder="e.g., 0-2 Years"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} 
                />
              </div>
            </div>
            
            {badge && (
               <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px' }}>Badge Color</label>
                  <select 
                    value={badgeColor} 
                    onChange={(e) => setBadgeColor(e.target.value)} 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                  >
                    <option value="badge-teal">Teal</option>
                    <option value="badge-red">Red</option>
                  </select>
               </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="submit" className="btn-primary" disabled={isSaving} style={{ flex: 1, padding: '12px', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? 'Saving...' : (editingId ? 'Save Changes' : 'Add Category')}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={{ padding: '12px', background: '#e2e8f0', color: 'var(--dark)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LIST SECTION */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', color: '#1a2238', margin: '0 0 20px', fontWeight: 700 }}>Existing Categories</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topLevelCategories.map(parent => (
              <div key={parent.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Parent Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--dark)' }}>{parent.name}</span>
                    {!parent.showInSidebar && <span style={{ fontSize: '11px', background: '#ff3b30', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>Hidden</span>}
                    {parent.badge && <span style={{ fontSize: '11px', background: parent.badgeColor === 'badge-red' ? '#ff3b30' : '#4ade80', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>{parent.badge}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(parent)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px' }}><i className="far fa-edit"></i></button>
                    <button onClick={() => handleDelete(parent.id)} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: '14px' }}><i className="far fa-trash-alt"></i></button>
                  </div>
                </div>

                {/* Children Rows */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {categories.filter(c => c.parentId === parent.id).sort((a, b) => a.order - b.order).map(child => (
                    <div key={child.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px 10px 40px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>↳ {child.name}</span>
                        {!child.showInSidebar && <span style={{ fontSize: '11px', background: '#ff3b30', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>Hidden</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEdit(child)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px' }}><i className="far fa-edit"></i></button>
                        <button onClick={() => handleDelete(child.id)} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: '14px' }}><i className="far fa-trash-alt"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
