import OpenAI from "openai";
const client = new OpenAI({
  baseURL: typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_LLM_GATEWAY_URL ?? "http://localhost:4242/v1")
    : "http://localhost:4242/v1",
  apiKey: "local",
  dangerouslyAllowBrowser: true,
});
export async function generateText(prompt: string, system?: string): Promise<string> {
  const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (system) msgs.push({ role:"system", content:system });
  msgs.push({ role:"user", content:prompt });
  const res = await client.chat.completions.create({ model:"lfm2-2.6b-f16", messages:msgs, max_tokens:1024, temperature:0.7 });
  return res.choices[0]?.message?.content ?? "";
}
export async function generateJSON<T>(prompt: string, system?: string): Promise<T> {
  const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (system) msgs.push({ role:"system", content:system });
  msgs.push({ role:"user", content:prompt });
  const res = await client.chat.completions.create({ model:"lfm2-2.6b-f16", messages:msgs, max_tokens:2048, temperature:0.3, response_format:{type:"json_object"} });
  return JSON.parse(res.choices[0]?.message?.content ?? "{}") as T;
}
