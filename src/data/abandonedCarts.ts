import { supabase } from '../lib/supabase';
import type { CartItem } from '../types';

export interface AbandonedCart {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  city?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  lastUpdated?: string;
}

// ─── FETCH ABANDONED CARTS ───
export const loadAbandonedCarts = async (): Promise<AbandonedCart[]> => {
  try {
    const { data, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .order('lastUpdated', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching abandoned carts from Supabase:', error);
      return [];
    }

    return (data as AbandonedCart[]) ?? [];
  } catch (err) {
    console.error('Exception fetching abandoned carts:', err);
    return [];
  }
};

// ─── UPSERT ABANDONED CART ───
export const saveAbandonedCart = async (cart: AbandonedCart): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('abandoned_carts')
      .upsert({ ...cart, lastUpdated: new Date().toISOString() }, { onConflict: 'id' });

    if (error) {
      console.error('Error saving abandoned cart to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception saving abandoned cart:', err);
    return false;
  }
};

// ─── DELETE ABANDONED CART ───
export const deleteAbandonedCart = async (cartId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('abandoned_carts')
      .delete()
      .eq('id', cartId);

    if (error) {
      console.error('Error deleting abandoned cart in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception deleting abandoned cart:', err);
    return false;
  }
};
