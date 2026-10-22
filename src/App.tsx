import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { InboxView } from './components/InboxView';
import { FacebookSetupView } from './components/FacebookSetupView';
import { GeminiConfigView } from './components/GeminiConfigView';
import { ProductsView } from './components/ProductsView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { DeploymentGuideView } from './components/DeploymentGuideView';
import { LogsView } from './components/LogsView';
import { MalagasyHelpModal } from './components/MalagasyHelpModal';
import { Menu, MapPin, Phone } from 'lucide-react';
import type { DashboardStats, AppSettings } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, settingsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/settings'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (err) {
      console.error('Erreur chargement des données:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0d] text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Mobile top navigation toggle */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#0d0d12] border-b border-[#22222d] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center font-bold text-white text-xs">
            M
          </div>
          <span className="font-bold text-sm text-white">MIKROTECK 301</span>
        </div>

        <button
          onClick={() => setIsHelpOpen(true)}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 border border-red-600/30"
        >
          Aide
        </button>
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          stats={stats}
          unreadCount={stats?.pendingHumanHandoffs || 0}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
          {/* Top Header */}
          <Header
            stats={stats}
            onRefresh={fetchData}
            isLoading={isLoading}
            onOpenHelp={() => setIsHelpOpen(true)}
          />

          {/* Dynamic View Tab */}
          <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                onNavigate={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'inbox' && (
              <InboxView
                onOpenSimulator={() => setCurrentTab('facebook')}
                onOpenFacebookSetup={() => setCurrentTab('facebook')}
                isFacebookConnected={Boolean(stats?.facebookConnected)}
              />
            )}

            {currentTab === 'facebook' && (
              <FacebookSetupView
                settings={settings}
                onRefreshSettings={fetchData}
              />
            )}

            {currentTab === 'gemini' && (
              <GeminiConfigView
                settings={settings}
                onRefreshSettings={fetchData}
              />
            )}

            {currentTab === 'products' && <ProductsView />}

            {currentTab === 'diagnostics' && <DiagnosticsView />}

            {currentTab === 'deployment' && (
              <DeploymentGuideView settings={settings} />
            )}

            {currentTab === 'logs' && <LogsView />}
          </main>

          {/* Permanent Bottom Footer Signature */}
          <footer className="border-t border-[#1c1c24] bg-[#0c0c10] px-4 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-300 tracking-wide">MIKROTECK 301</span>
              <span>|</span>
              <span className="text-red-400 font-semibold font-mono">038 28 171 00</span>
              <span className="hidden sm:inline text-zinc-600">•</span>
              <span className="hidden sm:inline flex items-center gap-1 text-zinc-400">
                <MapPin className="w-3 h-3 text-red-500 inline" /> Imandry, Fianarantsoa, Madagascar
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-zinc-400">
              <span className="font-mono">Messenger AI Manager</span>
              <span>•</span>
              <span className="text-zinc-500">Google Gemini & Meta Graph API</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Bilingual Malagasy/French Help Modal */}
      <MalagasyHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
