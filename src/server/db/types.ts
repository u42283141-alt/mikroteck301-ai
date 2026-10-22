/**
 * Types de données pour la base de données persistante de MIKROTECK 301.
 */

export interface AppSettings {
  id: string;
  appName: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  metaVerifyToken: string;
  metaAppSecret: string;
  metaAppId: string;
  metaPageAccessToken: string;
  metaPageId: string;
  metaPageName?: string;
  geminiModel: string;
  geminiTemperature: number;
  geminiMaxTokens: number;
  aiAutoReplyEnabled: boolean;
  malagasySupportEnabled: boolean;
  systemPromptInstructions: string;
  updatedAt: string;
}

export interface ConnectedPage {
  id: string;
  pageId: string;
  pageName: string;
  category?: string;
  tasks?: string[];
  status: 'active' | 'disconnected' | 'token_expired';
  lastSyncedAt: string;
  errorMessage?: string;
}

export type ConversationStatus = 'ai_active' | 'human_handoff' | 'resolved';

export interface Conversation {
  id: string;
  platformUserId: string; // Facebook PSID (Page-scoped ID)
  senderName: string;
  status: ConversationStatus;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  summary?: string;
}

export type MessageSenderType = 'user' | 'bot' | 'agent';
export type DeliveryStatus = 'delivered' | 'failed' | 'pending';

export interface Message {
  id: string;
  conversationId: string;
  platformUserId: string;
  senderType: MessageSenderType;
  senderName?: string;
  text: string;
  attachments?: Array<{
    type: string;
    payload?: { url?: string };
  }>;
  deliveryStatus: DeliveryStatus;
  errorMessage?: string;
  geminiTokensUsed?: number;
  rawPayload?: any;
  createdAt: string;
}

export interface ProcessedEvent {
  id: string;
  eventId: string;
  eventType: string;
  processedAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  priceAriary: number;
  description: string;
  inStock: boolean;
  highlight?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success';
  eventType: string;
  message: string;
  details?: any;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  role: 'superadmin' | 'operator';
  createdAt: string;
  lastLoginAt?: string;
}

export interface OperatorHandoff {
  id: string;
  conversationId: string;
  platformUserId: string;
  reason: string;
  requestedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
}

export interface DashboardStats {
  totalConversations: number;
  uniqueCustomers: number;
  messagesReceived: number;
  messagesSent: number;
  geminiResponsesGenerated: number;
  messengerDeliveryErrors: number;
  pendingHumanHandoffs: number;
  estimatedTokensUsed: number;
  facebookConnected: boolean;
  facebookPageName: string | null;
  geminiActive: boolean;
  serverOnline: boolean;
  activityByPeriod: {
    period: string; // 'day' | 'week' | 'month'
    data: Array<{ date: string; incoming: number; outgoing: number; ai: number }>;
  };
}
