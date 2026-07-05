import React from 'react';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import ProductsSection from '../components/ProductsSection';
import ShopByAge from '../components/ShopByAge';
import Footwear from '../components/Footwear';
import Reviews from '../components/Reviews';
import type { Product } from '../data/products';
import type { CartItem } from '../types';

type HomeProps = {
  products: Product[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  toggleWishlist: (product: Product) => void;
  wishlistItems: Product[];
};

const Home: React.FC<HomeProps> = ({ products, addToCart, toggleWishlist, wishlistItems }) => {
  return (
    <>
      <Hero />
      <Categories />
      <ProductsSection products={products} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlistItems={wishlistItems} />
      <ShopByAge />
      <Footwear products={products} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlistItems={wishlistItems} />
      <Reviews />
    </>
  );
};

export default Home;
