/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: ["winter", "night"],
  },
  darkMode: ["class", '[data-theme="night"]'],
  plugins: [require("daisyui")],
};
