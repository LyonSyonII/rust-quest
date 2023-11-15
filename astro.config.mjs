import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import preact from "@astrojs/preact";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  site: "https://lyonsyonii.github.io",
  base: "/rust-quest",
  integrations: [
    starlight({
      title: "Rust Quest",
      logo: {
        src: "./src/assets/ferris.svg",
        // replacesTitle: true,
      },
      social: {
        github: "https://github.com/withastro/starlight",
      },
      sidebar: [
        {
          label: "First Steps",
          autogenerate: {
            directory: "first-steps",
          },
        },
      ],
      customCss: ["./src/styles/custom.css"],
    }),
    svelte(),
  ],
});
