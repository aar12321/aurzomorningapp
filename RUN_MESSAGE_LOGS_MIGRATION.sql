-- ============================================================================
-- MIGRATION: Create message_logs table
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor
-- This creates the message_logs table to track all sent notifications
-- ============================================================================

-- Create message_logs table to track all sent notifications
-- This provides audit trail and debugging capabilities

CREATE TABLE IF NOT EXISTS public.message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('email', 'whatsapp', 'telegram', 'slack', 'instagram')),
  recipient TEXT NOT NULL, -- Email address, phone number, username, etc.
  subject TEXT, -- For emails
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  error_message TEXT, -- Store error details if failed
  external_message_id TEXT, -- ID from external service (Resend, WhatsApp, etc.)
  metadata JSONB, -- Additional data like API response, retry count, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE, -- When message was actually sent
  delivered_at TIMESTAMP WITH TIME ZONE -- When delivery was confirmed (if available)
);

-- Enable Row Level Security
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own message logs
CREATE POLICY "Users can view their own message logs"
  ON public.message_logs FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Policy: Service role can insert/update message logs (for edge functions)
CREATE POLICY "Service role can manage message logs"
  ON public.message_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_logs_user_id ON public.message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_type_status ON public.message_logs(message_type, status);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON public.message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_user_created ON public.message_logs(user_id, created_at DESC);

-- Add comment
COMMENT ON TABLE public.message_logs IS 'Audit log of all messages sent to users via email, WhatsApp, Telegram, Slack, or Instagram';

