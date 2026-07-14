import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Breakpoints finos adicionais — usar só quando sm/md/lg/xl/2xl (padrão
      // do Tailwind, já cobrindo 640/768/1024/1280/1536) não forem suficientes.
      screens: {
        "xs": "375px",
        "xs2": "390px",
        "xs3": "414px",
        "xs4": "480px",
        "3xl": "1920px",
        "4xl": "2560px",
      },
      colors: {
        primary: {
          DEFAULT: "#D20001",
          hover: "#B40001",
          active: "#9A0000",
        },
        secondary: "#ED1D1D",
        accent: "#FE0000",
        surface: {
          DEFAULT: "#FFFFFF",
          soft: "rgba(254,0,0,0.08)",
        },
        dark: "#4F0101",
        bg: {
          DEFAULT: "#FFF8F8",
          alt: "#FFF1F1",
        },
        ink: {
          900: "#2A0001",
          700: "#8A6363",
          300: "#C9A8A8",
        },
        success: "#D20001",
        info: "#FE0000",
        warning: "#F4B740",
        danger: "#C81E5C",
      },
      fontFamily: {
        syne: ["var(--font-display)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        bricolage: ["var(--font-display)", "sans-serif"],
        dm: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        md: "0.875rem",
        lg: "1.125rem",
        xl: "1.125rem",
      },
      boxShadow: {
        card: "0 10px 40px rgba(0,0,0,0.05)",
        primary: "0 8px 24px rgba(210,0,1,0.20)",
      },
    },
  },
  plugins: [],
};
export default config;
