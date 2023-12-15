<script lang="ts">
  import { clickoutside } from "@svelte-put/clickoutside";
  import { shortcut } from "@svelte-put/shortcut";
  import { onThemeChange } from "src/utils/onThemeChange";
  import { onDestroy, onMount } from "svelte";
  import { derived, writable } from "svelte/store";
  import { translation } from "@i18n/_CodeBlock";
  import { type Langs } from "@i18n/_langs";

  /** Id of the CodeBlock. If provided, when the output's last line is "SUCCESS", a local-storage entry will be created with this id */
  export let id: string = "";
  /** Code that will be sent to the playground, replaces __VALUE__ with the code in the editor */
  export let setup = "__VALUE__";
  /** Validator executed before the code is sent to the playground.
   *
   * If the return value is a string, it will be displayed in the editor */
  export let validator: string = "return undefined";
  export let onsuccess: string = "return undefined";
  /** Code visible in the editor */
  export let code = "";
  /** Error message in case the code doesn't compile */
  export let errorMsg = "";
  /** Placeholder in the editor when the code is empty */
  export let placeholder = "";
  /** Hide line numbers */
  export let showLineNumbers = true;
  /** If the code block is editable */
  export let editable = true;
  /** Language used by the editor */
  export let lang: Langs = "en";

  $: l = translation(lang);

  let value = code;
  let running = false;
  let focused = false;
  let playgroundResponse = "";
  const setResponse = async (response: string) => {
    const out = response.replace("SUCCESS\n", "");
    if (id && response.length !== out.length) {
      (await import("../Checkpoint/checkpoint")).add(id);
      Function("value", onsuccess)(out);
    }
    playgroundResponse = out;
  };

  const theme = writable("light");
  const getTheme = derived(theme, async ($theme) =>
    $theme === "light"
      ? (await import("../../codemirror-themes/github-light")).githubLight
      : (await import("../../codemirror-themes/github-dark")).githubDark,
  );
  let observer: MutationObserver | undefined = undefined;

  onMount(async () => {
    theme.set(document.documentElement.dataset.theme || "light");
    observer = onThemeChange((t) => theme.set(t));
    lang = window.location.pathname.split("/")[1] as Langs;
  });
  onDestroy(() => observer?.disconnect());

  const handleRun = async (force_focus = false) => {
    if (!force_focus && !focused) {
      return;
    }

    running = true;
    playgroundResponse = l.compiling;

    // Wait for the editor to update `value`
    await new Promise((resolve) => setTimeout(resolve, 125));

    const v = Function("value", validator)(value);

    if (v !== undefined) {
      running = false;
      await setResponse(v);
      return;
    }

    const code = `#![allow(warnings)] fn main() { \n${setup.replaceAll(
      "__VALUE__",
      value,
    )}\n }`;

    const { evaluate } = await import("./evaluate");

    const result = await evaluate(code, lang, errorMsg);
    await setResponse(result);
    running = false;
  };
</script>

<svelte:window
  use:shortcut={{
    trigger: { key: "Enter", modifier: ["shift"], callback: () => handleRun() },
  }}
/>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="wrapper not-content"
  use:clickoutside
  on:click={() => (focused = true)}
  on:clickoutside={() => (focused = false)}
>
  {#await Promise.all( [import("svelte-codemirror-editor"), $getTheme, import("@codemirror/lang-rust")], )}
    <pre class="not-content">{value || placeholder || l.placeholder}</pre>
  {:then [CodeMirror, theme, lang]}
    <CodeMirror.default
      class="not-content"
      bind:value
      lang={lang.rust()}
      {theme}
      basic={showLineNumbers}
      {editable}
      readonly={!editable || running}
      placeholder={placeholder || l.placeholder}
    />
  {/await}
  
  <div class="buttons">
    <button
      title="Run (Shift+Enter)"
      disabled={running}
      on:click={() => handleRun(true)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32"><path fill="currentColor" d="M21 16a6 6 0 1 1-6 6a6 6 0 0 1 6-6m0-2a8 8 0 1 0 8 8a8 8 0 0 0-8-8"/><path fill="currentColor" d="M26 4H6a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h4v-2H6V12h22V6a2 2 0 0 0-2-2M6 10V6h20v4Z"/><path fill="currentColor" d="M19 19v6l5-3z"/></svg>
    </button>
    
    <button title="Reset code" on:click={() => (value = code)}>
      <!-- carbon:reset -->
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32"><path fill="currentColor" d="M18 28A12 12 0 1 0 6 16v6.2l-3.6-3.6L1 20l6 6l6-6l-1.4-1.4L8 22.2V16a10 10 0 1 1 10 10Z"/></svg>
    </button>
  </div>

  {#if playgroundResponse}
    <output>
      <p>{playgroundResponse}</p>
    </output>
  {/if}
</div>

<style>
  :root {
    --accent: var(--sl-color-accent-high);
  }
  :root[data-theme="light"] {
    --accent: var(--sl-color-accent);
  }
  pre {
    color: gray;
    line-height: 1.4;
  }
  .wrapper {
    display: grid;
    border-radius: 6px;
    margin: 0rem;

    font-size: 0.9rem;
    grid-template-columns: minmax(0px, auto) 60px;
  }
  .buttons {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-left: var(--card-padding);
  }
  @media only screen and (min-width: 768px) {
    .wrapper {
      font-size: 1rem;
      grid-template-columns: 90% auto;
    }
  }
  button {
    background-color: rgba(0, 0, 0, 0);
    color: var(--sl-color-white);
    cursor: pointer;
    border: 0;
    margin: 0rem;
    padding: 0;
    height: fit-content;
    transition: opacity 0.25s ease;
  }
  button:disabled {
    opacity: 0.2;
  }
  output {
    font-size: 1rem;
    font-family: monospace;
    border-width: 1px;
    border-style: solid;
    border-color: color-mix(in srgb, var(--sl-color-white), transparent 90%);
    border-radius: 6px;
    padding: 1rem;
    grid-column: span 3;
    margin-top: 1rem;
    white-space: pre-line;
  }
</style>