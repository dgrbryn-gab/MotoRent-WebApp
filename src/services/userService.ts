import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

const db = supabase as unknown as SupabaseClient<Database>;

export const userService = {
  // Get all users (admin only)
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get user by ID
  async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get user by email
  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get user by username
  async getUserByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get user by email or username
  async getUserByEmailOrUsername(identifier: string) {
    // Try email first
    let user = await this.getUserByEmail(identifier);
    if (user) return user;

    // Try username
    user = await this.getUserByUsername(identifier);
    return user;
  },

  // Create new user
  async createUser(user: UserInsert) {
    const { data, error } = await db
      .from('users')
      .insert(user)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update user
  async updateUser(id: string, updates: UserUpdate) {
    const { data, error } = await db
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete user
  async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Check if email exists
  async emailExists(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  // Check if username exists
  async usernameExists(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  // Get users with driver licenses (for admin document verification)
  async getUsersWithDriverLicenses() {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, driver_license_url, license_number, updated_at')
      .not('driver_license_url', 'is', null);

    if (error) throw error;
    return { data, error: null };
  }
};
