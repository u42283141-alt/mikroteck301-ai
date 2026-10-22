import { db } from '../db/database.js';
import { geminiService } from './gemini.js';
import { messengerService } from './messenger.js';

interface WebhookMessagingEvent {
  sender?: { id: string };
  recipient?: { id: string };
  timestamp?: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    attachments?: Array<{
      type: string;
      payload?: { url?: string };
    }>;
  };
  delivery?: any;
  read?: any;
  postback?: {
    title?: string;
    payload?: string;
  };
}

interface WebhookFeedChange {
  field: string;
  value: {
    item?: string; // 'comment' | 'post' | 'status'
    verb?: string; // 'add' | 'edit' | 'remove'
    comment_id?: string;
    parent_id?: string;
    post_id?: string;
    created_time?: number;
    from?: { id: string; name: string };
    message?: string;
  };
}

interface WebhookEntry {
  id: string;
  time: number;
  messaging?: WebhookMessagingEvent[];
  changes?: WebhookFeedChange[];
}

export interface MetaWebhookPayload {
  object: string;
  entry?: WebhookEntry[];
}

class WebhookHandler {
  /**
   * Traite l'ensemble du payload entrant envoyé par Meta
   */
  public async handleIncomingWebhook(payload: MetaWebhookPayload): Promise<{
    processedCount: number;
    ignoredCount: number;
    errors: string[];
  }> {
    if (payload.object !== 'page') {
      return { processedCount: 0, ignoredCount: 1, errors: ['Objet webhook non pris en charge'] };
    }

    let processedCount = 0;
    let ignoredCount = 0;
    const errors: string[] = [];

    const entries = payload.entry || [];
    for (const entry of entries) {
      // 1. Événements de messagerie directe (Facebook Messenger)
      const messagingEvents = entry.messaging || [];
      for (const event of messagingEvents) {
        try {
          const result = await this.processSingleEvent(event, entry.id);
          if (result.processed) {
            processedCount++;
          } else {
            ignoredCount++;
          }
        } catch (err: any) {
          errors.push(err.message || 'Erreur inconnue lors du traitement d’un événement Messenger');
        }
      }

      // 2. Événements du flux / Commentaires sur publications (Feed comments)
      const changes = entry.changes || [];
      for (const change of changes) {
        try {
          const result = await this.processFeedChangeEvent(change, entry.id);
          if (result.processed) {
            processedCount++;
          } else {
            ignoredCount++;
          }
        } catch (err: any) {
          errors.push(err.message || 'Erreur inconnue lors du traitement d’un commentaire de publication');
        }
      }
    }

    return { processedCount, ignoredCount, errors };
  }

  /**
   * Traite un événement de messagerie individuel avec gestion d'idempotence et d'erreurs
   */
  private async processSingleEvent(
    event: WebhookMessagingEvent,
    pageId: string
  ): Promise<{ processed: boolean; reason?: string }> {
    // 1. Ignorer les événements de lecture/livraison simples
    if (event.delivery || event.read) {
      return { processed: false, reason: 'Événement de livraison ou lecture' };
    }

    const senderId = event.sender?.id;
    if (!senderId) {
      return { processed: false, reason: 'Expéditeur inconnu' };
    }

    // 2. Gestion des messages
    const message = event.message;
    if (!message) {
      // Éventuel postback
      if (event.postback) {
        return this.handlePostback(senderId, event.postback.payload || event.postback.title || 'Action');
      }
      return { processed: false, reason: 'Pas de message' };
    }

    // 3. Détection des événements echo (messages envoyés par la Page elle-même)
    if (message.is_echo) {
      db.logActivity('info', 'ECHO_MESSAGE_IGNORED', `Message echo ignoré pour ${senderId}`);
      return { processed: false, reason: 'Message echo' };
    }

    // 4. Protection contre les doublons (Idempotence)
    const messageId = message.mid;
    if (messageId && db.hasProcessedEvent(messageId)) {
      db.logActivity('warn', 'DUPLICATE_EVENT_DROPPED', `Événement dupliqué ignoré : ${messageId}`);
      return { processed: false, reason: 'Événement déjà traité' };
    }

    if (messageId) {
      db.recordProcessedEvent(messageId, 'facebook_message');
    }

    // 5. Récupérer ou créer la conversation
    const conversation = db.getOrCreateConversation(senderId, 'Client Messenger');

    // 6. Extraire le contenu (texte ou pièces jointes)
    const rawText = message.text?.trim() || '';
    const attachments = message.attachments || [];

    // Enregistrer le message reçu du client dans la base de données
    db.addMessage({
      conversationId: conversation.id,
      platformUserId: senderId,
      senderType: 'user',
      text: rawText || (attachments.length > 0 ? `[Fichier reçu: ${attachments[0].type}]` : '[Message vide]'),
      attachments: attachments.map((a) => ({
        type: a.type,
        payload: a.payload ? { url: a.payload.url } : undefined,
      })),
      deliveryStatus: 'delivered',
    });

    db.logActivity('info', 'INBOUND_MESSAGE_RECEIVED', `Nouveau message de ${senderId}: "${rawText.slice(0, 50)}"`);

    // 7. Vérifier si la conversation est en mode "Opérateur humain"
    if (conversation.status === 'human_handoff') {
      db.logActivity(
        'info',
        'HANDOFF_ACTIVE_NO_AI',
        `Conversation ${conversation.id} en attente d'un opérateur humain. L'IA reste silencieuse.`
      );
      return { processed: true };
    }

    // 8. Vérifier si l'auto-réponse IA est activée dans les paramètres globaux
    const settings = db.getSettings();
    if (!settings.aiAutoReplyEnabled) {
      db.logActivity('info', 'AI_AUTOREPLY_DISABLED', 'Réponses automatiques IA désactivées.');
      return { processed: true };
    }

    // 9. Traitement des pièces jointes sans texte
    let textToProcess = rawText;
    if (!textToProcess && attachments.length > 0) {
      textToProcess = `[Le client a envoyé une pièce jointe de type "${attachments[0].type}"]`;
    }

    // 10. Indiquer à l'utilisateur que MIKROTECK 301 est en train de taper
    await messengerService.sendSenderAction(senderId, 'typing_on');

    // 11. Récupérer l'historique et générer la réponse avec Gemini
    const history = db.getMessages(conversation.id);
    const geminiReply = await geminiService.generateMessengerReply(senderId, textToProcess, history);

    // 12. Envoyer la réponse via la Meta Messenger Send API
    const sendResult = await messengerService.sendTextMessage(senderId, geminiReply.text);

    // 13. Enregistrer le message sortant dans la base
    db.addMessage({
      conversationId: conversation.id,
      platformUserId: senderId,
      senderType: 'bot',
      senderName: `${settings.businessName} AI`,
      text: geminiReply.text,
      deliveryStatus: sendResult.success ? 'delivered' : 'failed',
      errorMessage: sendResult.error,
      geminiTokensUsed: geminiReply.tokensUsed,
    });

    // Éteindre l'indicateur de frappe
    await messengerService.sendSenderAction(senderId, 'typing_off');

    return { processed: true };
  }

  private async handlePostback(senderId: string, payload: string): Promise<{ processed: boolean }> {
    const conversation = db.getOrCreateConversation(senderId);
    db.addMessage({
      conversationId: conversation.id,
      platformUserId: senderId,
      senderType: 'user',
      text: `[Clic Bouton: ${payload}]`,
      deliveryStatus: 'delivered',
    });

    const settings = db.getSettings();
    // Réponse rapide automatique
    const replyText =
      `Misaotra tompoko tamin'ny safidinao. Inona no fitaovana Wi-Fi ilainao ato amin'ny ${settings.businessName} (Tenda AC5, OS3 5 km, Tenda 01 1 km) ? Na antsoy mivantana ny ${settings.businessPhone}.`;
    const sendResult = await messengerService.sendTextMessage(senderId, replyText);

    db.addMessage({
      conversationId: conversation.id,
      platformUserId: senderId,
      senderType: 'bot',
      senderName: `${settings.businessName} AI`,
      text: replyText,
      deliveryStatus: sendResult.success ? 'delivered' : 'failed',
      errorMessage: sendResult.error,
    });

    return { processed: true };
  }

  /**
   * Traite les événements de commentaires sur les publications Facebook (Feed comments)
   * 1. Répond publiquement en commentaire sous le commentaire du client
   * 2. Envoie un message privé direct dans son Messenger avec les offres et prix officiels
   */
  private async processFeedChangeEvent(
    change: WebhookFeedChange,
    pageId: string
  ): Promise<{ processed: boolean; reason?: string }> {
    if (change.field !== 'feed') {
      return { processed: false, reason: 'Non feed event' };
    }

    const val = change.value;
    if (!val || val.item !== 'comment' || val.verb !== 'add') {
      return { processed: false, reason: 'Pas un nouveau commentaire' };
    }

    const commentId = val.comment_id;
    if (!commentId) {
      return { processed: false, reason: 'Identifiant de commentaire manquant' };
    }

    // Ignorer si le commentaire vient de la Page elle-même
    if (val.from?.id && (val.from.id === pageId || val.from.id === db.getSettings().metaPageId)) {
      return { processed: false, reason: 'Commentaire posté par la Page' };
    }

    // Protection contre les doublons (Idempotence)
    if (db.hasProcessedEvent(`comment_${commentId}`)) {
      return { processed: false, reason: 'Commentaire déjà traité' };
    }
    db.recordProcessedEvent(`comment_${commentId}`, 'feed_comment');

    const settings = db.getSettings();
    const commenterName = val.from?.name || 'tompoko';
    const commentText = val.message?.trim() || '';

    db.logActivity('info', 'FEED_COMMENT_RECEIVED', `Nouveau commentaire de ${commenterName} : "${commentText.slice(0, 60)}"`, {
      commentId,
      user: val.from,
    });

    // 1. Réponse publique sous le commentaire
    const publicReply = `Manao ahoana ${commenterName} ! Nalefanay hafatra miafina (Message privé) any amin'ny Messenger-nao ny antsipiriany sy ny vidiny tompoko. Jereo ny Boîte de réception-nao ! Efa vonona ato amin'ny ${settings.businessName} (Imandry Fianarantsoa) ny stock. Antsoy ny ${settings.businessPhone}.`;
    await messengerService.replyToComment(commentId, publicReply);

    // 2. Générer la réponse commerciale personnalisée pour le message privé
    const geminiReply = await geminiService.generateMessengerReply(
      val.from?.id || commentId,
      commentText || 'Manao ahoana, ohatrinona ny vidiny ?'
    );

    const privateMessageText = `Manao ahoana ${commenterName} ! Misaotra tamin'ny fanehoan-kevitrao tamin'ny publication Facebook ato amin'ny ${settings.businessName} (Fianarantsoa).\n\n${geminiReply.text}\n\n📍 Adiresy : ${settings.businessAddress}\n📞 Telefaonina : ${settings.businessPhone}`;

    // 3. Envoyer le message privé direct via l'API Send de Meta (Private Reply)
    await messengerService.sendPrivateReplyToComment(commentId, privateMessageText);

    return { processed: true };
  }
}

export const webhookHandler = new WebhookHandler();
