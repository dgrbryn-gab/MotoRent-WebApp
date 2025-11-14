import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

export const transactionService = {
  // Get all transactions (admin)
  async getAllTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        user:users(*),
        reservation:reservations(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get user's transactions
  async getUserTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get transaction by ID
  async getTransactionById(id: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        user:users(*),
        reservation:reservations(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create transaction
  async createTransaction(transaction: TransactionInsert) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update transaction status
  async updateTransactionStatus(reservationId: string, status: 'pending' | 'completed' | 'cancelled') {
    console.log('═══════════════════════════════════════');
    console.log('🔄 UPDATE TRANSACTION STATUS');
    console.log(`   Reservation ID: ${reservationId}`);
    console.log(`   Target Status: ${status}`);
    console.log('═══════════════════════════════════════');
    
    // First, let's check if any transactions exist for this reservation
    const { data: existingTransactions, error: checkError } = await supabase
      .from('transactions')
      .select('*')
      .eq('reservation_id', reservationId)
      .eq('type', 'payment');
    
    if (checkError) {
      console.error('❌ Error checking existing transactions:', checkError);
    } else {
      console.log(`📊 Found ${existingTransactions?.length || 0} payment transaction(s) for this reservation`);
      existingTransactions?.forEach(tx => {
        console.log(`   - Transaction ID: ${tx.id}, Current Status: ${tx.status}`);
      });
    }
    
    // Now perform the update
    const { data, error } = await supabase
      .from('transactions')
      .update({ status })
      .eq('reservation_id', reservationId)
      .eq('type', 'payment')
      .select();

    if (error) {
      console.error('❌ Error updating transaction status:', error);
      throw error;
    }
    
    console.log(`✅ Successfully updated ${data?.length || 0} transaction(s) to ${status}`);
    if (data && data.length > 0) {
      data.forEach(tx => {
        console.log(`   ✓ Transaction ID: ${tx.id} → Status: ${tx.status}`);
      });
    } else {
      console.warn('⚠️ WARNING: No transactions were updated! This might indicate:');
      console.warn('   1. No transaction exists with this reservation_id');
      console.warn('   2. Transaction type is not "payment"');
      console.warn('   3. Database permission issue');
    }
    console.log('═══════════════════════════════════════');
    
    return data;
  },

  // Get transactions by type
  async getTransactionsByType(type: 'payment' | 'deposit' | 'refund') {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', type)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get completed transactions total
  async getCompletedTotal() {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'payment')
      .eq('status', 'completed');

    if (error) throw error;
    
    const total = data?.reduce((sum, t) => sum + (t as any).amount, 0) || 0;
    return total;
  },

  // Get user's total spending
    async getUserTotalSpending(userId: string) {
      const { data, error } = await supabase
        .rpc('get_user_total_spending', { user_uuid: userId } as any);
  
      if (error) throw error;
      return data || 0;
    },

  // Get transactions by reservation
  async getReservationTransactions(reservationId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Delete transaction (admin only)
  async deleteTransaction(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Delete all transactions (admin only)
  async deleteAllTransactions() {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (error) throw error;
  },

  // Sync transaction and payment status (Option 3: Keep both in sync)
  async syncTransactionAndPaymentStatus(
    reservationId: string, 
    status: 'pending' | 'completed' | 'cancelled'
  ) {
    console.log('═══════════════════════════════════════');
    console.log('🔄 SYNC TRANSACTION & PAYMENT STATUS');
    console.log(`   Reservation ID: ${reservationId}`);
    console.log(`   Target Status: ${status}`);
    console.log('═══════════════════════════════════════');

    // Map transaction status to payment status
    const paymentStatusMap = {
      'pending': 'pending' as const,
      'completed': 'succeeded' as const,
      'cancelled': 'cancelled' as const,
    };

    const paymentStatus = paymentStatusMap[status];

    try {
      // Update TRANSACTION record (simplified tracking)
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .update({ status })
        .eq('reservation_id', reservationId)
        .eq('type', 'payment')
        .select();

      if (txError) {
        console.error('❌ Error updating transaction:', txError);
      } else {
        console.log(`✅ Updated ${txData?.length || 0} transaction(s) to ${status}`);
      }

      // Update PAYMENT record (detailed tracking)
      const { data: pmData, error: pmError } = await supabase
        .from('payments')
        .update({ 
          status: paymentStatus,
          paid_at: status === 'completed' ? new Date().toISOString() : undefined
        })
        .eq('reservation_id', reservationId)
        .eq('payment_method', 'cash')
        .select();

      if (pmError) {
        console.error('❌ Error updating payment:', pmError);
      } else {
        console.log(`✅ Updated ${pmData?.length || 0} payment(s) to ${paymentStatus}`);
      }

      console.log('═══════════════════════════════════════');
      
      return {
        transactionUpdated: txData && txData.length > 0,
        paymentUpdated: pmData && pmData.length > 0,
        transactionData: txData,
        paymentData: pmData,
      };
    } catch (error) {
      console.error('❌ Error syncing transaction and payment:', error);
      throw error;
    }
  }
};
