import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import svelte from "@astrojs/svelte";
import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: netlify(),
  integrations: [tailwind(), svelte()],
  security: {
    checkOrigin: true,
  },
  devToolbar: {
    enabled: false,
  },
  i18n: {
    defaultLocale: "en",
    // locales: ["de", "de-DE", "de-CH", "de-DE", "de-AT", "de-LI", "de-LU", "en"],
    locales: [
      "en",
      {
        path: "de",
        codes: ["de", "de-DE", "de-CH", "de-DE", "de-AT", "de-LI", "de-LU"],
      },
    ],
    routing: "manual",
  },
  redirects: {
    "/login": "/", // old login page
  },
});
