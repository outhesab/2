import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSpeechRecognition, useSpeechSynthesis } from '@/hooks/useSpeech';
import type { DBAction, SaveFn } from '@/lib/aiActions';
import { applyActionWithFallback, parseActions, stripActions } from '@/lib/aiActions';
import type { Message as ApiMessage } from '@/lib/aiApi';
import { askClaude, askGemini } from '@/lib/aiApi';
import { getKeys } from '@/lib/aiKeys';
import { buildContext, offlineReply, QUICK_PROMPTS } from '@/lib/aiOffline';
import { askDeepSeek } from '@/lib/deepseek';
import { getUserSession } from '@/lib/userManager';
import { logger } from '@/lib/logger';
import { genId } from '@/lib/utils-tr';
import type { AIActionLogEntry, DB } from '@/types';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import VoiceAgentUI from '@/components/ai/VoiceAgentUI';
import { MessageList } from './MessageList';
import { ActionHistory } from './ActionHistory';
import { ChatPanel } from './ChatPanel';

interface Props {
  db: DB;
  save?: SaveFn;
  embedded?: boolean;
}

type Message = ApiMessage;

export default function AIAsistan({ db, save, embedded = false }: Props) {
  const session = getUserSession();
  const isAdminUser = session?.role === 'admin';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'deepseek' | 'claude' | 'gemini' | 'offline'>('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [modelSource, setModelSource] = useState<'deepseek' | 'claude' | 'gemini' | 'offline'>('claude');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [autoApplyActions, setAutoApplyActions] = useState(false);
  const [maxAutoActions, setMaxAutoActions] = useState(3);
  const [stopOnViolation, setStopOnViolation] = useState(true);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const [pendingActions, setPendingActions] = useState<{
    msgIdx: number;
    actions: DBAction[];
  } | null>(null);
  const [actionResult, setActionResult] = useState<{
    msgIdx: number;
    success: boolean;
    msg: string;
  } | null>(null);

  const actionMode: 'read-only' | 'manual' | 'auto' =
    !isAdminUser || !adminMode ? 'read-only' : autoApplyActions ? 'auto' : 'manual';

  const context = useMemo(
    () => buildContext(db, actionMode, maxAutoActions, stopOnViolation),
    [db, actionMode, maxAutoActions, stopOnViolation],
  );
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdminUser) {
      setAdminMode(false);
      setAutoApplyActions(false);
      setStopOnViolation(true);
    }
  }, [isAdminUser]);

  const runActions = useCallback(
    (msgIdx: number, actions: DBAction[]) => {
      if (!save) return;
      try {
        let summary = '';
        save((prev) => {
          let next = { ...prev };
          let appliedCount = 0;
          const violations: string[] = [];
          const fallbackNotes: string[] = [];
          const actionLogs: AIActionLogEntry[] = [];
          const actionLimit = autoApplyActions ? Math.max(1, maxAutoActions) : Number.MAX_SAFE_INTEGER;

          for (let i = 0; i < actions.length; i++) {
            if (appliedCount >= actionLimit) {
              violations.push(`Limit aşıldı: maksimum ${actionLimit} işlem`);
              break;
            }
            const action = actions[i];
            const attempted = applyActionWithFallback(next, action);
            if (attempted.applied) {
              const appliedAction = attempted.appliedAction || action;
              next = attempted.next;
              appliedCount += 1;
              fallbackNotes.push(`Sistem:${action.label}`);
              if (attempted.appliedAction && attempted.appliedAction !== action) {
                fallbackNotes.push(`${action.label} => ${attempted.appliedAction.label}`);
              }
              actionLogs.push({
                id: genId(),
                createdAt: new Date().toISOString(),
                model: modelSource,
                mode: autoApplyActions ? 'auto' : 'manual',
                messageIndex: msgIdx,
                actionType: appliedAction.type,
                label: appliedAction.label,
                status: 'applied',
                dangerous: false,
                affectedIds: [],
                notes: attempted.notes,
              });
            } else {
              const error = attempted.notes[0] || `${action.label}: İşlem uygulanamadı`;
              violations.push(error);
              if (attempted.notes.length > 1) {
                fallbackNotes.push(...attempted.notes.slice(1));
              }
              actionLogs.push({
                id: genId(),
                createdAt: new Date().toISOString(),
                model: modelSource,
                mode: autoApplyActions ? 'auto' : 'manual',
                messageIndex: msgIdx,
                actionType: action.type,
                label: action.label,
                status: 'failed',
                dangerous: false,
                affectedIds: [],
                notes: attempted.notes,
                error,
              });
              if (stopOnViolation) break;
            }
          }

          const aiLog = {
            id: genId(),
            action: autoApplyActions ? 'ai_auto_action' : 'ai_manual_action',
            detail: [
              `Uygulanan:${appliedCount}`,
              `Toplam:${actions.length}`,
              actions.map((a) => a.label).join(' | '),
              violations.length ? `İhlal:${violations.join(' ; ')}` : '',
              fallbackNotes.length ? `Fallback:${fallbackNotes.join(' ; ')}` : '',
            ]
              .filter(Boolean)
              .join(' || '),
            time: new Date().toISOString(),
          };
          summary = violations.length
            ? `${appliedCount}/${actions.length} işlendi. ${violations.length} kural ihlali var.`
            : autoApplyActions
              ? `${appliedCount} işlem otomatik işlendi`
              : 'Kaydedildi!';
          return {
            ...next,
            _activityLog: [...(next._activityLog || []), aiLog],
            aiActionLog: [...actionLogs, ...(next.aiActionLog || [])].slice(0, 200),
          };
        });
        setActionResult({ msgIdx, success: true, msg: summary || 'Kaydedildi!' });
        setTimeout(() => {
          setPendingActions(null);
          setActionResult(null);
        }, 1200);
      } catch (err) {
        setActionResult({
          msgIdx,
          success: false,
          msg: err instanceof Error ? err.message : 'Hata oluştu',
        });
      }
    },
    [save, autoApplyActions, maxAutoActions, stopOnViolation, modelSource],
  );

  const { speaking, speak, stop: stopSpeak } = useSpeechSynthesis();
  const {
    listening,
    supported: micSupported,
    start: startListen,
    stop: stopListen,
  } = useSpeechRecognition((text) => {
    setInput(text);
    setTimeout(() => sendText(text), 100);
  });

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const [hasKeys, setHasKeys] = useState(false);
  const [keyLoadError, setKeyLoadError] = useState(false);
  const [keyAccessForbidden, setKeyAccessForbidden] = useState(false);
  const keysRef = useRef({ claude: '', gemini: '', deepseek: '', huggingface: '', opencodeNvidia: '', opencodeHf: '' });

  useEffect(() => {
    getKeys()
      .then((keys) => {
        keysRef.current = keys;
        setHasKeys(!!(keys.claude || keys.gemini));
        setKeyAccessForbidden(keys.state === 'forbidden');
        setKeyLoadError(keys.state === 'unavailable');
      })
      .catch(() => {
        setKeyLoadError(true);
        setKeyAccessForbidden(false);
      });
  }, []);

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const initNetwork = async () => {
      try {
        const { Network } = await import('@capacitor/network');
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        Network.addListener('networkStatusChange', (s) => setIsOnline(s.connected));
      } catch {
        setIsOnline(navigator.onLine);
        window.addEventListener('online', () => setIsOnline(true));
        window.addEventListener('offline', () => setIsOnline(false));
      }
    };
    initNetwork();
  }, []);

  const copyMsg = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  const send = useCallback(
    async (text?: string) => {
      const userMsg = (text || input).trim();
      if (!userMsg || loading) return;

      const now = Date.now();
      const lastReq = parseInt(sessionStorage.getItem('ai_last_req') || '0');
      if (now - lastReq < 3000 && lastReq > 0) {
        setMessages((prev) => [...prev, { role: 'user', content: userMsg }, { role: 'assistant', content: '⏳ Lütfen biraz bekleyin.', source: 'offline' }]);
        return;
      }
      sessionStorage.setItem('ai_last_req', String(now));

      setInput('');
      setLoading(true);
      const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
      setMessages(newMessages);
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      if (!isOnline) {
        const reply = offlineReply(db, userMsg);
        setMessages((prev) => {
          const u = [...prev];
          u[u.length - 1] = { role: 'assistant', content: reply, source: 'offline' };
          return u;
        });
        if (autoSpeak) speak(reply);
        const actions = parseActions(reply);
        if (actions.length > 0 && save) {
          if (!isAdminUser || !adminMode) {
            setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Yönetici Modu kapalı.', source: 'offline' }]);
          } else if (autoApplyActions) {
            runActions(newMessages.length, actions);
          } else {
            setPendingActions({ msgIdx: newMessages.length, actions });
          }
        }
        setApiStatus('offline');
        setLoading(false);
        return;
      }

      const keys = await getKeys();
      keysRef.current = keys;
      
      const appendChunk = (chunk: string) => {
        setMessages((prev) => {
          const u = [...prev];
          u[u.length - 1] = { ...u[u.length - 1], content: u[u.length - 1].content + chunk };
          return u;
        });
      };

      const finalizeResponse = (msgIndex: number) => {
        setMessages((prev) => {
          const msg = prev[msgIndex];
          if (!msg) return prev;
          const actions = parseActions(msg.content);
          const cleaned = stripActions(msg.content);
          const updated = [...prev];
          updated[msgIndex] = { ...msg, content: cleaned };
          if (actions.length > 0 && save) {
            if (!isAdminUser || !adminMode) {
              updated.push({ role: 'assistant', content: '⚠️ Yönetici Modu kapalı.', source: 'offline' });
            } else if (autoApplyActions) {
              setTimeout(() => runActions(msgIndex, actions), 0);
            } else {
              setPendingActions({ msgIdx: msgIndex, actions });
            }
          }
          return updated;
        });
      };

      const tryApiInternal = async (
        source: 'deepseek' | 'claude' | 'gemini', 
        key: string, 
        askFn: (msgs: Message[], ctx: string, k: string, onChunk: (t: string) => void) => Promise<void>
      ) => {
        try {
          setApiStatus(source);
          setMessages(prev => {
            const u = [...prev];
            u[u.length - 1] = { ...u[u.length - 1], source };
            return u;
          });
          await askFn(messages.slice(-10), context, key, appendChunk);
          if (autoSpeak) {
            setMessages(prev => {
              if (prev[prev.length - 1]?.content) speak(prev[prev.length - 1].content);
              return prev;
            });
          }
          finalizeResponse(messages.length);
          setLoading(false);
          return true;
        } catch (e) {
          logger.warn('ai', `${source} başarısız`, e);
          return false;
        }
      };

      if (modelSource !== 'offline') {
        let success = false;
        if (modelSource === 'deepseek' && keys.deepseek) {
          success = await tryApiInternal('deepseek', keys.deepseek, async (msgs, ctx, key, cb) => {
            const systemMsg = { role: 'system' as const, content: `Sen Soba işletmesi için AI analistsin. Kısa, net, Türkçe yanıt ver.\\n\\n${ctx}` };
            const userMsgs = msgs.filter(m => m.content).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
            await askDeepSeek([systemMsg, ...userMsgs], key, cb);
          });
        } else if (modelSource === 'claude' && keys.claude) {
          success = await tryApiInternal('claude', keys.claude, askClaude);
        } else if (modelSource === 'gemini' && keys.gemini) {
          success = await tryApiInternal('gemini', keys.gemini, askGemini);
        }
        if (success) return;
      }

      const reply = offlineReply(db, userMsg);
      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = { role: 'assistant', content: `?? API hatası veya anahtar eksik.\\n\\n?? Çevrimdışı yanıt:\\n${reply}`, source: 'offline' };
        return u;
      });
      if (autoSpeak) speak(reply);
      setApiStatus('offline');
      setLoading(false);
    },
    [input, loading, messages, context, db, autoSpeak, speak, isOnline, isAdminUser, adminMode, autoApplyActions, runActions, save, modelSource],
  );

  const sendText = useCallback((text: string) => {
    if (!text.trim() || loading) return;
    setInput('');
    send(text);
  }, [send, loading]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const {
    state: voiceState,
    transcript: voiceTranscript,
    response: voiceResponse,
    toggleListening: toggleVoiceListening,
  } = useVoiceAgent(async (text) => {
    const keys = await getKeys();
    if (modelSource === 'deepseek' && keys.deepseek) {
      const systemMsg = { role: 'system' as const, content: `Sen Soba işletmesi için AI analistsin. Kısa, net, Türkçe yanıt ver.\\n\\n${context}` };
      const userMsgs = [...messages, { role: 'user', content: text }].filter(m => m.content).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      const result = await askDeepSeek([systemMsg, ...userMsgs], keys.deepseek, () => {});
      setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: result, source: 'deepseek' }]);
      return result;
    }
    return offlineReply(db, text);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: embedded ? '100%' : 'calc(100vh - 140px)' }}>
      <ChatPanel
        db={db}
        isAdminUser={isAdminUser}
        adminMode={adminMode}
        onToggleAdmin={() => setAdminMode(v => !v)}
        autoApplyActions={autoApplyActions}
        onToggleAutoApply={() => setAutoApplyActions(v => !v)}
        maxAutoActions={maxAutoActions}
        onMaxActionsChange={setMaxAutoActions}
        stopOnViolation={stopOnViolation}
        onToggleStopViolation={() => setStopOnViolation(v => !v)}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        isOnline={isOnline}
        hasKeys={hasKeys}
        keyStatus={keyLoadError ? '⚠️ Anahtarlar yüklenemedi' : keyAccessForbidden ? '🚫 Erişim kısıtlı' : '⚠️ Anahtar girilmedi'}
        embedded={embedded}
        modelSource={modelSource}
        setModelSource={(val: string) => setModelSource(val as 'deepseek' | 'claude' | 'gemini' | 'offline')}
        messagesCount={messages.length}
        onClearChat={() => setMessages([])}
      />

      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '2px 4px' }}>
        <MessageList
          messages={messages}
          copyMsg={copyMsg}
          copiedIdx={copiedIdx}
          loading={loading}
          apiStatus={apiStatus}
        />
        <ActionHistory
          pendingActions={pendingActions}
          actionResult={actionResult}
          onConfirm={runActions}
          onCancel={() => { setPendingActions(null); setActionResult(null); }}
        />
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={listening ? '🎤 Dinleniyor...' : 'Sorunuzu yazın veya 🎤 mikrofona basın...'}
            rows={2}
            disabled={loading || listening}
            style={{
              width: '100%',
              padding: '11px 15px',
              background: listening ? 'rgba(239,68,68,0.08)' : 'var(--bg-card)',
              border: `1px solid ${listening ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
              borderRadius: 12,
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              resize: 'none',
              boxSizing: 'border-box',
              outline: 'none',
              lineHeight: 1.5,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          />
        </div>
        {micSupported && (
          <button
            onPointerDown={(e) => { e.preventDefault(); startListen(); }}
            onPointerUp={(e) => { e.preventDefault(); stopListen(); }}
            onPointerLeave={() => stopListen()}
            disabled={loading}
            style={{
              width: 46, height: 46, flexShrink: 0,
              background: listening ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${listening ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: 12, color: listening ? '#fff' : '#f87171',
              cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: listening ? '0 0 20px rgba(239,68,68,0.5)' : 'none',
              animation: listening ? 'micPulse 1s ease-in-out infinite' : 'none',
            }}
          >
            🎤
          </button>
        )}
        <button
          onClick={() => send()}
          disabled={loading || !input.trim() || listening}
          style={{
            width: 46, height: 46, flexShrink: 0,
            background: loading || !input.trim() ? 'var(--bg-card)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: loading || !input.trim() ? '1px solid var(--border)' : 'none',
            borderRadius: 12, color: loading || !input.trim() ? 'var(--text-dim)' : '#fff',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: loading || !input.trim() ? 'none' : '0 4px 16px rgba(99,102,241,0.4)',
          }}
        >
          {loading ? '⏳' : '↑'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => { if (speaking) stopSpeak(); setAutoSpeak(a => !a); }}
          style={{
            padding: '5px 12px', borderRadius: 8,
            border: `1px solid ${autoSpeak ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
            background: autoSpeak ? 'rgba(16,185,129,0.1)' : 'var(--bg-card)',
            color: autoSpeak ? '#10b981' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          {speaking ? '🔊' : autoSpeak ? '🔈' : '🔇'}
          <span>{autoSpeak ? 'Sesli Açık' : 'Sesli Kapalı'}</span>
        </button>

        {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content && (
          <button
            onClick={() => { if (speaking) stopSpeak(); else speak(messages[messages.length - 1].content); }}
            style={{
              padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg-card)', color: speaking ? 'var(--color-accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {speaking ? '⏹ Durdur' : '▶ Son Cevabı Oku'}
          </button>
        )}
      </div>

      {messages.length > 0 && !loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {QUICK_PROMPTS.slice(0, 5).map((p) => (
            <button
              key={p.label}
              onClick={() => send(p.prompt)}
              disabled={loading}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 7, color: 'var(--text-secondary)',
                padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {isVoiceMode && (
        <VoiceAgentUI 
          state={voiceState}
          transcript={voiceTranscript}
          response={voiceResponse}
          onToggleMic={toggleVoiceListening}
          onClose={() => setIsVoiceMode(false)}
        />
      )}
    </div>
  );
}
