import { useEffect, useMemo, useRef, useState } from "react";
import { fetchActions, fetchData, fetchHealth, streamChat } from "./api.js";

const WELCOME = {
  role: "assistant",
  content:
    "Ask about finOS / reseller data, or tap a quick action for exact tables. General trivia is out of scope.",
};

function StatusDot({ ok, label }) {
  const state = ok === true ? "ok" : ok === false ? "bad" : "unknown";
  return (
    <span className={`status-pill ${state}`} title={label}>
      <span className="dot" />
      <span className="status-text">{label}</span>
    </span>
  );
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function isTableSep(line) {
  return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line.trim());
}

function parseTableRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

function renderBody(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const nodes = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // Markdown table block
    if (
      trimmed.includes("|") &&
      i + 1 < lines.length &&
      isTableSep(lines[i + 1])
    ) {
      const headers = parseTableRow(trimmed);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        if (isTableSep(lines[i])) {
          i += 1;
          continue;
        }
        rows.push(parseTableRow(lines[i]));
        i += 1;
      }
      nodes.push(
        <div key={key++} className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {headers.map((h, hi) => (
                  <th key={hi} dangerouslySetInnerHTML={{ __html: formatInline(h) }} />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {headers.map((_, ci) => (
                    <td
                      key={ci}
                      dangerouslySetInnerHTML={{ __html: formatInline(row[ci] ?? "") }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (!trimmed) {
      nodes.push(<br key={key++} />);
      i += 1;
      continue;
    }

    const html = formatInline(trimmed);
    if (trimmed.startsWith("- ")) {
      nodes.push(
        <div key={key++} className="line bullet" dangerouslySetInnerHTML={{ __html: html.slice(2) }} />
      );
    } else {
      nodes.push(<div key={key++} className="line" dangerouslySetInnerHTML={{ __html: html }} />);
    }
    i += 1;
  }

  return nodes;
}

function DataPanel({ preview, actionLabel }) {
  if (!preview) {
    return (
      <div className="data-empty">
        <p>No snapshot yet</p>
        <p className="muted">Tap a quick action to load computed facts from finOS or Reseller.</p>
      </div>
    );
  }

  const facts = preview.facts;
  const md = preview.facts_markdown;
  const err = preview.error;

  return (
    <div className="data-panel-body">
      <div className="data-panel-meta">
        <span className="chip">READ-ONLY</span>
        {actionLabel ? <span className="chip soft">{actionLabel}</span> : null}
      </div>
      {err ? <pre className="err">{JSON.stringify({ error: err }, null, 2)}</pre> : null}
      {md ? <div className="facts-md">{renderBody(md)}</div> : null}
      {facts ? (
        <details className="facts-json">
          <summary>Raw facts JSON</summary>
          <pre>{JSON.stringify(facts, null, 2)}</pre>
        </details>
      ) : !err && !md ? (
        <pre>{JSON.stringify(preview, null, 2)}</pre>
      ) : null}
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
  const [panelOpen, setPanelOpen] = useState(false);
  const [actionTab, setActionTab] = useState("finOS");
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
    const t = setInterval(() => {
      fetchHealth()
        .then(setHealth)
        .catch(() => {});
    }, 30000);
    return () => clearInterval(t);
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
      .slice(-4)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      { role: "user", content: message, action: actionObj?.label || actionObj?.id },
      { role: "assistant", content: "", streaming: true },
    ]);

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
            copy[copy.length - 1] = {
              role: "assistant",
              content: assembled || "No response.",
            };
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
          content: `Could not reach the model. ${e.message || e}`,
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
    try {
      const raw = await fetchData(actionObj.id, actionObj.params || null);
      setDataPreview({
        facts: raw.facts,
        facts_markdown: raw.facts_markdown,
        source: raw.source,
        error: raw.ok ? undefined : raw.error,
      });
      setPanelOpen(true);
    } catch {
      /* chat path still runs */
    }
    await runChat({ text: actionObj.prompt, actionObj });
  }

  function onSubmit(e) {
    e.preventDefault();
    const text = input;
    setInput("");
    runChat({ text, actionObj: null });
  }

  function clearChat() {
    setMessages([WELCOME]);
    setDataPreview(null);
    setError(null);
  }

  const ollamaOk = health?.ollama?.ok;
  const finosOk = health?.finos?.reachable;
  const resellerOk = health?.reseller?.reachable;
  const tabActions = grouped[actionTab] || [];

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
          <StatusDot ok={ollamaOk} label="Ollama" />
          <StatusDot ok={finosOk} label="finOS" />
          <StatusDot ok={resellerOk} label="Reseller" />
          <button type="button" className="ghost" onClick={clearChat} disabled={busy}>
            New chat
          </button>
          <button type="button" className="ghost" onClick={() => setPanelOpen((v) => !v)}>
            {panelOpen ? "Hide facts" : "Show facts"}
          </button>
        </div>
      </header>

      <div className={`workspace ${panelOpen ? "with-panel" : ""}`}>
        <main className="chat">
          <div className="messages">
            {messages.map((m, i) => (
              <article key={i} className={`bubble ${m.role}`}>
                <div className="bubble-label">{m.role === "user" ? "You" : "Assistant"}</div>
                <div className="bubble-body">
                  {m.role === "assistant" ? renderBody(m.content) : m.content}
                  {m.streaming ? <span className="caret" /> : null}
                </div>
                {m.action ? <div className="bubble-tag">{m.action}</div> : null}
              </article>
            ))}
            <div ref={bottomRef} />
          </div>

          {error ? <div className="banner error">{error}</div> : null}

          <section className="actions">
            <div className="action-tabs">
              {["finOS", "Reseller"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`tab ${actionTab === tab ? "on" : ""}`}
                  onClick={() => setActionTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="action-row">
              {tabActions.map((a) => (
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
          </section>

          <form className="composer" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything — or use quick actions for exact DB counts"
              disabled={busy}
              autoComplete="off"
            />
            <button type="submit" disabled={busy || !input.trim()}>
              {busy ? "…" : "Send"}
            </button>
          </form>
          <p className="footnote">Quick actions = exact DB totals (instant). Free-form chat = Qwen. Read-only.</p>
        </main>

        {panelOpen ? (
          <aside className="data-panel">
            <div className="data-panel-head">
              <h2>Facts</h2>
              <span className="muted">normalized counts</span>
            </div>
            <DataPanel preview={dataPreview} actionLabel={activeAction} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
