import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import { visualizer } from "rollup-plugin-visualizer";
import compress from "astro-compress";
import robotsTxt from "astro-robots-txt";
import webmanifest from "astro-webmanifest";

// https://astro.build/config
export default defineConfig({
  site: "https://rust-quest.com",
  /* base: "/rust-quest", */
  integrations: [
    starlight({
      title: "Rust Quest",
      tableOfContents: false,
      logo: {
        src: "./src/assets/ferris.svg",
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
    // TODO: Does not work at the moment
    // https://github.com/alextim/astro-lib/tree/main/packages/astro-webmanifest
    /* webmanifest({
      name: "Rust Quest",
      icon: "src/assets/ferris.svg",
      short_name: "Rust Quest",
      description: "Learn programming in a new way!",
      start_url: "/",
      display: "standalone"
    }), */
    compress(),
    robotsTxt(),
  ],
  vite: {
    plugins: [visualizer()],
  },
  markdown: {
    remarkPlugins: [],
  },
});
