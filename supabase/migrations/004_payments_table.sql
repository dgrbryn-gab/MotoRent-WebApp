-- Migration: Add Payments Table for Stripe Integration
-- Description: Creates payments table to track all payment transactions

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment amount and currency
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'PHP' NOT NULL,
  
  -- Payment status
  status VARCHAR(50) DEFAULT 'pending' NOT NULL 
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
  
  -- Payment method
  payment_method VARCHAR(50) DEFAULT 'card' NOT NULL
    CHECK (payment_method IN ('card', 'gcash', 'cash')),
  
  -- Stripe integration fields
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_refund_id VARCHAR(255),
  
  -- Refund information
  refund_amount DECIMAL(10, 2),
  refund_reason TEXT,
  
  -- Additional metadata (JSON for flexibility)
  metadata JSONB DEFAULT '{}',
  
  -- Error tracking
  error_message TEXT,
  
  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_method ON payments(payment_method);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at_trigger
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
  ON payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own payments
CREATE POLICY "Users can create their own payments"
  ON payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending payments (e.g., payment confirmation)
CREATE POLICY "Users can update their own pending payments"
  ON payments
  FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'processing'));

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Admins can update any payment (for refunds, status changes, etc.)
CREATE POLICY "Admins can update any payment"
  ON payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Admins can delete payments
CREATE POLICY "Admins can delete payments"
  ON payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Add payment_status to reservations table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='reservations' AND column_name='payment_status'
  ) THEN
    ALTER TABLE reservations 
    ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid'
      CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'failed'));
  END IF;
END $$;

-- Create view for payment analytics
CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_payments,
  SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as successful_payments,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
  SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refunded_payments,
  SUM(CASE WHEN status IN ('succeeded', 'partially_refunded') THEN amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN status = 'refunded' THEN refund_amount ELSE 0 END) as total_refunds,
  payment_method,
  currency
FROM payments
GROUP BY DATE_TRUNC('day', created_at), payment_method, currency
ORDER BY date DESC;

-- Grant access to payment_analytics view
GRANT SELECT ON payment_analytics TO authenticated;

-- Function to get user's total spent
CREATE OR REPLACE FUNCTION get_user_total_spent(user_uuid UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM payments
  WHERE user_id = user_uuid 
    AND status IN ('succeeded', 'partially_refunded');
$$ LANGUAGE SQL STABLE;

-- Function to get payment statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_payment_stats()
RETURNS TABLE (
  total_payments BIGINT,
  successful_payments BIGINT,
  pending_payments BIGINT,
  failed_payments BIGINT,
  total_revenue DECIMAL,
  today_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_payments,
    COUNT(*) FILTER (WHERE status = 'succeeded')::BIGINT as successful_payments,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_payments,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_payments,
    COALESCE(SUM(amount) FILTER (WHERE status IN ('succeeded', 'partially_refunded')), 0) as total_revenue,
    COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded' AND created_at >= CURRENT_DATE), 0) as today_revenue
  FROM payments;
END;
$$ LANGUAGE plpgsql STABLE;

-- Comments for documentation
COMMENT ON TABLE payments IS 'Stores all payment transactions including Stripe payments, GCash, and cash payments';
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'Stripe Payment Intent ID for online card payments';
COMMENT ON COLUMN payments.metadata IS 'Additional payment metadata stored as JSON (e.g., customer notes, transaction details)';
COMMENT ON COLUMN payments.refund_amount IS 'Amount refunded (can be partial)';
