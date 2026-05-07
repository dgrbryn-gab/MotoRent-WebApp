-- =============================================================================
-- CHATBOT TRAINING DATA SETUP
-- =============================================================================
-- Run this SQL directly in Supabase Dashboard → SQL Editor
-- This sets up tables for AI training and user feedback
-- =============================================================================

-- Create chatbot training data table
CREATE TABLE IF NOT EXISTS chatbot_training_data (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  intent VARCHAR(50),
  category VARCHAR(50),
  confidence INT DEFAULT 100 CHECK (confidence >= 0 AND confidence <= 100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Create feedback table for continuous improvement
CREATE TABLE IF NOT EXISTS chatbot_feedback (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT,
  bot_response TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  user_comment TEXT,
  helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_training_data_active ON chatbot_training_data(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_training_data_category ON chatbot_training_data(category);
CREATE INDEX IF NOT EXISTS idx_training_data_intent ON chatbot_training_data(intent);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON chatbot_feedback(rating);

-- Enable Row Level Security
ALTER TABLE chatbot_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read active training data" ON chatbot_training_data CASCADE;
DROP POLICY IF EXISTS "Admins can manage training data" ON chatbot_training_data CASCADE;
DROP POLICY IF EXISTS "Users can create feedback" ON chatbot_feedback CASCADE;
DROP POLICY IF EXISTS "Users can read their own feedback" ON chatbot_feedback CASCADE;
DROP POLICY IF EXISTS "Admins can read all feedback" ON chatbot_feedback CASCADE;

-- RLS Policies for training data (admins only, users can read)
CREATE POLICY "Users can read active training data"
  ON chatbot_training_data FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage training data"
  ON chatbot_training_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for feedback (users can create their own, admins can read all)
CREATE POLICY "Users can create feedback"
  ON chatbot_feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read their own feedback"
  ON chatbot_feedback FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all feedback"
  ON chatbot_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =============================================================================
-- SEED TRAINING DATA (30+ examples)
-- =============================================================================

INSERT INTO chatbot_training_data (question, answer, intent, category, confidence) VALUES

-- PRICING & COSTS
('How much does it cost to rent a bike?', 'Our rates vary by bike type: Scooters (125cc) ₱200-300/day, Sport bikes ₱300-400/day, Cruisers ₱600-1000/day. Which type interests you? 🏍️', 'bike_pricing', 'pricing', 100),
('What''s the cheapest bike you have?', 'Our most affordable option is the **Yamaha XRay (125cc) at ₱250/day**. It''s perfect for beginners and city riding! Includes helmet & basic insurance. 🏍️', 'bike_pricing', 'pricing', 100),
('How much for a 3-day rental?', 'Depends on the bike! Example: Yamaha XRay = ₱250/day × 3 = ₱750. For a weekend (3+ days), we offer 15% discount! Would you like to check a specific bike? 💰', 'rental_calculator', 'pricing', 100),
('Do you have any discounts?', 'Yes! 🎉 We offer: **Weekend Special** (3+ days = 15% off), **Weekly Rental** (7+ days = 20% off), **Corporate** (5+ bikes = 25% off). What dates interest you? 📅', 'promotions', 'pricing', 100),

-- CANCELLATION & POLICIES
('What''s your cancellation policy?', '📋 **Cancellation Policy:**\n• **24+ hours before**: 100% refund ✅\n• **12-24 hours before**: 50% refund\n• **Less than 12 hours**: No refund\n\nNeed to cancel? Call us at 091234323212 immediately! ☎️', 'cancellation_request', 'policies', 100),
('Can I cancel my booking?', 'Yes, you can cancel! Your refund depends on timing:\n• Cancel 24+ hours before pickup: Full refund\n• Cancel 12-24 hours before: 50% back\n• Cancel less than 12 hours: No refund\n\nContact support ASAP: 091234323212', 'cancellation_request', 'policies', 100),
('What if I return the bike late?', 'Late return charges apply! ⏰\n• **Less than 1 hour late**: ₱500 charge\n• **1+ hours late**: ₱5,000 per day\n\nBetter to return on time! If there''s an issue, call 091234323212 immediately.', 'damage_liability', 'policies', 100),

-- BOOKING & AVAILABILITY
('How do I book a bike?', 'Easy! 📅 Here''s the process:\n1. Choose dates & bike type\n2. View available bikes\n3. Select your preferred motorcycle\n4. Upload required documents\n5. Complete payment on our website\nReady to book? Go to our Bookings page! 🏍️', 'booking_assistance', 'booking', 100),
('What motorcycles do you have available?', 'Great question! 🏍️ We have multiple options:\n\n**Scooters (125cc)**: Yamaha XRay, Honda Wave - ₱250/day\n**Sport Bikes**: Honda CB150, Yamaha YZF-R15 - ₱300-400/day\n**Cruisers**: Harley-Davidson - ₱800/day\n\nWant specific dates checked? Just tell me! 📅', 'available_bikes', 'booking', 100),
('Is the bike available for next weekend?', 'I can help check! 📅 What specific dates do you need? (e.g., March 15-17)\n\nAlso, which bike type interests you?\n• Scooter (easy & affordable)\n• Sport (fast & nimble)\n• Cruiser (comfortable)\n\nLet me check availability for you!', 'availability_check', 'booking', 100),

-- REQUIREMENTS & AGE
('What do I need to rent a bike?', '📋 **Required Documents:**\n✅ Valid government-issued ID\n✅ Motorcycle license (for bikes 125cc+)\n✅ Minimum 18 years old\n✅ Contact information\n\nFor tourists: International license accepted\n\nHave all these? Ready to book? 🏍️', 'age_requirements', 'requirements', 100),
('Can I rent if I''m 17?', 'Unfortunately no. 😔 Our **minimum age requirement is 18 years old** with a valid ID and motorcycle license.\n\nBut come back next year—we''ll be ready for you! 🏍️', 'age_requirements', 'requirements', 100),
('Do I need a motorcycle license?', 'It depends on the bike:\n✅ **125cc & below**: Regular driver''s license OK\n✅ **Above 125cc**: Motorcycle license required\n\nWe have great scooters (125cc) if you don''t have a motorcycle license yet! Want to check those? 🏍️', 'age_requirements', 'requirements', 100),

-- INSURANCE & SAFETY
('What insurance options do you have?', '🛡️ **Insurance Coverage:**\n\n**Basic (Included):** ₱10,000 coverage - accidents & damage\n**Premium:** +₱200/day - ₱50,000 coverage\n\n**Always Included:**\n✅ Helmets & protective gear\n✅ Basic insurance\n✅ 24/7 roadside support\n\nRecommend premium for peace of mind!', 'insurance_info', 'insurance', 100),
('Does the rental include a helmet?', 'Yes! 🪖 **Helmets are included FREE** with all rentals.\n\nWe also provide:\n✅ Protective gear available\n✅ Safety briefing before pickup\n✅ 24/7 roadside assistance\n✅ Insurance coverage\n\nYour safety is our priority! ⚠️', 'helmet_safety', 'insurance', 100),

-- FUEL & MAINTENANCE
('What''s your fuel policy?', '⛽ **Fuel Policy:**\n\n✅ **Pickup**: Full tank provided\n✅ **Return**: Same fuel level (±5%) OR pay ₱50-150 refill charge\n\n**Gas Stations Near Us:**\n• Petron (5 min away)\n• Shell (10 min away)\n• Caltex (8 min away)\n\nAlways return with adequate fuel! ⛽', 'fuel_policy', 'maintenance', 100),

-- DOCUMENT STATUS
('How do I upload documents?', '📄 **Document Upload Steps:**\n\n1. Go to your Profile\n2. Click "Upload Documents"\n3. Upload:\n   - Government ID (clear photo)\n   - Motorcycle License (both sides)\n   - Proof of Address (optional)\n4. Submit & wait for verification\n\n**Verification usually takes 2-4 hours!** ✅', 'document_status', 'documents', 100),
('What''s my document verification status?', 'I can check that for you! 📋 Your current documents:\n\n✅ **Government ID**: Approved\n⏳ **Motorcycle License**: Under Review\n❌ **Proof of Address**: Not Uploaded\n\nYour ID is good to go! Just complete the license upload. 📸', 'document_status', 'documents', 100),

-- PAYMENT & TRANSACTIONS
('How do I pay?', '💳 **Payment Methods:**\n\n✅ Credit Card (Visa, Mastercard)\n✅ Debit Card\n✅ GCash (Philippine e-wallet)\n✅ Bank Transfer\n✅ Cash on Pickup (if arranged)\n\n**Secure checkout** on our website. All transactions are 100% safe! 🔒', 'payment_info', 'payment', 100),
('Can I pay cash?', 'Cash payment can be arranged! 💵 Here''s how:\n\n1. Complete your booking online\n2. Select "Cash on Pickup"\n3. Bring exact amount to our office\n4. Pickup your bike!\n\n**Location**: Dumaguete City (8am-5pm daily)\n**Phone**: 091234323212\n\nWorks great for locals! 🏍️', 'payment_info', 'payment', 100),

-- CONTACT & SUPPORT
('How do I contact support?', '📞 **Get Help Anytime:**\n\n📱 **Phone**: 091234323212\n📧 **Email**: support@dumagueteMotorAent.com\n⏰ **Hours**: Mon-Sun, 8am-5pm\n📍 **Location**: Dumaguete City, Negros Oriental\n\nOr message me directly here! I''m available 24/7. 💬', 'contact_agent', 'support', 100),
('Where are you located?', '📍 **Our Location:**\n\n**Dumaguete MotoRent**\nDumaguete City, Negros Oriental, Philippines\n\n**Business Hours:**\nMonday - Sunday: 8:00 AM - 5:00 PM\n\n**Contact:**\n☎️ 091234323212\n📧 support@dumagueteMotorAent.com\n\nGreat for tourists exploring the city! 🏝️', 'location_hours', 'support', 100),

-- BIKE RECOMMENDATIONS
('Which bike should I rent?', 'Great question! 🤔 Let me help you choose:\n\n**Beginner?** → Yamaha XRay (125cc) - Easy, affordable, ₱250/day\n**Need speed?** → Honda CB150 - Fast & nimble, ₱350/day\n**Long ride?** → Harley Cruiser - Super comfortable, ₱800/day\n**Budget conscious?** → Underbone bike - Most affordable\n\nWhat''s your experience level? Where are you going? 🏍️', 'recommendations', 'recommendations', 100),
('I''m a beginner, what do you recommend?', '👍 **Perfect for beginners! I recommend:**\n\n🏍️ **Yamaha XRay (125cc)**\n• ₱250/day - Most affordable\n• Very stable & easy to handle\n• Great for city riding\n• Fuel-efficient\n• Highly rated: 4.5⭐\n\n**Why?** Low learning curve, reliable, and won''t break the bank! Want to book it? 📅', 'recommendations', 'recommendations', 100),

-- SPECIAL SITUATIONS
('I want to rent for a whole month', 'Awesome! 📅 Our **Monthly Rental Rate:**\n\n🎉 **30% discount** on daily rates!\n\nExample: Yamaha XRay\n• Normal: ₱250/day × 30 = ₱7,500\n• Monthly: ₱7,500 × 70% = **₱5,250**\n\nThat''s ₱175/day! Plus, we can discuss special arrangements.\n\nWant more details? Call 091234323212 ☎️', 'rental_calculator', 'special', 95),
('Do you rent to tourists?', 'Absolutely! Welcome! 🎉 We love renting to tourists exploring Dumaguete.\n\n✅ **International License**: Accepted\n✅ **Passport**: Valid ID\n✅ **Credit Card**: For payment\n✅ **No Local Address Needed**: Use hotel address\n\n**Tips:**\n• Wear helmet always!\n• Follow local traffic rules\n• Insurance recommended\n\nReady to explore? Let''s find you the perfect bike! 🏍️', 'booking_assistance', 'special', 95),
('Can I extend my rental?', 'Great idea! 📅 **Yes, you can extend!**\n\nHow to extend:\n1. Contact us **before** your return date\n2. ☎️ Call: 091234323212\n3. 📧 Email: support@dumagueteMotorAent.com\n4. We''ll check availability & update your booking\n\n**Extension pricing** uses same daily rates.\nWhen do you want to extend until? 🤔', 'booking_assistance', 'special', 90),

-- GENERAL HELP
('Hello, can you help me?', '👋 Hi there! Of course I can help! 🤗\n\nI''m your MotoRent Assistant. I can help you with:\n\n🏍️ Browse available motorcycles\n💰 Check pricing & deals\n📅 See bike availability\n📋 Answer policy questions\n✅ Guide you through booking\n\nWhat would you like to know? 😊', 'general_help', 'general', 100),
('What can you do?', 'Great question! 🤖 I''m here to help with:\n\n✅ Check your booking status\n✅ Show available bikes with prices\n✅ Calculate rental costs\n✅ Recommend bikes for you\n✅ Answer all policy questions\n✅ Guide booking process\n✅ Check document status\n✅ Connect with human support\n\nWhat do you need help with today? 🏍️', 'general_help', 'general', 100);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_training_data_search ON chatbot_training_data USING gin(to_tsvector('english', question));

-- Confirm setup
SELECT 'Training tables created successfully!' as status;
SELECT COUNT(*) as total_training_examples FROM chatbot_training_data;
