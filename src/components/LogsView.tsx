import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Database,
  ShieldCheck,
  Check
} from 'lucide-react';
import type { ActivityLog } from '../types';

export const LogsView: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'success'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/logs?limit=150');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err: any) {
      console.error('Erreur chargement logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDownloadBackup = () => {
    window.open('/api/backup/download', '_blank');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (res.ok) {
        setRestoreStatus('Base de données restaurée avec succès.');
        await loadLogs();
        setTimeout(() => setRestoreStatus(null), 4000);
      } else {
        setRestoreStatus('Erreur lors de la restauration du fichier.');
      }
    } catch (err: any) {
      setRestoreStatus(`Fichier JSON invalide : ${err.message}`);
    }
  };

  const filteredLogs = logs.filter((l) => (levelFilter === 'all' ? true : l.level === levelFilter));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#14141d] to-[#0e0e14] border border-[#22222d] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Journal d'Activité & Sauvegardes</h2>
            <p className="text-xs text-zinc-400">
              Audit des requêtes webhook, génération de réponses Gemini, erreurs Graph API et sauvegardes de la base.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBackup}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-colors"
            title="Télécharger une copie JSON de la base locale"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Télécharger Sauvegarde
          </button>

          <label className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            Restaurer
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={loadLogs}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
            title="Rafraîchir les logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {restoreStatus && (
        <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-800/40 text-blue-200 text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-blue-400" />
          {restoreStatus}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        {(['all', 'info', 'success', 'warn', 'error'] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setLevelFilter(lvl)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              levelFilter === lvl
                ? 'bg-red-600 text-white font-semibold'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {lvl === 'all'
              ? `Tous (${logs.length})`
              : lvl === 'info'
              ? 'Info'
              : lvl === 'success'
              ? 'Succès'
              : lvl === 'warn'
              ? 'Alertes'
              : 'Erreurs'}
          </button>
        ))}
      </div>

      {/* Logs Table / Stream */}
      <div className="rounded-2xl bg-[#121218] border border-[#22222d] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-zinc-500">Chargement des événements...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            Aucun événement enregistré pour ce niveau.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/70 font-mono text-xs">
            {filteredLogs.map((log) => {
              const isError = log.level === 'error';
              const isWarn = log.level === 'warn';
              const isSuccess = log.level === 'success';

              return (
                <div
                  key={log.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors hover:bg-zinc-900/50 ${
                    isError
                      ? 'bg-rose-950/10'
                      : isWarn
                      ? 'bg-amber-950/10'
                      : isSuccess
                      ? 'bg-emerald-950/5'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="shrink-0 mt-0.5">
                      {isError ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : isSuccess ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-blue-400" />
                      )}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white uppercase text-[11px] tracking-wide">
                          [{log.eventType}]
                        </span>
                        <span className="text-zinc-300 font-sans text-xs break-all">
                          {log.message}
                        </span>
                      </div>

                      {log.details && (
                        <div className="text-[10px] text-zinc-500 truncate mt-0.5 font-mono">
                          {typeof log.details === 'object'
                            ? JSON.stringify(log.details)
                            : String(log.details)}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-500 shrink-0 self-end sm:self-center font-mono">
                    {new Date(log.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
