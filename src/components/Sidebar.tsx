import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Facebook,
  Bot,
  Package,
  Activity,
  Rocket,
  FileText,
  ShieldCheck,
  Headphones,
  Check
} from 'lucide-react';
import type { DashboardStats } from '../types';

export type NavTab =
  | 'dashboard'
  | 'inbox'
  | 'facebook'
  | 'gemini'
  | 'products'
  | 'diagnostics'
  | 'deployment'
  | 'logs';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  stats: DashboardStats | null;
  unreadCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  stats,
  unreadCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const menuItems: Array<{
    id: NavTab;
    label: string;
    subLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number | null;
    badgeColor?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      subLabel: 'Statistiques & métriques',
      icon: LayoutDashboard,
    },
    {
      id: 'inbox',
      label: 'Boîte de réception',
      subLabel: 'Messages Messenger réels',
      icon: MessageSquare,
      badge: stats?.pendingHumanHandoffs && stats.pendingHumanHandoffs > 0 ? `${stats.pendingHumanHandoffs} urgent` : unreadCount > 0 ? unreadCount : null,
      badgeColor: stats?.pendingHumanHandoffs && stats.pendingHumanHandoffs > 0 ? 'bg-amber-500 text-black' : 'bg-red-600 text-white',
    },
    {
      id: 'facebook',
      label: 'Connexion Facebook',
      subLabel: 'Webhook & Page Meta',
      icon: Facebook,
      badge: stats?.facebookConnected ? 'Connecté' : 'À configurer',
      badgeColor: stats?.facebookConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/40' : 'bg-zinc-800 text-zinc-400',
    },
    {
      id: 'gemini',
      label: 'Configuration Gemini',
      subLabel: 'Modèle, prompt & langue',
      icon: Bot,
      badge: stats?.geminiActive ? 'Actif' : 'Clé requise',
      badgeColor: stats?.geminiActive ? 'bg-red-950 text-red-300 border border-red-800/40' : 'bg-amber-950 text-amber-400',
    },
    {
      id: 'products',
      label: 'Produits & Tarifs',
      subLabel: 'Catalogue officiel en Ariary',
      icon: Package,
    },
    {
      id: 'diagnostics',
      label: 'Tests & Diagnostics',
      subLabel: '10 tests automatisés',
      icon: Activity,
    },
    {
      id: 'deployment',
      label: 'Guide Déploiement',
      subLabel: 'Render, Meta & Cloud',
      icon: Rocket,
    },
    {
      id: 'logs',
      label: 'Journal & Sauvegardes',
      subLabel: 'Audit & export JSON',
      icon: FileText,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0d0d12] border-r border-[#22222d] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="p-5 border-b border-[#22222d] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center font-black text-white text-base shadow-md shadow-red-950/50 border border-red-500/40">
                M
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-wide">MIKROTECK 301</div>
                <div className="text-[11px] text-red-400 font-medium">Messenger AI Manager</div>
              </div>
            </div>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                ✕
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600/20 to-red-600/5 text-white border border-red-600/40 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-red-500' : 'text-zinc-500 group-hover:text-zinc-300'
                      }`}
                    />
                    <div className="truncate">
                      <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                        {item.label}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">{item.subLabel}</div>
                    </div>
                  </div>

                  {item.badge !== undefined && item.badge !== null && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 ${
                        item.badgeColor || 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Permanent Signature Section at Bottom */}
        <div className="p-4 border-t border-[#22222d] bg-[#09090c]/80">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white tracking-wider">E-Varotra Info</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-red-950/80 text-red-400 border border-red-800/30">
                Fianarantsoa
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center justify-between font-mono">
              <span>Contact :</span>
              <span className="text-red-400 font-bold">038 28 171 00</span>
            </p>
            <p className="text-[10px] text-zinc-500 truncate">Imandry, Fianarantsoa, Madagascar</p>
          </div>
          <div className="mt-2 text-center text-[10px] text-zinc-500 font-mono tracking-wide">
            E-Varotra Info Fianarantsoa | 038 28 171 00
          </div>
        </div>
      </aside>
    </>
  );
};
