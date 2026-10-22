import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  User,
  Bot,
  Send,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Phone,
  MessageSquare,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import type { Conversation, Message, ConversationStatus } from '../types';

interface InboxViewProps {
  onOpenSimulator: () => void;
  onOpenFacebookSetup: () => void;
  isFacebookConnected: boolean;
}

export const InboxView: React.FC<InboxViewProps> = ({
  onOpenSimulator,
  onOpenFacebookSetup,
  isFacebookConnected,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ConversationStatus>('all');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = async () => {
    try {
      let url = '/api/conversations';
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Erreur chargement conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(convId)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.conversation?.summary) {
          setSummary(data.conversation.summary);
        } else {
          setSummary(null);
        }
      }
    } catch (err: any) {
      console.error('Erreur chargement messages:', err);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 6000);
    return () => clearInterval(interval);
  }, [statusFilter, search]);

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendManualReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedId || isSending) return;

    setIsSending(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(selectedId)}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || data.sendResult?.error || 'Échec de l\'envoi via Messenger Send API');
      }

      setReplyText('');
      await loadMessages(selectedId);
      await loadConversations();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur réseau');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: ConversationStatus) => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(selectedId)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await loadConversations();
        const conv = conversations.find((c) => c.id === selectedId);
        if (conv) conv.status = newStatus;
      }
    } catch (err: any) {
      console.error('Erreur mise à jour statut:', err);
    }
  };

  const handleSummarize = async () => {
    if (!selectedId || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(selectedId)}/summarize`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      }
    } catch (err: any) {
      console.error('Erreur résumé:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row rounded-2xl bg-[#101015] border border-[#22222d] overflow-hidden">
      {/* LEFT PANE: Conversation list */}
      <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-[#22222d] flex flex-col bg-[#0d0d12]">
        {/* Search & Filter Header */}
        <div className="p-3.5 border-b border-[#22222d] space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Rechercher par nom ou identifiant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            {[
              { id: 'all', label: 'Toutes' },
              { id: 'human_handoff', label: 'Attente Humain' },
              { id: 'ai_active', label: 'IA Active' },
              { id: 'resolved', label: 'Résolues' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors ${
                  statusFilter === f.id
                    ? 'bg-red-600 text-white font-semibold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1e1e28]">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-zinc-500">Chargement des messages...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mx-auto text-zinc-500 border border-zinc-800">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Aucune conversation reçue</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isFacebookConnected
                  ? "Aucun client n'a encore envoyé de message à votre Page Facebook."
                  : 'Votre Page Facebook n\'est pas encore connectée à l\'application.'}
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={onOpenSimulator}
                  className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold border border-red-600/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Simuler un message client de test
                </button>
                {!isFacebookConnected && (
                  <button
                    onClick={onOpenFacebookSetup}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
                  >
                    Connecter ma Page Facebook
                  </button>
                )}
              </div>
            </div>
          ) : (
            conversations.map((c) => {
              const isSelected = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-3.5 transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-zinc-800/80 border-l-4 border-red-600'
                      : 'hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-xs shrink-0">
                    {c.senderName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-white truncate">{c.senderName}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(c.lastMessageAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mb-1">
                      {c.lastMessageText || 'Discussion démarrée'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {c.status === 'human_handoff' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/40">
                          Attente Humain
                        </span>
                      ) : c.status === 'resolved' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                          Résolue
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-950/80 text-red-400 border border-red-800/40">
                          IA Active
                        </span>
                      )}
                      {c.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center ml-auto">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANE: Chat Messages thread */}
      <div className="flex-1 flex flex-col bg-[#111117] h-full overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="p-3.5 border-b border-[#22222d] bg-[#0e0e13] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  {selectedConversation.senderName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{selectedConversation.senderName}</h3>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      ID: {selectedConversation.platformUserId}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                    <span>
                      Dernier message : {new Date(selectedConversation.lastMessageAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Handoff Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* AI / Human toggle */}
                {selectedConversation.status === 'human_handoff' ? (
                  <button
                    onClick={() => handleUpdateStatus('ai_active')}
                    className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold border border-red-600/40 flex items-center gap-1.5 transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Réactiver le Bot Gemini
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus('human_handoff')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 flex items-center gap-1.5 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Prendre la main (Mode Humain)
                  </button>
                )}

                {/* Mark as resolved */}
                {selectedConversation.status !== 'resolved' ? (
                  <button
                    onClick={() => handleUpdateStatus('resolved')}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Résolu
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus('ai_active')}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700"
                  >
                    Rouvrir
                  </button>
                )}

                {/* Summarize AI button */}
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1 disabled:opacity-50 transition-colors"
                  title="Demander à Gemini un résumé rapide de la conversation"
                >
                  <Sparkles className="w-3.5 h-3.5 text-red-400" />
                  {isSummarizing ? 'Résumé...' : 'Résumer'}
                </button>
              </div>
            </div>

            {/* AI Summary Banner if present */}
            {summary && (
              <div className="px-4 py-2.5 bg-red-950/30 border-b border-red-900/30 flex items-start gap-2.5 text-xs text-zinc-200">
                <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-red-400 mr-1.5">Résumé IA :</span>
                  <span>{summary}</span>
                </div>
              </div>
            )}

            {/* Error banner if send failed */}
            {errorMsg && (
              <div className="px-4 py-2 bg-rose-950/60 border-b border-rose-800/40 text-xs text-rose-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button onClick={() => setErrorMsg(null)} className="text-zinc-400 hover:text-white">
                  ✕
                </button>
              </div>
            )}

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0a0a0e]">
              {messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500">
                  Aucun message enregistré dans cette conversation.
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.senderType === 'user';
                  const isBot = m.senderType === 'bot';
                  const isAgent = m.senderType === 'agent';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-zinc-500 font-medium">
                        {isUser ? (
                          <>
                            <User className="w-3 h-3 text-zinc-400" />
                            <span>{m.senderName || selectedConversation.senderName}</span>
                          </>
                        ) : isBot ? (
                          <>
                            <Bot className="w-3 h-3 text-red-400" />
                            <span className="text-red-400 font-semibold">MIKROTECK 301 AI</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3 text-blue-400" />
                            <span className="text-blue-400 font-semibold">Opérateur Humain</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] lg:max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words ${
                          isUser
                            ? 'bg-[#181822] text-zinc-200 rounded-tl-sm border border-zinc-800'
                            : isBot
                            ? 'bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-tr-sm shadow-md shadow-red-950/40'
                            : 'bg-blue-600 text-white rounded-tr-sm'
                        }`}
                      >
                        {m.text}

                        {/* Attachments view */}
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/20 text-[11px]">
                            📎 Pièce jointe ({m.attachments[0].type})
                          </div>
                        )}
                      </div>

                      {/* Delivery Status Indicator */}
                      {!isUser && (
                        <div className="flex items-center gap-1 mt-1 text-[10px]">
                          {m.deliveryStatus === 'delivered' ? (
                            <span className="text-emerald-500 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Livré à Facebook
                            </span>
                          ) : m.deliveryStatus === 'failed' ? (
                            <span
                              className="text-rose-400 flex items-center gap-0.5 cursor-pointer font-medium"
                              title={m.errorMessage || 'Échec d\'envoi'}
                            >
                              <AlertCircle className="w-3 h-3" /> Échec livraison ({m.errorMessage?.slice(0, 30)}...)
                            </span>
                          ) : (
                            <span className="text-zinc-500 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> En attente
                            </span>
                          )}
                          {m.geminiTokensUsed ? (
                            <span className="text-zinc-500 font-mono ml-2">
                              • {m.geminiTokensUsed} tokens
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Reply Composer */}
            <form onSubmit={handleSendManualReply} className="p-3 bg-[#0d0d12] border-t border-[#22222d]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={
                    selectedConversation.status === 'human_handoff'
                      ? 'Répondre manuellement en tant qu\'opérateur MIKROTECK 301...'
                      : 'Répondre manuellement (basculera en mode humain)...'
                  }
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/40 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Envoyer</span>
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-500">
                <span>
                  L'envoi manuel s'effectue via l'API Send officielle de Facebook Messenger.
                </span>
                <span>Limite légale Meta : fenêtre de 24h</span>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
            <MessageSquare className="w-12 h-12 mb-3 text-zinc-700" />
            <h4 className="text-sm font-bold text-zinc-400">Aucune conversation sélectionnée</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Sélectionnez une discussion dans la liste de gauche pour lire l'historique et répondre.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
