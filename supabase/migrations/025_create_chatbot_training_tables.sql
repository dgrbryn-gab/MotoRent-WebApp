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
CREATE INDEX idx_training_data_active ON chatbot_training_data(active) WHERE active = true;
CREATE INDEX idx_training_data_category ON chatbot_training_data(category);
CREATE INDEX idx_training_data_intent ON chatbot_training_data(intent);
CREATE INDEX idx_feedback_rating ON chatbot_feedback(rating);

-- Enable Row Level Security
ALTER TABLE chatbot_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_feedback ENABLE ROW LEVEL SECURITY;

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
