// Browser-side AI client. Calls the in-app BFF (/api/ai/chat) which proxies
// to the LFM Gateway server-side. The browser never sees the gateway URL.

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: Message[];
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: string };
}

/**
 * POSTs to the BFF and consumes the SSE stream, invoking onToken for each
 * incremental delta. Returns the fully aggregated text.
 */
async function streamChat(
  req: ChatRequest,
  onToken?: (delta: string) => void,
): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok || !res.body) {
    throw new Error(`AI request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by double newlines; each line is "data: ...".
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "" || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const delta: string = json.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          full += delta;
          onToken?.(delta);
        }
      } catch {
        // Ignore non-JSON keep-alive lines.
      }
    }
  }

  return full;
}

export async function generateText(
  prompt: string,
  system?: string,
  onToken?: (delta: string) => void,
): Promise<string> {
  const messages: Message[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });
  return streamChat({ messages, max_tokens: 1024, temperature: 0.7 }, onToken);
}

export async function generateJSON<T>(prompt: string, system?: string): Promise<T> {
  const messages: Message[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });
  const text = await streamChat({
    messages,
    max_tokens: 2048,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });
  return JSON.parse(text || "{}") as T;
}
