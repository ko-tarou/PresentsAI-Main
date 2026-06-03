export interface ColorToken { id: string; name: string; value: string; }
export interface TextStyleToken { id: string; name: string; fontSize: number; fontFamily: string; fontWeight: string; fill: string; }

export class DesignTokenStore {
  colors: ColorToken[] = [
    { id: "primary", name: "Primary", value: "#3B5BDB" },
    { id: "secondary", name: "Secondary", value: "#7950F2" },
    { id: "accent", name: "Accent", value: "#F59F00" },
    { id: "neutral", name: "Neutral", value: "#495057" },
  ];
  textStyles: TextStyleToken[] = [
    { id: "heading1", name: "見出し1", fontSize: 56, fontFamily: "sans-serif", fontWeight: "bold", fill: "#212529" },
    { id: "heading2", name: "見出し2", fontSize: 36, fontFamily: "sans-serif", fontWeight: "bold", fill: "#212529" },
    { id: "body", name: "本文", fontSize: 20, fontFamily: "sans-serif", fontWeight: "normal", fill: "#495057" },
    { id: "caption", name: "キャプション", fontSize: 14, fontFamily: "sans-serif", fontWeight: "normal", fill: "#868e96" },
  ];

  addColor(name: string, value: string) {
    this.colors.push({ id: `color-${Date.now()}`, name, value });
  }
  addTextStyle(style: Omit<TextStyleToken, "id">) {
    this.textStyles.push({ ...style, id: `text-${Date.now()}` });
  }
}

export const globalTokens = new DesignTokenStore();
