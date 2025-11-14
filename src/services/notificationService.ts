import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export const notificationService = {
  // Get all notifications for a user
  async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get unread notifications
  async getUnreadNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get unread count
  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },

  // Create notification
  async createNotification(notification: NotificationInsert) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark notification as read
  async markAsRead(id: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  // Delete notification
  async deleteNotification(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Clear all notifications for a user
  async clearAllNotifications(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Subscribe to new notifications (realtime)
  subscribeToUserNotifications(userId: string, callback: (notification: Notification) => void) {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return subscription;
  }
};
