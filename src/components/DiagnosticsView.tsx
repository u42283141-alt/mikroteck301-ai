import React, { useState } from 'react';
import {
  Activity,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Terminal,
  FileCheck
} from 'lucide-react';
import type { TestReport } from '../types';

export const DiagnosticsView: React.FC = () => {
  const [report, setReport] = useState<TestReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/diagnostics/run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err: any) {
      console.error('Erreur tests:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#14141d] to-[#0e0e14] border border-[#22222d] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Suite de Tests & Diagnostics Automatisés</h2>
            <p className="text-xs text-zinc-400">
              Vérification des 10 points critiques : Webhook, signatures cryptographiques HMAC, pipeline Gemini, et intégrité base.
            </p>
          </div>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/40 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <Play className={`w-4 h-4 fill-white ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Tests en cours...' : 'Lancer tous les tests'}
        </button>
      </div>

      {/* Summary Scorecard if tests ran */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#121218] border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-500 font-medium">Total des tests</div>
              <div className="text-2xl font-black text-white">{report.total}</div>
            </div>
            <FileCheck className="w-6 h-6 text-zinc-500" />
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-400 font-medium">Tests Réussis</div>
              <div className="text-2xl font-black text-emerald-400">{report.passed}</div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>

          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 flex items-center justify-between">
            <div>
              <div className="text-xs text-rose-400 font-medium">Tests Échoués</div>
              <div className="text-2xl font-black text-rose-400">{report.failed}</div>
            </div>
            <XCircle className="w-6 h-6 text-rose-400" />
          </div>

          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-400 font-medium">Ignorés (Non configurés)</div>
              <div className="text-2xl font-black text-amber-400">{report.skipped}</div>
            </div>
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="space-y-3">
        {!report && !isRunning ? (
          <div className="p-12 text-center rounded-2xl bg-[#121218] border border-[#22222d] space-y-3">
            <Terminal className="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">Aucun test exécuté récemment</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Cliquez sur le bouton « Lancer tous les tests » pour vérifier en direct la robustesse
              du serveur, la validation cryptographique et la connexion aux APIs.
            </p>
          </div>
        ) : (
          report?.results.map((t, idx) => {
            const isPassed = t.status === 'passed';
            const isSkipped = t.status === 'skipped';
            const isFailed = t.status === 'failed';

            return (
              <div
                key={t.id || idx}
                className={`p-4 rounded-xl border transition-all ${
                  isPassed
                    ? 'bg-[#121218] border-zinc-800/80 hover:border-zinc-700'
                    : isSkipped
                    ? 'bg-amber-950/10 border-amber-900/30'
                    : 'bg-rose-950/20 border-rose-900/40'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : isSkipped ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}

                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{t.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500">({t.durationMs} ms)</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">{t.description}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isPassed
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : isSkipped
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                    }`}
                  >
                    {isPassed ? 'Succès' : isSkipped ? 'Non configuré' : 'Échec'}
                  </span>
                </div>

                {/* Output Details */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800/60 text-xs font-mono">
                  <div className="text-zinc-300 leading-relaxed">{t.details}</div>
                  {t.error && (
                    <div className="mt-1 text-rose-400 font-semibold">
                      Erreur détectée : {t.error}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
