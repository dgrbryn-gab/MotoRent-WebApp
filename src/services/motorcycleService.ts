import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { transformMotorcycle, transformMotorcycles } from '../utils/supabaseHelpers';

type Motorcycle = Database['public']['Tables']['motorcycles']['Row'];
type MotorcycleInsert = Database['public']['Tables']['motorcycles']['Insert'];
type MotorcycleUpdate = Database['public']['Tables']['motorcycles']['Update'];

export const motorcycleService = {
  // Get all motorcycles
  async getAllMotorcycles() {
    const { data, error } = await supabase
      .from('motorcycles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return transformMotorcycles(data || []);
  },

  // Get available motorcycles
  async getAvailableMotorcycles() {
    const { data, error } = await supabase
      .from('motorcycles')
      .select('*')
      .eq('availability', 'Available')
      .order('name');

    if (error) throw error;
    return transformMotorcycles(data || []);
  },

  // Get motorcycle by ID
  async getMotorcycleById(id: string) {
    const { data, error } = await supabase
      .from('motorcycles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return transformMotorcycle(data);
  },

  // Search motorcycles
  async searchMotorcycles(searchTerm: string) {
    const { data, error } = await supabase
      .from('motorcycles')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%`)
      .order('name');

    if (error) throw error;
    return transformMotorcycles(data || []);
  },

  // Filter by type
  async getMotorcyclesByType(type: string) {
    const { data, error } = await supabase
      .from('motorcycles')
      .select('*')
      .eq('type', type)
      .order('name');

    if (error) throw error;
    return transformMotorcycles(data || []);
  },

  // Create motorcycle (admin)
  async createMotorcycle(motorcycle: MotorcycleInsert) {
    const { data, error } = await supabase
      .from('motorcycles')
      .insert(motorcycle)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update motorcycle (admin)
  async updateMotorcycle(id: string, updates: MotorcycleUpdate) {
    const { data, error } = await supabase
      .from('motorcycles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete motorcycle (admin)
  async deleteMotorcycle(id: string) {
    const { error } = await supabase
      .from('motorcycles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Update availability
  async updateAvailability(id: string, availability: 'Available' | 'Reserved' | 'In Maintenance') {
    const { data, error } = await supabase
      .from('motorcycles')
      .update({ availability })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Check availability for date range
  async checkAvailability(motorcycleId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .rpc('check_motorcycle_availability', {
        motorcycle_uuid: motorcycleId,
        check_start_date: startDate,
        check_end_date: endDate
      });

    if (error) throw error;
    return data;
  }
};
