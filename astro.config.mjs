import { defineConfig } from "astro/config";
// import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";
import awsAmplify from "astro-aws-amplify";
import svelte from "@astrojs/svelte";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: netlify(),
  integrations: [tailwind(), svelte()],
  devToolbar: {
    enabled: false
  }
});