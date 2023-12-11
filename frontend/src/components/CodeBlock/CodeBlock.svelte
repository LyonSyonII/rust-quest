<script lang="ts">
  import Icon from "@iconify/svelte";
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

    console.log({ value, validator });
    const v = Function("value", validator)(value);
    console.log({ v });
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
    <pre>{value || placeholder || l.placeholder}</pre>
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

  <button
    class="not-content"
    title="Run (Shift+Enter)"
    disabled={running}
    on:click={() => handleRun(true)}
  >
    <Icon icon="carbon:run" width={24} />
  </button>

  <button title="Reset code" on:click={() => (value = code)}>
    <Icon icon="carbon:reset" width={24} />
  </button>

  {#if playgroundResponse}
    <div class="response">
      <p>{playgroundResponse}</p>
    </div>
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
    height: 33.4px;
    color: gray;
  }
  .wrapper {
    display: grid;
    border-radius: 6px;
    margin: 0rem;

    font-size: 0.9rem;
    grid-template-columns: 80% auto auto;
  }
  @media only screen and (min-width: 768px) {
    .wrapper {
      font-size: 1rem;
      grid-template-columns: 90% auto auto;
    }
    button {
      margin-left: 0.5rem;
    }
  }
  button {
    background-color: rgba(0, 0, 0, 0);
    color: var(--sl-color-white);
    cursor: pointer;
    border: 0px;
    margin-left: 0rem;
    padding-bottom: 0px;
    height: fit-content;
    transition: color 0.25s ease;
  }
  button:disabled {
    color: color-mix(in srgb, var(--sl-color-white), transparent 80%);
  }
  .response {
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
