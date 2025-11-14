import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type AdminUser = Database['public']['Tables']['admin_users']['Row'];

export const adminService = {
  // Get admin user by email
  async getAdminByEmail(email: string) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  },

  // Get admin user by ID
  async getAdminById(id: string) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update last login
  async updateLastLogin(id: string) {
    const { data, error } = await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() } as unknown as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all admins (super-admin only)
  async getAllAdmins() {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // =====================================================
  // DASHBOARD STATISTICS
  // =====================================================

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      // Fetch all data in parallel
      const [
        motorcyclesResult,
        reservationsResult,
        usersResult,
        transactionsResult
      ] = await Promise.all([
        supabase.from('motorcycles').select('id, availability'),
        supabase.from('reservations').select('id, status, start_date, end_date, total_price, motorcycle_id, motorcycles(name)'),
        supabase.from('users').select('id'),
        supabase.from('transactions').select('id, type, amount, status')
      ]);

      // Handle errors
      if (motorcyclesResult.error) throw motorcyclesResult.error;
      if (reservationsResult.error) throw reservationsResult.error;
      if (usersResult.error) throw usersResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      const motorcycles: any[] = motorcyclesResult.data || [];
      const reservations: any[] = reservationsResult.data || [];
      const users: any[] = usersResult.data || [];
      const transactions: any[] = transactionsResult.data || [];

      // Calculate statistics
      const totalMotorcycles = motorcycles.length;
      const availableMotorcycles = motorcycles.filter(m => m.availability === 'Available').length;
      const reservedMotorcycles = motorcycles.filter(m => m.availability === 'Reserved').length;
      const maintenanceMotorcycles = motorcycles.filter(m => m.availability === 'In Maintenance').length;

      const totalReservations = reservations.length;
      const pendingReservations = reservations.filter(r => r.status === 'pending').length;
      const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length;
      const completedReservations = reservations.filter(r => r.status === 'completed').length;
      const cancelledReservations = reservations.filter(r => r.status === 'cancelled').length;

      const totalUsers = users.length;

      // Calculate revenue from COMPLETED RESERVATIONS (not transactions)
      // This is more accurate for a rental business
      const completedReservationsData = reservations.filter(r => r.status === 'completed');
      const totalRevenue = completedReservationsData.reduce((sum, r) => sum + (r.total_price || 0), 0);

      // Also keep transaction-based calculations for deposits/refunds
      const completedPayments = transactions.filter(t => 
        t.type === 'payment' && t.status === 'completed'
      );
      
      const completedDeposits = transactions.filter(t => 
        t.type === 'deposit' && t.status === 'completed'
      );
      const totalDeposits = completedDeposits.reduce((sum, t) => sum + (t.amount || 0), 0);

      const completedRefunds = transactions.filter(t => 
        t.type === 'refund' && t.status === 'completed'
      );
      const totalRefunds = completedRefunds.reduce((sum, t) => sum + (t.amount || 0), 0);

      // Count completed reservations as "payments" for the dashboard
      const paymentTransactions = completedReservationsData.length;

      // Debug logging
      console.log('📊 Dashboard Stats Debug:');
      console.log('Total users:', totalUsers);
      console.log('Total transactions:', transactions.length);
      console.log('Completed payments:', completedPayments.length, '- Amount:', totalRevenue);
      console.log('All transactions:', JSON.stringify(transactions, null, 2));
      console.log('Completed reservations:', completedReservations);

      // Recent reservations (last 5)
      const recentReservations = reservations
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        .slice(0, 5)
        .map(r => ({
          id: r.id,
          status: r.status,
          startDate: r.start_date,
          endDate: r.end_date,
          motorcycleName: r.motorcycles?.name || 'Unknown',
          totalPrice: r.total_price
        }));

      return {
        motorcycles: {
          total: totalMotorcycles,
          available: availableMotorcycles,
          reserved: reservedMotorcycles,
          maintenance: maintenanceMotorcycles
        },
        reservations: {
          total: totalReservations,
          pending: pendingReservations,
          confirmed: confirmedReservations,
          completed: completedReservations,
          cancelled: cancelledReservations,
          recent: recentReservations
        },
        users: {
          total: totalUsers
        },
        revenue: {
          total: totalRevenue,
          deposits: totalDeposits,
          refunds: totalRefunds,
          paymentCount: paymentTransactions
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get monthly revenue trend
  async getMonthlyRevenue(months: number = 6) {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, date, type, status')
      .eq('type', 'payment')
      .eq('status', 'completed')
      .order('date', { ascending: false });

    if (error) throw error;

    // Group by month
    const monthlyData: Record<string, number> = {};
    const transactions: any[] = data || [];
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + transaction.amount;
    });

    return monthlyData;
  },

  // Get pending verifications count
  async getPendingVerificationsCount() {
    const { count, error } = await supabase
      .from('document_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending');

    if (error) throw error;
    return count || 0;
  }
};
