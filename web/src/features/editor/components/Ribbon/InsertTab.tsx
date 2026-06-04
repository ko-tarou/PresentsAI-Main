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

  // Each insert item renders its own big labeled button (PowerPoint style),
  // so the RibbonGroup caption is omitted to avoid a redundant double label.
  return (
    <div className="flex h-full items-stretch">
      <RibbonGroup>
        <TableButton />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup>
        <ImageUploadButton />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup>
        <ShapeToolbar />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup>
        <ChartButton />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup>
        <RibbonBigButton
          testId="insert-text"
          icon={<Type />} label="テキスト"
          onClick={() => canvas && addText(canvas)}
          disabled={!canvas}
        />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup>
        <TemplatePanel />
      </RibbonGroup>
      <RibbonDivider />

      <RibbonGroup>
        <ComponentPanel />
      </RibbonGroup>
    </div>
  );
}
