import React, { useState } from 'react';
import {
  Rocket,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Server,
  Facebook,
  Database,
  AlertCircle,
  HelpCircle,
  Terminal,
  CheckCircle2
} from 'lucide-react';
import type { AppSettings } from '../types';

interface DeploymentGuideViewProps {
  settings: AppSettings | null;
}

export const DeploymentGuideView: React.FC<DeploymentGuideViewProps> = ({ settings }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const renderEnvVars = `# Variables d'environnement pour Render / Cloud Run
PORT=3000
NODE_ENV=production
APP_URL=https://votre-app-render.onrender.com

# Google Gemini API
GEMINI_API_KEY=votre_cle_gemini_ici
GEMINI_MODEL=gemini-3.8-flash

# Meta Facebook Messenger Platform
META_VERIFY_TOKEN=${settings?.metaVerifyToken || 'mikroteck301_verify_token_2026'}
META_APP_SECRET=votre_app_secret_meta
META_PAGE_ACCESS_TOKEN=votre_page_access_token
META_APP_ID=votre_meta_app_id
META_PAGE_ID=${settings?.metaPageId || 'votre_page_id'}

# Base de données PostgreSQL (Optionnelle, sinon stockage local actif)
# DATABASE_URL=postgresql://user:password@hostname:5432/mikroteck_db`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#14141d] to-[#0e0e14] border border-[#22222d] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Guide de Déploiement Cloud (Pour Débutant)</h2>
            <p className="text-xs text-zinc-400">
              Comment mettre votre bot en ligne 24h/24 gratuitement sur Render et le relier à Facebook sans taper de code.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-mono">
          Render / Supabase / Meta
        </span>
      </div>

      {/* Direct Project ZIP Download Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/60 via-red-900/30 to-zinc-900 border border-red-600/40 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-600 text-white">
              Étape 0 — Obtenir les fichiers
            </span>
            <span className="text-xs text-red-300 font-semibold">1-Clic pour Débutant</span>
          </div>
          <h3 className="text-base font-bold text-white">
            Où est le fichier GitHub ? Téléchargez-le directement ici !
          </h3>
          <p className="text-xs text-zinc-300 max-w-xl">
            Cliquez sur le bouton ci-contre pour télécharger l'archive complète <strong>mikroteck301-messenger-ai.zip</strong> contenant tous les fichiers du bot prêts à être déposés sur GitHub.
          </p>
        </div>

        <a
          href="/api/project/download-zip"
          download="mikroteck301-messenger-ai.zip"
          className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-950/60 transition-all flex items-center gap-2 shrink-0 border border-red-400/30"
        >
          <Rocket className="w-4 h-4 fill-white" />
          Télécharger le Projet (ZIP pour GitHub)
        </a>
      </div>

      {/* 4 Major Steps */}
      <div className="space-y-6">
        {/* Step 1: GitHub / Render Hosting */}
        <div className="p-5 rounded-2xl bg-[#121218] border border-[#22222d] space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
            <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center text-xs">
              1
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Hébergement Gratuit du Serveur sur Render.com
              </h3>
              <p className="text-xs text-zinc-400">
                Render fournit une URL HTTPS sécurisée requise par Facebook Messenger pour les webhooks.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-zinc-300">
            <ol className="list-decimal list-inside space-y-2 text-zinc-400 leading-relaxed">
              <li>
                Créez un compte gratuit sur{' '}
                <a
                  href="https://render.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-400 underline font-semibold inline-flex items-center gap-0.5"
                >
                  Render.com <ExternalLink className="w-3 h-3" />
                </a>.
              </li>
              <li>
                Cliquez sur <strong>New + &gt; Web Service</strong> et liez votre dépôt GitHub contenant le code de ce projet.
              </li>
              <li>
                Renseignez les commandes suivantes :
                <div className="my-2 p-3 rounded-xl bg-black/60 font-mono text-[11px] text-zinc-300 border border-zinc-800 space-y-1">
                  <div><strong>Build Command :</strong> <code>npm install && npm run build</code></div>
                  <div><strong>Start Command :</strong> <code>npm run start</code></div>
                </div>
              </li>
              <li>
                Choisissez le plan <strong>Free (Gratuit)</strong>.
              </li>
            </ol>
          </div>
        </div>

        {/* Step 2: Environment Variables */}
        <div className="p-5 rounded-2xl bg-[#121218] border border-[#22222d] space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Variables d'Environnement à Coller sur Render
                </h3>
                <p className="text-xs text-zinc-400">
                  Dans les paramètres Render (onglet <strong>Environment</strong>), collez ces variables.
                </p>
              </div>
            </div>

            <button
              onClick={() => copyText(renderEnvVars, 'env')}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-colors"
            >
              {copiedSection === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'env' ? 'Copié !' : 'Copier tout le bloc'}</span>
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-black/70 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
            {renderEnvVars}
          </pre>
        </div>

        {/* Step 3: Meta App & Messenger Connection */}
        <div className="p-5 rounded-2xl bg-[#121218] border border-[#22222d] space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
            <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center text-xs">
              3
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Configuration de la Plateforme Meta Messenger
              </h3>
              <p className="text-xs text-zinc-400">
                Liaison officielle de votre Page Facebook de MIKROTECK 301.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-zinc-300">
            <ol className="list-decimal list-inside space-y-2.5 text-zinc-400 leading-relaxed">
              <li>
                Accédez à{' '}
                <a
                  href="https://developers.facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-400 underline font-semibold"
                >
                  developers.facebook.com
                </a>{' '}
                &gt; Mes applications &gt; Créer une application.
              </li>
              <li>
                Sélectionnez le cas d'usage <strong>« Communiquer avec des clients »</strong> ou <strong>« Entreprise »</strong>.
              </li>
              <li>
                Ajoutez le produit <strong>Messenger</strong> à votre application.
              </li>
              <li>
                Dans <strong>Paramètres de Messenger &gt; Jetons d'accès</strong>, cliquez sur <strong>« Ajouter ou supprimer des pages »</strong> et sélectionnez votre Page Facebook.
              </li>
              <li>
                Générez le <strong>Jeton d'accès de page</strong> et copiez-le.
              </li>
              <li>
                Dans <strong>Webhooks</strong>, cliquez sur <strong>Modifier l'URL de rappel</strong> :
                <ul className="list-disc list-inside ml-4 mt-1 text-zinc-300 font-mono text-[11px]">
                  <li>URL : <code>https://votre-app.onrender.com/api/webhook</code></li>
                  <li>Jeton de vérification : <code>{settings?.metaVerifyToken || 'mikroteck301_verify_token_2026'}</code></li>
                </ul>
              </li>
              <li>
                Cochez les abonnements <strong>messages</strong> et <strong>messaging_postbacks</strong>.
              </li>
            </ol>
          </div>
        </div>

        {/* Step 4: Verification and Meta App Review */}
        <div className="p-5 rounded-2xl bg-[#121218] border border-[#22222d] space-y-3 text-xs text-zinc-300">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
            <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center text-xs">
              4
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Tests & Démarches de Mise en Production Meta
              </h3>
              <p className="text-xs text-zinc-400">
                Mode Développement vs Mode En Ligne officiel.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-zinc-400 leading-relaxed">
            <p>
              <strong>1. En Mode Développement (Immédiat & 100% Gratuit) :</strong> Tant que votre application Meta est en mode
              développement, vous n'avez besoin d'<strong>aucune vérification d'entreprise</strong>. Les administrateurs et les comptes Facebook ajoutés dans l'onglet
              <strong> Rôles &gt; Testeurs</strong> peuvent immédiatement discuter avec le bot.
            </p>
            <p>
              <strong>2. Pour le Public Général (Production) :</strong> Pour que n'importe quel client externe à Madagascar puisse
              recevoir les réponses automatiques, passez l'application en <strong>Mode En Ligne (Live)</strong>. Meta demande une vérification d'application
              (App Review) pour la permission <code>pages_messaging</code> : c'est <strong>gratuit</strong> (Meta ne fait pas payer l'utilisation de l'API Messenger).
            </p>
          </div>
        </div>

        {/* Section FAQ & Transparence : Gratuit, Illimité & Vérification */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161622] to-[#111118] border border-blue-900/40 space-y-4">
          <div className="flex items-center gap-2.5 text-blue-400 border-b border-zinc-800 pb-3">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              FAQ : Est-ce Gratuit, Illimité et sans Vérification d'Entreprise ?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 100% Gratuit
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Render a un plan gratuit, l'API Gemini a un quota gratuit généreux (Google AI Studio Free Tier), et l'API Messenger de Meta est entièrement gratuite. Aucun paiement par message.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Limite des 24 heures
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Meta autorise des réponses illimitées tant qu'elles ont lieu dans les 24h suivant le dernier message du client. C'est parfait pour le service client de MIKROTECK 301.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="font-bold text-blue-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Pas de Kbis / NIF requis
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Pas besoin du badge payant "Meta Verified". Pour les tests, aucun document requis. Pour le grand public, seule la validation d'autorisation technique Messenger (gratuite) est demandée.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
