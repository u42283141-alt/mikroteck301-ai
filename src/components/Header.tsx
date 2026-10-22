import React from 'react';
import {
  Radio,
  Sparkles,
  Server,
  RefreshCw,
  Phone,
  MapPin,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import type { DashboardStats } from '../types';

interface HeaderProps {
  stats: DashboardStats | null;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ stats, onRefresh, isLoading, onOpenHelp }) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0c0c10]/90 backdrop-blur-md border-b border-[#22222d] px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Left side: branding & location */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 shadow-lg shadow-red-950/40 text-white font-black text-lg tracking-wider border border-red-500/30">
          E
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-white text-base lg:text-lg tracking-tight">
              E-Varotra Info Fianarantsoa
            </h1>
            <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40">
              MIKROTECK 301
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-500" />
              Imandry, Fianarantsoa
            </span>
            <span className="hidden md:inline text-zinc-600">•</span>
            <a
              href="tel:0382817100"
              className="hidden md:flex items-center gap-1 text-zinc-300 hover:text-white transition-colors"
            >
              <Phone className="w-3 h-3 text-red-500" />
              038 28 171 00
            </a>
          </div>
        </div>
      </div>

      {/* Right side: Live statuses & actions */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Direct Download ZIP Button */}
        <a
          href="/api/project/download-zip"
          download="mikroteck301-messenger-ai.zip"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-950/50 transition-all border border-red-400/40 hover:scale-[1.02] active:scale-[0.98]"
          title="Télécharger l'archive ZIP propre complète pour GitHub / Render"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Télécharger ZIP (GitHub)</span>
        </a>
        {/* Status Facebook */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            stats?.facebookConnected
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800'
          }`}
          title={
            stats?.facebookConnected
              ? `Page Facebook active : ${stats.facebookPageName || 'Connectée'}`
              : 'Aucune Page Facebook connectée pour le moment'
          }
        >
          {stats?.facebookConnected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-zinc-500" />
          )}
          <span>
            {stats?.facebookConnected
              ? stats.facebookPageName || 'Facebook Connecté'
              : 'Facebook Non Connecté'}
          </span>
        </div>

        {/* Status Gemini */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            stats?.geminiActive
              ? 'bg-rose-950/30 text-red-400 border-red-800/40'
              : 'bg-amber-950/30 text-amber-400 border-amber-800/40'
          }`}
          title={stats?.geminiActive ? 'Moteur Google Gemini opérationnel' : 'Clé API Gemini en attente'}
        >
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span>{stats?.geminiActive ? 'Gemini IA Actif' : 'Gemini Non Détecté'}</span>
        </div>

        {/* Status Server */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <Server className="w-3.5 h-3.5 text-zinc-400" />
          <span>Webhook OK</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors disabled:opacity-50"
          title="Actualiser les statistiques et conversations"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
        </button>

        {/* Help / Guide */}
        <button
          onClick={onOpenHelp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-600/30 text-xs font-medium transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Aide & Malagasy</span>
        </button>
      </div>
    </header>
  );
};
