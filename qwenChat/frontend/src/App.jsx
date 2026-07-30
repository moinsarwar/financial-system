import { useEffect, useMemo, useRef, useState } from "react";
import { fetchActions, fetchData, fetchHealth, streamChat } from "./api.js";

const WELCOME = {
  role: "assistant",
  content:
    "Welcome to Financial System. I can explain finOS and reseller data using live read-only database queries. Use a quick action below, or ask a question.",
};

function StatusDot({ ok, label }) {
  return (
    <span className={`status-pill ${ok ? "ok" : "bad"}`} title={label}>
      <span className="dot" />
      {label}
    </span>
  );
}

function DataPanel({ preview, action }) {
  if (!preview) {
    return (
      <div className="data-empty">
        <p>No live snapshot yet.</p>
        <p className="muted">Click a quick action to load read-only data from finOS or reseller.</p>
      </div>
    );
  }
  return (
    <div className="data-panel-body">
      <div className="data-panel-meta">
        <span className="chip">READ-ONLY</span>
        {action ? <span className="chip soft">{action}</span> : null}
      </div>
      <pre>{JSON.stringify(preview, null, 2)}</pre>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [actions, setActions] = useState([]);
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [dataPreview, setDataPreview] = useState(null);
  const [error, setError] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const grouped = useMemo(() => {
    const map = { finOS: [], Reseller: [] };
    for (const a of actions) {
      (map[a.group] || (map[a.group] = [])).push(a);
    }
    return map;
  }, [actions]);

  useEffect(() => {
    fetchActions()
      .then((d) => setActions(d.actions || []))
      .catch((e) => setError(e.message));
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function runChat({ text, actionObj }) {
    if (busy) return;
    const message = (text || "").trim();
    if (!message) return;

    setError(null);
    setBusy(true);
    setActiveAction(actionObj?.id || null);

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: "user", content: message, action: actionObj?.id }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    let assembled = "";
    try {
      await streamChat({
        message,
        history,
        action: actionObj?.id || null,
        params: actionObj?.params || null,
        onMeta: (meta) => {
          if (meta?.data_preview !== undefined) {
            setDataPreview(meta.data_preview);
            setPanelOpen(true);
          }
        },
        onToken: (token) => {
          assembled += token;
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: assembled, streaming: true };
            return copy;
          });
        },
        onDone: () => {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: assembled || "No response from model." };
            return copy;
          });
        },
        onError: (err) => setError(err),
      });
    } catch (e) {
      setError(e.message || String(e));
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `I could not reach the model. ${e.message || e}`,
        };
        return copy;
      });
    } finally {
      setBusy(false);
      setActiveAction(null);
      inputRef.current?.focus();
    }
  }

  async function onQuickAction(actionObj) {
    // Also load raw data for the side panel immediately
    try {
      const raw = await fetchData(actionObj.id, actionObj.params || null);
      setDataPreview(raw.data ?? { error: raw.error });
      setPanelOpen(true);
    } catch {
      /* chat path will still attempt */
    }
    await runChat({ text: actionObj.prompt, actionObj });
  }

  function onSubmit(e) {
    e.preventDefault();
    const text = input;
    setInput("");
    runChat({ text, actionObj: null });
  }

  const ollamaOk = health?.ollama?.ok;
  const finosOk = health?.finos?.reachable;
  const resellerOk = health?.reseller?.reachable;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">F</span>
          <div>
            <h1>Financial System</h1>
            <p>Read-only assistant · powered by Qwen</p>
          </div>
        </div>
        <div className="status-row">
          <StatusDot ok={!!ollamaOk} label={`Ollama ${health?.ollama?.configured_model || ""}`} />
          <StatusDot ok={!!finosOk} label="finOS" />
          <StatusDot ok={!!resellerOk} label="Reseller" />
          <button type="button" className="ghost" onClick={() => setPanelOpen((v) => !v)}>
            {panelOpen ? "Hide data" : "Show data"}
          </button>
        </div>
      </header>

      <div className={`workspace ${panelOpen ? "with-panel" : ""}`}>
        <main className="chat">
          <div className="messages">
            {messages.map((m, i) => (
              <article key={i} className={`bubble ${m.role}`}>
                <div className="bubble-label">{m.role === "user" ? "You" : "Qwen"}</div>
                <div className="bubble-body">
                  {m.content}
                  {m.streaming ? <span className="caret" /> : null}
                </div>
                {m.action ? <div className="bubble-tag">via {m.action}</div> : null}
              </article>
            ))}
            <div ref={bottomRef} />
          </div>

          {error ? <div className="banner error">{error}</div> : null}

          <section className="actions">
            {Object.entries(grouped).map(([group, items]) =>
              items.length ? (
                <div key={group} className="action-group">
                  <h3>{group}</h3>
                  <div className="action-row">
                    {items.map((a) => (
                      <button
                        key={a.id + JSON.stringify(a.params || {})}
                        type="button"
                        className={`action-btn ${activeAction === a.id ? "active" : ""}`}
                        disabled={busy}
                        title={a.description}
                        onClick={() => onQuickAction(a)}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </section>

          <form className="composer" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, applications, resellers, commissions…"
              disabled={busy}
              autoComplete="off"
            />
            <button type="submit" disabled={busy || !input.trim()}>
              {busy ? "Thinking…" : "Send"}
            </button>
          </form>
          <p className="footnote">Buttons and APIs are read-only — no create, edit, or delete.</p>
        </main>

        {panelOpen ? (
          <aside className="data-panel">
            <div className="data-panel-head">
              <h2>Live data</h2>
              <span className="muted">DB snapshot</span>
            </div>
            <DataPanel preview={dataPreview} action={activeAction} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
