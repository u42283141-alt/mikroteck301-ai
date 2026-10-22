import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Send,
  Languages,
  ShieldCheck,
  Check
} from 'lucide-react';
import type { AppSettings } from '../types';

interface GeminiConfigViewProps {
  settings: AppSettings | null;
  onRefreshSettings: () => void;
}

export const GeminiConfigView: React.FC<GeminiConfigViewProps> = ({
  settings,
  onRefreshSettings,
}) => {
  const [model, setModel] = useState('gemini-3.8-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(800);
  const [aiAutoReplyEnabled, setAiAutoReplyEnabled] = useState(true);
  const [malagasySupportEnabled, setMalagasySupportEnabled] = useState(true);
  const [systemInstructions, setSystemInstructions] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Testing state
  const [testPrompt, setTestPrompt] = useState('Manao ahoana, ohatrinona ny vidin\'ny OS3 5 km ?');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    model: string;
    output?: string;
    error?: string;
    latencyMs: number;
  } | null>(null);

  useEffect(() => {
    if (settings) {
      setModel(settings.geminiModel || 'gemini-3.8-flash');
      setTemperature(settings.geminiTemperature ?? 0.7);
      setMaxTokens(settings.geminiMaxTokens ?? 800);
      setAiAutoReplyEnabled(settings.aiAutoReplyEnabled ?? true);
      setMalagasySupportEnabled(settings.malagasySupportEnabled ?? true);
      setSystemInstructions(settings.systemPromptInstructions || '');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiModel: model,
          geminiTemperature: temperature,
          geminiMaxTokens: maxTokens,
          aiAutoReplyEnabled,
          malagasySupportEnabled,
          systemPromptInstructions: systemInstructions,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        onRefreshSettings();
      }
    } catch (err: any) {
      console.error('Erreur sauvegarde Gemini:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/gemini/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        model,
        error: err.message || 'Erreur réseau',
        latencyMs: 0,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#171113] to-[#0e0e14] border border-[#2e1d24] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Moteur Google Gemini AI (@google/genai)</h2>
            <p className="text-xs text-zinc-400">
              Paramétrez l'intelligence artificielle pour vos réponses commerciales en français et en malgache.
            </p>
          </div>
        </div>

        {/* Server-side key status (NO KEY EXPOSURE) */}
        <div className="flex items-center gap-2">
          {settings?.geminiApiKeyConfigured ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Clé GEMINI_API_KEY détectée côté serveur
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 border border-amber-700/50 text-amber-300 text-xs font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Clé GEMINI_API_KEY non détectée
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Model parameters & System prompt */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-2xl bg-[#121218] border border-[#22222d] space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-white">Paramètres du Modèle</h3>
              </div>
              <span className="text-[11px] text-zinc-500">SDK @google/genai v2.4.0</span>
            </div>

            {/* Model Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Modèle Google Gemini
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Recommandé - Ultra rapide & économique)</option>
                <option value="gemini-flash-latest">gemini-flash-latest (Dernière version flash stable)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra léger pour forts volumes)</option>
              </select>
              <p className="text-[11px] text-zinc-500">
                Seuls les modèles stables compatibles avec le SDK moderne @google/genai sont supportés.
              </p>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Réponses automatiques IA</div>
                  <div className="text-[10px] text-zinc-400">Activer le bot sur Messenger</div>
                </div>
                <input
                  type="checkbox"
                  checked={aiAutoReplyEnabled}
                  onChange={(e) => setAiAutoReplyEnabled(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Assistance Malgache</div>
                  <div className="text-[10px] text-zinc-400">Bilingue Français / Malagasy</div>
                </div>
                <input
                  type="checkbox"
                  checked={malagasySupportEnabled}
                  onChange={(e) => setMalagasySupportEnabled(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  Créativité & Température : <span className="text-red-400 font-bold">{temperature}</span>
                </label>
                <span className="text-[10px] text-zinc-500">
                  {temperature <= 0.3 ? 'Très précis & strict' : temperature >= 0.8 ? 'Créatif' : 'Équilibré (Recommandé)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>

            {/* System prompt instructions */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  Consignes Système Personnalisées (Prompt)
                </label>
                <span className="text-[10px] text-zinc-500">Injecté avec le catalogue dynamique</span>
              </div>
              <textarea
                rows={7}
                value={systemInstructions}
                onChange={(e) => setSystemInstructions(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-600 leading-relaxed"
                placeholder="Règles du bot commercial..."
              />
              <p className="text-[11px] text-zinc-500">
                Note : Le catalogue officiel des produits et les prix en Ariary sont automatiquement ajoutés
                à ce prompt par le serveur, vous n'avez pas besoin de les réécrire manuellement.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center justify-between">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Paramètres Gemini sauvegardés !
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
          </div>
        </form>

        {/* Right Pane: Live Gemini API Connection Tester */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#121218] border border-[#22222d] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-white">Test de Connexion en Direct</h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Server-side call</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Envoie une invite réelle au modèle sélectionné pour mesurer la latence et valider que l'API
              répond convenablement.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Invite de test :</label>
              <textarea
                rows={2}
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-600"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !testPrompt.trim()}
                className="w-full py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold border border-red-600/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Contact de Gemini...' : 'Exécuter le test de réponse'}
              </button>
            </div>

            {/* Test result card */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                  testResult.success
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    {testResult.success ? 'Réponse reçue avec succès' : 'Échec du test'}
                  </span>
                  <span className="text-[10px] font-mono opacity-80">
                    {testResult.latencyMs} ms
                  </span>
                </div>

                {testResult.output && (
                  <div className="p-2.5 rounded-lg bg-black/40 text-zinc-200 text-[11px] leading-relaxed whitespace-pre-wrap border border-white/5">
                    {testResult.output}
                  </div>
                )}

                {testResult.error && (
                  <div className="text-[11px] text-rose-300 leading-normal">
                    {testResult.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security details */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs text-zinc-400">
            <div className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-red-400" />
              Sécurité de la clé API
            </div>
            <p className="text-[11px] leading-relaxed">
              La variable <code>GEMINI_API_KEY</code> est interrogée exclusivement depuis le serveur Express
              Node.js. Aucun fragment de clé n'est transmis au navigateur du visiteur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
