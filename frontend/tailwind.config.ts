import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./test-utils/**/*.{js,ts,jsx,tsx}",
    "./tests/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        ink: "#111418",
        sand: "#efe5d6",
        ember: "#b65230",
        mist: "#dbe5ef",
        stone: "#f6f1e8",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)"],
        serif: ["var(--font-instrument-serif)"],
        body: ["var(--font-space-grotesk)"],
      },
      boxShadow: {
        line: "0 0 0 1px rgba(17, 20, 24, 0.1)",
      },
      backgroundImage: {
        mesh:
          "radial-gradient(circle at top left, rgba(239,229,214,0.95), transparent 42%), radial-gradient(circle at 85% 10%, rgba(220,93,48,0.16), transparent 28%), linear-gradient(180deg, rgba(219,229,239,0.24), transparent 48%)",
      },
    },
  },
  plugins: [],
};

export default config;
