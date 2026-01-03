-- Discord Clone Database Migration
-- Run this script in your Supabase SQL Editor

-- 1. DM Conversations table
CREATE TABLE IF NOT EXISTS dm_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Direct Messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#99aab5',
  permissions JSONB DEFAULT '{"create_channels": false, "delete_messages": false, "manage_roles": false}',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Server Members junction table
CREATE TABLE IF NOT EXISTS server_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  nickname TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

-- 5. Read States for unread tracking
CREATE TABLE IF NOT EXISTS read_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id UUID,
  conversation_id UUID,
  last_read_message_id UUID,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id),
  UNIQUE(user_id, conversation_id)
);

-- 6. Message Reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID,
  dm_message_id UUID,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji),
  UNIQUE(dm_message_id, user_id, emoji)
);

-- 7. Update messages table for edit/delete/attachments
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';

-- Enable RLS on new tables
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE read_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for DM Conversations
CREATE POLICY "Users view their DM conversations" ON dm_conversations FOR SELECT USING (auth.uid() = ANY(participant_ids));
CREATE POLICY "Users create DM conversations" ON dm_conversations FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));
CREATE POLICY "Users update their DM conversations" ON dm_conversations FOR UPDATE USING (auth.uid() = ANY(participant_ids));

-- RLS Policies for Direct Messages
CREATE POLICY "Users view DMs in their conversations" ON direct_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM dm_conversations WHERE id = conversation_id AND auth.uid() = ANY(participant_ids))
);
CREATE POLICY "Users send DMs" ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users edit own DMs" ON direct_messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Users delete own DMs" ON direct_messages FOR DELETE USING (auth.uid() = sender_id);

-- RLS Policies for Roles
CREATE POLICY "Users view server roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Server owners manage roles" ON roles FOR ALL USING (
  EXISTS (SELECT 1 FROM servers WHERE id = server_id AND owner_id = auth.uid())
);

-- RLS Policies for Server Members
CREATE POLICY "Users view server members" ON server_members FOR SELECT USING (true);
CREATE POLICY "Users join servers" ON server_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Server owners manage members" ON server_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM servers WHERE id = server_id AND owner_id = auth.uid())
);

-- RLS Policies for Read States
CREATE POLICY "Users manage own read states" ON read_states FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Reactions
CREATE POLICY "Users view reactions" ON message_reactions FOR SELECT USING (true);
CREATE POLICY "Users add reactions" ON message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own reactions" ON message_reactions FOR DELETE USING (auth.uid() = user_id);

-- Update existing messages policy for edit/delete
DROP POLICY IF EXISTS "Users edit own messages" ON messages;
CREATE POLICY "Users edit own messages" ON messages FOR UPDATE USING (auth.uid() = (author->>'id')::uuid);

DROP POLICY IF EXISTS "Users delete messages" ON messages;
CREATE POLICY "Users delete messages" ON messages FOR DELETE USING (auth.uid() = (author->>'id')::uuid);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE dm_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE server_members;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_dm_conversations_participants ON dm_conversations USING GIN (participant_ids);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_roles_server ON roles(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_server ON server_members(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_user ON server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_read_states_user ON read_states(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
