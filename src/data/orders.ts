import { supabase } from '../lib/supabase';
import type { CartItem } from '../types';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  city: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  items: CartItem[];
  notes: string;
  status: 'Pending' | 'Approved' | 'Cancelled';
  orderDate: string;
  createdAt?: string;
}

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ZW-TEST1',
    customerName: 'Ayesha Khan',
    customerPhone: '0321-4567890',
    customerEmail: 'ayesha.khan@gmail.com',
    customerAddress: 'House 12, Block C, DHA Phase 5',
    city: 'Karachi',
    paymentMethod: 'Cash on Delivery',
    subtotal: 3290,
    deliveryFee: 250,
    totalAmount: 3540,
    items: [
      {
        id: 'p1',
        name: 'PL Baby 2 Pk Zipper Romper Dino and Boat Print',
        image: 'https://hipkids.pk/cdn/shop/files/29_f1f4d31f-0985-4ddc-83c9-32db12e49bc1.webp?v=1782287979&width=800',
        price: 3290,
        quantity: 1,
        size: '3-6M'
      }
    ],
    notes: 'Please deliver in the evening.',
    status: 'Pending',
    orderDate: '2026-07-03'
  }
];

export const loadOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('orderDate', { ascending: false });

    if (error) {
      console.error('Error fetching orders from Supabase:', error);
      // Fallback to localStorage
      const localData = localStorage.getItem('zeero_wear_orders');
      if (localData) return JSON.parse(localData);
      return INITIAL_ORDERS;
    }

    if (data && data.length > 0) {
      return data as Order[];
    }
  } catch (err) {
    console.error('Exception fetching orders:', err);
  }

  // Fallback to localStorage if no data in Supabase yet
  const localData = localStorage.getItem('zeero_wear_orders');
  if (localData) {
    return JSON.parse(localData);
  }
  
  return INITIAL_ORDERS;
};

export const saveOrders = (orders: Order[]) => {
  localStorage.setItem('zeero_wear_orders', JSON.stringify(orders));
};

export const addOrderToSupabase = async (order: Order): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .insert([order]);
      
    if (error) {
      console.error('Error adding order to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception adding order:', err);
    return false;
  }
};

