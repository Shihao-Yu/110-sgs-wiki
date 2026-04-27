import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Classical palette — warm paper, ink, vermillion seal, liquid gold */
        paper: {
          DEFAULT: "#F2E3C0",
          deep: "#E8D5A8",
          mist: "#FAF1DC",
        },
        ink: {
          DEFAULT: "#1C140C",
          soft: "#4A3C2D",
          mute: "#7A6951",
        },
        vermillion: {
          DEFAULT: "#B23A36",
          deep: "#8B2A28",
          light: "#D04F47",
        },
        gold: {
          DEFAULT: "#B5894C",
          light: "#D4B57F",
          deep: "#8A6730",
        },
        jade: "#4A6F4F",
        night: {
          DEFAULT: "#1A1612",
          deep: "#0E0B08",
        },
        ivory: {
          DEFAULT: "#E8DDC4",
          soft: "#B8AB8E",
        },

        /* Brand maps to vermillion for backward-compat */
        brand: "#B23A36",

        /* Faction colors — re-tuned to classical hues */
        wei: "#2D3F4E", /* 玄青 */
        shu: "#B23A36", /* 朱砂 */
        wu: "#3F6F4E",  /* 苍翠 */
        qun: "#B5894C", /* 赭黄 */
        jin: "#6E3658", /* 紫绛 */
      },
      boxShadow: {
        panel:
          "0 2px 0 rgba(178, 58, 54, 0.06), 0 18px 38px -22px rgba(28, 20, 12, 0.28), 0 8px 20px -16px rgba(178, 58, 54, 0.18)",
        seal:
          "0 1px 0 rgba(178, 58, 54, 0.35), 0 0 0 1px rgba(178, 58, 54, 0.45), 0 6px 14px -6px rgba(139, 42, 40, 0.45)",
        ink:
          "0 1px 2px rgba(28, 20, 12, 0.18), 0 8px 24px -12px rgba(28, 20, 12, 0.35)",
      },
      fontFamily: {
        sans: [
          '"Noto Serif SC"',
          '"Source Han Serif SC"',
          '"Songti SC"',
          "serif",
        ],
        display: [
          '"ZCOOL XiaoWei"',
          '"Noto Serif SC"',
          '"Source Han Serif SC"',
          "serif",
        ],
        seal: [
          '"Ma Shan Zheng"',
          '"ZCOOL XiaoWei"',
          '"Noto Serif SC"',
          "serif",
        ],
        latin: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      letterSpacing: {
        seal: "0.35em",
      },
    },
  },
  plugins: [],
};

export default config;
