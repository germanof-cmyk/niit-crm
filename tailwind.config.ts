import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-montserrat)', 'sans-serif'],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // NIIT brand tokens
        niit: {
          navy:    "#1C4061",
          dark:    "#132D46",
          deep:    "#0E2236",
          orange:  "#F7661E",
          orangeLight: "#FB8A4B",
          orangeBg: "#FEF0E8",
          surface: "#F4F6F9",
          ink:     "#1B2A3A",
          muted:   "#64748B",
          line:    "#E3E8EF",
          success: "#14A05A",
          alert:   "#DC2626",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(28,64,97,0.06), 0 1px 2px rgba(28,64,97,0.04)",
        "card-hover": "0 4px 12px rgba(28,64,97,0.10)",
        orange: "0 4px 12px rgba(247,102,30,0.35)",
        "orange-lg": "0 6px 16px rgba(247,102,30,0.40)",
      },
    },
  },
  plugins: [],
};
export default config;
