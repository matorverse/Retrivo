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
        calm: {
          bg: "var(--color-bg)",
          surface: "var(--color-surface)",
          "surface-muted": "var(--color-surface-muted)",
          primary: "var(--color-primary)",
          "primary-hover": "var(--color-primary-hover)",
          "primary-tint": "var(--color-primary-tint)",
          secondary: "var(--color-secondary)",
          "secondary-tint": "var(--color-secondary-tint)",
          text: "var(--color-text-primary)",
          "text-muted": "var(--color-text-secondary)",
          "text-subtle": "var(--color-text-muted)",
          border: "var(--color-border)",
          "border-strong": "var(--color-border-strong)",
          success: "var(--color-success)",
          "success-tint": "var(--color-success-tint)",
          warning: "var(--color-warning)",
          "warning-tint": "var(--color-warning-tint)",
          danger: "var(--color-danger)",
          "danger-tint": "var(--color-danger-tint)",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-jakarta)", "var(--font-dm-sans)", "sans-serif"],
        serif: ["var(--font-jakarta)", "sans-serif"],
      },
      borderRadius: {
        calm: "12px",
        "calm-lg": "16px",
        "calm-sm": "8px",
      },
    },
  },
  plugins: [],
};
export default config;
