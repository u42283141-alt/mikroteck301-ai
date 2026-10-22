import React, { useState, useEffect } from 'react';
import {
  Facebook,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Key,
  Globe,
  Lock,
  Send,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import type { AppSettings } from '../types';

interface FacebookSetupViewProps {
  settings: AppSettings | null;
  onRefreshSettings: () => void;
}

export const FacebookSetupView: React.FC<FacebookSetupViewProps> = ({
  settings,
  onRefreshSettings,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form states
  const [verifyToken, setVerifyToken] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [pageAccessToken, setPageAccessToken] = useState('');
  const [pageId, setPageId] = useState('');

  // Status & testing
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [tokenTestResult, setTokenTestResult] = useState<{
    valid: boolean;
    pageInfo?: any;
    error?: string;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulator states
  const [simText, setSimText] = useState('Manao ahoana, ohatrinona ny vidin\'ny Tenda AC5 ?');
  const [simSenderName, setSimSenderName] = useState('Client Fianarantsoa');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  useEffect(() => {
    if (settings) {
      setVerifyToken(settings.metaVerifyToken || 'mikroteck301_verify_token_2026');
      setAppSecret(settings.metaAppSecret || '');
      setPageAccessToken(settings.metaPageAccessToken || '');
      setPageId(settings.metaPageId || '');
    }
  }, [settings]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const baseUrl = settings?.appUrl && settings.appUrl.startsWith('http')
    ? settings.appUrl.replace(/\/$/, '')
    : window.location.origin;
  const webhookUrl = `${baseUrl}/api/webhook`;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metaVerifyToken: verifyToken,
          metaAppSecret: appSecret,
          metaPageAccessToken: pageAccessToken,
          metaPageId: pageId,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        onRefreshSettings();
      }
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestToken = async () => {
    if (!pageAccessToken.trim()) return;
    setIsTestingToken(true);
    setTokenTestResult(null);

    try {
      const res = await fetch('/api/meta/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: pageAccessToken.trim() }),
      });
      const data = await res.json();
      setTokenTestResult(data);
      if (data.valid) {
        onRefreshSettings();
      }
    } catch (err: any) {
      setTokenTestResult({ valid: false, error: err.message || 'Erreur réseau' });
    } finally {
      setIsTestingToken(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!simText.trim() || isSimulating) return;
    setIsSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/meta/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: simText.trim(),
          senderName: simSenderName.trim(),
        }),
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err: any) {
      setSimResult({ success: false, error: err.message });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#14141d] to-[#0e0e14] border border-[#22222d] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Facebook className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Intégration Facebook Messenger Platform</h2>
            <p className="text-xs text-zinc-400">
              Reliez votre Page Facebook officielle pour recevoir et répondre aux messages clients 24h/24.
            </p>
          </div>
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-2">
          {settings?.metaPageName ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Page active : {settings.metaPageName}
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-zinc-500" />
              Statut : Non connecté
            </div>
          )}
        </div>
      </div>

      {/* Step by step Setup Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Webhook Parameters Card */}
          <div className="p-5 rounded-2xl bg-[#121218] border border-[#22222d] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-white">1. Paramètres du Webhook Meta</h3>
              </div>
              <span className="text-[11px] text-zinc-500">GET & POST /api/webhook</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Copiez ces deux informations dans votre portail{' '}
              <a
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noreferrer"
                className="text-red-400 hover:underline font-semibold inline-flex items-center gap-0.5"
              >
                Meta for Developers <ExternalLink className="w-3 h-3" />
              </a>{' '}
              à la section <strong>Messenger &gt; Paramètres &gt; Webhooks</strong>.
            </p>

            {/* Webhook URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                URL de rappel (Callback URL)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(webhookUrl, 'url')}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-zinc-700 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'url' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            </div>

            {/* Verify Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Jeton de vérification (Verify Token)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-red-600"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(verifyToken, 'token')}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-zinc-700 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {copiedField === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'token' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Page Access Token & Secret Card */}
          <form onSubmit={handleSaveSettings} className="p-5 rounded-2xl bg-[#121218] border border-[#22222d] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-white">2. Jetons d'Accès et Clés Secrètes Meta</h3>
              </div>
              <span className="text-[11px] text-zinc-500">Chiffrement & Sécurité</span>
            </div>

            {/* Page Access Token */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  Jeton d'Accès de Page (Page Access Token)
                </label>
                <span className="text-[11px] text-zinc-500">Permission: pages_messaging</span>
              </div>
              <div className="relative">
                <textarea
                  rows={2}
                  placeholder="EAA... (Jeton généré depuis votre application Meta Developers)"
                  value={pageAccessToken}
                  onChange={(e) => setPageAccessToken(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-red-600 placeholder-zinc-600"
                />
              </div>

              {/* Test Page Token Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleTestToken}
                  disabled={!pageAccessToken.trim() || isTestingToken}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-medium border border-blue-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingToken ? 'animate-spin' : ''}`} />
                  Tester la validité du jeton avec Meta Graph API
                </button>
              </div>

              {/* Token test result feedback */}
              {tokenTestResult && (
                <div
                  className={`mt-2 p-3 rounded-xl text-xs border ${
                    tokenTestResult.valid
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                      : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                  }`}
                >
                  {tokenTestResult.valid ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Jeton Meta valide ! Page identifiée : {tokenTestResult.pageInfo?.name}
                      </div>
                      <div className="text-[11px] text-zinc-300 font-mono">
                        ID: {tokenTestResult.pageInfo?.id} | Catégorie: {tokenTestResult.pageInfo?.category || 'Non renseignée'}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Échec du test de jeton :</div>
                        <div className="text-[11px] mt-0.5">{tokenTestResult.error}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Meta App Secret */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  Clé Secrète de l'Application Meta (App Secret)
                </label>
                <span className="text-[11px] text-zinc-500">Pour X-Hub-Signature-256</span>
              </div>
              <input
                type="password"
                placeholder="0123456789abcdef0123456789abcdef"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-red-600 placeholder-zinc-600"
              />
              <p className="text-[11px] text-zinc-500">
                Protège contre les requêtes contrefaites. Chaque webhook entrant est validé par HMAC-SHA256.
              </p>
            </div>

            {/* Save Buttons */}
            <div className="pt-2 flex items-center justify-between">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Enregistré avec succès !
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/40 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Enregistrement...' : 'Enregistrer la configuration'}
                </button>
              </div>
            </div>
          </form>

          {/* Webhook Simulator (Test End-to-End) */}
          <div className="p-5 rounded-2xl bg-[#121218] border border-[#22222d] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-white">3. Simulateur de Message Client (Test direct)</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40">
                Test en direct
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Permet de tester l'intégralité du pipeline (réception webhook, génération Gemini avec tarifs officiels,
              et enregistrement en base) sans devoir attendre un message réel sur Facebook.
            </p>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "Manao ahoana, ohatrinona ny vidin'ny Tenda AC5 ?",
                "Bonjour, je cherche un pont Wi-Fi pour relier 2 maisons à 4 km.",
                "Inona avy ny fitaovana misy ao amin'ny MIKROTECK 301 ?",
                "Quel est le prix du Pack OS3 + AC5 ?",
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSimText(preset)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-300 border border-zinc-800 transition-colors"
                >
                  {preset.slice(0, 36)}...
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nom fictif du client..."
                  value={simSenderName}
                  onChange={(e) => setSimSenderName(e.target.value)}
                  className="w-48 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Message du client à simuler..."
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
                />
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={!simText.trim() || isSimulating}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-950/40 disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSimulating ? 'Test en cours...' : 'Simuler'}
                </button>
              </div>
            </div>

            {/* Simulation output */}
            {simResult && (
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400 font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Message simulé traité avec succès
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Conv ID : {simResult.conversationId}
                  </span>
                </div>
                {simResult.messages && simResult.messages.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {simResult.messages.slice(-2).map((m: any, i: number) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg text-xs ${
                          m.senderType === 'user'
                            ? 'bg-zinc-800 text-zinc-200'
                            : 'bg-red-950/60 text-red-200 border border-red-800/40 font-medium'
                        }`}
                      >
                        <div className="text-[10px] font-bold text-zinc-400 mb-0.5">
                          {m.senderType === 'user' ? 'Client' : 'Réponse MIKROTECK 301 AI :'}
                        </div>
                        {m.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Step-by-Step Meta Developer Instructions */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#121218] border border-[#22222d] space-y-3.5 text-xs text-zinc-300">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Procédure Débutant Meta (Étape par Étape)
            </h4>

            <ol className="list-decimal list-inside space-y-2.5 text-zinc-400 leading-relaxed">
              <li>
                Rendez-vous sur{' '}
                <a
                  href="https://developers.facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-400 underline"
                >
                  developers.facebook.com
                </a>{' '}
                et connectez-vous.
              </li>
              <li>Créez une application de type <strong>« Entreprise »</strong> ou <strong>« Autre »</strong>.</li>
              <li>Dans le tableau de bord Meta, ajoutez le produit <strong>« Messenger »</strong>.</li>
              <li>
                Accédez à <strong>Paramètres de Messenger &gt; Pages</strong> et associez votre Page Facebook de MIKROTECK 301.
              </li>
              <li>
                Générez le <strong>Jeton d'accès de la Page (Page Access Token)</strong> et collez-le à gauche.
              </li>
              <li>
                Allez dans <strong>Webhooks &gt; Modifier l'URL de rappel</strong>, collez l'URL et le Jeton de vérification ci-contre.
              </li>
              <li>
                Abonnez le webhook aux champs suivants : <code>messages</code>, <code>messaging_postbacks</code>.
              </li>
            </ol>
          </div>

          {/* Meta Errors Guide */}
          <div className="p-5 rounded-2xl bg-[#121218] border border-[#22222d] space-y-2.5 text-xs">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Codes d'Erreurs Meta Courants
            </h4>
            <div className="space-y-2 text-[11px] text-zinc-400">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="font-bold text-rose-400">Code 190 (Token Expired) :</span> Le jeton a expiré. Régénérez un jeton longue durée (60 jours ou système).
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="font-bold text-rose-400">Code 10 (Permissions) :</span> Permission <code>pages_messaging</code> manquante sur l'application Meta.
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="font-bold text-rose-400">Code 200 (Fenêtre 24h) :</span> Facebook interdit d'écrire à un client si plus de 24h se sont écoulées sans interaction de sa part.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
