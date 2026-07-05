import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import ProductPage from './pages/ProductPage'
import CategoryPage from './pages/CategoryPage'
import SearchPage from './pages/SearchPage'
import ContactUs from './pages/ContactUs'
import PolicyPage from './pages/PolicyPage'
import Checkout from './pages/Checkout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import { loadProducts, addProduct as addProductToDb, deleteProduct as deleteProductFromDb, updateProduct as updateProductInDb, type Product } from './data/products'
import { loadCategories, DEFAULT_CATEGORIES, type Category } from './data/categories'
import type { CartItem } from './types';

export type { CartItem };

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('adminToken') === 'true';
  return isAuthenticated ? children : <Navigate to="/admin-login" replace />;
};


function AppContent() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const [productsData, categoriesData] = await Promise.all([
        loadProducts(),
        loadCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    };
    fetchAll();
  }, []);

  const handleAddProduct = async (newProd: Product) => {
    const success = await addProductToDb(newProd);
    if (success) {
      setProducts(prev => [newProd, ...prev]);
    } else {
      alert("Failed to add product to Supabase database.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const success = await deleteProductFromDb(id);
    if (success) {
      setProducts(prev => prev.filter(p => p.id !== id));
    } else {
      alert("Failed to delete product from Supabase database.");
    }
  };

  const handleEditProduct = async (updatedProd: Product) => {
    const success = await updateProductInDb(updatedProd);
    if (success) {
      setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
    } else {
      alert("Failed to update product in Supabase database.");
    }
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id && i.size === item.size);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string, size: string) => {
    setCartItems(prev => prev.filter(i => !(i.id === id && i.size === size)));
  };

  const updateQuantity = (id: string, size: string, delta: number) => {
    setCartItems(prev => prev.map(i => {
      if (i.id === id && i.size === size) {
        const newQuantity = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQuantity };
      }
      return i;
    }));
  };

  const toggleWishlist = (product: Product) => {
    setWishlistItems(prev => {
      if (prev.find(p => p.id === product.id)) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlistItems(prev => prev.filter(p => p.id !== id));
  };

  const clearCart = () => setCartItems([]);

  const activeCategories = Array.from(new Set(products.flatMap(p => p.categories || [])));
  const activeTags = Array.from(new Set(products.flatMap(p => p.tags || [])));
  
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isCheckoutRoute = location.pathname === '/checkout';

  return (
    <>
      {!isAdminRoute && (
        <Header 
          cartItems={cartItems} 
          isCartOpen={isCartOpen} 
          setIsCartOpen={setIsCartOpen}
          isAccountOpen={isAccountOpen}
          setIsAccountOpen={setIsAccountOpen}
          removeFromCart={removeFromCart}
          updateQuantity={updateQuantity}
          wishlistItems={wishlistItems}
          isWishlistOpen={isWishlistOpen}
          setIsWishlistOpen={setIsWishlistOpen}
          removeFromWishlist={removeFromWishlist}
          activeCategories={activeCategories}
          activeTags={activeTags}
          categories={categories}
          isCheckoutRoute={isCheckoutRoute}
        />
      )}
      <Routes>
        <Route path="/" element={<Home products={products} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlistItems={wishlistItems} />} />
        <Route path="/product/:id" element={<ProductPage products={products} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlistItems={wishlistItems} />} />
        <Route path="/category/:id" element={<CategoryPage products={products} addToCart={addToCart} />} />
        <Route path="/search" element={<SearchPage products={products} addToCart={addToCart} />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/policies/:id" element={<PolicyPage />} />
        <Route path="/checkout" element={<Checkout cartItems={cartItems} clearCart={clearCart} />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <ProtectedAdminRoute>
            <AdminDashboard products={products} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} onEditProduct={handleEditProduct} categories={categories} onCategoriesChange={setCategories} />
          </ProtectedAdminRoute>
        } />
      </Routes>
      {!isAdminRoute && !isCheckoutRoute && <Footer />}
    </>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App

