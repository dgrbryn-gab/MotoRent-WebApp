-- Fix SECURITY DEFINER warnings for views
-- Change from SECURITY DEFINER to SECURITY INVOKER for all views

-- =====================================================
-- Fix active_reservations_view
-- =====================================================
DROP VIEW IF EXISTS active_reservations_view;

CREATE OR REPLACE VIEW active_reservations_view
WITH (security_invoker = true) AS
SELECT 
  r.id,
  r.user_id,
  r.motorcycle_id,
  r.start_date,
  r.end_date,
  r.status,
  r.total_price,
  r.customer_name,
  r.customer_email,
  r.customer_phone,
  r.payment_method,
  m.name as motorcycle_name,
  m.type as motorcycle_type,
  m.image as motorcycle_image,
  u.name as user_name,
  u.email as user_email
FROM reservations r
JOIN motorcycles m ON r.motorcycle_id = m.id
JOIN users u ON r.user_id = u.id
WHERE r.status IN ('pending', 'confirmed');

GRANT SELECT ON active_reservations_view TO authenticated;

COMMENT ON VIEW active_reservations_view IS 'Shows active reservations with motorcycle and user details. Uses SECURITY INVOKER for proper RLS enforcement.';

-- =====================================================
-- Fix motorcycle_availability_view
-- =====================================================
DROP VIEW IF EXISTS motorcycle_availability_view;

CREATE OR REPLACE VIEW motorcycle_availability_view
WITH (security_invoker = true) AS
SELECT 
  m.id,
  m.name,
  m.type,
  m.price_per_day,
  m.availability,
  m.image,
  COUNT(r.id) FILTER (WHERE r.status = 'confirmed') as active_rentals,
  COUNT(r.id) FILTER (WHERE r.status = 'pending') as pending_rentals
FROM motorcycles m
LEFT JOIN reservations r ON m.id = r.motorcycle_id
GROUP BY m.id, m.name, m.type, m.price_per_day, m.availability, m.image;

GRANT SELECT ON motorcycle_availability_view TO authenticated;

COMMENT ON VIEW motorcycle_availability_view IS 'Shows motorcycle availability with rental counts. Uses SECURITY INVOKER for proper RLS enforcement.';

-- =====================================================
-- Fix payment_analytics view (if not already fixed)
-- =====================================================
DROP VIEW IF EXISTS payment_analytics;

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

GRANT SELECT ON payment_analytics TO authenticated;

COMMENT ON VIEW payment_analytics IS 'Payment analytics aggregated by day. Uses SECURITY INVOKER for proper RLS enforcement.';
