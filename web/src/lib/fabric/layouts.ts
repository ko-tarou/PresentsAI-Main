import type { SlideContent } from "@shared/types/slide";

export interface SlideLayout {
  id: string;
  name: string;
  content: SlideContent;
}

export const SLIDE_LAYOUTS: SlideLayout[] = [
  {
    id: "title",
    name: "タイトルスライド",
    content: {
      version: "6.0.0",
      background: "#ffffff",
      objects: [
        { type: "textbox", version: "6.0.0", left: 140, top: 260, width: 1000, fontSize: 54, fontWeight: "bold", fill: "#0F172A", textAlign: "center", text: "タイトルを入力" },
        { type: "textbox", version: "6.0.0", left: 140, top: 360, width: 1000, fontSize: 26, fill: "#475569", textAlign: "center", text: "サブタイトル" },
      ],
    },
  },
  {
    id: "title-content",
    name: "タイトルとコンテンツ",
    content: {
      version: "6.0.0",
      background: "#ffffff",
      objects: [
        { type: "textbox", version: "6.0.0", left: 80, top: 50, width: 1120, fontSize: 40, fontWeight: "bold", fill: "#0F172A", text: "タイトルを入力" },
        { type: "textbox", version: "6.0.0", left: 80, top: 150, width: 1120, fontSize: 22, fill: "#334155", text: "• 箇条書きテキスト\n• 箇条書きテキスト\n• 箇条書きテキスト" },
      ],
    },
  },
  {
    id: "two-content",
    name: "2つのコンテンツ",
    content: {
      version: "6.0.0",
      background: "#ffffff",
      objects: [
        { type: "textbox", version: "6.0.0", left: 80, top: 50, width: 1120, fontSize: 40, fontWeight: "bold", fill: "#0F172A", text: "タイトルを入力" },
        { type: "textbox", version: "6.0.0", left: 80, top: 150, width: 540, fontSize: 20, fill: "#334155", text: "• 左のコンテンツ" },
        { type: "textbox", version: "6.0.0", left: 660, top: 150, width: 540, fontSize: 20, fill: "#334155", text: "• 右のコンテンツ" },
      ],
    },
  },
  {
    id: "comparison",
    name: "比較",
    content: {
      version: "6.0.0",
      background: "#ffffff",
      objects: [
        { type: "textbox", version: "6.0.0", left: 80, top: 50, width: 1120, fontSize: 40, fontWeight: "bold", fill: "#0F172A", text: "比較" },
        { type: "textbox", version: "6.0.0", left: 80, top: 150, width: 540, fontSize: 24, fontWeight: "bold", fill: "#1E293B", text: "見出し A" },
        { type: "textbox", version: "6.0.0", left: 660, top: 150, width: 540, fontSize: 24, fontWeight: "bold", fill: "#1E293B", text: "見出し B" },
        { type: "textbox", version: "6.0.0", left: 80, top: 210, width: 540, fontSize: 18, fill: "#475569", text: "内容 A" },
        { type: "textbox", version: "6.0.0", left: 660, top: 210, width: 540, fontSize: 18, fill: "#475569", text: "内容 B" },
      ],
    },
  },
  {
    id: "title-only",
    name: "タイトルのみ",
    content: {
      version: "6.0.0",
      background: "#ffffff",
      objects: [
        { type: "textbox", version: "6.0.0", left: 80, top: 50, width: 1120, fontSize: 40, fontWeight: "bold", fill: "#0F172A", text: "タイトルを入力" },
      ],
    },
  },
  {
    id: "blank",
    name: "白紙",
    content: { version: "6.0.0", background: "#ffffff", objects: [] },
  },
];
