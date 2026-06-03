"use client";
import { useState } from "react";
import { generateJSON } from "@lib/ai/client";

interface Report {
  summary: string;
  strengths: string[];
  improvements: string[];
  score: number;
}

export function PresentationReport({ transcript }: { transcript: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!transcript.trim()) return;
    setLoading(true);
    try {
      const r = await generateJSON<Report>(
        `以下の発表内容を分析してください:\n「${transcript.slice(0, 500)}」\n\nJSON形式: {"summary":"","strengths":[""],"improvements":[""],"score":0}`,
        "プレゼン評価の専門家。日本語でJSONを返してください。scoreは0-100の整数。"
      );
      setReport(r);
    } catch {
      setReport({ summary:"LFM Gateway が必要です", strengths:[], improvements:[], score:0 });
    } finally { setLoading(false); }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-sm font-semibold text-gray-700">📊 発表後レポート</h2>
      <button onClick={generate} disabled={loading || !transcript.trim()}
        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? "分析中..." : "レポートを生成"}
      </button>
      {report && (
        <div className="space-y-3">
          <div className="rounded-xl bg-blue-50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-700">総合スコア</span>
              <span className="text-2xl font-bold text-blue-700">{report.score}</span>
            </div>
            <p className="text-xs text-blue-600">{report.summary}</p>
          </div>
          {report.strengths.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-700 mb-1">✅ 良かった点</p>
              {report.strengths.map((s,i)=><p key={i} className="text-xs text-gray-600">• {s}</p>)}
            </div>
          )}
          {report.improvements.length > 0 && (
            <div>
              <p className="text-xs font-medium text-orange-700 mb-1">📈 改善点</p>
              {report.improvements.map((s,i)=><p key={i} className="text-xs text-gray-600">• {s}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
