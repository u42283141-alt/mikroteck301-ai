# MIKROTECK 301 — Messenger AI Manager

Tableau de bord SaaS professionnel et bot commercial intelligent propulsé par **Google Gemini** et connecté à la **Meta Messenger Platform** pour **MIKROTECK 301** (Imandry, Fianarantsoa, Madagascar | Téléphone : **038 28 171 00**).

---

## 🌟 Présentation

Cette application offre une solution complète, moderne et sécurisée pour gérer automatiquement et manuellement les discussions clients sur Facebook Messenger :

1. **Design SaaS Premium** : Thème sombre noir, rouge et blanc, responsive (PC, tablette, mobile).
2. **Assistant Commercial Gemini** : Réponses naturelles en **Français** et en **Malgache** basées sur le modèle stable `gemini-3.8-flash` via le SDK officiel `@google/genai`.
3. **Catalogue Dynamique en Ariary (Ar)** : Les prix des équipements Wi-Fi (Tenda AC5, OS3 5 km, Tenda 01, packs) sont modifiables en direct sans coder et sans redémarrage.
4. **Intégration Facebook Messenger Robuste** :
   - Webhook officiel avec vérification GET (`hub.challenge`).
   - Signature cryptographique `X-Hub-Signature-256` (HMAC-SHA256).
   - Envoi de messages via la Send API de Meta Graph API v21.0.
   - Suppression des echos et idempotence contre les doublons d'événements.
   - Gestion des transferts vers un opérateur humain (Human Handoff).
5. **Stockage Persistant & Migrations** : Base de données locale persistante atomique avec compatibilité directe PostgreSQL (Render, Cloud SQL, Supabase).
6. **Sécurité Maximale** : La clé `GEMINI_API_KEY` et les secrets Meta ne sont jamais transmis au navigateur.
7. **Simulateur & Suite de Tests Intégrée** : 10 tests automatisés exécutables en un clic depuis le tableau de bord ou en ligne de commande.

---

## 📦 Catalogue Initial des Produits MIKROTECK 301

- **Tenda AC5 AC1200** : 85 000 Ar
- **OS3 5 km 5 GHz** : 180 000 Ar
- **Tenda 01 1 km 5 GHz** : 135 000 Ar
- **Pack OS3 + AC5** : 265 000 Ar
- **Pack Tenda 01 + AC5** : 215 000 Ar

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js version 18 ou supérieure.
- Clé d'API Google Gemini (`GEMINI_API_KEY`).

### Installation et Lancement Local
```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur full-stack de développement (Port 3000)
npm run dev

# 3. Lancer la suite des 10 tests automatisés
npm test

# 4. Compiler pour la production
npm run build
npm start
```

---

## ⚙️ Variables d'Environnement (.env)

```env
PORT=3000
APP_URL="https://votre-domaine.onrender.com"
GEMINI_API_KEY="votre_cle_gemini_secrete"
GEMINI_MODEL="gemini-3.8-flash"

META_VERIFY_TOKEN="mikroteck301_verify_token_2026"
META_APP_SECRET="votre_app_secret_meta"
META_APP_ID="votre_meta_app_id"
META_PAGE_ACCESS_TOKEN="votre_page_access_token_longue_duree"
META_PAGE_ID="votre_page_id"

# Optionnel : PostgreSQL sur Render / Supabase
# DATABASE_URL="postgresql://user:password@host:5432/mikroteck_db"
```

---

## 🌐 Déploiement sur Render (Sans Programmation)

1. Créez un compte sur [Render.com](https://render.com).
2. Cliquez sur **New + > Web Service** et sélectionnez votre dépôt.
3. Renseignez :
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm run start`
4. Dans l'onglet **Environment**, ajoutez les variables listées ci-dessus.
5. Dans [developers.facebook.com](https://developers.facebook.com) > Messenger > Webhook :
   - URL de rappel : `https://votre-app.onrender.com/api/webhook`
   - Jeton de vérification : Votre `META_VERIFY_TOKEN`
   - Champs cochés : `messages`, `messaging_postbacks`

---

## 📞 Contact Officiel

- **Entreprise** : MIKROTECK 301
- **Localisation** : Imandry, Fianarantsoa, Madagascar
- **Téléphone** : 038 28 171 00
