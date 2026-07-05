import { supabase } from '../lib/supabase';

export const loadSizes = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('sizes')
      .select('name')
      .order('id', { ascending: true });
      
    if (error) {
      console.error('Error fetching sizes from Supabase:', error);
      return [];
    }
    
    return (data as { name: string }[]).map(item => item.name);
  } catch (err) {
    console.error('Exception fetching sizes:', err);
    return [];
  }
};

export const addSizeToDb = async (name: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sizes')
      .insert([{ name }]);
      
    if (error) {
      console.error('Error adding size to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception adding size:', err);
    return false;
  }
};

export const deleteSizeFromDb = async (name: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sizes')
      .delete()
      .eq('name', name);
      
    if (error) {
      console.error('Error deleting size from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception deleting size:', err);
    return false;
  }
};
