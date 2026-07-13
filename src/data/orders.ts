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

// ─── FETCH ALL ORDERS ───
export const loadOrders = async (): Promise<Order[]> => {
  // Clear any stale localStorage orders — Supabase is the only source of truth
  localStorage.removeItem('zeero_wear_orders');

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching orders from Supabase:', error);
      return [];
    }

    return (data as Order[]) ?? [];
  } catch (err) {
    console.error('Exception fetching orders:', err);
    return [];
  }
};

// ─── INSERT NEW ORDER ───
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

// ─── UPDATE ORDER STATUS (Approve / Cancel / Re-Approve) ───
export const updateOrderStatus = async (
  orderId: string,
  status: 'Pending' | 'Approved' | 'Cancelled'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception updating order status:', err);
    return false;
  }
};

// ─── BULK UPDATE ORDER STATUS ───
export const bulkUpdateOrderStatus = async (
  orderIds: string[],
  status: 'Pending' | 'Approved' | 'Cancelled'
): Promise<boolean> => {
  if (!orderIds.length) return true;
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .in('id', orderIds);

    if (error) {
      console.error('Error bulk updating orders in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception bulk updating orders:', err);
    return false;
  }
};

// ─── UPDATE ORDER DETAILS (Edit Modal) ───
export type OrderEditFields = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  city: string;
  totalAmount: number;
};

export const updateOrderDetails = async (
  orderId: string,
  fields: OrderEditFields
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update(fields)
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order details in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception updating order details:', err);
    return false;
  }
};

export const deleteOrder = async (orderId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Error deleting order in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception deleting order:', err);
    return false;
  }
};

// ─── LEGACY: No longer used. Orders are now Supabase-only. ───
export const saveOrders = (_orders: Order[]) => {
  // No-op: localStorage orders are deprecated. Supabase is the single source of truth.
};
