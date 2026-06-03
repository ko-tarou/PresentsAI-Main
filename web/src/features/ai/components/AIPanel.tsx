"use client";
import { useState } from "react";
import { Bot } from "lucide-react";
import { useEditorStore } from "@features/editor/stores/editorStore";
import { generateText, generateJSON } from "@lib/ai/client";
import { Textbox } from "fabric";

export function AIPanel() {
  const { canvas } = useEditorStore();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"improve"|"generate"|"outline">("improve");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function run() {
    if (!prompt.trim()) return;
    setLoading(true); setResult("");
    try {
      if (mode==="improve") {
        const r = await generateText(`以下をプレゼン向きに改善:\n${prompt}`,"プレゼン改善アシスタント。日本語で。");
        setResult(r);
      } else if (mode==="outline") {
        const r = await generateJSON<{slides:{title:string;bullets:string[]}[]}>(
          `「${prompt}」のプレゼン5スライド分アウトライン。JSON: {"slides":[{"title":"","bullets":[""]}]}`
        );
        setResult(JSON.stringify(r,null,2));
      } else {
        const r = await generateText(`「${prompt}」のスライドコンテンツを箇条書き5点で生成。日本語で。`);
        if (canvas) {
          const tb = new Textbox(r,{left:80,top:100,width:1100,fontSize:20,fill:"#212529"});
          canvas.add(tb); canvas.renderAll();
        }
        setResult(r);
      }
    } catch {
      setResult("エラー: localhost:4242 が起動していることを確認してください。");
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-content-primary">
        <Bot className="h-4 w-4 text-primary-600" /> AI アシスタント
      </h2>
      <p className="text-xs text-content-tertiary">LFM2-2.6B ローカル</p>
      <div className="flex gap-1">
        {(["improve","generate","outline"] as const).map(m=>(
          <button key={m} onClick={()=>setMode(m)} className={`flex-1 rounded-lg py-1 text-xs font-medium transition-colors ${mode===m?"bg-primary-600 text-white":"bg-surface-muted text-content-secondary hover:bg-surface-subtle"}`}>
            {m==="improve"?"改善":m==="generate"?"生成":"アウトライン"}
          </button>
        ))}
      </div>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={4}
        placeholder={mode==="outline"?"テーマを入力...":"テキストを入力..."}
        className="input flex-1 resize-none p-3 text-sm"/>
      <button onClick={run} disabled={loading||!prompt.trim()} className="btn btn-primary w-full disabled:opacity-50">
        {loading?"生成中...":"実行"}
      </button>
      {result && <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-muted p-3 text-xs text-content-secondary">{result}</div>}
    </div>
  );
}
