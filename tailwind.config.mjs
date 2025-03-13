/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,svg}"],
  theme: {
    fontFamily: {
      sans: [
        "Inter",
        "ui-sans-serif",
        "system-ui",
        "sans-serif",
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ],
      serif: [
        "ui-serif",
        "Georgia",
        "Cambria",
        '"Times New Roman"',
        "Times",
        "serif",
      ],
      mono: [
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Monaco",
        "Consolas",
        '"Liberation Mono"',
        '"Courier New"',
        "monospace",
      ],
    },
    extend: {
      backgroundImage: {
        "blue-design": "url('/img/aibox-login-background.svg')",
      },
      keyframes: {
        "slide-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-out": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        typing: {
          "0%": {
            width: "0%",
            visibility: "hidden",
          },
          "50%": {
            width: "100%",
          },
        },
        blink: {
          "0%": {
            borderColor: "transparent",
          },
          "50%": {
            borderColor: "white",
          },
        },
      },
      animation: {
        "slide-in": "slide-in 0.5s ease-in-out forwards",
        "slide-out": "slide-out 0.5s ease-in-out forwards",
        typing: "typing 2s steps(10) infinite alternate, blink .7s infinite",
      },
    },
  },
  darkMode: "selector",
  plugins: [require("@tailwindcss/typography")],
};
