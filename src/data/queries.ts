import { supabase } from '../lib/supabase';

export interface Query {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  date: string;
  status: 'Unread' | 'Resolved';
}

export const loadQueries = async (): Promise<Query[]> => {
  const { data, error } = await supabase
    .from('queries')
    .select('*')
    .order('date', { ascending: false });
    
  if (error) {
    console.error("Error fetching queries from Supabase", error);
    return [];
  }
  return data as Query[];
};

export const saveQuery = async (query: Query): Promise<boolean> => {
  const { error } = await supabase
    .from('queries')
    .insert([query]);
    
  if (error) {
    console.error("Error inserting query:", error);
    return false;
  }
  return true;
};

export const updateQueryStatus = async (id: string, status: string): Promise<boolean> => {
  const { error } = await supabase
    .from('queries')
    .update({ status })
    .eq('id', id);
    
  if (error) {
    console.error("Error updating query status:", error);
    return false;
  }
  return true;
};
