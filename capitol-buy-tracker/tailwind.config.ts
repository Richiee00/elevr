import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        panel: "#141414",
        panel2: "#1b1b1b",
        line: "#2a2a2a",
        ink: "#f2f2f2",
        muted: "#a3a3a3",
        faint: "#6b6b6b",
        up: "#22c55e",
        down: "#ef4444",
        near: "#facc15",
        link: "#60a5fa",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
