"use client";
import { SpellCheck, MessageSquare, Bot, History, Users } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

// The comment button toggles the presentation-level comments panel; the history
// button toggles the per-slide version history panel; the members button toggles
// the in-editor roster / role-management panel. Both the スペルチェック and
// AI チェック buttons open the ProofreadPanel, which runs the slide text through
// the LFM2 gateway for 誤字脱字・表現の提案.
export function ReviewTab() {
  const showComments = useEditorStore((s) => s.showComments);
  const toggleComments = useEditorStore((s) => s.toggleComments);
  const showVersions = useEditorStore((s) => s.showVersions);
  const toggleVersions = useEditorStore((s) => s.toggleVersions);
  const showMembers = useEditorStore((s) => s.showMembers);
  const toggleMembers = useEditorStore((s) => s.toggleMembers);
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

      <RibbonGroup label="履歴">
        <RibbonBigButton
          icon={<History />} label="バージョン履歴"
          active={showVersions} onClick={toggleVersions}
          title="このスライドのバージョン履歴を開く"
        />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="共有">
        <RibbonBigButton
          icon={<Users />} label="メンバー"
          active={showMembers} onClick={toggleMembers}
          title="メンバーと権限パネルを開く"
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
