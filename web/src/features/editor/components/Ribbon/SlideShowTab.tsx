"use client";
import { useRouter } from "next/navigation";
import { Play, PlayCircle, Monitor, Timer } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

export function SlideShowTab() {
  const router = useRouter();
  const { presentationId } = useEditorStore();

  function present() {
    if (presentationId) router.push(`/present/${presentationId}`);
  }

  return (
    <div className="flex h-full items-stretch">
      <RibbonGroup label="スライドショーの開始">
        <RibbonBigButton
          icon={<Play />} label="最初から"
          onClick={present} disabled={!presentationId}
          title="最初からスライドショーを開始"
        />
        <RibbonBigButton
          icon={<PlayCircle />} label="現在のスライドから"
          onClick={present} disabled={!presentationId}
          title="現在のスライドからスライドショーを開始"
        />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="設定">
        <RibbonBigButton
          icon={<Monitor />} label="発表者ビュー"
          onClick={present} disabled={!presentationId}
          title="発表者ビューで開始"
        />
        <RibbonBigButton
          icon={<Timer />} label="タイマー"
          title="リハーサルタイマー — 次のアップデートで実装"
        />
      </RibbonGroup>
    </div>
  );
}
