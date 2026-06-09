"use client";
import { SpellCheck, MessageSquare, Bot, Users } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

// Spell-check / AI proofreading have no backend yet, so those stay as titled
// "次のアップデートで実装" placeholders. The comment button is wired to the
// presentation-level comments panel (toggles the side panel). The members
// button toggles the in-editor roster / role-management panel.
export function ReviewTab() {
  const showComments = useEditorStore((s) => s.showComments);
  const toggleComments = useEditorStore((s) => s.toggleComments);
  const showMembers = useEditorStore((s) => s.showMembers);
  const toggleMembers = useEditorStore((s) => s.toggleMembers);
  return (
    <div className="flex h-full items-stretch">
      <RibbonGroup label="文章校正">
        <RibbonBigButton
          icon={<SpellCheck />} label="スペルチェック"
          title="スペルチェック — 次のアップデートで実装"
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
          title="AI チェック — 次のアップデートで実装"
        />
      </RibbonGroup>
    </div>
  );
}
