import { GoogleGenAI } from '@google/genai';
import { db } from '../db/database.js';
import type { Message } from '../db/types.js';

class GeminiService {
  private getApiKeys(): string[] {
    const raw = process.env.GEMINI_API_KEY || '';
    return raw
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 5);
  }

  private getClient(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  /**
   * Construit dynamiquement le prompt système avec les informations
   * à jour de l'entreprise et le catalogue des produits et tarifs réels.
   */
  private buildSystemInstruction(): string {
    const settings = db.getSettings();
    const products = db.getProducts();

    const productCatalogText = products
      .map(
        (p) =>
          `- ${p.name} : ${p.priceAriary.toLocaleString('fr-FR')} Ariary (Ar) | Catégorie: ${p.category} | En stock: ${
            p.inStock ? 'OUI' : 'RUPTURE DE STOCK'
          } | Description: ${p.description}`
      )
      .join('\n');

    return `ROLE ET IDENTITE :
Ianao no MPIVAROTRA SY TEKNISIANINA MPANOLO-TSAINA MATIHANINA INDRINDRA (Commercial d'Élite et Conseiller Technique Réseau) an'ny ${settings.businessName} (Fianarantsoa, Madagasikara).
Ny tanjonao voalohany : MAMPIDITRA VOA-BIDY, MANDRESY LAHATRA AMIN'NY FENOM-PANAJANA SY FAHAMARINANA, ARY MIKATONA NY VAROTRA (Clôturer la vente avec succès).

INFORMATIONS DE L'ENTREPRISE :
- Orinasa : ${settings.businessName} (MIKROTECK 301)
- Toerana (Adresse) : ${settings.businessAddress}
- Fifandraisana (Téléphone & WhatsApp) : ${settings.businessPhone}
- Fomba fandoavana (Paiements) : Mvola, Airtel Money, Orange Money, na Cash eo am-pelatanana.
- Fandefasana (Livraisons) : Misy fandefasana amin'ny taxi-brousse sy coopératives manerana an'i Madagasikara.

CATALOGUE OFFICIEL SY VIDIN'ENTANA AMIN'NY ARIARY (Tsy azo ovaina) :
${productCatalogText}

TETIKADY FAMAROTANA SY FAHAIZA-MANDRESY LAHATRA (TECHNIQUES DE VENTE PRO) :
1. TENY MALAGASY VOALOHANY :
   - Raha manoratra amin'ny teny malagasy ny mpanjifa (na "salama", "manahoana", "misy router ve", "ohatrinona"), valio amin'ny TENY MALAGASY MADIO, MAFANA, SY MAHAI-MIVAROTRA avy hatrany !
   - Raha amin'ny teny frantsay kosa izy no manoratra, valio amin'ny teny frantsay kanto sy matihanina.

2. FITARIDHANA SY DIAGNOSTIC MAHAI-MIVAROTRA :
   - Aza mionona amin'ny fanomezana vidiny fotsiny ! Anontanio ny filàny marina :
     * "Firy metatra na kilometatra eo ny elanelana tianao hizarana ny connexion ?"
     * "Ho an'ny fampiasana anatiny (maison/bureau) sa ivelany (hampitohy trano roa lavitra) ?"
   - Toroy hevitra avy hatrany ny fitaovana tandrify azy :
     * Raha < 1 km : Tenda 01 1 km (135 000 Ar) na Pack Tenda 01 + AC5 (215 000 Ar).
     * Raha 1 km hatramin'ny 5 km : OS3 5 GHz 867 Mbps (180 000 Ar) na Pack OS3 + AC5 (265 000 Ar).
     * Raha Wi-Fi anatiny haingam-pandeha : Tenda AC5 AC1200 (85 000 Ar).

3. FANOMEZANA TOKY SY ARGUMENTS DE VENTE :
   - Entana azo antoka, matanjaka, mahazaka orana sy rivotra (étanche IP65 ho an'ny ivelany).
   - Manampy amin'ny configuration sy torohevitra ara-teknika ny ekipanay eto Imandry Fianarantsoa.
   - Mitsitsy vola be satria tsy mandoa famandrihana isam-bolana intsony rehefa vita ny tetezana Wi-Fi.

4. FANAKATONANA VAROTRA (CALL-TO-ACTION MAHERY VAIKA) :
   - Faranano amin'ny fanasana mazava foana ny hafatrao :
     * "Efa vonona eto am-pelatanana ny entana tompoko. Mandaloa mivantana eto amin'ny magazay eto Imandry, Fianarantsoa, na antsoy/alefaso hafatra amin'ny ${settings.businessPhone} izahay hanaovana commande sy fandefasana !"

5. ENDRIKA SY HALAVAN'NY HAFATRA :
   - Valinteny mazava, misy fiverenan'andininy (retours à la ligne) mba ho mora vakina amin'ny smartphone Facebook Messenger.`;
  }

  /**
   * Génère une réponse intelligente pour un utilisateur Messenger
   */
  public async generateMessengerReply(
    platformUserId: string,
    incomingText: string,
    historyMessages: Message[] = []
  ): Promise<{ text: string; tokensUsed?: number; error?: string }> {
    const settings = db.getSettings();
    const keys = this.getApiKeys();

    if (keys.length === 0) {
      const fallbackText = this.generateSmartFallbackReply(incomingText);
      return {
        text: fallbackText,
        error: 'Aucune clé GEMINI_API_KEY configurée. Mode vendeur expert local actif.',
      };
    }

    // Format previous conversation history (last 8 messages)
    const recentHistory = historyMessages.slice(-8);
    const formattedHistory = recentHistory.map((m) => {
      const role = m.senderType === 'user' ? 'Client' : settings.businessName;
      return `${role}: ${m.text}`;
    });

    const prompt = `Voici l'historique récent de la discussion avec ce client :
${formattedHistory.length > 0 ? formattedHistory.join('\n') : '(Début de la conversation)'}

Nouveau message reçu du client :
"${incomingText}"

Rédigez la réponse idéale de ${settings.businessName} :`;

    try {
      const systemInstruction = this.buildSystemInstruction();

      // Timeout adapté de 8.5s pour garantir une réponse rapide sans coupure prématurée
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_IA_8500MS')), 8500)
      );

      // Cascade de modèles gratuits avec 1 500 requêtes/jour gratuites sans carte de crédit
      const candidateModels = [
        settings.geminiModel || 'gemini-flash-latest',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
      ].filter((v, i, a) => a.indexOf(v) === i);

      let response: any;
      let lastModelError: any = null;

      // Boucle intelligente sur les clés gratuites (rotation) et sur les modèles
      keyLoop: for (const key of keys) {
        const ai = this.getClient(key);
        for (const candidate of candidateModels) {
          try {
            const generatePromise = ai.models.generateContent({
              model: candidate,
              contents: prompt,
              config: {
                systemInstruction,
                temperature: settings.geminiTemperature || 0.7,
              },
            });
            response = await Promise.race([generatePromise, timeoutPromise]);
            if (response?.text?.trim()) {
              break keyLoop;
            }
          } catch (mErr: any) {
            lastModelError = mErr;
            console.warn(`[Gemini] Clé/Modèle ${candidate} indisponible (${mErr.message}), passage au suivant...`);
          }
        }
      }

      if (!response?.text?.trim()) {
        throw lastModelError || new Error('Tous les modèles Gemini et clés gratuites ont atteint leur quota temporaire.');
      }

      const replyText = response.text.trim();
      const sanitizedText = replyText.length > 1950 ? replyText.substring(0, 1950) + '...' : replyText;

      return {
        text: sanitizedText,
        tokensUsed: Math.ceil((prompt.length + replyText.length) / 4),
      };
    } catch (err: any) {
      console.warn('[Gemini] Repli commercial expert malgache activé:', err.message || err);
      db.logActivity('warn', 'GEMINI_FALLBACK_TRIGGERED', `Repli vendeur expert activé (${err.message})`, {
        user: platformUserId,
        incoming: incomingText,
      });

      // Génération de repli commercial intelligent basé sur le catalogue réel et l'intention exacte
      const fallbackText = this.generateSmartFallbackReply(incomingText);

      return {
        text: fallbackText,
        error: err.message,
      };
    }
  }

  /**
   * Moteur de repli commercial intelligent : garantit que le client reçoit
   * toujours une réponse précise avec les tarifs officiels en Ariary,
   * même en cas de pic de charge ou indisponibilité temporaire de l'API Gemini.
   */
  private generateSmartFallbackReply(text: string): string {
    const q = (text || '').toLowerCase().trim();
    const settings = db.getSettings();
    const products = db.getProducts();

    const isMalagasy =
      q.includes('manao') ||
      q.includes('ahoana') ||
      q.includes('ohatrinona') ||
      q.includes('vidiny') ||
      q.includes('misy') ||
      q.includes('inona') ||
      q.includes('tompoko') ||
      q.includes('fitaovana') ||
      q.includes('misaotra') ||
      q.includes('aiza') ||
      q.includes('salama') ||
      q.includes('akory') ||
      q.includes('tsara') ||
      q.includes('aza') ||
      q.includes('ve');

    // 1. Remerciements et clôture
    if (q === 'misaotra' || q === 'misaotra tompoko' || q.includes('merci') || q === 'ok' || q === 'daccord') {
      return isMalagasy
        ? `Tsy misy fisaorana tompoko ! Faly manampy anao hatrany ny ${settings.businessName}. Antsoy ny ${settings.businessPhone} raha misy fanontaniana hafa.`
        : `Avec grand plaisir ! L'équipe de ${settings.businessName} reste à votre disposition au ${settings.businessPhone}. Bonne journée !`;
    }

    // 2. Localisation et adresse
    if (q.includes('aiza') || q.includes('où') || q.includes('ou') || q.includes('adresse') || q.includes('toerana') || q.includes('quartier') || q.includes('magasin') || q.includes('boutique')) {
      return isMalagasy
        ? `Eto ${settings.businessAddress} no misy ny ${settings.businessName}. Tonga soa eto an-toerana ianao na antsoy ny ${settings.businessPhone} raha hitari-dalana.`
        : `Nous sommes situés à ${settings.businessAddress}. Vous pouvez passer directement à notre boutique ou nous joindre au ${settings.businessPhone}.`;
    }

    // 3. Contact et numéro de téléphone
    if (q.includes('numero') || q.includes('numéro') || q.includes('contact') || q.includes('telefaonina') || q.includes('finday') || q.includes('appeler') || q.includes('joindre')) {
      return isMalagasy
        ? `Ny laharana finday azo antsoina dia : ${settings.businessPhone}. Eto ${settings.businessAddress} no misy anay.`
        : `Vous pouvez nous contacter directement au : ${settings.businessPhone}. Adresse : ${settings.businessAddress}.`;
    }

    // 4. Heures d'ouverture
    if (q.includes('ora') || q.includes('heure') || q.includes('ouvert') || q.includes('misokatra') || q.includes('ferme') || q.includes('fermé')) {
      return isMalagasy
        ? `Misokatra ny Alatsinainy ka hatramin'ny Sabotsy, manomboka amin'ny 8h maraina ka hatramin'ny 5h30 hariva ny ${settings.businessName}. Telefaonina : ${settings.businessPhone}.`
        : `${settings.businessName} est ouvert du lundi au samedi de 8h00 à 17h30. Téléphone : ${settings.businessPhone}.`;
    }

    // 5. Livraison
    if (q.includes('livraison') || q.includes('handefa') || q.includes('alefa') || q.includes('province') || q.includes('mandefa') || q.includes('expedition') || q.includes('expédition')) {
      return isMalagasy
        ? `Eny tompoko, afaka mandefa fitaovana amin'ny taxi-brousse na coopérative manerana an'i Madagasikara izahay. Mandoa vola amin'ny Mvola / Airtel Money / Orange Money. Antsoy ny ${settings.businessPhone} ho an'ny antsipiriany.`
        : `Oui, nous organisons les livraisons partout à Madagascar via coopératives ou transporteurs fiables. Contactez-nous au ${settings.businessPhone} pour coordonner l'envoi.`;
    }

    // 6. Salutations simples sans demande de produit
    const isPureGreeting =
      q === 'salama' ||
      q === 'manao ahoana' ||
      q === 'manahoana' ||
      q === 'manao ahoana tompoko' ||
      q === 'bonjour' ||
      q === 'bonsoir' ||
      q === 'salut' ||
      q === 'akory' ||
      q === 'mbôla tsara';

    if (isPureGreeting) {
      return isMalagasy
        ? `Manao ahoana tompoko ! Tonga soa eto amin'ny ${settings.businessName}. Inona no fitaovana réseau na Wi-Fi ilainao androany ? Faly manoro hevitra anao izahay.`
        : `Bonjour ! Bienvenue chez ${settings.businessName} à Fianarantsoa. Quels équipements Wi-Fi ou réseau recherchez-vous ?`;
    }

    // 7. Produits spécifiques : Pack OS3 + AC5
    if (q.includes('pack os3') || (q.includes('pack') && q.includes('os3'))) {
      const p = products.find((x) => x.name.includes('Pack OS3'));
      const price = p ? `${p.priceAriary.toLocaleString('fr-FR')} Ar` : '265 000 Ar';
      return isMalagasy
        ? `Ny Pack OS3 (5 km) + Routeur double bande Tenda AC5 dia ${price} ato amin'ny ${settings.businessName}. Pack feno vonona ampiasaina. Antsoy ny ${settings.businessPhone}.`
        : `Le Pack complet OS3 (5 km) + Routeur intérieur Tenda AC5 est à ${price} chez ${settings.businessName}. Disponible au ${settings.businessPhone}.`;
    }

    // 8. Pack Tenda 01 + AC5
    if (q.includes('pack tenda 01') || (q.includes('pack') && (q.includes('01') || q.includes('tenda 01')))) {
      const p = products.find((x) => x.name.includes('Pack Tenda 01'));
      const price = p ? `${p.priceAriary.toLocaleString('fr-FR')} Ar` : '215 000 Ar';
      return isMalagasy
        ? `Ny Pack Tenda 01 (1 km) + Routeur AC5 dia ${price} ato amin'ny ${settings.businessName}. Idealy ho an'ny fizarana connexion 1 km. Antsoy ny ${settings.businessPhone}.`
        : `Le Pack Tenda 01 (1 km) + Routeur Tenda AC5 est à ${price} chez ${settings.businessName}. Contact : ${settings.businessPhone}.`;
    }

    // 9. OS3 5 km
    if (q.includes('os3') || q.includes('5 km') || q.includes('5km')) {
      const p = products.find((x) => x.name.includes('OS3'));
      const price = p ? `${p.priceAriary.toLocaleString('fr-FR')} Ar` : '180 000 Ar';
      return isMalagasy
        ? `Ny CPE extérieur OS3 5 km 5 GHz dia ${price} ato amin'ny ${settings.businessName}. Portée 5 km point-à-point, étanche IP65. Antsoy ny ${settings.businessPhone}.`
        : `Le point d'accès extérieur OS3 5 km 5 GHz est à ${price} chez ${settings.businessName}. Portée 5 km point-à-point. Contact : ${settings.businessPhone}.`;
    }

    // 10. Tenda 01 1 km
    if (q.includes('tenda 01') || q.includes('1 km') || q.includes('1km')) {
      const p = products.find((x) => x.name.includes('Tenda 01'));
      const price = p ? `${p.priceAriary.toLocaleString('fr-FR')} Ar` : '135 000 Ar';
      return isMalagasy
        ? `Ny CPE extérieur Tenda 01 1 km 5 GHz dia ${price} ato amin'ny ${settings.businessName}. Mahatratra 1 km. Antsoy ny ${settings.businessPhone}.`
        : `Le CPE extérieur Tenda 01 1 km 5 GHz est disponible à ${price} chez ${settings.businessName}. Téléphone : ${settings.businessPhone}.`;
    }

    // 11. Demande générale "Tenda"
    if (q === 'tenda' || q.includes('tenda misy') || q.includes('marika tenda') || (q.includes('tenda') && !q.includes('01') && !q.includes('ac5'))) {
      return isMalagasy
        ? `Manana fitaovana Tenda maromaro izahay ato amin'ny ${settings.businessName} :\n1. Routeur Wi-Fi Tenda AC5 (AC1200) anatiny : 85 000 Ar\n2. CPE Tenda 01 1 km (5 GHz) ivelany : 135 000 Ar\n3. Pack Tenda 01 + AC5 : 215 000 Ar\nInona amin'ireo no mety aminao tompoko ? Antsoy ny ${settings.businessPhone}.`
        : `Nous proposons plusieurs équipements Tenda chez ${settings.businessName} :\n1. Routeur intérieur Tenda AC5 (AC1200) : 85 000 Ar\n2. Point d'accès extérieur Tenda 01 (1 km 5 GHz) : 135 000 Ar\n3. Pack Tenda 01 + AC5 : 215 000 Ar\nLequel correspond à votre projet ? Contact : ${settings.businessPhone}.`;
    }

    // 12. Tenda AC5
    if (q.includes('ac5') || q.includes('ac1200') || q.includes('routeur') || q.includes('router')) {
      const p = products.find((x) => x.name.includes('AC5'));
      const price = p ? `${p.priceAriary.toLocaleString('fr-FR')} Ar` : '85 000 Ar';
      return isMalagasy
        ? `Ny routeur Wi-Fi Tenda AC5 AC1200 dia ${price} ato amin'ny ${settings.businessName}. Double bande, 4 antennes 5dBi matanjaka be. Antsoy ny ${settings.businessPhone}.`
        : `Le routeur Wi-Fi double bande Tenda AC5 AC1200 est à ${price} chez ${settings.businessName}. 4 antennes haute portée. Contact : ${settings.businessPhone}.`;
    }

    // 13. Configuration & Installation
    if (q.includes('config') || q.includes('apetraka') || q.includes('installer') || q.includes('installation') || q.includes('fampiasana') || q.includes('sarotra')) {
      return isMalagasy
        ? `Tena mora apetraka sy ampiasaina tompoko ny fitaovanay ! Manome torolalana sy manampy anao amin'ny configuration hatramin'ny farany koa ny ekipanay eto Imandry Fianarantsoa. Antsoy ny ${settings.businessPhone} raha misy fanontaniana ara-teknika.`
        : `Nos équipements sont très simples à installer et préconfigurables ! Notre équipe technique à Imandry Fianarantsoa vous guide pas à pas. Contactez le ${settings.businessPhone} pour toute assistance.`;
    }

    // 14. Partage de connexion & Wi-Fi longue portée
    if (q.includes('hizara') || q.includes('partage') || q.includes('tetezana') || q.includes('pont') || q.includes('lavitra') || q.includes('distansy') || q.includes('distance')) {
      return isMalagasy
        ? `Raha hizara connexion tompoko :\n• Latsaky ny 1 km : Tenda 01 (135 000 Ar) na Pack Tenda 01 + AC5 (215 000 Ar)\n• 1 km hatramin'ny 5 km : OS3 5 GHz (180 000 Ar) na Pack OS3 + AC5 (265 000 Ar)\nFiry kilometatra eo ny elanelan'ny trano tianao hampitohizana tompoko ? Antsoy ny ${settings.businessPhone}.`
        : `Pour partager une connexion sans fil :\n• Moins de 1 km : Tenda 01 (135 000 Ar) ou Pack Tenda 01 + AC5 (215 000 Ar)\n• De 1 à 5 km : OS3 5 GHz (180 000 Ar) ou Pack OS3 + AC5 (265 000 Ar)\nQuelle est la distance exacte entre vos deux points ? Contact : ${settings.businessPhone}.`;
    }

    // 15. Disponibilité du stock
    if (q.includes('misy ve') || q.includes('mbola misy') || q.includes('disponible') || q.includes('dispo') || q.includes('stock')) {
      return isMalagasy
        ? `Eny tompoko, misy avokoa ny stock eto amin'ny ${settings.businessName} (Imandry Fianarantsoa) :\n• Routeur Tenda AC5 : 85 000 Ar\n• Tenda 01 (1 km) : 135 000 Ar\n• OS3 (5 km) : 180 000 Ar\n• Pack OS3 + AC5 : 265 000 Ar\n• Pack Tenda 01 + AC5 : 215 000 Ar\nInona amin'ireo no tianao hatokana ho anao ? Antsoy ny ${settings.businessPhone}.`
        : `Oui ! Tous nos produits sont actuellement disponibles en stock chez ${settings.businessName} :\n• Routeur Tenda AC5 : 85 000 Ar\n• CPE Tenda 01 (1 km) : 135 000 Ar\n• CPE OS3 (5 km) : 180 000 Ar\n• Pack OS3 + AC5 : 265 000 Ar\n• Pack Tenda 01 + AC5 : 215 000 Ar\nLequel souhaitez-vous réserver ? Contact : ${settings.businessPhone}.`;
    }

    // 16. Réponse par défaut active d'un vendeur professionnel
    return isMalagasy
      ? `Manao ahoana tompoko ! Faly mandray anao ato amin'ny ${settings.businessName} (Imandry Fianarantsoa). Mpivarotra sy mpanolo-tsaina amin'ny fitaovana Wi-Fi sy réseau izahay. Inona no tetikasa tianao hotanterahina (fizarana connexion 1 km na 5 km, sa router Wi-Fi anatiny) ? Na antsoy mivantana ny ${settings.businessPhone} !`
      : `Bonjour ! Bienvenue chez ${settings.businessName} à Fianarantsoa. Nous sommes spécialistes des équipements réseau et Wi-Fi longue portée. Quel est votre besoin (partage de connexion à distance ou Wi-Fi intérieur) ? Vous pouvez aussi nous joindre directement au ${settings.businessPhone}.`;
  }

  /**
   * Résume une longue conversation pour l'opérateur humain
   */
  public async summarizeConversation(messages: Message[]): Promise<string> {
    const keys = this.getApiKeys();
    if (keys.length === 0) return 'Clé Gemini indisponible pour générer un résumé.';
    const ai = this.getClient(keys[0]);
    const settings = db.getSettings();

    const textLog = messages
      .slice(-15)
      .map((m) => `${m.senderType === 'user' ? 'Client' : 'Bot'}: ${m.text}`)
      .join('\n');

    try {
      const response = await ai.models.generateContent({
        model: settings.geminiModel || 'gemini-flash-latest',
        contents: `Résumez brièvement en 2 ou 3 phrases les besoins et demandes du client ci-dessous pour un technicien de ${settings.businessName} :\n\n${textLog}`,
      });
      return response.text?.trim() || 'Aucun résumé disponible.';
    } catch (err: any) {
      return `Impossible de résumer : ${err.message}`;
    }
  }

  /**
   * Test de connexion en direct à l'API Gemini
   */
  public async testConnection(customPrompt?: string): Promise<{
    success: boolean;
    model: string;
    output?: string;
    error?: string;
    latencyMs: number;
  }> {
    const startTime = Date.now();
    const keys = this.getApiKeys();
    const settings = db.getSettings();
    const testModel = settings.geminiModel || 'gemini-flash-latest';

    if (keys.length === 0) {
      return {
        success: false,
        model: testModel,
        error: 'Aucune clé GEMINI_API_KEY détectée dans les variables d\'environnement du serveur.',
        latencyMs: 0,
      };
    }

    try {
      const ai = this.getClient(keys[0]);
      const prompt = customPrompt || `Présentez en 1 phrase courte ${settings.businessName} à Fianarantsoa.`;

      const response = await ai.models.generateContent({
        model: testModel,
        contents: prompt,
      });

      const text = response.text?.trim() || '';
      const latencyMs = Date.now() - startTime;

      db.logActivity('success', 'GEMINI_TEST_SUCCESS', `Test de connexion Gemini réussi (${latencyMs}ms)`, {
        model: testModel,
      });

      return {
        success: true,
        model: testModel,
        output: text,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      db.logActivity('error', 'GEMINI_TEST_FAILED', `Échec du test Gemini: ${err.message}`, { err });
      return {
        success: false,
        model: testModel,
        error: err.message || 'Erreur lors du contact de l\'API Gemini',
        latencyMs,
      };
    }
  }
}

export const geminiService = new GeminiService();
