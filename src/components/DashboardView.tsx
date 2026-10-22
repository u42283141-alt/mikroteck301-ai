import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  Send,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Cpu,
  Facebook,
  Server,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import type { DashboardStats } from '../types';
import type { NavTab } from './Sidebar';

interface DashboardViewProps {
  stats: DashboardStats | null;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, onNavigate }) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  // If stats is null (loading or server offline)
  if (!stats) {
    return (
      <div className="p-8 text-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-400 text-sm">Chargement des données réelles du serveur...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Conversations reçues',
      value: stats.totalConversations,
      desc: 'Total des fils de discussion',
      icon: MessageSquare,
      color: 'text-white',
      border: 'border-zinc-800',
      badge: stats.totalConversations > 0 ? `${stats.totalConversations} actifs` : 'Aucune',
    },
    {
      title: 'Clients uniques',
      value: stats.uniqueCustomers,
      desc: 'Utilisateurs Facebook distincts',
      icon: Users,
      color: 'text-white',
      border: 'border-zinc-800',
      badge: 'Clients réels',
    },
    {
      title: 'Messages reçus',
      value: stats.messagesReceived,
      desc: 'Messages entrants des clients',
      icon: TrendingUp,
      color: 'text-emerald-400',
      border: 'border-emerald-900/30',
      badge: 'Entrants',
    },
    {
      title: 'Messages envoyés',
      value: stats.messagesSent,
      desc: 'Réponses IA + Opérateurs',
      icon: Send,
      color: 'text-blue-400',
      border: 'border-blue-900/30',
      badge: 'Sortants',
    },
    {
      title: 'Réponses générées par Gemini',
      value: stats.geminiResponsesGenerated,
      desc: 'Automatisées avec succès',
      icon: Sparkles,
      color: 'text-red-400',
      border: 'border-red-900/30',
      badge: 'IA Active',
    },
    {
      title: 'Erreurs de livraison Messenger',
      value: stats.messengerDeliveryErrors,
      desc: 'Échecs Graph API (ex: >24h)',
      icon: AlertTriangle,
      color: stats.messengerDeliveryErrors > 0 ? 'text-rose-400' : 'text-zinc-400',
      border: stats.messengerDeliveryErrors > 0 ? 'border-rose-900/40 bg-rose-950/10' : 'border-zinc-800',
      badge: stats.messengerDeliveryErrors > 0 ? 'À inspecter' : '0 erreur',
    },
    {
      title: 'En attente opérateur humain',
      value: stats.pendingHumanHandoffs,
      desc: 'Nécessite intervention technicien',
      icon: UserCheck,
      color: stats.pendingHumanHandoffs > 0 ? 'text-amber-400' : 'text-zinc-400',
      border: stats.pendingHumanHandoffs > 0 ? 'border-amber-900/40 bg-amber-950/10' : 'border-zinc-800',
      badge: stats.pendingHumanHandoffs > 0 ? 'Action requise' : 'Aucune',
    },
    {
      title: 'Estimation utilisation Gemini',
      value: `${stats.estimatedTokensUsed.toLocaleString('fr-FR')} tokens`,
      desc: `Modèle: gemini-3.8-flash`,
      icon: Cpu,
      color: 'text-red-400',
      border: 'border-zinc-800',
      badge: 'Consommation',
    },
  ];

  const maxVal = Math.max(
    ...stats.activityByPeriod.data.map((d) => Math.max(d.incoming, d.outgoing, d.ai, 1))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Facebook or Gemini not configured */}
      {(!stats.facebookConnected || !stats.geminiActive) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-red-900/20 to-zinc-900 border border-red-700/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-600/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Configuration initiale requise pour activer le bot en direct
              </h3>
              <p className="text-xs text-zinc-300">
                {!stats.facebookConnected && !stats.geminiActive
                  ? 'Connectez votre Page Facebook et activez la clé Gemini pour démarrer les réponses automatiques.'
                  : !stats.facebookConnected
                  ? 'La Page Facebook n\'est pas encore reliée. Configurez le Page Access Token et le Webhook.'
                  : 'La clé Google Gemini est en attente. Configurez votre clé pour alimenter l\'IA.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!stats.facebookConnected && (
              <button
                onClick={() => onNavigate('facebook')}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/50 transition-all flex items-center gap-1.5"
              >
                <Facebook className="w-3.5 h-3.5" />
                Connecter Facebook
              </button>
            )}
            {!stats.geminiActive && (
              <button
                onClick={() => onNavigate('gemini')}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                Vérifier Gemini
              </button>
            )}
          </div>
        </div>
      )}

      {/* Connection States Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Facebook State */}
        <div className="p-4 rounded-2xl bg-[#121218] border border-[#22222d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                stats.facebookConnected ? 'bg-emerald-950/40 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <Facebook className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-zinc-400 font-medium">Connexion Facebook</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                {stats.facebookConnected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{stats.facebookPageName || 'Page Connectée'}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-400">Non connecté</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('facebook')}
            className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
          >
            Configurer <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Gemini State */}
        <div className="p-4 rounded-2xl bg-[#121218] border border-[#22222d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                stats.geminiActive ? 'bg-red-950/40 text-red-400' : 'bg-amber-950/40 text-amber-400'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-zinc-400 font-medium">Moteur Gemini IA</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                {stats.geminiActive ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>gemini-3.8-flash (Actif)</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400">En attente de clé</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('gemini')}
            className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
          >
            Ajuster <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Webhook & Server State */}
        <div className="p-4 rounded-2xl bg-[#121218] border border-[#22222d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/40 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-zinc-400 font-medium">Serveur & Webhook</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>En ligne (Port 3000)</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('diagnostics')}
            className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
          >
            Tester <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 8 Official Metric Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Indicateurs Clés de Performance
          </h2>
          <span className="text-xs text-zinc-500">Données issues de la base locale persistante</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl bg-[#121218] border ${card.border} transition-all hover:border-zinc-700 flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-medium truncate">{card.title}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                    {card.badge}
                  </span>
                </div>
                <div className="my-3">
                  <div className={`text-2xl font-black ${card.color} tracking-tight`}>{card.value}</div>
                  <div className="text-[11px] text-zinc-500 truncate mt-0.5">{card.desc}</div>
                </div>
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-zinc-500">
                  <Icon className="w-4 h-4 text-zinc-500" />
                  <span className="text-[10px] uppercase font-mono tracking-wider">MIKROTECK 301</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Activity Chart */}
      <div className="p-5 rounded-2xl bg-[#121218] border border-[#22222d] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Activité des Conversations (Données Réelles)</h3>
            <p className="text-xs text-zinc-400">
              Flux des messages entrants (clients), sortants et réponses générées par Gemini
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  period === p ? 'bg-red-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Bars */}
        <div className="pt-4 pb-2">
          {stats.activityByPeriod.data.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Aucune activité enregistrée pour cette période.
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2 lg:gap-4 items-end h-44">
              {stats.activityByPeriod.data.map((item, index) => {
                const total = item.incoming + item.outgoing;
                const heightPct = maxVal > 0 ? Math.max((total / maxVal) * 100, 6) : 6;
                const incomingPct = total > 0 ? (item.incoming / total) * 100 : 50;

                return (
                  <div key={index} className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="text-[10px] font-mono text-zinc-400">{total}</div>
                    <div
                      className="w-full max-w-[40px] rounded-t-lg bg-zinc-800 overflow-hidden flex flex-col justify-end transition-all"
                      style={{ height: `${heightPct}%` }}
                    >
                      <div
                        className="w-full bg-red-600/80 hover:bg-red-500 transition-colors"
                        style={{ height: `${incomingPct}%` }}
                        title={`${item.date} : ${item.incoming} messages reçus, ${item.outgoing} envoyés`}
                      />
                      <div
                        className="w-full bg-blue-600/60 hover:bg-blue-500 transition-colors"
                        style={{ height: `${100 - incomingPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono truncate">
                      {item.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-600"></span>
              <span>Messages entrants (Clients)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-600"></span>
              <span>Messages sortants (Bot + Opérateur)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch & Status Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Simulator link */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-[#14141c] border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Simulateur Messenger
            </span>
            <Sparkles className="w-4 h-4 text-red-500" />
          </div>
          <h4 className="text-base font-bold text-white">
            Tester immédiatement une question client en direct
          </h4>
          <p className="text-xs text-zinc-400">
            Simulez l'envoi d'un message client en français ou en malgache pour voir instantanément la réponse
            fournie par l'IA de MIKROTECK 301.
          </p>
          <button
            onClick={() => onNavigate('facebook')}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700 transition-colors flex items-center justify-center gap-2"
          >
            Ouvrir l'écran de test & simulation <ArrowRight className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>

        {/* Catalog summary */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-[#14141c] border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Catalogue MIKROTECK 301
            </span>
            <span className="text-xs text-emerald-400 font-semibold">5 équipements en stock</span>
          </div>
          <h4 className="text-base font-bold text-white">Prix dynamiques en Ariary (Ar)</h4>
          <p className="text-xs text-zinc-400">
            Tenda AC5 (85 000 Ar), OS3 5 km (180 000 Ar), Tenda 01 (135 000 Ar), Pack OS3+AC5 (265 000 Ar).
            Modifiables en un clic sans coder.
          </p>
          <button
            onClick={() => onNavigate('products')}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700 transition-colors flex items-center justify-center gap-2"
          >
            Gérer les tarifs & équipements <ArrowRight className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
