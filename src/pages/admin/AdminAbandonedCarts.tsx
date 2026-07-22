import React, { useState, useEffect } from 'react';
import { loadAbandonedCarts, deleteAbandonedCart, type AbandonedCart } from '../../data/abandonedCarts';

interface AdminAbandonedCartsProps {
  onCountChange?: (count: number) => void;
}

const AdminAbandonedCarts: React.FC<AdminAbandonedCartsProps> = ({ onCountChange }) => {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    setIsLoading(true);
    const data = await loadAbandonedCarts();
    setCarts(data);
    if (onCountChange) {
      onCountChange(data.length);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this abandoned cart?')) {
      const success = await deleteAbandonedCart(id);
      if (success) {
        const newCarts = carts.filter(c => c.id !== id);
        setCarts(newCarts);
        if (onCountChange) {
          onCountChange(newCarts.length);
        }
      } else {
        alert('Failed to delete abandoned cart.');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#1a2238', margin: 0, fontWeight: 700 }}>
            <i className="fas fa-shopping-basket" style={{ marginRight: '10px', color: 'var(--primary)' }}></i>
            Abandoned Carts
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '4px' }}>
            Monitor uncompleted checkouts and recover lost sales.
          </p>
        </div>
        <button onClick={fetchCarts} className="btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-sync-alt" /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <i className="fas fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)', marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Loading abandoned carts...</p>
        </div>
      ) : carts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <i className="fas fa-shopping-basket fa-3x" style={{ color: 'var(--border)', marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-light)', fontWeight: 600 }}>No Abandoned Carts</h3>
          <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>There are currently no abandoned carts.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="admin-table" style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-light)' }}>Cart ID</th>
                  <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-light)' }}>Customer Info</th>
                  <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-light)' }}>Address & City</th>
                  <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-light)' }}>Items</th>
                  <th style={{ padding: '16px', textAlign: 'right', borderBottom: '2px solid var(--border)', color: 'var(--text-light)' }}>Total</th>
                  <th style={{ padding: '16px', textAlign: 'center', borderBottom: '2px solid var(--border)', color: 'var(--text-light)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((cart) => (
                  <tr key={cart.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>{cart.id}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                        {cart.lastUpdated ? new Date(cart.lastUpdated).toLocaleString() : 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--dark)' }}>{cart.customerName || 'No Name'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px' }}>
                        {cart.customerPhone && <><i className="fas fa-phone-alt" style={{ marginRight: '4px', fontSize: '11px' }}></i> {cart.customerPhone}<br/></>}
                        {cart.customerEmail && <><i className="fas fa-envelope" style={{ marginRight: '4px', fontSize: '11px' }}></i> {cart.customerEmail}</>}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ color: 'var(--dark)', fontSize: '14px' }}>{cart.customerAddress || 'No Address'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px' }}>{cart.city || 'No City'}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--dark)' }}>
                          {cart.items?.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>
                              <span style={{ fontWeight: 600 }}>{item.quantity}x</span> {item.name} ({item.size})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <strong style={{ color: 'var(--dark)' }}>Rs. {cart.totalAmount?.toLocaleString()}</strong>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDelete(cart.id)}
                        style={{
                          background: 'rgba(255, 59, 48, 0.1)',
                          color: '#ff3b30',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 600,
                          transition: '0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)'}
                        title="Delete Abandoned Cart"
                      >
                        <i className="fas fa-trash-alt"></i> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAbandonedCarts;
