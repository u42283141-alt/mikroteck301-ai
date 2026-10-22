import express, { Request, Response } from 'express';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { db } from '../db/database.js';
import { messengerService } from '../services/messenger.js';
import { geminiService } from '../services/gemini.js';
import { webhookHandler, MetaWebhookPayload } from '../services/webhookHandler.js';
import { runAllTests } from '../tests/runner.js';

export const apiRouter = express.Router();

/**
 * 1. WEBHOOK VERIFICATION (GET /api/webhook)
 * Appelé par Meta lors de la configuration du Webhook dans l'espace Développeur.
 */
apiRouter.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const settings = db.getSettings();
  const expectedToken = settings.metaVerifyToken;

  if (mode === 'subscribe' && token === expectedToken) {
    db.logActivity('success', 'WEBHOOK_VERIFIED', 'Webhook Meta vérifié avec succès par les serveurs Facebook.');
    res.status(200).send(challenge);
  } else {
    db.logActivity('warn', 'WEBHOOK_VERIFY_REJECTED', `Échec de vérification webhook. Jeton reçu: "${token}"`, {
      mode,
      expectedToken: expectedToken ? `${expectedToken.slice(0, 4)}...` : 'non défini',
    });
    res.status(403).json({ error: 'Jeton de vérification invalide ou non autorisé.' });
  }
});

/**
 * 2. WEBHOOK INGESTION (POST /api/webhook)
 * Réception des messages et événements en direct de Facebook Messenger.
 */
apiRouter.post('/webhook', async (req: Request, res: Response) => {
  const settings = db.getSettings();
  const signatureHeader = req.headers['x-hub-signature-256'] as string | undefined;

  // Si un secret d'application Meta est configuré, on valide obligatoirement la signature cryptographique
  if (settings.metaAppSecret && settings.metaAppSecret.trim().length > 0) {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const isValid = messengerService.verifySignature(rawBody, signatureHeader, settings.metaAppSecret);

    if (!isValid) {
      db.logActivity('error', 'SIGNATURE_VERIFICATION_FAILED', 'Signature X-Hub-Signature-256 invalide reçue de Meta.');
      return res.status(401).json({ error: 'Signature cryptographique invalide.' });
    }
  }

  const payload = req.body as MetaWebhookPayload;

  // Répondre immédiatement 200 OK à Meta pour respecter leur délai de 20 secondes
  res.status(200).send('EVENT_RECEIVED');

  // Traiter les événements en arrière-plan
  try {
    await webhookHandler.handleIncomingWebhook(payload);
  } catch (err: any) {
    console.error('[Webhook] Erreur traitement:', err);
    db.logActivity('error', 'WEBHOOK_PROCESS_ERROR', err.message || 'Erreur lors du traitement du webhook');
  }
});

/**
 * 3. PARAMÈTRES (GET / POST /api/settings)
 */
apiRouter.get('/settings', (req: Request, res: Response) => {
  const s = db.getSettings();
  // Ne pas exposer les secrets complets dans le JSON du client
  res.json({
    ...s,
    appUrl: process.env.APP_URL || '',
    metaAppSecretMasked: s.metaAppSecret ? `••••••••${s.metaAppSecret.slice(-4)}` : '',
    metaPageAccessTokenMasked: s.metaPageAccessToken ? `••••••••${s.metaPageAccessToken.slice(-6)}` : '',
    geminiApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
  });
});

apiRouter.post('/settings', (req: Request, res: Response) => {
  const {
    metaVerifyToken,
    metaAppSecret,
    metaAppId,
    metaPageAccessToken,
    metaPageId,
    geminiModel,
    geminiTemperature,
    geminiMaxTokens,
    aiAutoReplyEnabled,
    malagasySupportEnabled,
    systemPromptInstructions,
    businessName,
    businessAddress,
    businessPhone,
  } = req.body;

  const updated = db.updateSettings({
    ...(metaVerifyToken !== undefined && { metaVerifyToken }),
    ...(metaAppSecret !== undefined && { metaAppSecret }),
    ...(metaAppId !== undefined && { metaAppId }),
    ...(metaPageAccessToken !== undefined && { metaPageAccessToken }),
    ...(metaPageId !== undefined && { metaPageId }),
    ...(geminiModel !== undefined && { geminiModel }),
    ...(geminiTemperature !== undefined && { geminiTemperature: Number(geminiTemperature) }),
    ...(geminiMaxTokens !== undefined && { geminiMaxTokens: Number(geminiMaxTokens) }),
    ...(aiAutoReplyEnabled !== undefined && { aiAutoReplyEnabled: Boolean(aiAutoReplyEnabled) }),
    ...(malagasySupportEnabled !== undefined && { malagasySupportEnabled: Boolean(malagasySupportEnabled) }),
    ...(systemPromptInstructions !== undefined && { systemPromptInstructions }),
    ...(businessName !== undefined && { businessName }),
    ...(businessAddress !== undefined && { businessAddress }),
    ...(businessPhone !== undefined && { businessPhone }),
  });

  res.json({ success: true, settings: updated });
});

/**
 * 4. TABLEAU DE BORD & STATISTIQUES (GET /api/stats)
 */
apiRouter.get('/stats', (req: Request, res: Response) => {
  const stats = db.getDashboardStats();
  res.json(stats);
});

/**
 * 5. GESTION DES PRODUITS ET TARIFS (CRUD /api/products)
 */
apiRouter.get('/products', (req: Request, res: Response) => {
  const products = db.getProducts();
  res.json(products);
});

apiRouter.post('/products', (req: Request, res: Response) => {
  const { name, category, priceAriary, description, inStock, highlight } = req.body;
  if (!name || !priceAriary) {
    return res.status(400).json({ error: 'Le nom et le prix en Ariary sont obligatoires.' });
  }

  const created = db.createProduct({
    name,
    category: category || 'Équipement Wi-Fi',
    priceAriary: Number(priceAriary),
    description: description || '',
    inStock: inStock !== undefined ? Boolean(inStock) : true,
    highlight: Boolean(highlight),
  });

  res.status(201).json(created);
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.updateProduct(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Produit introuvable.' });
  }
  res.json(updated);
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteProduct(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Produit introuvable.' });
  }
  res.json({ success: true, id });
});

/**
 * 6. CONVERSATIONS ET BOÎTE DE RÉCEPTION (/api/conversations)
 */
apiRouter.get('/conversations', (req: Request, res: Response) => {
  const status = req.query.status as any;
  const search = req.query.search as string | undefined;
  const list = db.getConversations(status, search);
  res.json(list);
});

apiRouter.get('/conversations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const conv = db.getConversationById(id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation introuvable.' });
  }

  db.markConversationRead(conv.id);
  const messages = db.getMessages(conv.id);

  res.json({
    conversation: conv,
    messages,
  });
});

apiRouter.post('/conversations/:id/reply', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Le texte du message est requis.' });
  }

  const conv = db.getConversationById(id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation introuvable.' });
  }

  // Envoi réel via l'API Send de Meta
  const sendResult = await messengerService.sendTextMessage(conv.platformUserId, text.trim());

  // Enregistrement dans la base locale
  const message = db.addMessage({
    conversationId: conv.id,
    platformUserId: conv.platformUserId,
    senderType: 'agent',
    senderName: 'Opérateur MIKROTECK 301',
    text: text.trim(),
    deliveryStatus: sendResult.success ? 'delivered' : 'failed',
    errorMessage: sendResult.error,
  });

  res.json({
    success: sendResult.success,
    message,
    sendResult,
  });
});

apiRouter.post('/conversations/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!['ai_active', 'human_handoff', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }

  const updated = db.updateConversationStatus(id, status, notes);
  if (!updated) {
    return res.status(404).json({ error: 'Conversation introuvable.' });
  }
  res.json(updated);
});

apiRouter.post('/conversations/:id/summarize', async (req: Request, res: Response) => {
  const { id } = req.params;
  const conv = db.getConversationById(id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation introuvable.' });
  }

  const messages = db.getMessages(conv.id);
  const summary = await geminiService.summarizeConversation(messages);
  db.updateConversationSummary(conv.id, summary);

  res.json({ summary });
});

/**
 * 7. TEST ET VALIDATION META (FACEBOOK)
 */
apiRouter.post('/meta/test', async (req: Request, res: Response) => {
  const token = req.body.token || db.getSettings().metaPageAccessToken;
  if (!token) {
    return res.status(400).json({ valid: false, error: 'Aucun jeton d\'accès renseigné.' });
  }

  const result = await messengerService.testPageAccessToken(token);
  res.json(result);
});

/**
 * 8. SIMULATEUR DE MESSAGE CLIENT (WEBHOOK SIMULATOR)
 * Permet de tester le bot sans attendre qu'un vrai client Facebook écrive.
 */
apiRouter.post('/meta/simulate-webhook', async (req: Request, res: Response) => {
  const { text, senderName, senderId } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Texte requis pour la simulation.' });
  }

  const simId = senderId || `client_demo_${Math.floor(1000 + Math.random() * 9000)}`;
  const simName = senderName || 'Client Démo (Fianarantsoa)';

  // Create or update conversation with custom demo name
  db.getOrCreateConversation(simId, simName);

  const payload: MetaWebhookPayload = {
    object: 'page',
    entry: [
      {
        id: 'page_simulated',
        time: Date.now(),
        messaging: [
          {
            sender: { id: simId },
            recipient: { id: 'page_simulated' },
            timestamp: Date.now(),
            message: {
              mid: `mid_sim_${Date.now()}`,
              text: text.trim(),
            },
          },
        ],
      },
    ],
  };

  const result = await webhookHandler.handleIncomingWebhook(payload);
  const conv = db.getConversationById(simId);
  const messages = conv ? db.getMessages(conv.id) : [];

  res.json({
    success: true,
    result,
    conversationId: conv?.id,
    messages,
  });
});

/**
 * 9. TEST ET VALIDATION GEMINI AI
 */
apiRouter.post('/gemini/test', async (req: Request, res: Response) => {
  const prompt = req.body.prompt;
  const result = await geminiService.testConnection(prompt);
  res.json(result);
});

/**
 * 10. JOURNAL D'ACTIVITÉ (GET /api/logs)
 */
apiRouter.get('/logs', (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const logs = db.getActivityLogs(limit);
  res.json(logs);
});

/**
 * 11. TESTS AUTOMATISÉS & DIAGNOSTIC COMPLET (/api/diagnostics/run)
 */
apiRouter.post('/diagnostics/run', async (req: Request, res: Response) => {
  const report = await runAllTests();
  res.json(report);
});

/**
 * 12. SAUVEGARDE ET RESTAURATION DE LA BASE DE DONNÉES
 */
apiRouter.get('/backup/download', (req: Request, res: Response) => {
  const data = db.getFullBackup();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=mikroteck301_backup_${Date.now()}.json`);
  res.send(JSON.stringify(data, null, 2));
});

apiRouter.post('/backup/restore', (req: Request, res: Response) => {
  const success = db.restoreBackup(req.body);
  if (!success) {
    return res.status(400).json({ error: 'Fichier de sauvegarde invalide ou corrompu.' });
  }
  res.json({ success: true, message: 'Restauration réussie.' });
});

/**
 * 13. TÉLÉCHARGEMENT DIRECT DE L'ARCHIVE DU PROJET (.ZIP) POUR GITHUB / RENDER
 */
apiRouter.get('/project/download-zip', (_req: Request, res: Response) => {
  const zipPath = path.resolve(process.cwd(), 'mikroteck301-project.zip');
  try {
    execSync(`python3 -c "
import os, zipfile
exclude_dirs = {'.git', 'node_modules', 'dist', '.aistudio'}
exclude_files = {'mikroteck301-project.zip'}
with zipfile.ZipFile('mikroteck301-project.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file in exclude_files:
                continue
            p = os.path.join(root, file)
            arcname = os.path.relpath(p, '.')
            zipf.write(p, arcname)
"`);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="mikroteck301-messenger-ai.zip"');
    res.sendFile(zipPath);
  } catch (err: any) {
    console.error('Erreur génération ZIP:', err);
    res.status(500).json({ error: 'Échec de la génération du fichier ZIP.' });
  }
});
