"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { generateText } from "@lib/ai/client";

interface CoachingHint { text: string; type: "speed" | "filler" | "tip"; }

const FILLER_WORDS = ["えー","あの","その","まあ","えっと","あー","うーん"];

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

export function RealtimeCoach() {
  const [active, setActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [hints, setHints] = useState<CoachingHint[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fullTranscriptRef = useRef("");

  const analyzeSegment = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const fillers = FILLER_WORDS.filter(w => text.includes(w));
    const newHints: CoachingHint[] = [];

    if (fillers.length > 0) {
      newHints.push({ type: "filler", text: `フィラーワード検出: ${fillers.join(", ")}` });
    }

    const words = text.split(/\s+/).length;
    const wpm = elapsed > 0 ? Math.round((wordCount + words) / (elapsed / 60)) : 0;
    if (wpm > 180) newHints.push({ type: "speed", text: `話速が速いです (${wpm}wpm)。少しゆっくり。` });
    if (wpm > 0 && wpm < 80) newHints.push({ type: "speed", text: `話速が遅いです (${wpm}wpm)。テンポを上げましょう。` });

    if (text.length > 50) {
      try {
        const tip = await generateText(
          `発表者の発言:「${text.slice(-100)}」\n一言で改善アドバイスを日本語で。`,
          "プレゼンコーチ。15文字以内で簡潔に。"
        );
        if (tip) newHints.push({ type: "tip", text: tip });
      } catch { /* LFM unavailable */ }
    }

    if (newHints.length > 0) {
      setHints(prev => [...newHints, ...prev].slice(0, 5));
    }
    setWordCount(c => c + words);
  }, [elapsed, wordCount]);

  function startCoaching() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { setHints([{ type: "tip", text: "このブラウザは音声認識非対応です" }]); return; }
    const rec = new SR();
    rec.lang = "ja-JP"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const last = e.results[e.results.length - 1];
      const text = last[0].transcript;
      setTranscript(text);
      if (last.isFinal) { fullTranscriptRef.current += text + " "; analyzeSegment(text); }
    };
    rec.start();
    recognitionRef.current = rec;
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    setActive(true);
  }

  function stopCoaching() {
    recognitionRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setActive(false);
  }

  useEffect(() => () => { recognitionRef.current?.stop(); if (timerRef.current) clearInterval(timerRef.current); }, []);

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <h2 className="text-sm font-semibold text-gray-700">🎙️ リアルタイム AI コーチ</h2>

      <div className="flex items-center justify-between rounded-xl bg-gray-100 p-3">
        <div>
          <p className="text-xs text-gray-500">経過時間</p>
          <p className="font-mono text-lg font-bold text-gray-800">{fmt(elapsed)}</p>
        </div>
        <button
          onClick={active ? stopCoaching : startCoaching}
          className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${active ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
        >
          {active ? "⏹ 停止" : "▶ 開始"}
        </button>
      </div>

      {transcript && (
        <div className="rounded-lg bg-blue-50 p-2 text-xs text-blue-700 italic">
          "{transcript}"
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto">
        {hints.length === 0 ? (
          <p className="text-xs text-gray-400">コーチングを開始すると、ここにリアルタイムアドバイスが表示されます</p>
        ) : (
          hints.map((h, i) => (
            <div key={i} className={`rounded-lg p-2 text-xs ${
              h.type==="filler" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
              h.type==="speed" ? "bg-orange-50 text-orange-700 border border-orange-200" :
              "bg-green-50 text-green-700 border border-green-200"
            }`}>
              {h.type==="filler"?"🔤":h.type==="speed"?"⚡":"💡"} {h.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
