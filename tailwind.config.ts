import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
        },
        border: "hsl(var(--border))",
        magic: {
          circle: "hsl(var(--magic-circle))",
          glow: "hsl(var(--magic-circle-glow))",
        },
        hp: { bar: "hsl(var(--hp-bar))" },
        timer: {
          normal: "hsl(var(--timer-normal))",
          warning: "hsl(var(--timer-warning))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "screen-shake": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(-2px, -1px)" },
          "75%": { transform: "translate(2px, 1px)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "defense-repel": {
          "0%":   { opacity: "0.65", transform: "scale(1)",    filter: "brightness(1)" },
          "25%":  { opacity: "1",    transform: "scale(1.15)", filter: "brightness(2.5)" },
          "100%": { opacity: "0",    transform: "scale(1.6)",  filter: "brightness(0.3)" },
        },
      },
      animation: {
        "screen-shake": "screen-shake 0.3s ease-in-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "defense-repel": "defense-repel 0.8s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
