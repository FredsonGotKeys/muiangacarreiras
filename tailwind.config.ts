import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: "#0E0E0E",
        gold: "#C9A84C",
        "green-mc": "#1D9E75",
        "dark-800": "#1A1A1A",
        "dark-700": "#242424",
        "dark-600": "#2E2E2E",
        "gold-muted": "#A8893E",
        "gold-light": "#E8C96A",
      },
      fontFamily: {
        syne: ["var(--font-display)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        bricolage: ["var(--font-display)", "sans-serif"],
        dm: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
