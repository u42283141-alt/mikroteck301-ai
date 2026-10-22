-- ==============================================================================
-- MIKROTECK 301 — Messenger AI Manager — Schéma SQL PostgreSQL
-- ==============================================================================
-- Ce fichier contient la structure complète de la base de données PostgreSQL
-- à exécuter lors d'un déploiement sur Render, Supabase, Neon ou Cloud SQL.

CREATE TABLE IF NOT EXISTS app_settings (
  id VARCHAR(64) PRIMARY KEY,
  app_name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  business_address VARCHAR(255) NOT NULL,
  business_phone VARCHAR(64) NOT NULL,
  meta_verify_token VARCHAR(255) NOT NULL,
  meta_app_secret VARCHAR(255) DEFAULT '',
  meta_app_id VARCHAR(128) DEFAULT '',
  meta_page_access_token TEXT DEFAULT '',
  meta_page_id VARCHAR(128) DEFAULT '',
  meta_page_name VARCHAR(255),
  gemini_model VARCHAR(64) NOT NULL DEFAULT 'gemini-3.8-flash',
  gemini_temperature NUMERIC(3,2) DEFAULT 0.7,
  gemini_max_tokens INTEGER DEFAULT 800,
  ai_auto_reply_enabled BOOLEAN DEFAULT TRUE,
  malagasy_support_enabled BOOLEAN DEFAULT TRUE,
  system_prompt_instructions TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS connected_pages (
  id VARCHAR(64) PRIMARY KEY,
  page_id VARCHAR(128) NOT NULL UNIQUE,
  page_name VARCHAR(255) NOT NULL,
  category VARCHAR(128),
  status VARCHAR(32) NOT NULL DEFAULT 'disconnected',
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(64) PRIMARY KEY,
  platform_user_id VARCHAR(128) NOT NULL UNIQUE,
  sender_name VARCHAR(255) NOT NULL DEFAULT 'Client Messenger',
  status VARCHAR(32) NOT NULL DEFAULT 'ai_active',
  last_message_text TEXT NOT NULL DEFAULT '',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  unread_count INTEGER DEFAULT 0,
  notes TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  platform_user_id VARCHAR(128) NOT NULL,
  sender_type VARCHAR(16) NOT NULL, -- 'user', 'bot', 'agent'
  sender_name VARCHAR(255),
  text TEXT NOT NULL,
  attachments JSONB,
  delivery_status VARCHAR(16) NOT NULL DEFAULT 'delivered', -- 'delivered', 'failed', 'pending'
  error_message TEXT,
  gemini_tokens_used INTEGER DEFAULT 0,
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at ASC);

CREATE TABLE IF NOT EXISTS processed_events (
  id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(64) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_processed_events_id ON processed_events(event_id);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL DEFAULT 'Équipement Wi-Fi',
  price_ariary INTEGER NOT NULL,
  description TEXT NOT NULL,
  in_stock BOOLEAN DEFAULT TRUE,
  highlight BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(64) PRIMARY KEY,
  level VARCHAR(16) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(128) NOT NULL UNIQUE,
  role VARCHAR(32) NOT NULL DEFAULT 'superadmin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS operator_handoffs (
  id VARCHAR(64) PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  platform_user_id VARCHAR(128) NOT NULL,
  reason TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  assigned_to VARCHAR(128)
);
