import starlight from "@astrojs/starlight";
import compress from "astro-compress";
import compressor from "astro-compressor";
import purgecss from "astro-purgecss";
import robotsTxt from "astro-robots-txt";
import { defineConfig } from "astro/config";
import { MagicRegExpTransformPlugin } from "magic-regexp/transform";
import { visualizer } from "rollup-plugin-visualizer";

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
        // TODO: Add Ko-Fi or Patreon
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
    purgecss(),
    compressor(),
  ],
  vite: {
    plugins: [visualizer(), MagicRegExpTransformPlugin.vite()],
  },
  markdown: {
    remarkPlugins: [],
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  experimental: {
    clientPrerender: true,
    contentCollectionCache: false,
  },
});
