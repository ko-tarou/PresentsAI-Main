"use client";
import { useState } from "react";
import { BarChart3, CheckCircle2, TrendingUp } from "lucide-react";
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
      <h2 className="flex items-center gap-2 text-sm font-semibold text-content-primary">
        <BarChart3 className="h-4 w-4 text-primary-600" /> 発表後レポート
      </h2>
      <button onClick={generate} disabled={loading || !transcript.trim()}
        className="btn btn-primary w-full disabled:opacity-50">
        {loading ? "分析中..." : "レポートを生成"}
      </button>
      {report && (
        <div className="space-y-3">
          <div className="rounded-xl bg-primary-50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-primary-700">総合スコア</span>
              <span className="text-2xl font-bold text-primary-700">{report.score}</span>
            </div>
            <p className="text-xs text-primary-600">{report.summary}</p>
          </div>
          {report.strengths.length > 0 && (
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-success-dark"><CheckCircle2 className="h-3.5 w-3.5" /> 良かった点</p>
              {report.strengths.map((s,i)=><p key={i} className="text-xs text-content-secondary">• {s}</p>)}
            </div>
          )}
          {report.improvements.length > 0 && (
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-warning-dark"><TrendingUp className="h-3.5 w-3.5" /> 改善点</p>
              {report.improvements.map((s,i)=><p key={i} className="text-xs text-content-secondary">• {s}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
