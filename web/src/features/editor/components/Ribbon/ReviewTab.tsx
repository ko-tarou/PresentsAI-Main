"use client";
import { SpellCheck, MessageSquare, Bot } from "lucide-react";
import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

// No comments API/spell-check backend exists yet, so this tab mirrors
// PowerPoint's structure with titled present buttons ("次のアップデートで実装").
export function ReviewTab() {
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
          icon={<MessageSquare />} label="新しいコメント"
          title="新しいコメント — 次のアップデートで実装"
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
