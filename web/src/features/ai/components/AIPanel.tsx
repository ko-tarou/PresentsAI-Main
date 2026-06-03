"use client";
import { useState } from "react";
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
      <h2 className="text-sm font-semibold text-gray-700">🤖 AI アシスタント</h2>
      <p className="text-xs text-gray-400">LFM2-2.6B ローカル</p>
      <div className="flex gap-1">
        {(["improve","generate","outline"] as const).map(m=>(
          <button key={m} onClick={()=>setMode(m)} className={`flex-1 rounded py-1 text-xs font-medium ${mode===m?"bg-blue-600 text-white":"bg-gray-100 text-gray-600"}`}>
            {m==="improve"?"改善":m==="generate"?"生成":"アウトライン"}
          </button>
        ))}
      </div>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={4}
        placeholder={mode==="outline"?"テーマを入力...":"テキストを入力..."}
        className="flex-1 rounded-lg border p-3 text-sm resize-none focus:border-blue-500 focus:outline-none"/>
      <button onClick={run} disabled={loading||!prompt.trim()} className="rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {loading?"生成中...":"実行"}
      </button>
      {result && <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700 max-h-40 overflow-y-auto whitespace-pre-wrap">{result}</div>}
    </div>
  );
}
