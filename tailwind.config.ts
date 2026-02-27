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
        "bg-main": "hsl(200, 2%, 21%)",   /* --neutral-100 */
        "nav-bg": "hsl(200, 2%, 12%)",   /* mörkare än bg för nav-separation */
        "card-bg": "hsl(200, 2%, 30%)",  /* --neutral-90 */
        "text-primary": "hsl(200, 7%, 97%)",
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
