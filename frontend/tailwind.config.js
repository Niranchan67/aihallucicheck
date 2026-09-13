/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: {
          DEFAULT: "#0c0d12",
          elevated: "#12131a",
          card: "#09090b",
          border: "rgba(255, 255, 255, 0.08)",
        },
        brand: {
          blue: "#3b82f6",
          indigo: "#6366f1",
          purple: "#8b5cf6",
          violet: "#a855f7",
          pink: "#ec4899",
        },
        verified: {
          DEFAULT: "#10b981",
          soft: "rgba(16, 185, 129, 0.12)",
          border: "rgba(16, 185, 129, 0.25)",
        },
        suspicious: {
          DEFAULT: "#f59e0b",
          soft: "rgba(245, 158, 11, 0.12)",
          border: "rgba(245, 158, 11, 0.25)",
        },
        hallucinated: {
          DEFAULT: "#ef4444",
          soft: "rgba(239, 68, 68, 0.12)",
          border: "rgba(239, 68, 68, 0.25)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
        xl: "14px",
        "2xl": "18px",
      },
      keyframes: {
        ambientGlow: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1) translate(0px, 0px)" },
          "50%": { opacity: "0.75", transform: "scale(1.05) translate(10px, -10px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "ambient-glow": "ambientGlow 8s ease-in-out infinite",
        "fade-up": "fadeUp 0.35s ease-out forwards",
        shimmer: "shimmer 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
