import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

export const transactionService = {
  // Get all transactions (admin)
  async getAllTransactions() {
    console.log('📊 Fetching all transactions...');
    
    // First, get all transactions without nested selects (to avoid RLS issues with nested tables)
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (txError) {
      console.error('❌ Error fetching transactions:', txError);
      throw txError;
    }
    
    console.log(`✅ Found ${transactions?.length || 0} transactions`);
    
    if (!transactions || transactions.length === 0) {
      console.warn('⚠️ No transactions found in database');
      return [];
    }
    
    // Then fetch user and reservation data separately to avoid RLS issues
    const userIds = [...new Set(transactions.map(t => t.user_id))];
    const reservationIds = [...new Set(transactions.map(t => t.reservation_id).filter(Boolean))];
    
    let users: any[] = [];
    let reservations: any[] = [];
    
    if (userIds.length > 0) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);
      
      if (userError) {
        console.warn('⚠️ Could not fetch users:', userError);
      } else {
        users = userData || [];
      }
    }
    
    if (reservationIds.length > 0) {
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select(`
          *,
          motorcycles(id, name, type, image, price_per_day)
        `)
        .in('id', reservationIds);
      
      if (resError) {
        console.warn('⚠️ Could not fetch reservations:', resError);
      } else {
        reservations = resData || [];
      }
    }
    
    // Merge the data together
    const result = transactions.map(transaction => ({
      ...transaction,
      user: users.find(u => u.id === transaction.user_id),
      reservation: reservations.find(r => r.id === transaction.reservation_id)
    }));
    
    console.log('✅ Transaction data merged successfully');
    return result;
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
    console.log('💾 Creating transaction with data:', {
      user_id: transaction.user_id,
      reservation_id: transaction.reservation_id,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      date: transaction.date
    });
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction as any)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error on transaction insert:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        throw error;
      }
      
      if (!data) {
        console.error('❌ No data returned from transaction insert');
        throw new Error('No data returned from insert');
      }
      
      console.log('✅ Transaction created successfully with ID:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Error creating transaction:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
      throw error;
    }
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

  // Delete transactions by reservation ID
  async deleteReservationTransactions(reservationId: string) {
    console.log('🗑️ Deleting transactions for reservation:', reservationId);
    
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('reservation_id', reservationId)
      .select();

    if (error) {
      console.error('❌ Error deleting reservation transactions:', error);
      throw error;
    }
    
    console.log(`✅ Deleted ${data?.length || 0} transaction(s) for reservation`);
    return data;
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
      // First, check if transaction exists
      const { data: existingTx, error: checkError } = await supabase
        .from('transactions')
        .select('*')
        .eq('reservation_id', reservationId)
        .eq('type', 'payment')
        .maybeSingle();

      if (checkError) {
        console.warn('⚠️ Error checking for existing transaction:', checkError);
      }

      let txData: any[] = [];
      let txError: any = null;

      if (!existingTx) {
        // Transaction doesn't exist - create it first with reservation details
        console.log('📝 No transaction found, creating new one...');
        
        // Get reservation details to calculate amount
        const { data: reservation, error: resError } = await supabase
          .from('reservations')
          .select('*')
          .eq('id', reservationId)
          .single();

        if (resError || !reservation) {
          console.error('❌ Could not fetch reservation:', resError);
          throw new Error('Could not fetch reservation details');
        }

        // Create transaction with reservation data
        const { data: newTx, error: createError } = await supabase
          .from('transactions')
          .insert({
            user_id: reservation.user_id,
            reservation_id: reservationId,
            type: 'payment',
            amount: reservation.total_price,
            date: new Date().toISOString().split('T')[0],
            status: status,
            description: `Payment for reservation ${reservationId} - Total: ₱${reservation.total_price}`,
          })
          .select();

        if (createError) {
          console.error('❌ Error creating transaction:', createError);
          txError = createError;
        } else {
          console.log(`✅ Created new transaction with status ${status}`, newTx);
          txData = newTx || [];
        }
      } else {
        // Transaction exists - update its status
        console.log('🔄 Updating existing transaction...');
        const { data: updateTx, error: updateError } = await supabase
          .from('transactions')
          .update({ status })
          .eq('reservation_id', reservationId)
          .eq('type', 'payment')
          .select();

        if (updateError) {
          console.error('❌ Error updating transaction:', updateError);
          txError = updateError;
        } else {
          console.log(`✅ Updated transaction to ${status}`, updateTx);
          txData = updateTx || [];
        }
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
