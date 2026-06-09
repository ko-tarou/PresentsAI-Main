"use client";
import { SpellCheck, MessageSquare, Bot } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

// The comment button toggles the presentation-level comments panel. Both the
// スペルチェック and AI チェック buttons open the ProofreadPanel, which runs the
// slide text through the LFM2 gateway for誤字脱字・表現の提案.
export function ReviewTab() {
  const showComments = useEditorStore((s) => s.showComments);
  const toggleComments = useEditorStore((s) => s.toggleComments);
  const showProofread = useEditorStore((s) => s.showProofread);
  const toggleProofread = useEditorStore((s) => s.toggleProofread);
  return (
    <div className="flex h-full items-stretch">
      <RibbonGroup label="文章校正">
        <RibbonBigButton
          icon={<SpellCheck />} label="スペルチェック"
          active={showProofread} onClick={toggleProofread}
          title="AI 校正パネルを開く（誤字脱字・表現の提案）"
        />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="コメント">
        <RibbonBigButton
          icon={<MessageSquare />} label="コメント"
          active={showComments} onClick={toggleComments}
          title="コメントパネルを開く"
        />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="AI 校正">
        <RibbonBigButton
          icon={<Bot />} label="AI チェック"
          active={showProofread} onClick={toggleProofread}
          title="AI チェック — スライドの誤字脱字・表現を AI が校正"
        />
      </RibbonGroup>
    </div>
  );
}
