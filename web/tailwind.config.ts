import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        // PresentsAI Primary — Indigo
        primary: {
          50:  "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        // Surface & Neutral (Slate-based for warmth)
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F8FAFC",
          muted: "#F1F5F9",
        },
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
          focus: "#6366F1",
        },
        // Semantic text
        content: {
          primary:   "#0F172A",
          secondary: "#475569",
          tertiary:  "#94A3B8",
          disabled:  "#CBD5E1",
          inverse:   "#FFFFFF",
          link:      "#4F46E5",
        },
        // Status
        success: { DEFAULT: "#10B981", light: "#D1FAE5", dark: "#065F46" },
        warning: { DEFAULT: "#F59E0B", light: "#FEF3C7", dark: "#92400E" },
        error:   { DEFAULT: "#EF4444", light: "#FEE2E2", dark: "#991B1B" },
        info:    { DEFAULT: "#3B82F6", light: "#DBEAFE", dark: "#1E40AF" },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.05)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.10), 0 2px 4px -1px rgba(0,0,0,0.06)",
        modal: "0 20px 60px -12px rgba(0,0,0,0.18)",
        toolbar: "0 1px 0 0 #E2E8F0",
      },
      borderRadius: {
        "4": "4px",
        "6": "6px",
      },
    },
  },
  plugins: [],
};

export default config;
