import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type GPSTracking = Database['public']['Tables']['gps_tracking']['Row'];
type GPSTrackingInsert = Database['public']['Tables']['gps_tracking']['Insert'];
type GPSTrackingUpdate = Database['public']['Tables']['gps_tracking']['Update'];

export const gpsService = {
  // Get all GPS tracking data
  async getAllGPSData() {
    const { data, error } = await supabase
      .from('gps_tracking')
      .select(`
        *,
        motorcycle:motorcycles(*),
        reservation:reservations(*)
      `)
      .order('last_update', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get GPS data by motorcycle
  async getMotorcycleGPS(motorcycleId: string) {
    const { data, error } = await supabase
      .from('gps_tracking')
      .select(`
        *,
        motorcycle:motorcycles(*),
        reservation:reservations(*)
      `)
      .eq('motorcycle_id', motorcycleId)
      .order('last_update', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  },

  // Get active GPS tracking (motorcycles currently in use)
  async getActiveGPS() {
    const { data, error } = await supabase
      .from('gps_tracking')
      .select(`
        *,
        motorcycle:motorcycles(*),
        reservation:reservations(*)
      `)
      .eq('status', 'active')
      .order('last_update', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get GPS data by status
  async getGPSByStatus(status: 'active' | 'idle' | 'maintenance' | 'offline') {
    const { data, error } = await supabase
      .from('gps_tracking')
      .select(`
        *,
        motorcycle:motorcycles(*)
      `)
      .eq('status', status)
      .order('last_update', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create or update GPS data
  async upsertGPSData(gpsData: GPSTrackingInsert) {
    const { data, error } = await supabase
      .from('gps_tracking')
      .upsert(gpsData, {
        onConflict: 'motorcycle_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update GPS location
  async updateGPSLocation(
    motorcycleId: string,
    latitude: number,
    longitude: number,
    locationAddress: string,
    speed?: number
  ) {
    const { data, error } = await supabase
      .from('gps_tracking')
      .update({
        latitude,
        longitude,
        location_address: locationAddress,
        speed: speed || 0,
        last_update: new Date().toISOString()
      })
      .eq('motorcycle_id', motorcycleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update fuel and battery levels
  async updateLevels(motorcycleId: string, fuelLevel: number, batteryLevel: number) {
    const { data, error } = await supabase
      .from('gps_tracking')
      .update({
        fuel_level: fuelLevel,
        battery_level: batteryLevel,
        last_update: new Date().toISOString()
      })
      .eq('motorcycle_id', motorcycleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update GPS status
  async updateGPSStatus(motorcycleId: string, status: 'active' | 'idle' | 'maintenance' | 'offline') {
    const { data, error } = await supabase
      .from('gps_tracking')
      .update({
        status,
        last_update: new Date().toISOString()
      })
      .eq('motorcycle_id', motorcycleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Subscribe to GPS updates (realtime)
  subscribeToGPSUpdates(callback: (gpsData: GPSTracking) => void) {
    const subscription = supabase
      .channel('gps_tracking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gps_tracking'
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as GPSTracking);
          }
        }
      )
      .subscribe();

    return subscription;
  },

  // Get GPS history for a motorcycle
  async getGPSHistory(motorcycleId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('gps_tracking')
      .select('*')
      .eq('motorcycle_id', motorcycleId)
      .order('last_update', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
};
