import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#DC2626",
        wei: "#2563EB",
        shu: "#DC2626",
        wu: "#16A34A",
        qun: "#CA8A04",
        jin: "#9333EA",
      },
      boxShadow: {
        panel:
          "0 20px 45px -24px rgba(15, 23, 42, 0.35), 0 10px 24px -18px rgba(220, 38, 38, 0.24)",
      },
      fontFamily: {
        sans: ["Noto Sans SC", "PingFang SC", "Microsoft YaHei", "sans-serif"],
        display: ["Noto Serif SC", "Source Han Serif SC", "Songti SC", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
