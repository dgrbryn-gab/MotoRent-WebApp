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
        supabase.from('transactions').select('id, type, amount, status, description')
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

      // Helper function to extract breakdown from transaction description
      const extractBreakdown = (description: string) => {
        const subtotalMatch = description.match(/Subtotal:\s*₱([\d,]+)/);
        const depositMatch = description.match(/Security Deposit:\s*₱([\d,]+)/);
        
        if (subtotalMatch && depositMatch) {
          return {
            subtotal: parseFloat(subtotalMatch[1].replace(/,/g, '')),
            deposit: parseFloat(depositMatch[1].replace(/,/g, '')),
          };
        }
        return null;
      };

      // Calculate revenue from COMPLETED TRANSACTIONS
      // Only the rental portion (subtotal), excluding security deposits
      // This matches the Transactions page calculation for consistency
      const completedPayments = transactions.filter(t => 
        t.type === 'payment' && t.status === 'completed'
      );
      
      const totalRevenue = completedPayments.reduce((sum, t) => {
        const breakdown = extractBreakdown(t.description || '');
        if (breakdown) {
          // Only count the rental amount (subtotal), not the deposit
          return sum + breakdown.subtotal;
        }
        // Fallback for old transactions without breakdown
        // Assume 20% is deposit, so subtotal = total / 1.20
        return sum + (t.amount / 1.20);
      }, 0);
      
      const completedDeposits = transactions.filter(t => 
        t.type === 'deposit' && t.status === 'completed'
      );
      const totalDeposits = completedDeposits.reduce((sum, t) => sum + (t.amount || 0), 0);

      const completedRefunds = transactions.filter(t => 
        t.type === 'refund' && t.status === 'completed'
      );
      const totalRefunds = completedRefunds.reduce((sum, t) => sum + (t.amount || 0), 0);

      // Count completed payment transactions for the dashboard
      const paymentTransactions = completedPayments.length;

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
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('motorcycle_id, status')
        .eq('status', 'completed');

      if (error) throw error;

      const reservations = data || [];
      
      // Group by motorcycle_id
      const grouped: Record<string, number> = {};
      reservations.forEach((r: any) => {
        const id = r.motorcycle_id;
        grouped[id] = (grouped[id] || 0) + 1;
      });

      // Get top motorcycles
      const topIds = Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      if (topIds.length === 0) {
        return [];
      }

      // Fetch motorcycle details
      const { data: motorcycles, error: motoError } = await supabase
        .from('motorcycles')
        .select('id, name')
        .in('id', topIds);

      if (motoError) throw motoError;

      // Map back with counts
      return topIds.map(id => {
        const moto = motorcycles?.find((m: any) => m.id === id);
        return {
          name: moto?.name || 'Unknown',
          value: grouped[id]
        };
      });
    } catch (error) {
      console.error('Error fetching top motorcycles:', error);
      return [];
    }
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
      .from('transactions')
      .select('amount, date, type, status, description')
      .eq('type', 'payment')
      .eq('status', 'completed');

    if (error) throw error;

    // Helper function to extract breakdown from transaction description
    const extractBreakdown = (description: string) => {
      const subtotalMatch = description.match(/Subtotal:\s*₱([\d,]+)/);
      const depositMatch = description.match(/Security Deposit:\s*₱([\d,]+)/);
      
      if (subtotalMatch && depositMatch) {
        return {
          subtotal: parseFloat(subtotalMatch[1].replace(/,/g, '')),
          deposit: parseFloat(depositMatch[1].replace(/,/g, '')),
        };
      }
      return null;
    };

    const transactions: any[] = data || [];
    const today = new Date();
    
    const thisMonth = transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
      })
      .reduce((sum, t) => {
        const breakdown = extractBreakdown(t.description || '');
        if (breakdown) {
          return sum + breakdown.subtotal;
        }
        // Fallback for old transactions without breakdown
        return sum + (t.amount / 1.20);
      }, 0);

    const thisWeek = transactions
      .filter(t => {
        const tDate = new Date(t.date);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return tDate >= weekAgo;
      })
      .reduce((sum, t) => {
        const breakdown = extractBreakdown(t.description || '');
        if (breakdown) {
          return sum + breakdown.subtotal;
        }
        return sum + (t.amount / 1.20);
      }, 0);

    const today_revenue = transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate.toDateString() === today.toDateString();
      })
      .reduce((sum, t) => {
        const breakdown = extractBreakdown(t.description || '');
        if (breakdown) {
          return sum + breakdown.subtotal;
        }
        return sum + (t.amount / 1.20);
      }, 0);

    return { today: today_revenue, week: thisWeek, month: thisMonth };
  }
};
