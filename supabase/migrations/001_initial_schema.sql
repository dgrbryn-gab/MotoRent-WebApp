-- MotoRent Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- ADMIN USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'super-admin')) DEFAULT 'admin',
  last_login TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- =====================================================
-- MOTORCYCLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS motorcycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  engine_capacity INTEGER NOT NULL,
  transmission VARCHAR(20) CHECK (transmission IN ('Automatic', 'Manual')) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(50) NOT NULL,
  fuel_capacity DECIMAL(10, 2) NOT NULL,
  price_per_day DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  availability VARCHAR(20) CHECK (availability IN ('Available', 'Reserved', 'In Maintenance')) DEFAULT 'Available',
  rating DECIMAL(3, 2) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  fuel_type VARCHAR(20) CHECK (fuel_type IN ('Gasoline', 'Electric')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_motorcycles_availability ON motorcycles(availability);
CREATE INDEX IF NOT EXISTS idx_motorcycles_type ON motorcycles(type);

-- =====================================================
-- RESERVATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  motorcycle_id UUID NOT NULL REFERENCES motorcycles(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pickup_time TIME,
  return_time TIME,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'gcash')),
  gcash_reference_number VARCHAR(100),
  gcash_proof_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure end date is after start date
  CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_motorcycle_id ON reservations(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('payment', 'deposit', 'refund')) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('completed', 'pending', 'failed')) DEFAULT 'pending',
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reservation_id ON transactions(reservation_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('confirmed', 'rejected')) NOT NULL,
  motorcycle_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);

-- =====================================================
-- DOCUMENT VERIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS document_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(20) CHECK (document_type IN ('driver-license', 'valid-id')) NOT NULL,
  document_url TEXT NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_verifications_user_id ON document_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_document_verifications_status ON document_verifications(status);

-- =====================================================
-- GPS TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS gps_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  motorcycle_id UUID NOT NULL REFERENCES motorcycles(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2) DEFAULT 0,
  fuel_level DECIMAL(5, 2) DEFAULT 100,
  battery_level DECIMAL(5, 2) DEFAULT 100,
  location_address TEXT NOT NULL,
  status VARCHAR(20) CHECK (status IN ('active', 'idle', 'maintenance', 'offline')) DEFAULT 'idle',
  last_update TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gps_tracking_motorcycle_id ON gps_tracking(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_reservation_id ON gps_tracking(reservation_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_status ON gps_tracking(status);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_last_update ON gps_tracking(last_update DESC);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_motorcycles_updated_at BEFORE UPDATE ON motorcycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_verifications_updated_at BEFORE UPDATE ON document_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;

-- Public read access for motorcycles (anyone can view available motorcycles)
CREATE POLICY "Motorcycles are viewable by everyone" ON motorcycles
  FOR SELECT USING (true);

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can view their own reservations
CREATE POLICY "Users can view own reservations" ON reservations
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can view their own documents
CREATE POLICY "Users can view own documents" ON document_verifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can submit documents" ON document_verifications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- GPS tracking viewable by admins (you can adjust this based on your needs)
CREATE POLICY "GPS tracking viewable by authenticated users" ON gps_tracking
  FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- SAMPLE DATA (OPTIONAL - Remove if not needed)
-- =====================================================

-- Insert sample admin users
INSERT INTO admin_users (name, email, role) VALUES
  ('Super Admin', 'superadmin@motorent.com', 'super-admin'),
  ('Regular Admin', 'admin@motorent.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active reservations with motorcycle details
CREATE OR REPLACE VIEW active_reservations_view AS
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

-- View for motorcycle availability with current reservation status
CREATE OR REPLACE VIEW motorcycle_availability_view AS
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

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get user's total spending
CREATE OR REPLACE FUNCTION get_user_total_spending(user_uuid UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM transactions
  WHERE user_id = user_uuid 
    AND type = 'payment' 
    AND status = 'completed';
$$ LANGUAGE sql STABLE;

-- Function to check motorcycle availability for date range
CREATE OR REPLACE FUNCTION check_motorcycle_availability(
  motorcycle_uuid UUID,
  check_start_date DATE,
  check_end_date DATE
)
RETURNS BOOLEAN AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM reservations
    WHERE motorcycle_id = motorcycle_uuid
      AND status IN ('confirmed', 'pending')
      AND (
        (start_date <= check_end_date AND end_date >= check_start_date)
      )
  );
$$ LANGUAGE sql STABLE;

-- =====================================================
-- COMPLETED SUCCESSFULLY
-- =====================================================
-- Database schema created with all tables and relationships
-- Run this in your Supabase SQL Editor
