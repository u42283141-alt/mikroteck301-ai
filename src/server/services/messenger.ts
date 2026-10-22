import crypto from 'node:crypto';
import { db } from '../db/database.js';

export interface MetaPageInfo {
  id: string;
  name: string;
  category?: string;
  tasks?: string[];
}

class MessengerService {
  private readonly GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

  /**
   * Vérifie cryptographiquement la signature X-Hub-Signature-256 transmise par Meta.
   * Utilise un comparateur en temps constant (timingSafeEqual) pour parer aux attaques temporelles.
   */
  public verifySignature(rawBody: Buffer | string, signatureHeader: string | undefined, appSecret: string): boolean {
    if (!signatureHeader || !appSecret) {
      // Si aucun secret n'est configuré sur le serveur, on refuse par mesure de sécurité
      return false;
    }

    const parts = signatureHeader.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256') {
      return false;
    }

    const signature = parts[1];
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf-8') : rawBody)
      .digest('hex');

    try {
      const sigBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Envoie un indicateur d'action (ex: 'typing_on', 'mark_seen') sur Messenger
   */
  public async sendSenderAction(
    recipientId: string,
    action: 'typing_on' | 'typing_off' | 'mark_seen',
    pageAccessToken?: string
  ): Promise<boolean> {
    const token = pageAccessToken || db.getSettings().metaPageAccessToken;
    if (!token) return false;

    try {
      const res = await fetch(`${this.GRAPH_API_BASE}/me/messages?access_token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          sender_action: action,
        }),
        signal: AbortSignal.timeout(4000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Envoie un message texte réel au client via l'API Graph Meta Send API
   */
  public async sendTextMessage(
    recipientId: string,
    text: string,
    pageAccessToken?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string; errorCode?: number }> {
    const token = pageAccessToken || db.getSettings().metaPageAccessToken;

    if (!token) {
      return {
        success: false,
        error: 'Aucun Jeton d\'Accès de Page (Page Access Token) configuré.',
      };
    }

    // Les vrais identifiants Facebook (PSID) sont obligatoirement composés uniquement de chiffres
    // Tout identifiant contenant des lettres (ex: user_handoff_..., test_psid_..., client_demo_...) est un test local
    const isRealFacebookUser = /^\d{5,}$/.test(recipientId);
    if (!isRealFacebookUser) {
      return {
        success: true,
        messageId: `sim_msg_${Date.now()}`,
      };
    }

    try {
      const url = `${this.GRAPH_API_BASE}/me/messages?access_token=${encodeURIComponent(token)}`;
      const payload = {
        recipient: { id: recipientId },
        messaging_type: 'RESPONSE',
        message: { text },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      });

      const data = (await response.json()) as any;

      if (!response.ok || data.error) {
        const errMsg = data.error?.message || `Erreur HTTP ${response.status}`;
        const errCode = data.error?.code;
        const errSubcode = data.error?.error_subcode;

        let friendlyError = `Erreur Meta : ${errMsg}`;
        if (errCode === 190) {
          friendlyError = 'Le Jeton d\'Accès Facebook a expiré ou est invalide. Veuillez régénérer votre Page Access Token.';
        } else if (errCode === 10) {
          friendlyError = 'Autorisations insuffisantes. Votre application Meta a besoin de la permission "pages_messaging".';
        } else if (errCode === 200 || errSubcode === 2018001) {
          friendlyError = 'Fenêtre de messagerie fermée : plus de 24h se sont écoulées depuis le dernier message du client.';
        } else if (errCode === 613) {
          friendlyError = 'Limite de débit Meta atteinte (Rate limit). Réessayez dans quelques minutes.';
        }

        db.logActivity('error', 'MESSENGER_SEND_FAILED', friendlyError, {
          recipientId,
          code: errCode,
          subcode: errSubcode,
          raw: data.error,
        });

        return {
          success: false,
          error: friendlyError,
          errorCode: errCode,
        };
      }

      db.logActivity('success', 'MESSENGER_MESSAGE_SENT', `Message envoyé avec succès à ${recipientId}`, {
        messageId: data.message_id,
      });

      return {
        success: true,
        messageId: data.message_id,
      };
    } catch (err: any) {
      const errorStr = `Erreur réseau lors de l'envoi Messenger : ${err.message}`;
      db.logActivity('error', 'MESSENGER_NETWORK_ERROR', errorStr, { recipientId });
      return {
        success: false,
        error: errorStr,
      };
    }
  }

  /**
   * Répond publiquement en commentaire sous le commentaire d'un internaute sur une publication
   */
  public async replyToComment(
    commentId: string,
    message: string,
    pageAccessToken?: string
  ): Promise<{ success: boolean; commentId?: string; error?: string }> {
    const token = pageAccessToken || db.getSettings().metaPageAccessToken;
    if (!token) return { success: false, error: 'Page Access Token manquant' };

    try {
      const url = `${this.GRAPH_API_BASE}/${encodeURIComponent(commentId)}/comments?access_token=${encodeURIComponent(token)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: AbortSignal.timeout(6000),
      });

      const data = (await res.json()) as any;
      if (!res.ok || data.error) {
        const err = data.error?.message || `Erreur HTTP ${res.status}`;
        db.logActivity('warn', 'COMMENT_PUBLIC_REPLY_FAILED', `Échec réponse commentaire: ${err}`, { commentId });
        return { success: false, error: err };
      }

      db.logActivity('success', 'COMMENT_PUBLIC_REPLY_SENT', `Réponse publique postée sous commentaire ${commentId}`);
      return { success: true, commentId: data.id };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Envoie un message privé direct (Private Reply) dans le Messenger de la personne qui a commenté
   */
  public async sendPrivateReplyToComment(
    commentId: string,
    text: string,
    pageAccessToken?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const token = pageAccessToken || db.getSettings().metaPageAccessToken;
    if (!token) return { success: false, error: 'Page Access Token manquant' };

    try {
      const url = `${this.GRAPH_API_BASE}/me/messages?access_token=${encodeURIComponent(token)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { comment_id: commentId },
          message: { text },
        }),
        signal: AbortSignal.timeout(6000),
      });

      const data = (await res.json()) as any;
      if (!res.ok || data.error) {
        const err = data.error?.message || `Erreur HTTP ${res.status}`;
        db.logActivity('warn', 'COMMENT_PRIVATE_REPLY_FAILED', `Échec message privé sous commentaire: ${err}`, { commentId });
        return { success: false, error: err };
      }

      db.logActivity('success', 'COMMENT_PRIVATE_REPLY_SENT', `Message privé envoyé avec succès à la personne du commentaire ${commentId}`);
      return { success: true, messageId: data.message_id };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Teste la validité réelle d'un Page Access Token auprès de Meta Graph API
   */
  public async testPageAccessToken(token: string): Promise<{
    valid: boolean;
    pageInfo?: MetaPageInfo;
    error?: string;
  }> {
    if (!token || token.trim().length === 0) {
      return { valid: false, error: 'Le jeton d\'accès est vide.' };
    }

    try {
      const url = `${this.GRAPH_API_BASE}/me?fields=id,name,category&access_token=${encodeURIComponent(token.trim())}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const data = (await response.json()) as any;

      if (!response.ok || data.error) {
        return {
          valid: false,
          error: data.error?.message || `Erreur d'authentification Meta (${response.status})`,
        };
      }

      const pageInfo: MetaPageInfo = {
        id: data.id,
        name: data.name,
        category: data.category,
      };

      // Save valid page to DB
      db.upsertConnectedPage({
        id: `page-${data.id}`,
        pageId: data.id,
        pageName: data.name,
        category: data.category,
        status: 'active',
        lastSyncedAt: new Date().toISOString(),
      });

      db.updateSettings({
        metaPageId: data.id,
        metaPageName: data.name,
        metaPageAccessToken: token.trim(),
      });

      return {
        valid: true,
        pageInfo,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: `Erreur de connexion à Facebook Graph API : ${err.message}`,
      };
    }
  }
}

export const messengerService = new MessengerService();
