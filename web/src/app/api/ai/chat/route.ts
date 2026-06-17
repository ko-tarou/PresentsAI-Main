// Runs server-side only so the browser never learns the gateway URL.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Gateway base URL. The route appends "/v1/chat/completions" itself, so a
// trailing "/v1" (as shown in the README env example) is stripped to avoid a
// duplicated "/v1/v1". Any OpenAI-compatible server works (LM Studio :4242,
// Ollama's OpenAI-compat endpoint http://localhost:11434, etc.).
const GATEWAY_URL = (process.env.LLM_GATEWAY_URL ?? "http://localhost:4242")
  .replace(/\/+$/, "")
  .replace(/\/v1$/, "");

// Model name sent to the gateway. Defaults to LFM2 but is overridable so the
// same code drives a different local model (e.g. LLM_MODEL=qwen2.5:3b for
// Ollama, or llama3.2:3b) without touching source.
const MODEL = process.env.LLM_MODEL ?? "lfm2-2.6b-f16";

interface ChatBody {
  messages: { role: string; content: string }[];
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: string };
}

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!Array.isArray(body?.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages_required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const upstream = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: body.messages,
      max_tokens: body.max_tokens ?? 1024,
      temperature: body.temperature ?? 0.7,
      ...(body.response_format ? { response_format: body.response_format } : {}),
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ error: "gateway_error", status: upstream.status }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  // Pass the SSE stream straight through to the client.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
