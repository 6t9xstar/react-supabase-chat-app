-- Migration 014: Add missing columns for disappearing messages and group roles

-- Add expires_at column to messages for disappearing messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add role column to conversation_members for group admin functionality
ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin'));

-- Update existing conversation_members to have 'member' role by default
UPDATE conversation_members SET role = 'member' WHERE role IS NULL;

-- Create index for expires_at queries
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at) WHERE expires_at IS NOT NULL;

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_conversation_members_role ON conversation_members(conversation_id, role);