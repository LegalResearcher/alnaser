/**
 * Alnasser Tech Digital Solutions
 * Tailwind CSS Configuration — Version 2.0 (World-Class Upgrade)
 */
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1400px" },
    },
    extend: {

      // ── خطوط ──
      fontFamily: {
        cairo:   ['Cairo', 'sans-serif'],
        tajawal: ['Tajawal', 'sans-serif'],
      },

      // ── ألوان ──
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50:  "hsl(217 91% 97%)",
          100: "hsl(217 91% 93%)",
          200: "hsl(217 91% 85%)",
          300: "hsl(217 91% 75%)",
          400: "hsl(217 91% 65%)",
          500: "hsl(217 91% 57%)",
          600: "hsl(217 91% 48%)",
          700: "hsl(217 91% 40%)",
          800: "hsl(217 91% 30%)",
          900: "hsl(217 91% 20%)",
          950: "hsl(217 91% 12%)",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT:    "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        level: {
          1: "hsl(var(--level-1))",
          2: "hsl(var(--level-2))",
          3: "hsl(var(--level-3))",
          4: "hsl(var(--level-4))",
        },
      },

      // ── Border Radius ──
      borderRadius: {
        sm:   "calc(var(--radius) - 4px)",
        md:   "calc(var(--radius) - 2px)",
        lg:   "var(--radius)",
        xl:   "calc(var(--radius) + 4px)",
        "2xl":"calc(var(--radius) + 8px)",
        "3xl":"calc(var(--radius) + 16px)",
        "4xl":"calc(var(--radius) + 28px)",
      },

      // ── Spacing إضافي ──
      spacing: {
        "18":  "4.5rem",
        "22":  "5.5rem",
        "26":  "6.5rem",
        "30":  "7.5rem",
        "88":  "22rem",
        "100": "25rem",
        "112": "28rem",
        "120": "30rem",
        "128": "32rem",
      },

      // ── Typography ──
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
        "xs":  ["0.75rem", { lineHeight: "1.1rem" }],
        "display-sm": ["2rem",   { lineHeight: "1.2", fontWeight: "900" }],
        "display-md": ["2.75rem",{ lineHeight: "1.15", fontWeight: "900" }],
        "display-lg": ["3.5rem", { lineHeight: "1.1", fontWeight: "900" }],
        "display-xl": ["4.5rem", { lineHeight: "1.05", fontWeight: "900" }],
      },

      // ── Shadows مخصصة ──
      boxShadow: {
        "card":      "0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        "card-md":   "0 4px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.05)",
        "hover":     "0 12px 40px rgba(59,130,246,0.14), 0 4px 16px rgba(0,0,0,0.08)",
        "glow":      "0 0 60px rgba(59,130,246,0.2)",
        "glow-sm":   "0 0 30px rgba(59,130,246,0.15)",
        "glow-lg":   "0 0 100px rgba(59,130,246,0.25)",
        "deep":      "0 24px 64px rgba(0,0,0,0.12)",
        "primary":   "0 4px 24px hsl(217 91% 57% / 0.35), 0 2px 8px rgba(0,0,0,0.15)",
        "primary-lg":"0 8px 40px hsl(217 91% 57% / 0.45), 0 4px 16px rgba(0,0,0,0.2)",
        "inner-glow":"inset 0 0 30px rgba(59,130,246,0.08)",
        "dark-card": "0 2px 16px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)",
      },

      // ── Backdrop Blur ──
      backdropBlur: {
        xs:  "2px",
        sm:  "4px",
        DEFAULT: "8px",
        md:  "12px",
        lg:  "16px",
        xl:  "24px",
        "2xl":"32px",
      },

      // ── أنيميشن ──
      transitionDuration: {
        "250":  "250ms",
        "350":  "350ms",
        "400":  "400ms",
        "600":  "600ms",
        "800":  "800ms",
        "1200": "1200ms",
        "2000": "2000ms",
      },
      transitionTimingFunction: {
        "spring":   "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth":   "cubic-bezier(0.16, 1, 0.3, 1)",
        "snappy":   "cubic-bezier(0.2, 0, 0, 1)",
        "bounce":   "cubic-bezier(0.34, 1.4, 0.64, 1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%":   { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.88)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "blur-in": {
          "0%":   { opacity: "0", filter: "blur(10px)", transform: "scale(1.03)" },
          "100%": { opacity: "1", filter: "blur(0)",   transform: "scale(1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(217 91% 57% / 0.3)" },
          "50%":      { boxShadow: "0 0 50px hsl(217 91% 57% / 0.6)" },
        },
        "shimmer": {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "ping-sm": {
          "0%":     { transform: "scale(1)",    opacity: "1" },
          "75%,100%":{ transform: "scale(1.6)", opacity: "0" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.55s cubic-bezier(0.16,1,0.3,1) both",
        "slide-up":       "slide-up 0.65s cubic-bezier(0.16,1,0.3,1) both",
        "slide-down":     "slide-down 0.55s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in":       "scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        "blur-in":        "blur-in 0.65s cubic-bezier(0.16,1,0.3,1) both",
        "float":          "float 3.5s ease-in-out infinite",
        "pulse-glow":     "pulse-glow 2.5s ease-in-out infinite",
        "shimmer":        "shimmer 2.2s ease-in-out infinite",
        "spin-slow":      "spin-slow 12s linear infinite",
        "ping-sm":        "ping-sm 1.5s cubic-bezier(0,0,0.2,1) infinite",
        "count-up":       "count-up 0.4s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
