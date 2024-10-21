import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import svelte from "@astrojs/svelte";
import netlify from "@astrojs/netlify";
import sentry from "@sentry/astro";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: netlify(),
  integrations: [
    tailwind(),
    svelte(),
    // sentry({
    //   dsn:
    //     process.env.SENTRY_DSN ||
    //     "https://3dd6d1e46e7ea1249f102712d6b7742b@o4508102990757888.ingest.de.sentry.io/4508160313983056",
    //   sourceMapsUploadOptions: {
    //     project: "aibox",
    //     authToken: process.env.SENTRY_AUTH_TOKEN,
    //   },
    // }),
  ],
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
