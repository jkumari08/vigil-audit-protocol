import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'DM Mono'", "monospace"],
        display: ["'Syne'", "sans-serif"],
      },
      colors: {
        bg: "#0A0A0B",
        surface: "#111114",
        border: "#1E1E24",
        muted: "#3A3A45",
        subtle: "#6B6B7A",
        text: "#E8E8F0",
        dim: "#9090A0",
        green: {
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
        },
        red: {
          400: "#F87171",
          500: "#EF4444",
        },
        amber: {
          400: "#FBBF24",
        },
        blue: {
          400: "#60A5FA",
          500: "#3B82F6",
        },
        violet: {
          400: "#A78BFA",
          500: "#8B5CF6",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "blink": "blink 1s step-end infinite",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        slideUp: {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
