-- Fix payment_analytics view security property
-- Change from SECURITY DEFINER to SECURITY INVOKER

DROP VIEW IF EXISTS payment_analytics;

-- Recreate view with SECURITY INVOKER
CREATE OR REPLACE VIEW payment_analytics
WITH (security_invoker = true) AS
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

COMMENT ON VIEW payment_analytics IS 'Payment analytics aggregated by day. Uses SECURITY INVOKER for proper RLS enforcement.';
