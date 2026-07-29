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
        poke: {
          red: "#EE1515",
          dark: "#CC0000",
          yellow: "#FFCB05",
          blue: "#3B4CCA",
        },
      },
    },
  },
  plugins: [],
};

export default config;
