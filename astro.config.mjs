import netlify from "@astrojs/netlify";
import svelte from "@astrojs/svelte";
import sentry from "@sentry/astro";
import { defineConfig, envField } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: netlify(),
  integrations: [
    svelte(),
    sentry({
      sourceMapsUploadOptions: {
        project: import.meta.env.SENTRY_PROJECT || "aibox",
        authToken: import.meta.env.SENTRY_AUTH_TOKEN,
      },
    }),
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
  vite: {
    css: {
      transformer: "lightningcss",
    },

    plugins: [tailwindcss()],
  },
  env: {
    schema: {
      TRANSCRIPTION_API_URL: envField.string({
        context: "client",
        access: "public",
      }),
    },
  },
});
