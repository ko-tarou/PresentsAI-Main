"use client";
import { Type } from "lucide-react";
import { useEditorStore } from "../../stores/editorStore";
import { addText } from "@lib/fabric/tools/text";
import { TableButton } from "../Toolbar/TableButton";
import { ImageUploadButton } from "../Toolbar/ImageUploadButton";
import { ShapeToolbar } from "../Toolbar/ShapeToolbar";
import { ChartButton } from "../Toolbar/ChartButton";
import { TemplatePanel } from "../Toolbar/TemplatePanel";
import { ComponentPanel } from "../Toolbar/ComponentPanel";
import { RibbonGroup, RibbonDivider, RibbonBigButton } from "./ribbonPrimitives";

export function InsertTab() {
  const { canvas } = useEditorStore();

  return (
    <div className="flex h-full items-stretch">
      <RibbonGroup label="表">
        <TableButton />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="画像">
        <ImageUploadButton />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="図形">
        <ShapeToolbar />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="グラフ">
        <ChartButton />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="テキスト">
        <RibbonBigButton
          icon={<Type />} label="テキストボックス"
          onClick={() => canvas && addText(canvas)}
          disabled={!canvas}
        />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="テンプレート">
        <TemplatePanel />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup label="コンポーネント">
        <ComponentPanel />
      </RibbonGroup>
    </div>
  );
}
