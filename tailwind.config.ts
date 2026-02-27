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
        "bg-main": "hsl(225, 10%, 14%)",
        "nav-bg": "hsl(225, 14%, 8%)",
        "card-bg": "hsl(225, 8%, 19%)",
        "text-primary": "hsl(220, 12%, 96%)",
        "accent-ink": "hsl(357, 68%, 18%)",
      },
      fontFamily: {
        sans: ["var(--font-ubuntu)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
