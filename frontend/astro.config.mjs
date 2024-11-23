import starlight from "@astrojs/starlight";
import compress from "astro-compress";
import compressor from "astro-compressor";
import purgecss from "astro-purgecss";
import robotsTxt from "astro-robots-txt";
import { defineConfig, sharpImageService } from "astro/config";
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
      favicon: "/favicon.svg",
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
        // TODO: Locales disabled until proofreading
        /*
      es: {
        label: "Español",
      },
      ca: {
        label: "Català",
      },
      */
      },
      expressiveCode: false,
    }),
    robotsTxt(),
    purgecss(),
    compress(),
    compressor(),
  ],
  image: {
    service: sharpImageService(),
  },
  build: {
    inlineStylesheets: "never",
  },
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
