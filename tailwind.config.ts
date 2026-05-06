import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0B0D10",
          subtle: "#11141A",
          card: "#161A22",
        },
        border: {
          DEFAULT: "#1F2530",
          strong: "#2A3140",
        },
        ink: {
          DEFAULT: "#E6EAF2",
          muted: "#8B93A7",
          dim: "#5A6275",
        },
        brand: {
          DEFAULT: "#7C5CFF",
          hover: "#8E72FF",
          subtle: "#1A1530",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
