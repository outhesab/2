import { dispatchAgentFlow } from "@/agents/orchestrator";
import { useSpeechRecognition, useSpeechSynthesis } from "@/hooks/useSpeech";
import type { DBAction, SaveFn } from "@/lib/aiActions";
import {
  applyActionWithFallback,
  parseActions,
  stripActions,
} from "@/lib/aiActions";
import type { Message as ApiMessage } from "@/lib/aiApi";
import { askClaude, askGemini } from "@/lib/aiApi";
import DOMPurify from 'dompurify';
import {
  getKeys,
  invalidateKeyCache,
  loadKeysFromFirebase,
  saveKeysToFirebase,
} from "@/lib/aiKeys";
import { buildContext, offlineReply, QUICK_PROMPTS } from "@/lib/aiOffline";
import { askDeepSeek } from "@/lib/deepseek";
import { getUserSession } from "@/lib/userManager";
import { logger } from "@/lib/logger";
import { formatMoney, genId } from "@/lib/utils-tr";
import type { AIActionLogEntry, DB } from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Props {
  db: DB;
  save?: SaveFn;
  embedded?: boolean;
}

// Message type imported from @/lib/aiApi as ApiMessage
type Message = ApiMessage;

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const ALLOWED_TAGS = new Set(["strong", "h3", "h4", "li", "ul", "br", "span"]);
function sanitize(html: string): string {
  return html.replace(/<(\/?)(\w+)[^>]*>/g, (match, slash, tag) => {
    if (ALLOWED_TAGS.has(tag.toLowerCase())) return match;
    const escaped = match.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escaped;
  });
}

function MarkdownText({ text }: { text: string }) {
  const html = sanitize(
    escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(
        /^### (.+)$/gm,
        '<h4 style="color:var(--accent);font-size:0.9rem;margin:10px 0 4px;font-weight:700">$1</h4>',
      )
      .replace(
        /^## (.+)$/gm,
        '<h3 style="color:var(--text-primary);font-size:1rem;margin:12px 0 6px;font-weight:800">$1</h3>',
      )
      .replace(/^- (.+)$/gm, '<li style="margin:3px 0;padding-left:4px">$1</li>')
      .replace(
        /(<li[^>]*>.*<\/li>\n?)+/gs,
        '<ul style="list-style:none;padding:0;margin:6px 0">$&</ul>',
      )
      .replace(/\n\n/g, "<br/>")
      .replace(/\n/g, "<br/>"),
  );
  return <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}

function getActionAffectedIds(action: DBAction): string[] {
  const ids = new Set<string>();
  const payload = action.payload || {};
  ["id", "productId", "cariId", "saleId", "invoiceId", "kasaEntryId"].forEach(
    (key) => {
      const value = payload[key];
      if (typeof value === "string" && value.trim()) ids.add(value.trim());
    },
  );
  return [...ids];
}

function isDangerousAction(action: DBAction): boolean {
  return ["sale", "kasa_gider", "stok_guncelle", "cari_tahsilat"].includes(
    action.type,
  );
}

function ApiSettings({ onClose }: { onClose: () => void }) {
  const [ck, setCk] = useState("");
  const [gk, setGk] = useState("");
  const [dk, setDk] = useState("");
  const [hk, setHk] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadKeysFromFirebase().then((keys) => {
      setCk(keys.claude);
      setGk(keys.gemini);
      setDk(keys.deepseek);
      setHk(keys.huggingface);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const ok = await saveKeysToFirebase({
      claude: ck.trim(),
      gemini: gk.trim(),
      deepseek: dk.trim(),
      huggingface: hk.trim(),
      opencodeNvidia: "",
      opencodeHf: "",
    });
    if (ok) {
      invalidateKeyCache();
      setMsg("✅ Firebase'e kaydedildi");
      setTimeout(() => {
        setMsg("");
        onClose();
      }, 1200);
    } else {
      setMsg("❌ Kayıt başarısız — Firebase bağlantısını kontrol edin");
    }
    setSaving(false);
  };

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    background: "#0f172a",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "#f1f5f9",
    fontSize: "0.85rem",
    boxSizing: "border-box",
    fontFamily: "monospace",
  };
  return (
    <div style={{ padding: "16px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          padding: "8px 12px",
          background: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 8,
        }}
      >
        <span>☁️</span>
        <p style={{ color: "#10b981", fontSize: "0.82rem", margin: 0 }}>
          API anahtarları Firebase'de şifreli saklanır — tüm cihazlarda
          geçerlidir.
        </p>
      </div>
      {loading ? (
        <div
          style={{
            color: "#64748b",
            fontSize: "0.85rem",
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          Firebase'den yükleniyor...
        </div>
      ) : (
        <>
          <label
            style={{
              display: "block",
              color: "#94a3b8",
              fontSize: "0.82rem",
              marginBottom: 4,
            }}
          >
            🤖 Claude API Key (Anthropic — birincil)
          </label>
          <input
            value={ck}
            onChange={(e) => setCk(e.target.value)}
            placeholder="sk-ant-..."
            style={{ ...inp, marginBottom: 14 }}
            type="password"
          />
          <label
            style={{
              display: "block",
              color: "#94a3b8",
              fontSize: "0.82rem",
              marginBottom: 4,
            }}
          >
            ✨ Gemini API Key (Google — yedek)
          </label>
          <input
            value={gk}
            onChange={(e) => setGk(e.target.value)}
            placeholder="AIza..."
            style={{ ...inp, marginBottom: 18 }}
            type="password"
          />
          <label
            style={{
              display: "block",
              color: "#94a3b8",
              fontSize: "0.82rem",
              marginBottom: 4,
            }}
          >
            🧠 DeepSeek API Key (yedek AI)
          </label>
          <input
            value={dk}
            onChange={(e) => setDk(e.target.value)}
            placeholder="sk-..."
            style={{ ...inp, marginBottom: 14 }}
            type="password"
          />
          <label
            style={{
              display: "block",
              color: "#94a3b8",
              fontSize: "0.82rem",
              marginBottom: 4,
            }}
          >
            🤗 Hugging Face Token (HF_TOKEN)
          </label>
          <input
            value={hk}
            onChange={(e) => setHk(e.target.value)}
            placeholder="hf_..."
            style={{ ...inp, marginBottom: 18 }}
            type="password"
          />
          {msg && (
            <div
              style={{
                marginBottom: 12,
                fontSize: "0.82rem",
                color: msg.startsWith("✅") ? "#10b981" : "#ef4444",
                fontWeight: 600,
              }}
            >
              {msg}
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{
                flex: 1,
                background: "#10b981",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                padding: "10px 0",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {saving ? "Kaydediliyor..." : "☁️ Firebase'e Kaydet"}
            </button>
            <button
              onClick={onClose}
              style={{
                background: "#273548",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "#94a3b8",
                padding: "10px 16px",
                cursor: "pointer",
              }}
            >
              İptal
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AIAsistan({ db, save, embedded = false }: Props) {
  const session = getUserSession();
  const isAdminUser = session?.role === "admin";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<
    "idle" | "deepseek" | "claude" | "gemini" | "offline"
  >("idle");
  const [showSettings, setShowSettings] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [modelSource, setModelSource] = useState<
    "deepseek" | "claude" | "gemini" | "offline"
  >("claude");
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [autoApplyActions, setAutoApplyActions] = useState(false);
  const [maxAutoActions, setMaxAutoActions] = useState(3);
  const [stopOnViolation, setStopOnViolation] = useState(true);
  // Onay bekleyen DB işlemleri
  const [pendingActions, setPendingActions] = useState<{
    msgIdx: number;
    actions: DBAction[];
  } | null>(null);
  const [actionResult, setActionResult] = useState<{
    msgIdx: number;
    success: boolean;
    msg: string;
  } | null>(null);
  const actionMode: "read-only" | "manual" | "auto" =
    !isAdminUser || !adminMode
      ? "read-only"
      : autoApplyActions
        ? "auto"
        : "manual";
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
        let summary = "";
        save((prev) => {
          let next = prev;
          let appliedCount = 0;
          const violations: string[] = [];
          const fallbackNotes: string[] = [];
          const actionLogs: AIActionLogEntry[] = [];
          const actionLimit = autoApplyActions
            ? Math.max(1, maxAutoActions)
            : Number.MAX_SAFE_INTEGER;

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
              dispatchAgentFlow(appliedAction as Parameters<typeof dispatchAgentFlow>[0]);
              fallbackNotes.push(`AgentAkisi:${action.label}`);
              if (
                attempted.appliedAction &&
                attempted.appliedAction !== action
              ) {
                fallbackNotes.push(
                  `${action.label} => ${attempted.appliedAction.label}`,
                );
              }
              actionLogs.push({
                id: genId(),
                createdAt: new Date().toISOString(),
                model: modelSource,
                mode: autoApplyActions ? "auto" : "manual",
                messageIndex: msgIdx,
                actionType: appliedAction.type,
                label: appliedAction.label,
                status: "applied",
                dangerous: isDangerousAction(appliedAction),
                affectedIds: getActionAffectedIds(appliedAction),
                notes: attempted.notes,
              });
            } else {
              const error =
                attempted.notes[0] || `${action.label}: İşlem uygulanamadı`;
              violations.push(error);
              if (attempted.notes.length > 1) {
                fallbackNotes.push(...attempted.notes.slice(1));
              }
              actionLogs.push({
                id: genId(),
                createdAt: new Date().toISOString(),
                model: modelSource,
                mode: autoApplyActions ? "auto" : "manual",
                messageIndex: msgIdx,
                actionType: action.type,
                label: action.label,
                status: "failed",
                dangerous: isDangerousAction(action),
                affectedIds: getActionAffectedIds(action),
                notes: attempted.notes,
                error,
              });
              if (stopOnViolation) break;
            }
          }

          const aiLog = {
            id: genId(),
            action: autoApplyActions ? "ai_auto_action" : "ai_manual_action",
            detail: [
              `Uygulanan:${appliedCount}`,
              `Toplam:${actions.length}`,
              actions.map((a) => a.label).join(" | "),
              violations.length ? `İhlal:${violations.join(" ; ")}` : "",
              fallbackNotes.length
                ? `Fallback:${fallbackNotes.join(" ; ")}`
                : "",
            ]
              .filter(Boolean)
              .join(" || "),
            time: new Date().toISOString(),
          };
          summary = violations.length
            ? `${appliedCount}/${actions.length} işlendi. ${violations.length} kural ihlali var.`
            : autoApplyActions
              ? `${appliedCount} işlem otomatik işlendi`
              : "Kaydedildi!";
          return {
            ...next,
            _activityLog: [...(next._activityLog || []), aiLog],
            aiActionLog: [...actionLogs, ...(next.aiActionLog || [])].slice(
              0,
              200,
            ),
          };
        });
        setActionResult({
          msgIdx,
          success: true,
          msg: summary || "Kaydedildi!",
        });
        setTimeout(() => {
          setPendingActions(null);
          setActionResult(null);
        }, 1200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setActionResult({
          msgIdx,
          success: false,
          msg: err.message || "Hata oluştu",
        });
      }
    },
    [save, autoApplyActions, maxAutoActions, stopOnViolation, modelSource],
  );

  // Sesli özellikler
  const { speaking, speak, stop: stopSpeak } = useSpeechSynthesis();
  const {
    listening,
    supported: micSupported,
    error: micError,
    start: startListen,
    stop: stopListen,
  } = useSpeechRecognition((text) => {
    setInput(text);
    // Sesli girişten gelen metni otomatik gönder
    setTimeout(() => sendText(text), 100);
  });

  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [keysLoaded, setKeysLoaded] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const [keyLoadError, setKeyLoadError] = useState(false);
  const [keyAccessForbidden, setKeyAccessForbidden] = useState(false);
  const keysRef = useRef({
    claude: "",
    gemini: "",
    deepseek: "",
    huggingface: "",
    opencodeNvidia: "",
    opencodeHf: "",
  });

  useEffect(() => {
    getKeys()
      .then((keys) => {
        keysRef.current = keys;
        const loaded = !!(keys.claude || keys.gemini);
        setHasKeys(loaded);
        setKeyAccessForbidden(keys.state === "forbidden");
        setKeyLoadError(keys.state === "unavailable");
        setKeysLoaded(true);
      })
      .catch(() => {
        setKeyLoadError(true);
        setKeyAccessForbidden(false);
        setKeysLoaded(true);
      });
  }, []);

  const [isOnline, setIsOnline] = useState(true); // başlangıçta online kabul et

  useEffect(() => {
    // Capacitor Network plugin (Android WebView'da navigator.onLine güvenilmez)
    const initNetwork = async () => {
      try {
        const { Network } = await import("@capacitor/network");
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        Network.addListener("networkStatusChange", (s) =>
          setIsOnline(s.connected),
        );
      } catch {
        logger.warn('ai', 'Capacitor Network algılanamadı, Web fallback kullanılıyor');
        // Web fallback
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
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

      // Rate limit koruması: son istekten en az 3 saniye geçmeli
      const now = Date.now();
      const lastReq = parseInt(sessionStorage.getItem("ai_last_req") || "0");
      const elapsed = now - lastReq;
      if (elapsed < 3000 && lastReq > 0) {
        const wait = Math.ceil((3000 - elapsed) / 1000);
        setMessages((prev) => [
          ...prev,
          { role: "user", content: userMsg },
          {
            role: "assistant",
            content: `⏳ Çok hızlı istek gönderiyorsunuz. Lütfen ${wait} saniye bekleyin.`,
            source: "offline",
          },
        ]);
        return;
      }
      sessionStorage.setItem("ai_last_req", String(now));

      setInput("");
      setLoading(true);
      const newMessages: Message[] = [
        ...messages,
        { role: "user", content: userMsg },
      ];
      setMessages(newMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (!isOnline) {
        const reply = offlineReply(db, userMsg);
        setMessages((prev) => {
          const u = [...prev];
          u[u.length - 1] = {
            role: "assistant",
            content: reply,
            source: "offline",
          };
          return u;
        });
        if (autoSpeak) speak(reply);
        // offline modda da action parse et
        const actions = parseActions(reply);
        if (actions.length > 0 && save) {
          if (!isAdminUser || !adminMode) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content:
                  "⚠️ Action üretildi ancak Yönetici Modu kapalı olduğu için DB yazma yapılmadı.",
                source: "offline",
              },
            ]);
          } else if (autoApplyActions) {
            runActions(newMessages.length, actions);
          } else {
            setPendingActions({ msgIdx: newMessages.length, actions });
          }
        }
        setApiStatus("offline");
        setLoading(false);
        return;
      }

      // Key'leri her seferinde cache'den al (kaydet sonrası invalidate edilir)
      const keys = await getKeys();
      keysRef.current = keys;
      const claudeKey = keys.claude;
      const geminiKey = keys.gemini;
      const deepseekKey = keys.deepseek;

      const appendChunk = (chunk: string) => {
        setMessages((prev) => {
          const u = [...prev];
          u[u.length - 1] = {
            ...u[u.length - 1],
            content: u[u.length - 1].content + chunk,
          };
          return u;
        });
      };

      // Yanıt tamamlandığında action bloklarını parse et
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
              updated.push({
                role: "assistant",
                content:
                  "⚠️ Action üretildi ancak Yönetici Modu kapalı olduğu için DB yazma yapılmadı.",
                source: "offline",
              });
            } else if (autoApplyActions) {
              setTimeout(() => runActions(msgIndex, actions), 0);
            } else {
              setPendingActions({ msgIdx: msgIndex, actions });
            }
          }
          return updated;
        });
      };

      // Rate limit hata mesajı oluştur
      const rateLimitMsg = (api: string) =>
        `🚨 **${api} rate limit aşıldı** - çok fazla istek gönderildi.\n\nBirkaç dakika bekleyip tekrar deneyin. Bu sürede çevrimdışı mod aktif.`;

      // Token tasarrufu: yalnizca son 10 mesaji API'ye gonder (bagiam sistem prompt'ta var)
      const apiMessages = newMessages.slice(-10);

      const tryApi = async (
        source: "deepseek" | "claude" | "gemini",
        key: string,
        askFn: (
          msgs: typeof apiMessages,
          ctx: string,
          k: string,
          onChunk: (t: string) => void,
        ) => Promise<void>,
      ) => {
        try {
          setApiStatus(source);
          setMessages((prev) => {
            const u = [...prev];
            u[u.length - 1] = { ...u[u.length - 1], source };
            return u;
          });
          await askFn(apiMessages, context, key, appendChunk);
          if (autoSpeak) {
            setMessages((prev) => {
              if (prev[prev.length - 1]?.content)
                speak(prev[prev.length - 1].content);
              return prev;
            });
          }
          finalizeResponse(newMessages.length);
          setLoading(false);
          return true;
        } catch (e: unknown) {
          const err = e as { message?: string } | undefined;
          const msg = String(err?.message || e || "");
          if (
            msg.includes("429") ||
            msg.toLowerCase().includes("too many") ||
            msg.toLowerCase().includes("rate")
          ) {
            setMessages((prev) => {
              const u = [...prev];
              u[u.length - 1] = {
                role: "assistant",
                content: rateLimitMsg(
                  source.charAt(0).toUpperCase() + source.slice(1),
                ),
                source: "offline",
              };
              return u;
            });
            setLoading(false);
            return true;
          }
          console.warn(`${source} başarısız:`, e);
          return false;
        }
      };

      if (modelSource !== "offline") {
        let success = false;
        if (modelSource === "deepseek" && deepseekKey) {
          success = await tryApi(
            "deepseek",
            deepseekKey,
            async (msgs, ctx, key, cb) => {
              const systemMsg = {
                role: "system" as const,
                content: `Sen Soba işletmesi için AI analistsin. Kısa, net, Türkçe yanıt ver.\n\n${ctx}`,
              };
              const userMsgs = msgs
                .filter((m) => m.content)
                .map((m) => ({
                  role: m.role as "user" | "assistant",
                  content: m.content,
                }));
              await askDeepSeek([systemMsg, ...userMsgs], key, cb);
            },
          );
        } else if (modelSource === "claude" && claudeKey) {
          success = await tryApi("claude", claudeKey, askClaude);
        } else if (modelSource === "gemini" && geminiKey) {
          success = await tryApi("gemini", geminiKey, askGemini);
        }
        if (success) return;
      }

      const noKeyMsg =
        modelSource === "deepseek"
          ? "?? DeepSeek API anahtarı girilmemiş. Ayarlar'dan ekleyin veya farklı bir kaynak seçin."
          : modelSource === "claude"
            ? "?? Claude API anahtarı girilmemiş. Ayarlar'dan ekleyin veya farklı bir kaynak seçin."
            : modelSource === "gemini"
              ? "? Gemini API anahtarı girilmemiş. Ayarlar'dan ekleyin veya farklı bir kaynak seçin."
              : "?? Çevrimdışı mod — temel sorulara yanıt verir.";
      const reply = offlineReply(db, userMsg);
      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = {
          role: "assistant",
          content:
            noKeyMsg +
            (modelSource === "offline"
              ? `\n\n${reply}`
              : `\n\n?? Çevrimdışı yanıt:\n${reply}`),
          source: "offline",
        };
        return u;
      });
      if (autoSpeak) speak(reply);
      setApiStatus("offline");
      setLoading(false);
    },
    [
      input,
      loading,
      messages,
      context,
      db,
      autoSpeak,
      speak,
      isOnline,
      isAdminUser,
      adminMode,
      autoApplyActions,
      runActions,
      save,
      modelSource,
    ],
  );

  // Sesli girişten çağrılabilmesi için ayrı ref
  const sendText = useCallback(
    (text: string) => {
      if (!text.trim() || loading) return;
      setInput("");
      // send fonksiyonunu text parametresiyle çağır
      send(text);
    },
    [send, loading],
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const sourceLabel: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    deepseek: {
      label: "🧠 DeepSeek",
      color: "var(--color-success)",
      bg: "var(--color-success-soft)",
    },
    claude: {
      label: "🤖 Claude",
      color: "var(--color-accent)",
      bg: "var(--color-accent-soft)",
    },
    gemini: {
      label: "✨ Gemini",
      color: "var(--color-primary-light)",
      bg: "var(--color-primary-ultra)",
    },
    offline: {
      label: "🔌 Çevrimdışı",
      color: "var(--text-muted)",
      bg: "var(--bg-card)",
    },
  };

  // Anlık işletme özeti
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthSales = db.sales.filter(
    (s) =>
      !s.deleted &&
      s.status === "tamamlandi" &&
      new Date(s.createdAt) >= monthStart,
  );
  const kasaToplam = db.kasa
    .filter((k) => !k.deleted)
    .reduce((s, k) => s + (k.type === "gelir" ? k.amount : -k.amount), 0);
  const alacakToplam = db.cari
    .filter((c) => !c.deleted && c.type === "musteri" && c.balance > 0)
    .reduce((s, c) => s + c.balance, 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: embedded ? "100%" : "calc(100vh - 140px)",
      }}
    >
      {/* Header — sadece standalone modda */}
      {!embedded && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 16,
            padding: "16px 20px",
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))",
            borderRadius: 16,
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              flexShrink: 0,
              boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            }}
          >
            🤖
          </div>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontWeight: 800,
                color: "var(--text-primary)",
                fontSize: "1.1rem",
                margin: 0,
              }}
            >
              Soba AI Asistan
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.78rem",
                margin: "3px 0 0",
              }}
            >
              {!isOnline
                ? "🔌 Çevrimdışı — temel sorulara yanıt verir"
                : hasKeys
                  ? `✅ ${keysRef.current.deepseek ? "DeepSeek " : ""}${keysRef.current.claude ? "Claude " : ""}${keysRef.current.gemini ? "Gemini" : ""} hazır`
                  : keyAccessForbidden
                    ? "🚫 Firebase anahtar erişimi kısıtlı (403) — yerel/env anahtar kullanın"
                    : keyLoadError
                      ? "⚠️ Anahtarlar yüklenemedi - Ayarlar'a girin"
                      : "⚠️ API anahtarı girilmemiş - Ayarlar'a girin"}
            </p>
          </div>
          {/* Anlık Özet */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {[
              {
                label: "Bu Ay",
                value: formatMoney(monthSales.reduce((s, x) => s + x.total, 0)),
                color: "#10b981",
              },
              {
                label: "Kasa",
                value: formatMoney(kasaToplam),
                color: "#06b6d4",
              },
              {
                label: "Alacak",
                value: formatMoney(alacakToplam),
                color: "#f59e0b",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{ textAlign: "center", display: "none" }}
                className="ai-stat"
              >
                <div
                  style={{
                    color: s.color,
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  {s.value}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.65rem" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {isAdminUser && (
              <button
                onClick={() => setAdminMode((v) => !v)}
                title="Yönetici DB Yazma Modu"
                style={{
                  background: adminMode
                    ? "rgba(16,185,129,0.2)"
                    : "var(--bg-card)",
                  border: `1px solid ${adminMode ? "rgba(16,185,129,0.5)" : "var(--border)"}`,
                  borderRadius: 8,
                  color: adminMode ? "#10b981" : "var(--text-secondary)",
                  padding: "7px 10px",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                {adminMode ? "ADMIN AKTİF" : "OKUMA MODU"}
              </button>
            )}
            {isAdminUser && adminMode && (
              <button
                onClick={() => setAutoApplyActions((v) => !v)}
                title="Aksiyonları otomatik uygula"
                style={{
                  background: autoApplyActions
                    ? "rgba(245,158,11,0.2)"
                    : "var(--bg-card)",
                  border: `1px solid ${autoApplyActions ? "rgba(245,158,11,0.45)" : "var(--border)"}`,
                  borderRadius: 8,
                  color: autoApplyActions ? "#f59e0b" : "var(--text-secondary)",
                  padding: "7px 10px",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                {autoApplyActions ? "OTO-KAYIT" : "MANUEL-ONAY"}
              </button>
            )}
            {isAdminUser && adminMode && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid rgba(148,163,184,0.25)",
                  background: "rgba(15,23,42,0.35)",
                }}
              >
                <span
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}
                >
                  MAX
                </span>
                <button
                  onClick={() => setMaxAutoActions((v) => Math.max(1, v - 1))}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "none",
                    borderRadius: 6,
                    color: "#cbd5e1",
                    width: 20,
                    height: 20,
                    cursor: "pointer",
                    fontWeight: 700,
                    lineHeight: "20px",
                  }}
                >
                  -
                </button>
                <span
                  style={{
                    minWidth: 16,
                    textAlign: "center",
                    color: "#f1f5f9",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                  }}
                >
                  {maxAutoActions}
                </span>
                <button
                  onClick={() => setMaxAutoActions((v) => Math.min(20, v + 1))}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "none",
                    borderRadius: 6,
                    color: "#cbd5e1",
                    width: 20,
                    height: 20,
                    cursor: "pointer",
                    fontWeight: 700,
                    lineHeight: "20px",
                  }}
                >
                  +
                </button>
              </div>
            )}
            {isAdminUser && adminMode && (
              <button
                onClick={() => setStopOnViolation((v) => !v)}
                title="Kural ihlalinde davranış"
                style={{
                  background: stopOnViolation
                    ? "rgba(239,68,68,0.16)"
                    : "rgba(16,185,129,0.14)",
                  border: `1px solid ${stopOnViolation ? "rgba(239,68,68,0.45)" : "rgba(16,185,129,0.45)"}`,
                  borderRadius: 8,
                  color: stopOnViolation ? "#f87171" : "#34d399",
                  padding: "7px 8px",
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                }}
              >
                {stopOnViolation ? "HATA-DUR" : "HATA-GEÇ"}
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                title="Sohbeti Temizle"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 8,
                  color: "var(--text-secondary)",
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                }}
              >
                🗑️
              </button>
            )}
            <button
              onClick={() => setShowSettings((s) => !s)}
              title="API Ayarları"
              style={{
                background: showSettings
                  ? "rgba(99,102,241,0.2)"
                  : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 8,
                color: "#818cf8",
                padding: "7px 12px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              ⚙️
            </button>
          </div>
        </div>
      )}

      {/* Embedded header */}
      {embedded && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, display: "flex", gap: 8 }}>
            {[
              {
                label: "Bu Ay Ciro",
                value: formatMoney(monthSales.reduce((s, x) => s + x.total, 0)),
                color: "#10b981",
              },
              {
                label: "Kasa",
                value: formatMoney(kasaToplam),
                color: "#06b6d4",
              },
              {
                label: "Alacak",
                value: formatMoney(alacakToplam),
                color: "#f59e0b",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  background: `${s.color}10`,
                  border: `1px solid ${s.color}20`,
                  borderRadius: 8,
                  padding: "6px 10px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: s.color,
                    fontWeight: 700,
                    fontSize: "0.82rem",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.62rem",
                    marginTop: 1,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <select
            value={modelSource}
            onChange={(e) =>
              setModelSource(e.target.value as typeof modelSource)
            }
            style={{
              background: "rgba(15,23,42,0.6)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "#f1f5f9",
              padding: "6px 8px",
              fontSize: "0.72rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
            aria-label="AI kaynağı seçimi"
          >
            <option value="deepseek">🧠 DeepSeek</option>
            <option value="claude">🤖 Claude</option>
            <option value="gemini">✨ Gemini</option>
            <option value="offline">🔌 Çevrimdışı</option>
          </select>
          {isAdminUser && (
            <button
              onClick={() => setAdminMode((v) => !v)}
              title="Yönetici DB Yazma Modu"
              style={{
                background: adminMode
                  ? "rgba(16,185,129,0.18)"
                  : "rgba(99,102,241,0.1)",
                border: `1px solid ${adminMode ? "rgba(16,185,129,0.45)" : "rgba(99,102,241,0.2)"}`,
                borderRadius: 8,
                color: adminMode ? "#10b981" : "#818cf8",
                padding: "6px 8px",
                cursor: "pointer",
                fontSize: "0.72rem",
                fontWeight: 700,
              }}
            >
              {adminMode ? "ADMIN" : "READ"}
            </button>
          )}
          {isAdminUser && adminMode && (
            <button
              onClick={() => setAutoApplyActions((v) => !v)}
              title="Aksiyonları otomatik uygula"
              style={{
                background: autoApplyActions
                  ? "rgba(245,158,11,0.18)"
                  : "rgba(99,102,241,0.1)",
                border: `1px solid ${autoApplyActions ? "rgba(245,158,11,0.45)" : "rgba(99,102,241,0.2)"}`,
                borderRadius: 8,
                color: autoApplyActions ? "#f59e0b" : "#818cf8",
                padding: "6px 8px",
                cursor: "pointer",
                fontSize: "0.72rem",
                fontWeight: 700,
              }}
            >
              {autoApplyActions ? "AUTO" : "MANUAL"}
            </button>
          )}
          {isAdminUser && adminMode && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 6px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.2)",
                background: "rgba(15,23,42,0.3)",
              }}
            >
              <button
                onClick={() => setMaxAutoActions((v) => Math.max(1, v - 1))}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: 5,
                  color: "#cbd5e1",
                  width: 16,
                  height: 16,
                  cursor: "pointer",
                  fontWeight: 700,
                  lineHeight: "16px",
                  fontSize: "0.65rem",
                }}
              >
                -
              </button>
              <span
                style={{
                  color: "#f1f5f9",
                  fontSize: "0.65rem",
                  minWidth: 12,
                  textAlign: "center",
                }}
              >
                {maxAutoActions}
              </span>
              <button
                onClick={() => setMaxAutoActions((v) => Math.min(20, v + 1))}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: 5,
                  color: "#cbd5e1",
                  width: 16,
                  height: 16,
                  cursor: "pointer",
                  fontWeight: 700,
                  lineHeight: "16px",
                  fontSize: "0.65rem",
                }}
              >
                +
              </button>
            </div>
          )}
          {isAdminUser && adminMode && (
            <button
              onClick={() => setStopOnViolation((v) => !v)}
              title="Kural ihlalinde davranış"
              style={{
                background: stopOnViolation
                  ? "rgba(239,68,68,0.16)"
                  : "rgba(16,185,129,0.14)",
                border: `1px solid ${stopOnViolation ? "rgba(239,68,68,0.45)" : "rgba(16,185,129,0.45)"}`,
                borderRadius: 8,
                color: stopOnViolation ? "#f87171" : "#34d399",
                padding: "6px 8px",
                cursor: "pointer",
                fontSize: "0.62rem",
                fontWeight: 700,
              }}
            >
              {stopOnViolation ? "STOP" : "SKIP"}
            </button>
          )}
          <button
            onClick={() => setShowSettings((s) => !s)}
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 8,
              color: "#818cf8",
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            ⚙️
          </button>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "none",
                borderRadius: 8,
                color: "var(--text-secondary)",
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              🗑️
            </button>
          )}
        </div>
      )}

      {/* API Ayarları */}
      {showSettings && (
        <div
          style={{
            background: "rgba(15,23,42,0.8)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <h3
              style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem" }}
            >
              ⚙️ API Ayarları
            </h3>
            <button
              onClick={() => {
                invalidateKeyCache();
                setShowSettings(false);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "1.1rem",
              }}
            >
              ✕
            </button>
          </div>
          <ApiSettings
            onClose={() => {
              invalidateKeyCache();
              setShowSettings(false);
            }}
          />
        </div>
      )}

      {/* Quick prompts — boş ekranda büyük grid */}
      {messages.length === 0 && !showSettings && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "20px 0 16px",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 10, opacity: 0.5 }}>
              🤖
            </div>
            <h3
              style={{
                color: "var(--text-secondary)",
                fontWeight: 700,
                marginBottom: 6,
                fontSize: "0.95rem",
              }}
            >
              İşletmenizle ilgili her şeyi sorabilirsiniz
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.8rem",
                maxWidth: 360,
                lineHeight: 1.6,
              }}
            >
              {hasKeys
                ? "Gerçek verilerinizi analiz ederek yanıt verir."
                : "🔌 Ayarlar'dan API anahtarını girin. Internetsiz de temel sorulara yanıt verir."}
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
            }}
          >
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => send(p.prompt)}
                disabled={loading}
                style={{
                  background: "rgba(99,102,241,0.06)",
                  border: "1px solid rgba(99,102,241,0.15)",
                  borderRadius: 10,
                  color: "#818cf8",
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  textAlign: "left",
                  transition: "all 0.15s",
                  opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(99,102,241,0.14)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(99,102,241,0.35)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(99,102,241,0.06)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(99,102,241,0.15)";
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat */}
      <div
        ref={chatRef}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "2px 4px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 10,
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg,#ff5722,#ff7043)"
                    : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                flexShrink: 0,
                boxShadow:
                  msg.role === "user"
                    ? "0 2px 10px rgba(255,87,34,0.3)"
                    : "0 2px 10px rgba(99,102,241,0.3)",
              }}
            >
              {msg.role === "user" ? "👤" : "🤖"}
            </div>
            <div style={{ maxWidth: "80%", minWidth: 0 }}>
              <div
                style={{
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg,rgba(255,87,34,0.12),rgba(255,87,34,0.06))"
                      : "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(99,102,241,0.04))",
                  border: `1px solid ${msg.role === "user" ? "rgba(255,87,34,0.2)" : "rgba(99,102,241,0.15)"}`,
                  borderRadius: 14,
                  padding: "12px 15px",
                }}
              >
                <div
                  style={{
                     color: "var(--text-primary)",
                    fontSize: "0.87rem",
                    lineHeight: 1.7,
                  }}
                >
                  {msg.role === "assistant" ? (
                    <MarkdownText text={msg.content || "..."} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
              {msg.role === "assistant" && msg.content && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  {msg.source && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: sourceLabel[msg.source]?.color || "#64748b",
                        fontWeight: 600,
                        background: sourceLabel[msg.source]?.bg,
                        borderRadius: 5,
                        padding: "2px 7px",
                      }}
                    >
                      {sourceLabel[msg.source]?.label}
                    </span>
                  )}
                  <button
                    onClick={() => copyMsg(msg.content, i)}
                    style={{
                      background: "none",
                      border: "none",
                      color: copiedIdx === i ? "var(--color-success)" : "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      padding: "2px 6px",
                      borderRadius: 5,
                      transition: "color 0.2s",
                    }}
                  >
                    {copiedIdx === i ? "✓ Kopyalandı" : "📋 Kopyala"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {/* Onay Kartı — DB işlemi bekliyor */}
        {pendingActions && !loading && (
          <div
            style={{
              background:
                "linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.04))",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 14,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1.1rem" }}>⚡</span>
              <span
                style={{
                  color: "var(--color-success)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                }}
              >
                İşlem Onayı
              </span>
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.78rem",
                  marginLeft: "auto",
                }}
              >
                Kaydetmek istiyor musunuz?
              </span>
            </div>
            {pendingActions.actions.map((a, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: "0.85rem" }}>
                  {a.type === "sale"
                    ? "🛒"
                    : a.type === "kasa_gelir"
                      ? "💚"
                      : a.type === "kasa_gider"
                        ? "🔴"
                        : a.type === "stok_guncelle"
                          ? "📦"
                          : a.type === "urun_ekle"
                            ? "?"
                            : a.type === "cari_ekle"
                              ? "??"
                              : "💳"}
                </span>
                <span
                  style={{ color: "var(--text-primary)", fontSize: "0.83rem", flex: 1 }}
                >
                  {a.label}
                </span>
              </div>
            ))}
            {actionResult && actionResult.msgIdx === pendingActions.msgIdx && (
              <div
                style={{
                  color: actionResult.success ? "var(--color-success)" : "var(--color-danger)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {actionResult.success ? "✅ " : "❌ "}
                {actionResult.msg}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() =>
                  runActions(pendingActions.msgIdx, pendingActions.actions)
                }
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg,#059669,#10b981)",
                  border: "none",
                  borderRadius: 9,
                  color: "#fff",
                  padding: "9px 0",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                ✅ Onayla & Kaydet
              </button>
              <button
                onClick={() => {
                  setPendingActions(null);
                  setActionResult(null);
                }}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 9,
                  color: "var(--text-secondary)",
                  padding: "9px 16px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                İptal
              </button>
            </div>
          </div>
        )}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🤖
            </div>
            <div
              style={{
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.15)",
                borderRadius: 14,
                padding: "12px 18px",
              }}
            >
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#6366f1",
                      animation: `pulse 1.2s ease ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
                <span
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.75rem",
                    marginLeft: 6,
                  }}
                >
                  {apiStatus === "claude"
                    ? "Claude düşünüyor..."
                    : apiStatus === "gemini"
                      ? "Gemini yanıtlıyor..."
                      : "Yanıt hazırlanıyor..."}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              listening
                ? "🎤 Dinleniyor..."
                : "Sorunuzu yazın veya 🎤 mikrofona basın..."
            }
            rows={2}
            disabled={loading || listening}
            style={{
              width: "100%",
              padding: "11px 15px",
              background: listening
                ? "rgba(239,68,68,0.08)"
                : "var(--bg-card)",
              border: `1px solid ${listening ? "rgba(239,68,68,0.4)" : "var(--border)"}`,
              borderRadius: 12,
              color: "var(--text-primary)",
              fontSize: "0.88rem",
              resize: "none",
              boxSizing: "border-box",
              outline: "none",
              lineHeight: 1.5,
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "var(--border-strong)")
            }
            onBlur={(e) => {
              if (!listening)
                e.target.style.borderColor = "var(--border)";
            }}
          />
          {micError && (
            <div
              style={{
                position: "absolute",
                bottom: -20,
                left: 0,
                fontSize: "0.72rem",
                color: "#f87171",
              }}
            >
              {micError}
            </div>
          )}
        </div>

        {/* Mikrofon butonu */}
        {micSupported && (
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              startListen();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              stopListen();
            }}
            onPointerLeave={() => stopListen()}
            disabled={loading}
            title="Basılı tut ve konuş"
            style={{
              width: 46,
              height: 46,
              flexShrink: 0,
              background: listening
                ? "linear-gradient(135deg,#ef4444,#dc2626)"
                : "rgba(239,68,68,0.1)",
              border: `1px solid ${listening ? "rgba(239,68,68,0.6)" : "rgba(239,68,68,0.2)"}`,
              borderRadius: 12,
              color: listening ? "#fff" : "#f87171",
              cursor: "pointer",
              fontSize: "1.2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: listening ? "0 0 20px rgba(239,68,68,0.5)" : "none",
              animation: listening
                ? "micPulse 1s ease-in-out infinite"
                : "none",
              transition: "all 0.2s",
            }}
          >
            🎤
          </button>
        )}

        {/* Gönder butonu */}
        <button
          onClick={() => send()}
          disabled={loading || !input.trim() || listening}
          style={{
            width: 46,
            height: 46,
            flexShrink: 0,
            background:
              loading || !input.trim()
                ? "var(--bg-card)"
                : "linear-gradient(135deg,#6366f1,#8b5cf6)",
            border: loading || !input.trim() ? "1px solid var(--border)" : "none",
            borderRadius: 12,
            color: loading || !input.trim() ? "var(--text-dim)" : "#fff",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              loading || !input.trim()
                ? "none"
                : "0 4px 16px rgba(99,102,241,0.4)",
            transition: "all 0.2s",
          }}
        >
          {loading ? "⏳" : "↑"}
        </button>
      </div>

      {/* Sesli okuma & ayar çubuğu */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}
      >
        {/* Otomatik sesli okuma toggle */}
        <button
          onClick={() => {
            if (speaking) stopSpeak();
            setAutoSpeak((a) => !a);
          }}
          title={
            autoSpeak ? "Sesli okuma açık — kapat" : "Sesli okuma kapalı — aç"
          }
          style={{
            padding: "5px 12px",
            borderRadius: 8,
            border: `1px solid ${autoSpeak ? "rgba(16,185,129,0.4)" : "var(--border)"}`,
            background: autoSpeak
              ? "rgba(16,185,129,0.1)"
              : "var(--bg-card)",
            color: autoSpeak ? "#10b981" : "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "0.78rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "all 0.2s",
          }}
        >
          {speaking ? "🔊" : autoSpeak ? "🔈" : "🔇"}
          <span>{autoSpeak ? "Sesli Açık" : "Sesli Kapalı"}</span>
        </button>

        {/* Son cevabı sesli oku */}
        {messages.length > 0 &&
          messages[messages.length - 1]?.role === "assistant" &&
          messages[messages.length - 1]?.content && (
            <button
              onClick={() => {
                if (speaking) stopSpeak();
                else speak(messages[messages.length - 1].content);
              }}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: speaking ? "var(--color-accent)" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.2s",
              }}
            >
              {speaking ? "⏹ Durdur" : "▶ Son Cevabı Oku"}
            </button>
          )}

        {micSupported && (
          <span
            style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginLeft: "auto" }}
          >
            🎤 Basılı tut → konuş → bırak
          </span>
        )}
      </div>

      {/* Konuşma devam ederken mini quick prompts */}
      {messages.length > 0 && !loading && (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}
        >
          {QUICK_PROMPTS.slice(0, 5).map((p) => (
            <button
              key={p.label}
              onClick={() => send(p.prompt)}
              disabled={loading}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 7,
                color: "var(--text-secondary)",
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 600,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--border-strong)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--border)";
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
