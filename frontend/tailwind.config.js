/** @type {import('tailwind').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        foreground: "#f3f4f6",
        card: "#111827",
        "card-foreground": "#f9fafb",
        border: "#1f2937",
        muted: "#1f2937",
        "muted-foreground": "#9ca3af",
        accent: "#3b82f6",
        "accent-foreground": "#ffffff",
        danger: "#ef4444",
        success: "#10b981",
        warning: "#f59e0b"
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Courier New", "monospace"],
      }
    },
  },
  plugins: [],
};
