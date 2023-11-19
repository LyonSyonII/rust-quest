import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import preact from "@astrojs/preact";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  site: "https://garriga.dev",
  base: "/rust-quest",
  integrations: [
    starlight({
      title: "Rust Quest",
      tableOfContents: false,
      logo: {
        src: "./src/assets/ferris.svg",
        // replacesTitle: true,
      },
      social: {
        github: "https://github.com/lyonsyonii/rust-quest",
      },
      sidebar: [
        {
          label: "First Steps",
          translations: {
            es: "Primeros Pasos",
            ca: "Primeres Passes",
          },
          autogenerate: {
            directory: "first-steps",
          },
        },
      ],
      customCss: ["./src/styles/custom.css"],
      defaultLocale: "en",
      locales: {
        en: {
          label: "English",
        },
        es: {
          label: "Español",
        },
        ca: {
          label: "Català",
        },
      },
    }),
    svelte(),
  ],
});
