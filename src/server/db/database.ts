import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import type {
  AppSettings,
  ConnectedPage,
  Conversation,
  Message,
  ProcessedEvent,
  Product,
  ActivityLog,
  AdminUser,
  OperatorHandoff,
  DashboardStats,
  ConversationStatus,
} from './types.js';

interface DatabaseSchema {
  version: number;
  settings: AppSettings;
  connectedPages: ConnectedPage[];
  conversations: Conversation[];
  messages: Message[];
  processedEvents: ProcessedEvent[];
  products: Product[];
  activityLogs: ActivityLog[];
  adminUsers: AdminUser[];
  operatorHandoffs: OperatorHandoff[];
}

const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  appName: 'E-Varotra Info — Messenger AI Manager',
  businessName: 'E-Varotra Info Fianarantsoa',
  businessAddress: 'Imandry, Fianarantsoa, Madagascar',
  businessPhone: '038 28 171 00',
  metaVerifyToken: process.env.META_VERIFY_TOKEN || 'mikroteck301_verify_token_2026',
  metaAppSecret: process.env.META_APP_SECRET || '',
  metaAppId: process.env.META_APP_ID || '',
  metaPageAccessToken: process.env.META_PAGE_ACCESS_TOKEN || '',
  metaPageId: process.env.META_PAGE_ID || '',
  metaPageName: 'E-Varotra Info Fianarantsoa',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',
  geminiTemperature: 0.7,
  geminiMaxTokens: 800,
  aiAutoReplyEnabled: true,
  malagasySupportEnabled: true,
  systemPromptInstructions:
    `Vous êtes l'assistant commercial officiel et conseiller technique de E-Varotra Info Fianarantsoa à Fianarantsoa, Madagascar.
Votre mission :
1. Saluer chaleureusement le client et identifier s'il s'exprime en français ou en malgache.
2. Répondre TOUJOURS dans la même langue que le client (français ou malgache).
3. Présenter nos équipements réseau et Wi-Fi avec clarté, professionnalisme et courtoisie.
4. Les prix fournis doivent PROVENIR STRICTEMENT du catalogue officiel ci-dessous. Ne jamais inventer un prix ou promettre un rabais non mentionné.
5. Si un client pose une question ambiguë, demandez poliment des précisions (ex: distance de couverture, usage intérieur ou extérieur).
6. Ne jamais inventer de fausses livraisons, garanties non approuvées ou stock imaginaire.
7. Ne jamais demander de mot de passe, de code Mobile Money (Mvola, Orange Money, Airtel Money) ou d'information bancaire confidentielle.
8. Si vous n'êtes pas certain ou si le client demande une intervention humaine, proposez de le mettre en relation avec un technicien ou appelez le 038 28 171 00.
9. Gardez des réponses concises, naturelles, adaptées à la messagerie mobile Facebook Messenger.`,
  updatedAt: new Date().toISOString(),
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-tenda-ac5',
    name: 'Tenda AC5 AC1200',
    category: 'Routeur Wi-Fi Intérieur',
    priceAriary: 85000,
    description: 'Routeur Wi-Fi double bande AC1200 haute vitesse, 4 antennes 5dBi, idéal pour maison et bureau.',
    inStock: true,
    highlight: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-os3-5km',
    name: 'OS3 5 km 5 GHz',
    category: 'Pont Réseau Extérieur (CPE)',
    priceAriary: 180000,
    description: 'Point d\'accès extérieur 5 GHz 867 Mbps, portée jusqu\'à 5 km point-à-point, étanche IP65.',
    inStock: true,
    highlight: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-tenda-01-1km',
    name: 'Tenda 01 1 km 5 GHz',
    category: 'Pont Réseau Extérieur (CPE)',
    priceAriary: 135000,
    description: 'CPE extérieur 5 GHz 300 Mbps, portée jusqu\'à 1 km, idéal pour relier 2 bâtiments ou partage de connexion.',
    inStock: true,
    highlight: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-pack-os3-ac5',
    name: 'Pack OS3 + AC5',
    category: 'Pack Complet Longue Portée',
    priceAriary: 265000,
    description: 'Pack clé en main : 1 CPE extérieur OS3 (5 km) + 1 Routeur intérieur double bande Tenda AC5.',
    inStock: true,
    highlight: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-pack-tenda01-ac5',
    name: 'Pack Tenda 01 + AC5',
    category: 'Pack Complet Moyenne Portée',
    priceAriary: 215000,
    description: 'Pack économique : 1 CPE extérieur Tenda 01 (1 km) + 1 Routeur intérieur double bande Tenda AC5.',
    inStock: true,
    highlight: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class DatabaseService {
  private dataDir: string;
  private dbFilePath: string;
  private memoryData: DatabaseSchema;
  private pgPool: pg.Pool | null = null;
  private isPostgresActive = false;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data');
    this.dbFilePath = path.join(this.dataDir, 'mikroteck_database.json');
    this.memoryData = this.getDefaultSchema();
    this.init();
  }

  private getDefaultSchema(): DatabaseSchema {
    return {
      version: 1,
      settings: { ...DEFAULT_SETTINGS },
      connectedPages: [],
      conversations: [],
      messages: [],
      processedEvents: [],
      products: [...INITIAL_PRODUCTS],
      activityLogs: [
        {
          id: `log-${Date.now()}`,
          level: 'info',
          eventType: 'SYSTEM_STARTUP',
          message: 'Initialisation du gestionnaire de base de données MIKROTECK 301.',
          createdAt: new Date().toISOString(),
        },
      ],
      adminUsers: [
        {
          id: 'admin-1',
          username: 'admin_mikroteck',
          role: 'superadmin',
          createdAt: new Date().toISOString(),
        },
      ],
      operatorHandoffs: [],
    };
  }

  private init() {
    // 1. Ensure directory exists
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dbFilePath)) {
        const fileContent = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.memoryData = {
          ...this.getDefaultSchema(),
          ...parsed,
          settings: {
            ...DEFAULT_SETTINGS,
            ...(parsed.settings || {}),
          },
        };
      } else {
        this.persistToFile();
      }
    } catch (err) {
      console.error('[DB] Erreur lors de l’initialisation du stockage local:', err);
    }

    // 2. Check if PostgreSQL is configured via DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.startsWith('postgres')) {
      try {
        this.pgPool = new pg.Pool({
          connectionString: dbUrl,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        });
        this.isPostgresActive = true;
        this.logActivity('info', 'POSTGRES_CONNECTED', 'Connexion PostgreSQL configurée avec succès.');
      } catch (err) {
        console.warn('[DB] Échec de connexion PostgreSQL, fallback local actif:', err);
      }
    }
  }

  private persistToFile() {
    try {
      const tempPath = `${this.dbFilePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.memoryData, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.dbFilePath);
    } catch (err) {
      console.error('[DB] Erreur écriture disque:', err);
    }
  }

  // --- SETTINGS ---
  public getSettings(): AppSettings {
    // Merge dynamically from process.env if available
    const s = this.memoryData.settings;
    return {
      ...s,
      metaVerifyToken: s.metaVerifyToken || process.env.META_VERIFY_TOKEN || 'mikroteck301_verify_token_2026',
      metaAppSecret: s.metaAppSecret || process.env.META_APP_SECRET || '',
      metaAppId: s.metaAppId || process.env.META_APP_ID || '',
      metaPageAccessToken: s.metaPageAccessToken || process.env.META_PAGE_ACCESS_TOKEN || '',
      metaPageId: s.metaPageId || process.env.META_PAGE_ID || '',
      geminiModel: s.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    };
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.memoryData.settings = {
      ...this.memoryData.settings,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    this.persistToFile();
    this.logActivity('info', 'SETTINGS_UPDATED', 'Paramètres de l’application mis à jour.');
    return this.getSettings();
  }

  // --- CONNECTED PAGES ---
  public getConnectedPages(): ConnectedPage[] {
    return this.memoryData.connectedPages;
  }

  public upsertConnectedPage(page: ConnectedPage): ConnectedPage {
    const idx = this.memoryData.connectedPages.findIndex((p) => p.pageId === page.pageId);
    if (idx >= 0) {
      this.memoryData.connectedPages[idx] = page;
    } else {
      this.memoryData.connectedPages.push(page);
    }
    // Also sync with settings
    this.memoryData.settings.metaPageId = page.pageId;
    this.memoryData.settings.metaPageName = page.pageName;
    this.persistToFile();
    return page;
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.memoryData.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.memoryData.products.find((p) => p.id === id);
  }

  public createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.memoryData.products.push(newProduct);
    this.persistToFile();
    this.logActivity('info', 'PRODUCT_CREATED', `Nouveau produit ajouté : ${newProduct.name} (${newProduct.priceAriary} Ar)`);
    return newProduct;
  }

  public updateProduct(id: string, partial: Partial<Omit<Product, 'id' | 'createdAt'>>): Product | null {
    const idx = this.memoryData.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.memoryData.products[idx] = {
      ...this.memoryData.products[idx],
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    this.persistToFile();
    this.logActivity('info', 'PRODUCT_UPDATED', `Mise à jour produit : ${this.memoryData.products[idx].name}`);
    return this.memoryData.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const idx = this.memoryData.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const removed = this.memoryData.products.splice(idx, 1)[0];
    this.persistToFile();
    this.logActivity('warn', 'PRODUCT_DELETED', `Produit supprimé : ${removed.name}`);
    return true;
  }

  // --- CONVERSATIONS ---
  public getConversations(statusFilter?: ConversationStatus, search?: string): Conversation[] {
    let list = [...this.memoryData.conversations];
    if (statusFilter) {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.senderName.toLowerCase().includes(q) ||
          c.platformUserId.includes(q) ||
          c.lastMessageText.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  public getConversationById(id: string): Conversation | undefined {
    return this.memoryData.conversations.find((c) => c.id === id || c.platformUserId === id);
  }

  public getOrCreateConversation(platformUserId: string, senderName = 'Client Messenger'): Conversation {
    let conv = this.memoryData.conversations.find((c) => c.platformUserId === platformUserId);
    if (!conv) {
      conv = {
        id: `conv-${platformUserId}`,
        platformUserId,
        senderName,
        status: 'ai_active',
        lastMessageText: '',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.memoryData.conversations.unshift(conv);
      this.persistToFile();
      this.logActivity('info', 'NEW_CONVERSATION', `Nouvelle conversation avec ${senderName} (${platformUserId})`);
    } else if (senderName && conv.senderName === 'Client Messenger' && senderName !== 'Client Messenger') {
      conv.senderName = senderName;
      this.persistToFile();
    }
    return conv;
  }

  public updateConversationStatus(id: string, status: ConversationStatus, notes?: string): Conversation | null {
    const conv = this.memoryData.conversations.find((c) => c.id === id || c.platformUserId === id);
    if (!conv) return null;
    conv.status = status;
    if (notes !== undefined) conv.notes = notes;
    conv.updatedAt = new Date().toISOString();

    if (status === 'human_handoff') {
      this.recordOperatorHandoff(conv.id, conv.platformUserId, notes || 'Demande de transfert manuel');
    }

    this.persistToFile();
    this.logActivity('info', 'CONVERSATION_STATUS_CHANGE', `Statut conversation ${conv.senderName} passé à ${status}`);
    return conv;
  }

  public updateConversationSummary(id: string, summary: string): void {
    const conv = this.memoryData.conversations.find((c) => c.id === id || c.platformUserId === id);
    if (conv) {
      conv.summary = summary;
      conv.updatedAt = new Date().toISOString();
      this.persistToFile();
    }
  }

  // --- MESSAGES ---
  public getMessages(conversationId: string): Message[] {
    return this.memoryData.messages
      .filter((m) => m.conversationId === conversationId || m.platformUserId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addMessage(msg: Omit<Message, 'id' | 'createdAt'>): Message {
    const newMsg: Message = {
      ...msg,
      id: `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      createdAt: new Date().toISOString(),
    };
    this.memoryData.messages.push(newMsg);

    // Update parent conversation
    const conv = this.memoryData.conversations.find((c) => c.id === msg.conversationId || c.platformUserId === msg.platformUserId);
    if (conv) {
      conv.lastMessageText = msg.text || (msg.attachments && msg.attachments.length > 0 ? `[Pièce jointe: ${msg.attachments[0].type}]` : '');
      conv.lastMessageAt = newMsg.createdAt;
      conv.updatedAt = newMsg.createdAt;
      if (msg.senderType === 'user') {
        conv.unreadCount = (conv.unreadCount || 0) + 1;
      }
    }

    this.persistToFile();
    return newMsg;
  }

  public markConversationRead(conversationId: string): void {
    const conv = this.memoryData.conversations.find((c) => c.id === conversationId || c.platformUserId === conversationId);
    if (conv && conv.unreadCount > 0) {
      conv.unreadCount = 0;
      this.persistToFile();
    }
  }

  // --- PROCESSED EVENTS (IDEMPOTENCY) ---
  public hasProcessedEvent(eventId: string): boolean {
    return this.memoryData.processedEvents.some((e) => e.eventId === eventId);
  }

  public recordProcessedEvent(eventId: string, eventType: string): void {
    this.memoryData.processedEvents.push({
      id: `evt-${Date.now()}`,
      eventId,
      eventType,
      processedAt: new Date().toISOString(),
    });
    // Keep only last 5000 events to prevent memory bloating
    if (this.memoryData.processedEvents.length > 5000) {
      this.memoryData.processedEvents.splice(0, this.memoryData.processedEvents.length - 5000);
    }
    this.persistToFile();
  }

  // --- OPERATOR HANDOFFS ---
  public recordOperatorHandoff(conversationId: string, platformUserId: string, reason: string): OperatorHandoff {
    const handoff: OperatorHandoff = {
      id: `handoff-${Date.now()}`,
      conversationId,
      platformUserId,
      reason,
      requestedAt: new Date().toISOString(),
    };
    this.memoryData.operatorHandoffs.push(handoff);
    this.persistToFile();
    return handoff;
  }

  public resolveOperatorHandoff(conversationId: string): void {
    const item = this.memoryData.operatorHandoffs.find(
      (h) => (h.conversationId === conversationId || h.platformUserId === conversationId) && !h.resolvedAt
    );
    if (item) {
      item.resolvedAt = new Date().toISOString();
      this.persistToFile();
    }
  }

  // --- ACTIVITY LOGS ---
  public logActivity(level: ActivityLog['level'], eventType: string, message: string, details?: any): ActivityLog {
    const log: ActivityLog = {
      id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      level,
      eventType,
      message,
      details,
      createdAt: new Date().toISOString(),
    };
    this.memoryData.activityLogs.unshift(log);
    // Limit to 2000 logs
    if (this.memoryData.activityLogs.length > 2000) {
      this.memoryData.activityLogs.pop();
    }
    this.persistToFile();
    return log;
  }

  public getActivityLogs(limit = 100): ActivityLog[] {
    return this.memoryData.activityLogs.slice(0, limit);
  }

  // --- DASHBOARD STATS ---
  public getDashboardStats(): DashboardStats {
    const totalConversations = this.memoryData.conversations.length;
    const uniqueCustomers = new Set(this.memoryData.conversations.map((c) => c.platformUserId)).size;

    const messagesReceived = this.memoryData.messages.filter((m) => m.senderType === 'user').length;
    const messagesSent = this.memoryData.messages.filter((m) => m.senderType === 'bot' || m.senderType === 'agent').length;
    const geminiResponsesGenerated = this.memoryData.messages.filter((m) => m.senderType === 'bot' && m.deliveryStatus === 'delivered').length;
    const messengerDeliveryErrors = this.memoryData.messages.filter((m) => m.deliveryStatus === 'failed').length;
    const pendingHumanHandoffs = this.memoryData.conversations.filter((c) => c.status === 'human_handoff').length;

    // Tokens calculation (sum of geminiTokensUsed or estimate 4 chars ~ 1 token)
    const estimatedTokensUsed = this.memoryData.messages.reduce((acc, m) => {
      if (m.geminiTokensUsed) return acc + m.geminiTokensUsed;
      if (m.senderType === 'bot') return acc + Math.ceil(m.text.length / 3.5);
      return acc;
    }, 0);

    const s = this.getSettings();
    const hasMetaToken = Boolean(s.metaPageAccessToken && s.metaPageAccessToken.length > 15);
    const hasPageName = s.metaPageName || (hasMetaToken ? 'Page Connectée' : null);
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);

    // Group activity by last 7 days
    const daysMap: Record<string, { incoming: number; outgoing: number; ai: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      daysMap[key] = { incoming: 0, outgoing: 0, ai: 0 };
    }

    this.memoryData.messages.forEach((m) => {
      const dateKey = m.createdAt.split('T')[0];
      if (daysMap[dateKey]) {
        if (m.senderType === 'user') daysMap[dateKey].incoming += 1;
        if (m.senderType === 'bot' || m.senderType === 'agent') daysMap[dateKey].outgoing += 1;
        if (m.senderType === 'bot') daysMap[dateKey].ai += 1;
      }
    });

    const activityData = Object.entries(daysMap).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    return {
      totalConversations,
      uniqueCustomers,
      messagesReceived,
      messagesSent,
      geminiResponsesGenerated,
      messengerDeliveryErrors,
      pendingHumanHandoffs,
      estimatedTokensUsed,
      facebookConnected: hasMetaToken,
      facebookPageName: hasPageName,
      geminiActive: hasGeminiKey,
      serverOnline: true,
      activityByPeriod: {
        period: 'day',
        data: activityData,
      },
    };
  }

  // --- BACKUP & RESTORE ---
  public getFullBackup(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.memoryData));
  }

  public restoreBackup(data: Partial<DatabaseSchema>): boolean {
    if (!data || typeof data !== 'object') return false;
    this.memoryData = {
      ...this.getDefaultSchema(),
      ...data,
      settings: {
        ...DEFAULT_SETTINGS,
        ...(data.settings || {}),
      },
    };
    this.persistToFile();
    this.logActivity('warn', 'DATABASE_RESTORED', 'Restauration de la base de données effectuée avec succès.');
    return true;
  }
}

export const db = new DatabaseService();
