const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function fetchActions() {
  const res = await fetch(`${API_BASE}/api/actions`);
  if (!res.ok) throw new Error("Failed to load actions");
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function fetchData(action, params = null) {
  const res = await fetch(`${API_BASE}/api/data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });
  if (!res.ok) throw new Error("Data fetch failed");
  return res.json();
}

/**
 * Stream chat via SSE-style events from POST /api/chat/stream
 */
export async function streamChat({ message, history, action, params, onMeta, onToken, onDone, onError }) {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ message, history, action, params, stream: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Chat failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() || "";

    for (const line of parts) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
        continue;
      }
      if (line.startsWith("data:")) {
        const raw = line.slice(5).trim();
        try {
          const data = JSON.parse(raw);
          if (eventName === "meta" && onMeta) onMeta(data);
          else if (eventName === "token" && onToken) onToken(data.token || "");
          else if (eventName === "done" && onDone) onDone();
          else if (eventName === "error" && onError) onError(data.error || "Stream error");
        } catch {
          /* ignore parse errors for keep-alives */
        }
        eventName = "message";
      }
    }
  }
}
