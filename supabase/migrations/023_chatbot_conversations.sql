-- Migration: Create Chat Conversations Table
-- Created: 2026-03-19
-- Description: Create table for storing chatbot conversations and history

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  intent VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id 
  ON public.chat_conversations(user_id);

-- Create index for timestamp queries
CREATE INDEX IF NOT EXISTS idx_chat_conversations_timestamp 
  ON public.chat_conversations(timestamp DESC);

-- Create index for combined queries
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_timestamp 
  ON public.chat_conversations(user_id, timestamp DESC);

-- Enable RLS for security
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own chat history
DROP POLICY IF EXISTS "chat_conversations_read_own" ON public.chat_conversations;
CREATE POLICY "chat_conversations_read_own" 
  ON public.chat_conversations 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own messages
DROP POLICY IF EXISTS "chat_conversations_insert_own" ON public.chat_conversations;
CREATE POLICY "chat_conversations_insert_own" 
  ON public.chat_conversations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Admins can read all chat conversations for support purposes
DROP POLICY IF EXISTS "chat_conversations_read_admin" ON public.chat_conversations;
CREATE POLICY "chat_conversations_read_admin"
  ON public.chat_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE auth.uid() = id
    )
  );
