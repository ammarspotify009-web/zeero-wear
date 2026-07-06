import React, { useState, useCallback } from 'react';
import type { Product } from '../../data/products';
import { loadOrders, updateOrderStatus, updateOrderDetails, bulkUpdateOrderStatus, deleteOrder, type Order, type OrderEditFields } from '../../data/orders';
import { loadSizes, addSizeToDb, deleteSizeFromDb } from '../../data/sizes';
import { loadQueries, updateQueryStatus, type Query } from '../../data/queries';
import { uploadImageToB2 } from '../../lib/b2Upload';
import AdminCategories from './AdminCategories';
import type { Category } from '../../data/categories';

type AdminDashboardProps = {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onEditProduct: (product: Product) => void;
  onCategoriesChange: (categories: Category[]) => void;
};

type TabType = 'overview' | 'products' | 'add-product' | 'categories' | 'orders' | 'queries';
type OrderFilter = 'All' | 'Pending' | 'Approved' | 'Cancelled';



const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, categories, onAddProduct, onDeleteProduct, onEditProduct, onCategoriesChange }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Add/Edit Product Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState(['', '', '']);
  const [imagePreviews, setImagePreviews] = useState<string[]>(['', '', '']);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState('');
  const [availableSizes, setAvailableSizes] = useState<string[]>(['NB', '0-3M', '3-6M', '6-9M', '1Y', '2Y', '3-4Y', '5-6Y', '7-8Y', '17', '18', '20', '32', '33', '34']);
  const [badge, setBadge] = useState<Product['badge']>('none');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  // B2 Upload State
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<('idle' | 'uploading' | 'done' | 'error')[]>(['idle', 'idle', 'idle']);



  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null); // stores orderId being acted on
  const [orderActionMsg, setOrderActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('All');
  const [orderDateFilter, setOrderDateFilter] = useState<string>(''); // For calendar filter
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]); // For bulk actions
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<OrderEditFields>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    city: '',
    totalAmount: 0
  });

  const [queries, setQueries] = useState<Query[]>([]);
  const [timePeriod, setTimePeriod] = useState<'7days' | '30days' | 'all'>('30days');

  // ─── Load orders from Supabase ───
  const refreshOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const data = await loadOrders();
      setOrders(data);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Load async data on mount
  React.useEffect(() => {
    loadQueries().then(data => setQueries(data));
    refreshOrders();
    loadSizes().then(data => {
      if (data.length > 0) setAvailableSizes(data);
    });
  }, [refreshOrders]);

  // Time filter logic
  const now = new Date();
  const getFilteredOrders = () => {
    if (timePeriod === 'all') return orders;
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - (timePeriod === '7days' ? 7 : 30));
    return orders.filter(o => new Date(o.orderDate) >= cutoffDate);
  };
  
  const periodOrders = getFilteredOrders();

  // Calculate overview statistics from real orders (filtered by timePeriod)
  const totalRevenue = periodOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = periodOrders.length;
  const pendingOrders = periodOrders.filter(o => o.status === 'Pending').length;
  const approvedOrders = periodOrders.filter(o => o.status === 'Approved').length;
  const cancelledOrders = periodOrders.filter(o => o.status === 'Cancelled').length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / periodOrders.filter(o => o.status !== 'Cancelled').length) : 0;

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer Name', 'City', 'Product', 'Qty', 'Total Amount', 'Status'];
    const rows = periodOrders.map(o => [
      o.id,
      o.orderDate,
      o.customerName,
      o.city,
      `"${o.items.map(i => i.name).join(' | ')}"`,
      o.items.reduce((sum, i) => sum + i.quantity, 0).toString(),
      o.totalAmount.toString(),
      o.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_report_${timePeriod}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Today's Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysOrdersList = orders.filter(o => o.orderDate === todayStr);
  const todaysTotalOrders = todaysOrdersList.length;
  const todaysPending = todaysOrdersList.filter(o => o.status === 'Pending').length;
  const todaysSale = todaysOrdersList.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalAmount, 0);
  const todaysComplete = todaysOrdersList.filter(o => o.status === 'Approved').length;

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchesStatus = orderFilter === 'All' || o.status === orderFilter;
    const matchesDate = !orderDateFilter || o.orderDate === orderDateFilter;
    return matchesStatus && matchesDate;
  });

  const handleAddImageField = (index: number, val: string) => {
    const newImages = [...images];
    newImages[index] = val;
    setImages(newImages);
  };

  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) {
                // Drop quality by 30% means setting quality to 0.7
                const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpeg", {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(optimizedFile);
              } else {
                resolve(file); // fallback to original if blob fails
              }
            }, 'image/jpeg', 0.7);
          } else {
            resolve(file);
          }
        };
      };
    });
  };

  const handleFileUpload = async (index: number, file: File | null) => {
    if (!file) return;
    
    // Optimize the image before saving
    const optimizedFile = await optimizeImage(file);
    
    // Store the optimized File reference for B2 upload later
    const newFiles = [...imageFiles];
    newFiles[index] = optimizedFile;
    setImageFiles(newFiles);
    
    // Generate local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const newImages = [...images];
      newImages[index] = base64;
      setImages(newImages);
      const newPreviews = [...imagePreviews];
      newPreviews[index] = base64;
      setImagePreviews(newPreviews);
    };
    reader.readAsDataURL(optimizedFile);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = '';
    setImages(newImages);
    const newPreviews = [...imagePreviews];
    newPreviews[index] = '';
    setImagePreviews(newPreviews);
    const newFiles = [...imageFiles];
    newFiles[index] = null;
    setImageFiles(newFiles);
    const newProgress = [...uploadProgress];
    newProgress[index] = 'idle';
    setUploadProgress(newProgress);
  };

  const handleToggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter(s => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const handleAddCustomSize = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSize = sizeInput.trim();
    if (trimmedSize) {
      const success = await addSizeToDb(trimmedSize);
      if (success) {
        if (!availableSizes.includes(trimmedSize)) {
          setAvailableSizes([...availableSizes, trimmedSize]);
        }
        if (!selectedSizes.includes(trimmedSize)) {
          setSelectedSizes([...selectedSizes, trimmedSize]);
        }
        setSizeInput('');
      } else {
        alert("Failed to add size to database.");
      }
    }
  };

  const handleDeleteSizeOption = async (sizeToDelete: string) => {
    if (confirm(`Are you sure you want to permanently delete size "${sizeToDelete}" from the database?`)) {
      const success = await deleteSizeFromDb(sizeToDelete);
      if (success) {
        setAvailableSizes(prev => prev.filter(sz => sz !== sizeToDelete));
        setSelectedSizes(prev => prev.filter(sz => sz !== sizeToDelete));
      } else {
        alert("Failed to delete size from database.");
      }
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !description || !images[0]) {
      alert("Please fill in the Product Name, Price, Description and at least 1 Product Image!");
      return;
    }

    // Check if we have file uploads that need to go to B2
    const hasFileUploads = imageFiles.some(f => f !== null);
    let finalImageUrls: string[] = [];

    if (hasFileUploads) {
      setIsUploading(true);
      const newProgress: ('idle' | 'uploading' | 'done' | 'error')[] = ['idle', 'idle', 'idle'];

      for (let i = 0; i < 3; i++) {
        const file = imageFiles[i];
        if (!file) {
          // If no file but there's a URL (from URL mode), keep it
          if (images[i] && !images[i].startsWith('data:')) {
            finalImageUrls.push(images[i]);
          }
          continue;
        }

        newProgress[i] = 'uploading';
        setUploadProgress([...newProgress]);

        const result = await uploadImageToB2(file);
        if (result.success && result.url) {
          finalImageUrls.push(result.url);
          newProgress[i] = 'done';
        } else {
          newProgress[i] = 'error';
          setUploadProgress([...newProgress]);
          setIsUploading(false);
          alert(`Failed to upload image ${i + 1}: ${result.error}\n\nPlease check your B2 credentials and bucket CORS settings.`);
          return;
        }
        setUploadProgress([...newProgress]);
      }
      setIsUploading(false);
    } else {
      // URL mode — use the raw URLs directly
      finalImageUrls = images.filter(img => img.trim() !== '' && !img.startsWith('data:'));
    }

    if (finalImageUrls.length === 0) {
      alert('No valid images to upload. Please add at least 1 image.');
      return;
    }

    const parsedOldPrice = oldPrice ? parseFloat(oldPrice) : undefined;
    const autoTags: string[] = ['new-arrivals'];
    if (parsedOldPrice && parsedOldPrice > parseFloat(price)) {
      autoTags.push('sale');
    }

    const newProduct: Product = {
      id: 'p-' + Date.now(),
      name,
      price: parseFloat(price),
      oldPrice: parsedOldPrice,
      images: finalImageUrls,
      description,
      sizes: selectedSizes,
      categories: selectedCategories,
      tags: autoTags,
      badge
    };

    if (editingProductId) {
      onEditProduct({ ...newProduct, id: editingProductId });
      alert(`Product "${name}" was updated successfully!`);
    } else {
      onAddProduct(newProduct);
      alert(`Product "${name}" was uploaded successfully to Backblaze B2 and is now LIVE!`);
    }
    
    // Reset Form
    setEditingProductId(null);
    setName('');
    setPrice('');
    setOldPrice('');
    setDescription('');
    setImages(['', '', '']);
    setImagePreviews(['', '', '']);
    setImageFiles([null, null, null]);
    setUploadProgress(['idle', 'idle', 'idle']);
    setSelectedSizes([]);
    loadSizes().then(data => {
      if (data.length > 0) setAvailableSizes(data);
    });
    setBadge('none');
    
    // Switch to products tab to view
    setActiveTab('products');
  };



  // ─── ORDER HANDLERS ───
  const handleToggleOrderSelection = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
    );
  };

  const handleSelectAllOrders = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]); // Deselect all if all are selected
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id)); // Select all currently filtered
    }
  };

  const handleBulkApprove = async () => {
    if (!selectedOrderIds.length) return;
    const pendingIds = orders.filter(o => selectedOrderIds.includes(o.id) && o.status === 'Pending').map(o => o.id);
    if (!pendingIds.length) {
      showOrderMsg('error', 'No pending orders selected to approve.');
      return;
    }
    setOrderActionLoading('bulk-approve');
    const success = await bulkUpdateOrderStatus(pendingIds, 'Approved');
    if (success) {
      showOrderMsg('success', `${pendingIds.length} orders approved!`);
      setSelectedOrderIds([]);
      refreshOrders();
    } else {
      showOrderMsg('error', 'Failed to bulk approve orders.');
    }
    setOrderActionLoading(null);
  };

  const handleDownloadCSV = () => {
    if (!selectedOrderIds.length) return;
    
    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'City', 'Address', 'Status', 'Product Details', 'Subtotal', 'Delivery Fee', 'Total Amount', 'Notes'];
    
    const rows = selectedOrders.map(o => {
      const productDetails = o.items.map(item => `${item.name} (${item.size}) x${item.quantity}`).join(' | ');
      return [
        o.id,
        o.orderDate,
        `"${o.customerName}"`,
        `'${o.customerPhone}`, // Add quote to prevent Excel from treating it as a number
        `"${o.city}"`,
        `"${o.customerAddress}"`,
        o.status,
        `"${productDetails}"`,
        o.subtotal,
        o.deliveryFee,
        o.totalAmount,
        `"${o.notes || ''}"`
      ];
    });
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `selected_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showOrderMsg = (type: 'success' | 'error', text: string) => {
    setOrderActionMsg({ type, text });
    setTimeout(() => setOrderActionMsg(null), 3500);
  };

  const handleApproveOrder = async (orderId: string) => {
    const orderToApprove = orders.find(o => o.id === orderId);
    if (!orderToApprove) return;

    setOrderActionLoading(orderId);

    // Optimistic UI
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Approved' as const } : o));

    const ok = await updateOrderStatus(orderId, 'Approved');
    setOrderActionLoading(null);

    if (ok) {
      showOrderMsg('success', `Order ${orderId} approved successfully.`);
      // Send confirmation email if customer provided one
      if (orderToApprove.customerEmail && orderToApprove.customerEmail.trim() !== '') {
        fetch('/api/admin/approve-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: orderToApprove }),
        }).catch(err => console.error('Failed to send confirmation email', err));
      }
    } else {
      // Revert optimistic update on failure
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: orderToApprove.status } : o));
      showOrderMsg('error', `Failed to approve order ${orderId}. Please try again.`);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    const orderToCancel = orders.find(o => o.id === orderId);
    if (!orderToCancel) return;

    setOrderActionLoading(orderId);

    // Optimistic UI
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' as const } : o));

    const ok = await updateOrderStatus(orderId, 'Cancelled');
    setOrderActionLoading(null);

    if (ok) {
      showOrderMsg('success', `Order ${orderId} cancelled.`);
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: orderToCancel.status } : o));
      showOrderMsg('error', `Failed to cancel order ${orderId}. Please try again.`);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('WARNING: Are you sure you want to completely DELETE this order? This cannot be undone.')) return;

    setOrderActionLoading(orderId);

    // Optimistic UI
    const previousOrders = [...orders];
    setOrders(prev => prev.filter(o => o.id !== orderId));

    const ok = await deleteOrder(orderId);
    setOrderActionLoading(null);

    if (ok) {
      showOrderMsg('success', `Order ${orderId} deleted permanently.`);
    } else {
      setOrders(previousOrders);
      showOrderMsg('error', `Failed to delete order ${orderId}. Please try again.`);
    }
  };

  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: order.customerAddress,
      city: order.city,
      totalAmount: order.totalAmount
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setEditSaving(true);
    const ok = await updateOrderDetails(editingOrder.id, editForm);
    setEditSaving(false);

    if (ok) {
      setOrders(prev => prev.map(o =>
        o.id === editingOrder.id ? { ...o, ...editForm } : o
      ));
      setEditingOrder(null);
      showOrderMsg('success', `Order ${editingOrder.id} updated successfully.`);
    } else {
      alert('Failed to save changes to Supabase. Please try again.');
    }
  };

  const handleMarkQueryResolved = async (queryId: string) => {
    const updated = queries.map(q => q.id === queryId ? { ...q, status: 'Resolved' as const } : q);
    setQueries(updated);
    await updateQueryStatus(queryId, 'Resolved');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return { bg: 'rgba(240, 168, 50, 0.15)', color: '#d4940a', text: '⏳ Pending' };
      case 'Approved': return { bg: 'rgba(123, 171, 139, 0.2)', color: 'var(--success)', text: '✅ Approved' };
      case 'Cancelled': return { bg: 'rgba(255, 59, 48, 0.12)', color: '#ff3b30', text: '❌ Cancelled' };
      default: return { bg: '#e2e8f0', color: '#718096', text: status };
    }
  };

  return (
    <div className="admin-dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: '#f4f6fa' }}>
      
      {/* Mobile Sidebar Overlay */}
      <div className={`admin-drawer-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* SIDEBAR */}
      <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ width: '260px', background: '#1a2238', color: '#fff', padding: '24px 0', flexShrink: 0, overflowY: 'auto' }}>
        <button className="admin-sidebar-close" onClick={() => setIsSidebarOpen(false)}>
          <i className="fas fa-times"></i>
        </button>
        <div style={{ padding: '0 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-user-shield"></i> Zeero Admin
          </h2>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', display: 'block' }}>Store Controller</span>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button 
            onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
            style={{
              background: activeTab === 'overview' ? 'var(--primary)' : 'transparent',
              color: '#fff', border: 'none', padding: '14px 24px', textAlign: 'left', cursor: 'pointer', fontSize: '14.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', width: '100%', transition: '0.2s'
            }}
          >
            <i className="fas fa-chart-line" style={{ width: '20px' }}></i> Overview
          </button>
          
          <button 
            onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
            style={{
              background: activeTab === 'orders' ? 'var(--primary)' : 'transparent',
              color: '#fff', border: 'none', padding: '14px 24px', textAlign: 'left', cursor: 'pointer', fontSize: '14.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', width: '100%', transition: '0.2s'
            }}
          >
            <i className="fas fa-shopping-cart" style={{ width: '20px' }}></i> Orders
            {pendingOrders > 0 && (
              <span style={{
                background: '#ff3b30',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '50px',
                marginLeft: 'auto',
                minWidth: '22px',
                textAlign: 'center',
                animation: 'pulse 2s infinite'
              }}>{pendingOrders}</span>
            )}
          </button>

          <button 
            onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}
            style={{
              background: activeTab === 'products' ? 'var(--primary)' : 'transparent',
              color: '#fff', border: 'none', padding: '14px 24px', textAlign: 'left', cursor: 'pointer', fontSize: '14.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', width: '100%', transition: '0.2s'
            }}
          >
            <i className="fas fa-boxes" style={{ width: '20px' }}></i> Products List ({products.length})
          </button>

          <button 
            onClick={() => { setActiveTab('categories'); setIsSidebarOpen(false); }}
            style={{
              background: activeTab === 'categories' ? 'var(--primary)' : 'transparent',
              color: '#fff', border: 'none', padding: '14px 24px', textAlign: 'left', cursor: 'pointer', fontSize: '14.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', width: '100%', transition: '0.2s'
            }}
          >
            <i className="fas fa-tags" style={{ width: '20px' }}></i> Categories
          </button>

          <button 
            onClick={() => {
              setEditingProductId(null);
              setName('');
              setPrice('');
              setOldPrice('');
              setDescription('');
              setSelectedCategories([]);
              setSelectedSizes([]);
              setImages(['', '', '']);
              setImagePreviews(['', '', '']);
              setImageFiles([null, null, null]);
              setActiveTab('add-product');
              setIsSidebarOpen(false);
            }}
            style={{
              background: activeTab === 'add-product' ? 'var(--primary)' : 'transparent',
              color: '#fff', border: 'none', padding: '14px 24px', textAlign: 'left', cursor: 'pointer', fontSize: '14.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', width: '100%', transition: '0.2s'
            }}
          >
            <i className="fas fa-plus-circle" style={{ width: '20px' }}></i> Upload Product
          </button>

          <button 
            onClick={() => { setActiveTab('queries'); setIsSidebarOpen(false); }}
            style={{
              background: activeTab === 'queries' ? 'var(--primary)' : 'transparent',
              color: '#fff', border: 'none', padding: '14px 24px', textAlign: 'left', cursor: 'pointer', fontSize: '14.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', width: '100%', transition: '0.2s'
            }}
          >
            <i className="fas fa-envelope" style={{ width: '20px' }}></i> Customer Queries
            {queries.filter(q => q.status === 'Unread').length > 0 && (
              <span style={{
                background: '#ff3b30', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '50px', marginLeft: 'auto'
              }}>{queries.filter(q => q.status === 'Unread').length}</span>
            )}
          </button>

          <div style={{ flex: 1 }}></div>

          <button 
            onClick={() => {
              localStorage.removeItem('adminToken');
              window.location.href = '/admin-login';
            }}
            style={{
              background: 'rgba(255,59,48,0.15)',
              color: '#ff3b30', border: 'none', padding: '14px 24px', textAlign: 'left', cursor: 'pointer', fontSize: '14.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <i className="fas fa-sign-out-alt" style={{ width: '20px' }}></i> Logout
          </button>

        </nav>
      </div>

      {/* MAIN VIEW */}
      <div className="admin-main-content" style={{ flex: 1, padding: '40px 30px', overflowY: 'auto' }}>
        
        {/* Mobile Header */}
        <div className="admin-mobile-header">
          <button className="admin-hamburger" onClick={() => setIsSidebarOpen(true)}>
            <i className="fas fa-bars"></i>
          </button>
          <h2>Zeero Admin</h2>
        </div>
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '26px', color: '#1a2238', margin: 0, fontWeight: 700 }}>Dashboard Overview</h1>
                <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '4px' }}>Real-time business sales & activity trackers.</p>
              </div>
              <div style={{ background: '#fff', border: '1px solid var(--border)', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--dark)' }}>
                <i className="far fa-calendar-alt"></i> Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {/* TODAY'S SUMMARY CARDS */}
            <h3 style={{ fontSize: '18px', color: '#1a2238', marginBottom: '16px', fontWeight: 700 }}>Today's Performance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', borderTop: '4px solid var(--primary)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Today's Orders</div>
                <h2 style={{ fontSize: '28px', color: 'var(--dark)', margin: 0, fontWeight: 700 }}>{todaysTotalOrders}</h2>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', borderTop: '4px solid #d4940a', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Today's Pending</div>
                <h2 style={{ fontSize: '28px', color: 'var(--dark)', margin: 0, fontWeight: 700 }}>{todaysPending}</h2>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', borderTop: '4px solid var(--success)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Today's Complete</div>
                <h2 style={{ fontSize: '28px', color: 'var(--dark)', margin: 0, fontWeight: 700 }}>{todaysComplete}</h2>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', borderTop: '4px solid var(--accent)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Today's Sale</div>
                <h2 style={{ fontSize: '28px', color: 'var(--dark)', margin: 0, fontWeight: 700 }}>PKR {todaysSale.toLocaleString()}</h2>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '18px', color: '#1a2238', margin: 0, fontWeight: 700 }}>Overall Statistics</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select 
                  value={timePeriod} 
                  onChange={(e) => setTimePeriod(e.target.value as '7days' | '30days' | 'all')}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', outline: 'none' }}
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="all">All Time</option>
                </select>
                <button onClick={handleExportCSV} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-file-excel"></i> Export CSV
                </button>
              </div>
            </div>
            {/* STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase' }}>Gross Revenue</span>
                  <div style={{ background: 'rgba(123, 171, 139, 0.15)', color: 'var(--success)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <i className="fas fa-coins" style={{ margin: 'auto' }}></i>
                  </div>
                </div>
                <h2 style={{ fontSize: '26px', color: 'var(--dark)', margin: 0, fontWeight: 700 }}>PKR {totalRevenue.toLocaleString()}</h2>
                <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '8px', fontWeight: 600 }}>
                  <i className="fas fa-arrow-up"></i> +12.4% vs last week
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase' }}>Total Orders</span>
                  <div style={{ background: 'rgba(44, 62, 107, 0.1)', color: 'var(--primary)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <i className="fas fa-shopping-bag" style={{ margin: 'auto' }}></i>
                  </div>
                </div>
                <h2 style={{ fontSize: '26px', color: 'var(--dark)', margin: 0, fontWeight: 700 }}>{totalOrders}</h2>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px' }}>
                  <span style={{ color: '#d4940a', fontWeight: 600 }}>{pendingOrders} Pending</span> · <span style={{ color: 'var(--success)', fontWeight: 600 }}>{approvedOrders} Approved</span> · <span style={{ color: '#ff3b30', fontWeight: 600 }}>{cancelledOrders} Cancelled</span>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase' }}>Avg Order Value</span>
                  <div style={{ background: 'rgba(240, 168, 50, 0.15)', color: 'var(--accent)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <i className="fas fa-calculator" style={{ margin: 'auto' }}></i>
                  </div>
                </div>
                <h2 style={{ fontSize: '26px', color: 'var(--dark)', margin: 0, fontWeight: 700 }}>PKR {averageOrderValue.toLocaleString()}</h2>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px' }}>
                  Stable conversion trend
                </div>
              </div>

              <div className="overview-pending-card" onClick={() => { setActiveTab('orders'); setOrderFilter('Pending'); }} style={{ background: 'linear-gradient(135deg, #2C3E6B 0%, #1a2947 100%)', borderRadius: '12px', padding: '24px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', cursor: 'pointer', transition: '0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Pending Orders</span>
                  <div style={{ background: 'rgba(240, 168, 50, 0.3)', color: 'var(--accent)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    <i className="fas fa-clock" style={{ margin: 'auto' }}></i>
                  </div>
                </div>
                <h2 style={{ fontSize: '26px', color: '#fff', margin: 0, fontWeight: 700 }}>{pendingOrders}</h2>
                <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '8px', fontWeight: 600 }}>
                  <i className="fas fa-arrow-right"></i> Click to view & manage
                </div>
              </div>

            </div>

            {/* RECENT ORDERS TABLE ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>

              {/* Recent Orders Summary */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', color: '#1a2238', margin: 0, fontWeight: 700 }}>Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                    View All <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {orders.slice(0, 5).map(order => {
                    const statusInfo = getStatusColor(order.status);
                    return (
                      <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <img src={order.items?.[0]?.image || ''} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customerName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{(order.items?.[0]?.name || 'Unknown Product').length > 30 ? (order.items?.[0]?.name || '').slice(0, 30) + '...' : order.items?.[0]?.name || 'Unknown Product'}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)' }}>Rs. {order.totalAmount.toLocaleString()}</div>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '50px',
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            display: 'inline-block',
                            marginTop: '2px'
                          }}>{order.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button className="btn-primary" style={{ marginTop: '20px', width: '100%', padding: '12px' }} onClick={() => setActiveTab('orders')}>
                  <i className="fas fa-shopping-cart"></i> Manage All Orders
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS LIST */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '26px', color: '#1a2238', margin: 0, fontWeight: 700 }}>Manage Products</h1>
                <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '4px' }}>Review and modify catalog items.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select 
                  onChange={(e) => {
                    const select = e.target;
                    const val = select.value;
                    const table = document.getElementById('products-table-body');
                    if(table) {
                      Array.from(table.children).forEach(row => {
                        if(val === 'all' || row.getAttribute('data-category') === val) {
                          (row as HTMLElement).style.display = '';
                        } else {
                          (row as HTMLElement).style.display = 'none';
                        }
                      });
                    }
                  }}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', outline: 'none' }}
                >
                  <option value="all">All Categories</option>
                  <option value="new-born">Newborn</option>
                  <option value="baby-boy">Baby Boy</option>
                  <option value="baby-girl">Baby Girl</option>
                  <option value="boy">Boys</option>
                  <option value="girl">Girls</option>
                  <option value="hadid">Hadid Eastern</option>
                  <option value="footwear">Footwear</option>
                  <option value="accessories">Accessories</option>
                </select>
                <button className="btn-primary" style={{ padding: '12px 20px' }} onClick={() => {
                  setEditingProductId(null);
                  setName('');
                  setPrice('');
                  setOldPrice('');
                  setDescription('');
                  setSelectedCategories([]);
                  setSelectedSizes(['3-6M', '6-9M']);
                  setImages(['', '', '']);
                  setImagePreviews(['', '', '']);
                  setImageFiles([null, null, null]);
                  setActiveTab('add-product');
                }}>
                  <i className="fas fa-plus"></i> Upload New Product
                </button>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid var(--border)', textAlign: 'left', color: 'var(--dark)' }}>
                      <th style={{ padding: '16px 20px' }}>Image</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th style={{ minWidth: '110px' }}>Badge</th>
                      <th>Sizes</th>
                      <th>Price</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="products-table-body">
                    {products.map(prod => (
                      <tr key={prod.id} data-category={prod.categories?.[0]} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 20px' }}>
                          <img src={prod.images[0]} alt="" style={{ width: '50px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--dark)' }}>{prod.name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{prod.categories ? prod.categories.map(c => categories.find(cat => cat.id === c)?.name || c).join(', ') : ''}</td>
                        <td style={{ textTransform: 'capitalize' }}>
                          {prod.badge && prod.badge !== 'none' ? (
                            <span style={{
                              fontSize: '11px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: prod.badge === 'sale' ? '#ff3b30' : prod.badge === 'best-seller' ? '#d4940a' : prod.badge === 'new-arrival' ? 'var(--primary)' : '#888',
                              color: '#fff',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              display: 'inline-block'
                            }}>
                              {prod.badge.replace(/-/g, ' ')}
                            </span>
                          ) : <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>—</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {prod.sizes.map(s => (
                              <span key={s} style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg-light)', borderRadius: '4px', border: '1px solid var(--border)', color: 'var(--text-light)' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>Rs. {prod.price.toLocaleString()}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            onClick={() => {
                              setEditingProductId(prod.id);
                              setName(prod.name);
                              setPrice(prod.price.toString());
                              setOldPrice(prod.oldPrice ? prod.oldPrice.toString() : '');
                              setSelectedCategories(prod.categories || []);
                              setDescription(prod.description);
                              setSelectedSizes(prod.sizes);
                              setAvailableSizes(prev => {
                                const newSizes = [...prev];
                                prod.sizes.forEach(sz => {
                                  if (!newSizes.includes(sz)) {
                                    newSizes.push(sz);
                                  }
                                });
                                return newSizes;
                              });
                              setBadge(prod.badge || 'none');
                              
                              // Pad images array to length 3
                              const newImages = [...prod.images];
                              while (newImages.length < 3) newImages.push('');
                              setImages(newImages);
                              setImagePreviews([...newImages]);
                              setImageFiles([null, null, null]);
                              
                              setActiveTab('add-product');
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '16px', padding: '8px' }}
                            title="Edit Product"
                          >
                            <i className="far fa-edit"></i>
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${prod.name}"?`)) {
                                onDeleteProduct(prod.id);
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: '16px', padding: '8px' }}
                            title="Delete Product"
                          >
                            <i className="far fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: UPLOAD PRODUCT */}
        {activeTab === 'add-product' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '26px', color: '#1a2238', marginBottom: '8px', fontWeight: 700 }}>
              {editingProductId ? 'Edit Product' : 'Upload New Product'}
            </h1>
            <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '32px' }}>
              {editingProductId ? 'Update the details for this product.' : 'Fill in this form to publish a new product immediately to the live store.'}
            </p>

            <form onSubmit={handleProductSubmit} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
              
              <div className="form-group">
                <label>Product Title / Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Baby Girl Summer Floral Frock" 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label>Price (PKR) *</label>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    placeholder="e.g. 2490" 
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label>Compare-at / Original Price (PKR) <span style={{ color: '#ff3b30', fontSize: '12px', fontWeight: 400 }}>— Shows as struck-through old price (for discounts)</span></label>
                  <input 
                    type="number" 
                    value={oldPrice} 
                    onChange={(e) => setOldPrice(e.target.value)} 
                    placeholder="e.g. 2990 (leave blank if no discount)" 
                  />
                </div>
              </div>
              {/* Live Discount Preview */}
              {price && oldPrice && parseFloat(oldPrice) > parseFloat(price) && (
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '16px', 
                  padding: '12px 16px', background: 'linear-gradient(135deg, #fff5f5, #fff)', 
                  border: '1px solid #ffcccc', borderRadius: '8px', marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>Discount Preview:</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '15px' }}>Rs. {parseFloat(price).toLocaleString()}</span>
                  <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '13px' }}>Rs. {parseFloat(oldPrice).toLocaleString()}</span>
                  <span style={{ 
                    background: '#ff3b30', color: '#fff', fontWeight: 700, 
                    fontSize: '12px', padding: '3px 8px', borderRadius: '20px'
                  }}>
                    {Math.round(((parseFloat(oldPrice) - parseFloat(price)) / parseFloat(oldPrice)) * 100)}% OFF
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', marginLeft: 'auto' }}>
                    This will automatically add a "Sale" badge and the product will appear under the Sale category.
                  </span>
                </div>
              )}

              <div className="form-group" style={{ position: 'relative' }}>
                <label>Categories * (Select one or more)</label>
                
                {/* Custom Dropdown Toggle */}
                <div 
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  style={{
                    width: '100%', padding: '12px 16px', border: '1px solid var(--border)', 
                    borderRadius: '8px', background: '#fff', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: '14px', color: selectedCategories.length ? 'var(--dark)' : 'var(--text-light)'
                  }}
                >
                  <span>
                    {selectedCategories.length === 0 
                      ? 'Select categories...' 
                      : `${selectedCategories.length} categories selected`}
                  </span>
                  <i className={`fas fa-chevron-${isCategoryDropdownOpen ? 'up' : 'down'}`}></i>
                </div>

                {/* Dropdown Menu */}
                {isCategoryDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    marginTop: '4px', background: '#fff', border: '1px solid var(--border)',
                    borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    maxHeight: '340px', overflowY: 'auto', padding: '8px'
                  }}>
                    {categories.filter(c => !c.parentId).map(parent => {
                      const children = categories.filter(c => c.parentId === parent.id);
                      const isExpanded = expandedParents.includes(parent.id);
                      return (
                        <div key={parent.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {/* Parent row */}
                          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 8px', gap: '8px' }}>
                            <input
                              type="checkbox"
                              style={{ width: '16px', height: '16px', margin: 0, cursor: 'pointer', flexShrink: 0 }}
                              checked={selectedCategories.includes(parent.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedCategories([...selectedCategories, parent.id]);
                                else setSelectedCategories(selectedCategories.filter(c => c !== parent.id));
                              }}
                            />
                            <span style={{ flex: 1, fontWeight: 600, fontSize: '14px', color: 'var(--dark)', cursor: 'default' }}>
                              {parent.name}
                            </span>
                            {children.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setExpandedParents(isExpanded
                                  ? expandedParents.filter(id => id !== parent.id)
                                  : [...expandedParents, parent.id]
                                )}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: 'var(--text-light)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <span style={{ fontSize: '11px' }}>{children.length} sub</span>
                                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                              </button>
                            )}
                          </div>
                          {/* Subcategories — only shown when expanded */}
                          {isExpanded && children.length > 0 && (
                            <div style={{ paddingLeft: '28px', paddingBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {children.map(child => (
                                <label key={child.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: 'var(--text)' }}>
                                  <input
                                    type="checkbox"
                                    style={{ width: '14px', height: '14px', margin: 0, cursor: 'pointer' }}
                                    checked={selectedCategories.includes(child.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedCategories([...selectedCategories, child.id]);
                                      else setSelectedCategories(selectedCategories.filter(c => c !== child.id));
                                    }}
                                  />
                                  {child.name}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Selected Tags Display */}
                {selectedCategories.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                    {selectedCategories.map(catId => {
                      const catName = categories.find(c => c.id === catId)?.name || catId;
                      return (
                        <span key={catId} style={{
                          background: 'var(--primary-light)', color: 'var(--primary-dark)',
                          padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                          display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600
                        }}>
                          {catName}
                          <i 
                            className="fas fa-times" 
                            style={{ cursor: 'pointer', opacity: 0.6 }}
                            onClick={() => setSelectedCategories(selectedCategories.filter(id => id !== catId))}
                          ></i>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Product Description *</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Tell customers about material, fit, quality..." 
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none', minHeight: '120px', fontFamily: 'inherit' }}
                  required 
                />
              </div>

              {/* Sizes Selector */}
              <div className="form-group">
                <label>Select Available Sizes</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {availableSizes.map(sz => (
                    <div key={sz} style={{ position: 'relative', display: 'inline-block', margin: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleSize(sz)}
                        style={{
                          padding: '6px 22px 6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: selectedSizes.includes(sz) ? 'var(--primary)' : '#fff',
                          color: selectedSizes.includes(sz) ? '#fff' : 'var(--text-light)',
                          transition: '0.2s'
                        }}
                      >
                        {sz}
                      </button>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSizeOption(sz);
                        }}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: '#ff3b30',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '15px',
                          height: '15px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                          zIndex: 2
                        }}
                        title={`Delete ${sz} option`}
                      >
                        &times;
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    value={sizeInput} 
                    onChange={(e) => setSizeInput(e.target.value)} 
                    placeholder="Add custom size (e.g. 9-12M)"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={handleAddCustomSize} className="btn-primary" style={{ padding: '0 16px', fontSize: '13px' }}>Add Size</button>
                </div>
              </div>

              {/* Image Upload */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ margin: 0 }}>Product Images * (Up to 3 photos)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setUploadMode('file')} style={{ padding: '6px 14px', borderRadius: '6px', border: '1.5px solid var(--border)', background: uploadMode === 'file' ? 'var(--primary)' : '#fff', color: uploadMode === 'file' ? '#fff' : 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                      <i className="fas fa-laptop"></i> From Laptop
                    </button>
                    <button type="button" onClick={() => setUploadMode('url')} style={{ padding: '6px 14px', borderRadius: '6px', border: '1.5px solid var(--border)', background: uploadMode === 'url' ? 'var(--primary)' : '#fff', color: uploadMode === 'url' ? '#fff' : 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                      <i className="fas fa-link"></i> From URL
                    </button>
                  </div>
                </div>

                {uploadMode === 'file' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    {[0, 1, 2].map(index => (
                      <div key={index} style={{ position: 'relative' }}>
                        <label
                          htmlFor={`file-upload-${index}`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            height: '160px',
                            border: imagePreviews[index] ? '2px solid var(--primary)' : '2px dashed var(--border)',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            background: imagePreviews[index] ? 'transparent' : '#f8fafc',
                            overflow: 'hidden',
                            transition: '0.2s',
                            position: 'relative'
                          }}
                        >
                          {imagePreviews[index] ? (
                            <>
                              <img
                                src={imagePreviews[index]}
                                alt={`Preview ${index + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                              />
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s' }}
                                className="img-hover-overlay"
                              >
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '12px' }}>Change Photo</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <i className="fas fa-cloud-upload-alt" style={{ fontSize: '28px', color: 'var(--text-light)' }}></i>
                              <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 600, textAlign: 'center' }}>
                                {index === 0 ? 'Main Photo *' : `Photo ${index + 1} (optional)`}
                              </span>
                              <span style={{ fontSize: '11px', color: '#ccc' }}>Click to browse</span>
                            </>
                          )}
                        </label>
                        <input
                          id={`file-upload-${index}`}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileUpload(index, e.target.files?.[0] || null)}
                        />
                        {imagePreviews[index] && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            style={{ position: 'absolute', top: '6px', right: '6px', background: '#ff3b30', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                        {/* B2 Upload Status Badge */}
                        {uploadProgress[index] !== 'idle' && (
                          <div style={{
                            position: 'absolute', bottom: '6px', left: '6px', zIndex: 10,
                            padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                            background: uploadProgress[index] === 'uploading' ? 'rgba(240,168,50,0.9)' : uploadProgress[index] === 'done' ? 'rgba(40,167,69,0.9)' : 'rgba(255,59,48,0.9)',
                            color: '#fff', display: 'flex', alignItems: 'center', gap: '4px'
                          }}>
                            {uploadProgress[index] === 'uploading' && <><i className="fas fa-spinner fa-spin"></i> Uploading...</>}
                            {uploadProgress[index] === 'done' && <><i className="fas fa-check"></i> Uploaded</>}
                            {uploadProgress[index] === 'error' && <><i className="fas fa-exclamation-triangle"></i> Failed</>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input 
                    type="url" 
                    value={images[0].startsWith('data:') ? '' : images[0]} 
                    onChange={(e) => handleAddImageField(0, e.target.value)} 
                    placeholder="Primary Image URL (Required) - e.g. https://domain.com/pic1.jpg" 
                  />
                  <input 
                    type="url" 
                    value={images[1].startsWith('data:') ? '' : images[1]} 
                    onChange={(e) => handleAddImageField(1, e.target.value)} 
                    placeholder="Additional Image 2 URL (Optional)" 
                  />
                  <input 
                    type="url" 
                    value={images[2].startsWith('data:') ? '' : images[2]} 
                    onChange={(e) => handleAddImageField(2, e.target.value)} 
                    placeholder="Additional Image 3 URL (Optional)" 
                  />
                  </div>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginTop: '10px' }}>
                  <i className="fas fa-info-circle"></i> {uploadMode === 'file' ? 'Supports JPG, PNG, WEBP. Photos will be uploaded to Backblaze B2 cloud storage.' : 'You can paste any image link from hipkids.pk or any other website.'}
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '24px', marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '8px' }}>Product Badge</label>
                <select 
                  value={badge} 
                  onChange={e => setBadge(e.target.value as Product['badge'])}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
                >
                  <option value="none">None</option>
                  <option value="sale">Sale</option>
                  <option value="best-seller">Best Seller</option>
                  <option value="new-arrival">New Arrival</option>
                  <option value="sold-out">Sold Out</option>
                </select>
              </div>
              <button type="submit" className="btn-primary btn-block" style={{ padding: '16px 32px', fontSize: '15px', fontWeight: 700, borderRadius: '8px', marginTop: '20px' }} disabled={isUploading}>
                {isUploading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Uploading to B2...</>
                ) : (
                  <><i className="fas fa-upload"></i> {editingProductId ? 'Update Product' : 'Publish Product to Live Store'}</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <AdminCategories categories={categories} onCategoriesChange={onCategoriesChange} />
        )}



        {/* TAB 5: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '26px', color: '#1a2238', margin: 0, fontWeight: 700 }}>
                  <i className="fas fa-shopping-cart" style={{ marginRight: '10px', color: 'var(--primary)' }}></i>
                  Orders Management
                </h1>
                <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '4px' }}>
                  View, approve, cancel or edit customer orders. Total: <strong>{orders.length}</strong> orders
                </p>
              </div>
              <button
                onClick={refreshOrders}
                disabled={isLoadingOrders}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '8px',
                  border: '2px solid var(--primary)', background: '#fff',
                  color: 'var(--primary)', fontWeight: 700, fontSize: '13px',
                  cursor: isLoadingOrders ? 'not-allowed' : 'pointer',
                  opacity: isLoadingOrders ? 0.6 : 1, transition: '0.2s'
                }}
              >
                <i className={`fas fa-sync-alt ${isLoadingOrders ? 'fa-spin' : ''}`}></i>
                {isLoadingOrders ? 'Refreshing...' : 'Refresh Orders'}
              </button>
            </div>

            {/* Action feedback banner */}
            {orderActionMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 18px', borderRadius: '10px', marginBottom: '20px',
                background: orderActionMsg.type === 'success' ? 'rgba(123,171,139,0.15)' : 'rgba(255,59,48,0.1)',
                border: `1px solid ${orderActionMsg.type === 'success' ? 'var(--success)' : '#ff3b30'}`,
                color: orderActionMsg.type === 'success' ? 'var(--success)' : '#ff3b30',
                fontWeight: 600, fontSize: '14px'
              }}>
                <i className={`fas ${orderActionMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                {orderActionMsg.text}
              </div>
            )}

            {/* Loading state */}
            {isLoadingOrders && orders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '36px', color: 'var(--primary)', marginBottom: '16px' }}></i>
                <p style={{ color: 'var(--text-light)', fontWeight: 600 }}>Loading orders from database...</p>
              </div>
            )}

            {/* STATUS FILTER BAR */}
            <div className="order-filter-bar" style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
              {(['All', 'Pending', 'Approved', 'Cancelled'] as OrderFilter[]).map(filter => {
                const count = filter === 'All' ? orders.length : orders.filter(o => o.status === filter).length;
                const isActive = orderFilter === filter;
                const filterColors: Record<string, string> = {
                  'All': 'var(--primary)',
                  'Pending': '#d4940a',
                  'Approved': 'var(--success)',
                  'Cancelled': '#ff3b30'
                };
                return (
                  <button
                    key={filter}
                    onClick={() => setOrderFilter(filter)}
                    className={`order-filter-btn ${isActive ? 'active' : ''}`}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '50px',
                      border: isActive ? '2px solid ' + filterColors[filter] : '2px solid var(--border)',
                      background: isActive ? filterColors[filter] : '#fff',
                      color: isActive ? '#fff' : 'var(--text)',
                      fontWeight: 700,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {filter === 'All' && <i className="fas fa-layer-group"></i>}
                    {filter === 'Pending' && <i className="fas fa-clock"></i>}
                    {filter === 'Approved' && <i className="fas fa-check-circle"></i>}
                    {filter === 'Cancelled' && <i className="fas fa-times-circle"></i>}
                    {filter} ({count})
                  </button>
                );
              })}
            </div>

            {/* BULK ACTIONS & DATE FILTER BAR */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '24px', background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              {/* Date Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-light)' }}>
                  <i className="fas fa-calendar-alt" style={{ marginRight: '6px' }}></i> Filter by Date:
                </label>
                <input 
                  type="date" 
                  value={orderDateFilter}
                  onChange={(e) => setOrderDateFilter(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', outline: 'none' }}
                />
                {orderDateFilter && (
                  <button onClick={() => setOrderDateFilter('')} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: '13px', padding: '4px' }} title="Clear Date Filter">
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>

              {/* Bulk Actions */}
              <button
                onClick={handleSelectAllOrders}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: '#f8fafc', color: 'var(--dark)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: '0.2s' }}
              >
                {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? 'Deselect All' : 'Select All'}
              </button>

              <button
                onClick={handleDownloadCSV}
                disabled={selectedOrderIds.length === 0}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--primary)', background: '#fff', color: 'var(--primary)', fontWeight: 600, fontSize: '13px', cursor: selectedOrderIds.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedOrderIds.length === 0 ? 0.5 : 1, transition: '0.2s' }}
              >
                <i className="fas fa-download" style={{ marginRight: '6px' }}></i> Download CSV ({selectedOrderIds.length})
              </button>

              {orders.filter(o => selectedOrderIds.includes(o.id) && o.status === 'Pending').length > 0 && (
                <button
                  onClick={handleBulkApprove}
                  disabled={orderActionLoading === 'bulk-approve'}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--success)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: orderActionLoading === 'bulk-approve' ? 'not-allowed' : 'pointer', opacity: orderActionLoading === 'bulk-approve' ? 0.7 : 1, transition: '0.2s' }}
                >
                  <i className={`fas ${orderActionLoading === 'bulk-approve' ? 'fa-spinner fa-spin' : 'fa-check-double'}`} style={{ marginRight: '6px' }}></i> 
                  Approve Selected
                </button>
              )}
            </div>

            {/* ORDER CARDS GRID */}
            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <i className="fas fa-inbox" style={{ fontSize: '48px', color: 'var(--border)', marginBottom: '16px' }}></i>
                <h3 style={{ color: 'var(--text-light)', fontWeight: 600 }}>No {orderFilter !== 'All' ? orderFilter.toLowerCase() : ''} orders found</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Orders will appear here when customers place them.</p>
              </div>
            ) : (
              <div className="orders-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '22px' }}>
                {filteredOrders.map(order => {
                  const statusInfo = getStatusColor(order.status);
                  return (
                    <div key={order.id} className="order-card" style={{
                      background: '#fff',
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
                    }}>
                      {/* Card Header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        background: selectedOrderIds.includes(order.id) ? 'rgba(44, 62, 107, 0.04)' : '#f8fafc',
                        borderBottom: '1px solid var(--border)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedOrderIds.includes(order.id)}
                            onChange={() => handleToggleOrderSelection(order.id)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                          />
                          <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--primary)' }}>{order.id}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>{order.orderDate}</span>
                        </div>
                        <span style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '4px 14px',
                          borderRadius: '50px',
                          background: statusInfo.bg,
                          color: statusInfo.color,
                          letterSpacing: '0.3px'
                        }}>{statusInfo.text}</span>
                      </div>

                      {/* Product Info */}
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {order.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '14px' }}>
                            <img src={item.image} alt="" style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1px solid var(--border)',
                              flexShrink: 0
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--dark)', marginBottom: '2px', lineHeight: '1.3' }}>{item.name}</div>
                              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-light)' }}>
                                <span>Qty: <strong style={{ color: 'var(--dark)' }}>{item.quantity}</strong></span>
                                <span>Size: <strong style={{ color: 'var(--dark)' }}>{item.size}</strong></span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Subtotal: Rs. {order.subtotal?.toLocaleString() ?? 0} | Delivery: Rs. {order.deliveryFee?.toLocaleString() ?? 0}</span>
                          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary)' }}>
                            Total: Rs. {order.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                          <i className="fas fa-user" style={{ width: '16px', color: 'var(--primary)', fontSize: '12px' }}></i>
                          <span style={{ fontWeight: 600, color: 'var(--dark)' }}>{order.customerName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                          <i className="fas fa-phone-alt" style={{ width: '16px', color: 'var(--accent2)', fontSize: '12px' }}></i>
                          <span style={{ color: 'var(--text)' }}>{order.customerPhone}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                          <i className="fas fa-envelope" style={{ width: '16px', color: 'var(--accent)', fontSize: '12px' }}></i>
                          <span style={{ color: 'var(--text)' }}>{order.customerEmail}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
                          <i className="fas fa-map-marker-alt" style={{ width: '16px', color: '#ff3b30', fontSize: '12px', marginTop: '2px' }}></i>
                          <span style={{ color: 'var(--text)', lineHeight: '1.4' }}>{order.customerAddress}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                          <i className="fas fa-city" style={{ width: '16px', color: 'var(--accent3)', fontSize: '12px' }}></i>
                          <span style={{ fontWeight: 700, color: 'var(--dark)' }}>{order.city}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        padding: '14px 20px',
                        borderTop: '1px solid var(--border)',
                        background: '#fafbfc'
                      }}>
                        {order.status === 'Pending' && (
                          <button
                            onClick={() => handleApproveOrder(order.id)}
                            disabled={orderActionLoading === order.id}
                            className="order-action-btn approve-btn"
                            style={{
                              flex: 1,
                              padding: '10px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'var(--success)',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: orderActionLoading === order.id ? 'not-allowed' : 'pointer',
                              opacity: orderActionLoading === order.id ? 0.7 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {orderActionLoading === order.id
                              ? <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                              : <><i className="fas fa-check"></i> Approve</>}
                          </button>
                        )}
                        {order.status === 'Pending' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={orderActionLoading === order.id}
                            className="order-action-btn cancel-btn"
                            style={{
                              flex: 1,
                              padding: '10px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#ff3b30',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: orderActionLoading === order.id ? 'not-allowed' : 'pointer',
                              opacity: orderActionLoading === order.id ? 0.7 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <i className="fas fa-times"></i> Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(order)}
                          className="order-action-btn edit-btn"
                          style={{
                            flex: order.status !== 'Pending' ? 1 : undefined,
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '2px solid var(--primary)',
                            background: '#fff',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <i className="fas fa-pen"></i> Edit
                        </button>
                        {order.status === 'Cancelled' && (
                          <button
                            onClick={() => handleApproveOrder(order.id)}
                            disabled={orderActionLoading === order.id}
                            className="order-action-btn"
                            style={{
                              flex: 1,
                              padding: '10px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'var(--primary)',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: orderActionLoading === order.id ? 'not-allowed' : 'pointer',
                              opacity: orderActionLoading === order.id ? 0.7 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {orderActionLoading === order.id
                              ? <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                              : <><i className="fas fa-redo"></i> Re-Approve</>}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          disabled={orderActionLoading === order.id}
                          className="order-action-btn delete-btn"
                          style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid #ff3b30',
                            background: 'transparent',
                            color: '#ff3b30',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: orderActionLoading === order.id ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                            opacity: orderActionLoading === order.id ? 0.7 : 1
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#ff3b30';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#ff3b30';
                          }}
                        >
                          {orderActionLoading === order.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── EDIT ORDER MODAL ─── */}
        {editingOrder && (
          <div className="order-edit-overlay" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditingOrder(null); }}
          >
            <div className="order-edit-modal" style={{
              background: '#fff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              animation: 'modalSlideIn 0.3s ease'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 28px',
                borderBottom: '1px solid var(--border)',
                background: '#f8fafc',
                borderRadius: '20px 20px 0 0'
              }}>
                <div>
                  <h2 style={{ fontSize: '20px', color: 'var(--dark)', margin: 0, fontWeight: 700 }}>
                    <i className="fas fa-pen" style={{ color: 'var(--primary)', marginRight: '10px' }}></i>
                    Edit Order
                  </h2>
                  <span style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px', display: 'block' }}>
                    Order ID: <strong>{editingOrder.id}</strong>
                  </span>
                </div>
                <button
                  onClick={() => setEditingOrder(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '22px',
                    cursor: 'pointer',
                    color: 'var(--text-light)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: '0.2s'
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveEdit} style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-user" style={{ color: 'var(--primary)', fontSize: '12px' }}></i> Customer Name
                    </label>
                    <input
                      type="text"
                      value={editForm.customerName}
                      onChange={e => setEditForm({ ...editForm, customerName: e.target.value })}
                      required
                      style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: '0.2s' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '14px' }}>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fas fa-phone-alt" style={{ color: 'var(--accent2)', fontSize: '12px' }}></i> Phone
                      </label>
                      <input
                        type="text"
                        value={editForm.customerPhone}
                        onChange={e => setEditForm({ ...editForm, customerPhone: e.target.value })}
                        required
                        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fas fa-city" style={{ color: 'var(--accent3)', fontSize: '12px' }}></i> City
                      </label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                        required
                        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-envelope" style={{ color: 'var(--accent)', fontSize: '12px' }}></i> Email
                    </label>
                    <input
                      type="email"
                      value={editForm.customerEmail}
                      onChange={e => setEditForm({ ...editForm, customerEmail: e.target.value })}
                      required
                      style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-map-marker-alt" style={{ color: '#ff3b30', fontSize: '12px' }}></i> Address
                    </label>
                    <textarea
                      value={editForm.customerAddress}
                      onChange={e => setEditForm({ ...editForm, customerAddress: e.target.value })}
                      required
                      rows={2}
                      style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-coins" style={{ color: 'var(--success)', fontSize: '12px' }}></i> Total Amount (PKR)
                    </label>
                    <input
                      type="number"
                      value={editForm.totalAmount}
                      onChange={e => setEditForm({ ...editForm, totalAmount: Number(e.target.value) })}
                      required
                      min="0"
                      style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                    />
                  </div>

                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    style={{
                      flex: 1,
                      padding: '13px',
                      borderRadius: '10px',
                      border: '2px solid var(--border)',
                      background: '#fff',
                      color: 'var(--text)',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: '0.2s'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    style={{
                      flex: 2,
                      padding: '13px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: editSaving ? 'not-allowed' : 'pointer',
                      opacity: editSaving ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: '0.2s',
                      boxShadow: '0 4px 14px rgba(44,62,107,0.3)'
                    }}
                  >
                    {editSaving
                      ? <><i className="fas fa-spinner fa-spin"></i> Saving to Supabase...</>
                      : <><i className="fas fa-save"></i> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: CUSTOMER QUERIES */}
        {activeTab === 'queries' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '26px', color: '#1a2238', margin: 0, fontWeight: 700 }}>
                  <i className="fas fa-envelope" style={{ marginRight: '10px', color: 'var(--primary)' }}></i>
                  Customer Queries
                </h1>
                <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '4px' }}>
                  Manage and resolve messages from customers.
                </p>
              </div>
            </div>

            {queries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <i className="fas fa-inbox" style={{ fontSize: '48px', color: 'var(--border)', marginBottom: '16px' }}></i>
                <h3 style={{ color: 'var(--text-light)', fontWeight: 600 }}>No queries found</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Customer messages will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {queries.map(q => (
                  <div key={q.id} style={{
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    borderLeft: q.status === 'Unread' ? '4px solid #ff3b30' : '4px solid var(--success)',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--dark)' }}>{q.name}</h3>
                        <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px' }}>
                          <span><i className="fas fa-envelope" style={{ marginRight: '6px' }}></i>{q.email}</span>
                          {q.phone && <span style={{ marginLeft: '12px' }}><i className="fas fa-phone-alt" style={{ marginRight: '6px' }}></i>{q.phone}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 600, marginBottom: '6px' }}>{q.date}</div>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '50px',
                          background: q.status === 'Unread' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(123, 171, 139, 0.1)',
                          color: q.status === 'Unread' ? '#ff3b30' : 'var(--success)'
                        }}>
                          {q.status}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '14px', color: 'var(--dark)', lineHeight: '1.6', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                      "{q.message}"
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <a href={`mailto:${q.email}`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>
                        <i className="fas fa-reply"></i> Reply via Email
                      </a>
                      {q.status === 'Unread' && (
                        <button onClick={() => handleMarkQueryResolved(q.id)} style={{ padding: '8px 16px', fontSize: '13px', background: '#fff', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: 'var(--dark)' }}>
                          <i className="fas fa-check"></i> Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



      </div>
    </div>
  );
};

export default AdminDashboard;
