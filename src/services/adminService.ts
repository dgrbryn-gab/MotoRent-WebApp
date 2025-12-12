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
  },

  // Get top motorcycles by rental count
  async getTopMotorcyclesByRentals(limit: number = 5) {
    const { data, error } = await supabase
      .from('reservations')
      .select('motorcycle_id, motorcycles(name, hourly_rate)')
      .eq('status', 'completed');

    if (error) throw error;

    const motorcycles = data || [];
    const grouped: Record<string, { name: string; count: number; rate: number }> = {};
    
    motorcycles.forEach((r: any) => {
      const id = r.motorcycle_id;
      if (!grouped[id]) {
        grouped[id] = { name: r.motorcycles?.name || 'Unknown', count: 0, rate: r.motorcycles?.hourly_rate || 0 };
      }
      grouped[id].count++;
    });

    return Object.values(grouped)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(m => ({ name: m.name, value: m.count }));
  },

  // Get daily reservation count for last 30 days
  async getDailyReservationTrend(days: number = 30) {
    const { data, error } = await supabase
      .from('reservations')
      .select('created_at, status');

    if (error) throw error;

    const today = new Date();
    const dailyData: Record<string, number> = {};
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      dailyData[dateKey] = 0;
    }

    (data || []).forEach((r: any) => {
      const dateKey = new Date(r.created_at).toISOString().split('T')[0];
      if (dateKey in dailyData) {
        dailyData[dateKey]++;
      }
    });

    return Object.entries(dailyData).map(([date, count]) => ({ date, count }));
  },

  // Get motorcycle utilization rate
  async getMotorcycleUtilization() {
    const { data: motorcycles, error: mError } = await supabase
      .from('motorcycles')
      .select('id, name, availability');

    const { data: reservations, error: rError } = await supabase
      .from('reservations')
      .select('motorcycle_id, status')
      .eq('status', 'confirmed');

    if (mError) throw mError;
    if (rError) throw rError;

    const total = motorcycles?.length || 0;
    const inUse = reservations?.length || 0;
    const utilization = total > 0 ? Math.round((inUse / total) * 100) : 0;

    return {
      utilization,
      inUse,
      available: total - inUse,
      total
    };
  },

  // Get payment success rate
  async getPaymentSuccessRate() {
    const { data, error } = await supabase
      .from('transactions')
      .select('status, type');

    if (error) throw error;

    const transactions = data || [];
    const completed = transactions.filter(t => t.status === 'completed').length;
    const total = transactions.length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { successRate, completed, total };
  },

  // Get average reservation value
  async getAverageReservationValue() {
    const { data, error } = await supabase
      .from('reservations')
      .select('total_price')
      .eq('status', 'completed');

    if (error) throw error;

    const reservations = data || [];
    if (reservations.length === 0) return 0;
    
    const total = reservations.reduce((sum, r: any) => sum + (r.total_price || 0), 0);
    return Math.round(total / reservations.length);
  },

  // Get repeat customer rate
  async getRepeatCustomerRate() {
    const { data, error } = await supabase
      .from('reservations')
      .select('user_id');

    if (error) throw error;

    const reservations = data || [];
    const userCounts: Record<string, number> = {};
    
    reservations.forEach((r: any) => {
      userCounts[r.user_id] = (userCounts[r.user_id] || 0) + 1;
    });

    const repeatCustomers = Object.values(userCounts).filter(count => count > 1).length;
    const totalCustomers = Object.keys(userCounts).length;
    const rate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    return { rate, repeatCustomers, totalCustomers };
  },

  // Get revenue breakdown by type
  async getRevenueBreakdown() {
    const { data, error } = await supabase
      .from('reservations')
      .select('total_price, status, created_at');

    if (error) throw error;

    const reservations = data || [];
    const today = new Date();
    
    const thisMonth = reservations
      .filter(r => {
        const rDate = new Date(r.created_at);
        return rDate.getMonth() === today.getMonth() && rDate.getFullYear() === today.getFullYear();
      })
      .reduce((sum, r: any) => sum + (r.total_price || 0), 0);

    const thisWeek = reservations
      .filter(r => {
        const rDate = new Date(r.created_at);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return rDate >= weekAgo;
      })
      .reduce((sum, r: any) => sum + (r.total_price || 0), 0);

    const today_revenue = reservations
      .filter(r => {
        const rDate = new Date(r.created_at);
        return rDate.toDateString() === today.toDateString();
      })
      .reduce((sum, r: any) => sum + (r.total_price || 0), 0);

    return { today: today_revenue, week: thisWeek, month: thisMonth };
  }
};
