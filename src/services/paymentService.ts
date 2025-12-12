/**
 * Payment Service - Cash-Only Mode
 * 
 * Handles all payment processing operations for cash payments:
 * - Creating payment records
 * - Confirming cash payments
 * - Refunds and cancellations
 * - Payment history
 * 
 * NOTE: This application uses CASH-ONLY payment model.
 * All payments must be collected in-person during motorcycle pickup.
 */

import { supabase } from '../lib/supabase';

// Payment status types
export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export type PaymentMethod = 'cash';

export interface Payment {
  id: string;
  reservation_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  stripe_refund_id?: string;
  refund_amount?: number;
  refund_reason?: string;
  metadata?: Record<string, any>;
  error_message?: string;
  paid_at?: string;
  refunded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentIntentParams {
  reservationId: string;
  userId: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface RefundPaymentParams {
  paymentId: string;
  amount?: number; // If not provided, full refund
  reason?: string;
}

/**
 * Initialize Stripe (client-side)
 * DEPRECATED - No longer used in cash-only mode
 */
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = Promise.reject(new Error('Stripe is not available in cash-only mode'));
  }
  return stripePromise;
};

/**
 * Create a payment record for a cash reservation
 * Cash payments are always set to 'pending' status and collected during pickup
 */
export const createPaymentIntent = async (
  params: CreatePaymentIntentParams
): Promise<{ payment: Payment }> => {
  const { reservationId, userId, amount, currency = 'PHP', metadata = {} } = params;

  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        reservation_id: reservationId,
        user_id: userId,
        amount,
        currency,
        status: 'pending',
        payment_method: 'cash',
        metadata: {
          ...metadata,
          note: 'Cash payment to be collected on pickup',
        },
      })
      .select()
      .single();

    if (error) throw error;

    return { payment };
  } catch (error: any) {
    console.error('Error creating payment record:', error);
    throw new Error(error.message || 'Failed to create payment record');
  }
};

/**
 * Process a cash payment (admin confirms payment received)
 */
export const processPayment = async (paymentId: string): Promise<Payment> => {
  try {
    const { data: updatedPayment, error } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        paid_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    return updatedPayment;
  } catch (error: any) {
    console.error('Error processing payment:', error);
    throw new Error(error.message || 'Failed to process payment');
  }
};

/**
 * Confirm a cash payment (admin use)
 */
export const confirmCashPayment = async (paymentId: string): Promise<Payment> => {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        paid_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    return payment;
  } catch (error: any) {
    console.error('Error confirming cash payment:', error);
    throw new Error(error.message || 'Failed to confirm cash payment');
  }
};

/**
 * Refund a cash payment
 */
export const refundPayment = async (
  paymentId: string,
  amount?: number,
  reason?: string
): Promise<Payment> => {
  try {
    // Get payment details
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError) throw fetchError;

    if (payment.status !== 'succeeded') {
      throw new Error('Can only refund succeeded payments');
    }

    const refundAmount = amount || payment.amount;

    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: refundAmount === payment.amount ? 'refunded' : 'partially_refunded',
        refund_amount: refundAmount,
        refund_reason: reason || 'Requested by customer',
        refunded_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (updateError) throw updateError;

    return updatedPayment;
  } catch (error: any) {
    console.error('Error refunding payment:', error);
    throw new Error(error.message || 'Failed to refund payment');
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId: string): Promise<Payment | null> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching payment:', error);
    return null;
  }
};

/**
 * Get payment by reservation ID
 */
export const getPaymentByReservationId = async (
  reservationId: string
): Promise<Payment | null> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching payment by reservation:', error);
    return null;
  }
};

/**
 * Get user's payment history
 */
export const getUserPaymentHistory = async (userId: string): Promise<Payment[]> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, reservations(motorcycle_id, start_date, end_date)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    return [];
  }
};

/**
 * Get all payments (admin use)
 */
export const getAllPayments = async (filters?: {
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
}): Promise<Payment[]> => {
  try {
    let query = supabase
      .from('payments')
      .select(`
        *,
        users(name, email),
        reservations(
          motorcycle_id,
          start_date,
          end_date,
          motorcycles(name, brand, model)
        )
      `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.paymentMethod) {
      query = query.eq('payment_method', filters.paymentMethod);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error fetching all payments:', error);
    return [];
  }
};

/**
 * Calculate total revenue
 */
export const getTotalRevenue = async (filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<number> => {
  try {
    let query = supabase
      .from('payments')
      .select('amount')
      .in('status', ['succeeded', 'partially_refunded']);

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data?.reduce((total, payment) => total + payment.amount, 0) || 0;
  } catch (error: any) {
    console.error('Error calculating revenue:', error);
    return 0;
  }
};

/**
 * Get payment statistics
 */
export const getPaymentStatistics = async () => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('status, amount, payment_method');

    if (error) throw error;

    const stats = {
      total: payments?.length || 0,
      succeeded: payments?.filter(p => p.status === 'succeeded').length || 0,
      pending: payments?.filter(p => p.status === 'pending').length || 0,
      failed: payments?.filter(p => p.status === 'failed').length || 0,
      refunded: payments?.filter(p => p.status === 'refunded').length || 0,
      totalRevenue: payments
        ?.filter(p => ['succeeded', 'partially_refunded'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0) || 0,
      byMethod: {
        cash: payments?.filter(p => p.payment_method === 'cash').length || 0,
      },
    };

    return stats;
  } catch (error: any) {
    console.error('Error fetching payment statistics:', error);
    return {
      total: 0,
      succeeded: 0,
      pending: 0,
      failed: 0,
      refunded: 0,
      totalRevenue: 0,
      byMethod: { cash: 0 },
    };
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number, currency: string = 'PHP'): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Get payment status badge color
 */
export const getPaymentStatusColor = (status: PaymentStatus): string => {
  const colors: Record<PaymentStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    succeeded: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-purple-100 text-purple-800',
    partially_refunded: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Test payment service - DEPRECATED
 * Use backend API endpoints for payment operations instead
 */
// export const testPaymentService = async () => {
//   // Function removed in production build
// };
