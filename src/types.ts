export type ConversationStatus = 'ai_active' | 'human_handoff' | 'resolved';

export interface Conversation {
  id: string;
  platformUserId: string;
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
  createdAt: string;
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

export interface AppSettings {
  id: string;
  appName: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  metaVerifyToken: string;
  metaAppSecret: string;
  metaAppSecretMasked?: string;
  metaAppId: string;
  metaPageAccessToken: string;
  metaPageAccessTokenMasked?: string;
  metaPageId: string;
  metaPageName?: string;
  geminiModel: string;
  geminiTemperature: number;
  geminiMaxTokens: number;
  aiAutoReplyEnabled: boolean;
  malagasySupportEnabled: boolean;
  systemPromptInstructions: string;
  appUrl?: string;
  geminiApiKeyConfigured?: boolean;
  updatedAt: string;
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
    period: string;
    data: Array<{ date: string; incoming: number; outgoing: number; ai: number }>;
  };
}

export interface ActivityLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success';
  eventType: string;
  message: string;
  details?: any;
  createdAt: string;
}

export interface TestResult {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  details: string;
  error?: string;
}

export interface TestReport {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  results: TestResult[];
  timestamp: string;
}
