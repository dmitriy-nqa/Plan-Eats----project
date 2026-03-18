import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: "#f6efe4",
        almond: "#f9f4ec",
        clay: "#d48d65",
        leaf: "#7b9775",
        ink: "#2f241d",
        cocoa: "#6d574b",
        cream: "#fffaf4",
        blush: "#f2d9cb",
      },
      boxShadow: {
        shell: "0 22px 55px rgba(93, 70, 49, 0.12)",
        card: "0 14px 35px rgba(84, 62, 43, 0.1)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      backgroundImage: {
        "paper-glow":
          "radial-gradient(circle at top, rgba(255, 250, 244, 0.95), rgba(246, 239, 228, 0.92) 55%, rgba(236, 221, 207, 0.88) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
