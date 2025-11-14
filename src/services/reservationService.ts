import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Reservation = Database['public']['Tables']['reservations']['Row'];
type ReservationInsert = Database['public']['Tables']['reservations']['Insert'];
type ReservationUpdate = Database['public']['Tables']['reservations']['Update'];

export const reservationService = {
  // Get all reservations (admin)
  async getAllReservations() {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        user:users(*),
        motorcycle:motorcycles(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get user's reservations
  async getUserReservations(userId: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        motorcycle:motorcycles(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get reservation by ID
  async getReservationById(id: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        user:users(*),
        motorcycle:motorcycles(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get reservations by status
  async getReservationsByStatus(status: 'pending' | 'confirmed' | 'cancelled' | 'completed') {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        user:users(*),
        motorcycle:motorcycles(*)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create reservation
  async createReservation(reservation: ReservationInsert) {
    const { data, error } = await supabase
      .from('reservations')
      .insert(reservation)
      .select(`
        *,
        motorcycle:motorcycles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Update reservation
  async updateReservation(id: string, updates: ReservationUpdate) {
    const { data, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        motorcycle:motorcycles(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Update reservation status
  async updateStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') {
    // First get the reservation details to send notification
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        *,
        motorcycle:motorcycles(name)
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Update the status
    const { data, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Send notification for status changes
    if (status === 'cancelled' || status === 'confirmed' || status === 'completed') {
      try {
        let notificationData = {
          user_id: (reservation as any).user_id,
          reference_id: id,
          reference_type: 'reservation',
          type: '',
          title: '',
          message: ''
        };

        const motorcycleName = (reservation as any).motorcycle?.name || 'the motorcycle';

        if (status === 'cancelled') {
          notificationData.type = 'reservation_cancelled';
          notificationData.title = 'Reservation Cancelled';
          notificationData.message = `Your reservation for ${motorcycleName} has been cancelled.`;
        } else if (status === 'confirmed') {
          notificationData.type = 'reservation_confirmed';
          notificationData.title = 'Reservation Confirmed';
          notificationData.message = `Your reservation for ${motorcycleName} has been confirmed!`;
        } else if (status === 'completed') {
          notificationData.type = 'reservation_completed';
          notificationData.title = 'Reservation Completed';
          notificationData.message = `Your reservation for ${motorcycleName} has been completed. Thank you!`;
        }

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notificationData);

        if (notificationError) {
          console.error('⚠️ Failed to create notification:', notificationError);
        } else {
          console.log(`✅ ${status} notification sent to user`);
        }
      } catch (notifError) {
        console.error('⚠️ Notification error:', notifError);
      }
    }

    return data;
  },

  // Cancel reservation
  async cancelReservation(id: string) {
    // First get the reservation details to get user_id and motorcycle info
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        *,
        motorcycle:motorcycles(name)
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Update the reservation status
    const result = await this.updateStatus(id, 'cancelled');

    // Create notification for the user
    try {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: (reservation as any).user_id,
          type: 'reservation_cancelled',
          title: 'Reservation Cancelled',
          message: `Your reservation for ${(reservation as any).motorcycle?.name || 'the motorcycle'} has been cancelled.`,
          reference_id: id,
          reference_type: 'reservation'
        });

      if (notificationError) {
        console.error('⚠️ Failed to create cancellation notification:', notificationError);
        // Don't throw - reservation is already cancelled
      } else {
        console.log('✅ Cancellation notification sent to user');
      }
    } catch (notifError) {
      console.error('⚠️ Notification error:', notifError);
      // Don't throw - reservation is already cancelled
    }

    return result;
  },

  // Get pending reservations count
  async getPendingCount() {
    const { count, error } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;
    return count || 0;
  },

  // Get active reservations (confirmed)
  async getActiveReservations() {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        user:users(*),
        motorcycle:motorcycles(*)
      `)
      .eq('status', 'confirmed')
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get upcoming reservations for a motorcycle
  async getMotorcycleReservations(motorcycleId: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('motorcycle_id', motorcycleId)
      .in('status', ['confirmed', 'pending'])
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data;
  }
};
