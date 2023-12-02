<script lang="ts">
  import { rust } from "@codemirror/lang-rust";
  import Icon from "@iconify/svelte";
  import { clickoutside } from "@svelte-put/clickoutside";
  import { shortcut } from "@svelte-put/shortcut";
  import { onThemeChange } from "src/utils/onThemeChange";
  import { onDestroy, onMount } from "svelte";
  import CodeMirror from "svelte-codemirror-editor";
  import { writable } from "svelte/store";
  import { githubDark } from "../../codemirror-themes/github-dark";
  import { githubLight } from "../../codemirror-themes/github-light";
  import { translation, type Langs } from "@i18n/CodeBlock.ts";
  import "../../styles/custom.css";
  import { evaluate } from "./evaluate";

  /** Code that will be sent to the playground, replaces __VALUE__ with the code in the editor */
  export let setup = "__VALUE__";
  /** Validator executed before the code is sent to the playground.
   *
   * If the return value is a string, it will be displayed in the editor */
  export let validator: string = "(_) => undefined";
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

  const l = translation(lang);

  let value = code;
  let running = false;
  let focused = false;
  let playground_response = "";

  const theme = writable("light");
  let observer: MutationObserver | undefined = undefined;

  onMount(() => {
    theme.set(document.documentElement.dataset.theme || "light");
    observer = onThemeChange((t) => theme.set(t));
  });
  onDestroy(() => observer?.disconnect());

  const handleRun = async (force_focus = false) => {
    if (!force_focus && !focused) {
      return;
    }

    running = true;
    playground_response = l.compiling;

    // Wait for the editor to update `value`
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    const v = eval(validator)(value);
    console.log({validator, v})
    if (v !== undefined) {
      running = false;
      playground_response = v;
      return;
    }

    const code = `#![allow(warnings)] fn main() { \n${setup.replaceAll("__VALUE__", value)}\n }`;

    playground_response = await evaluate(code, lang, errorMsg);
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
  <CodeMirror
    class="not-content"
    bind:value
    lang={rust()}
    theme={$theme === "dark" ? githubDark : githubLight}
    basic={showLineNumbers}
    editable={editable && !running}
    placeholder={placeholder || l.placeholder}
  />

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

  {#if playground_response}
    <div class="response">
      <p>{playground_response}</p>
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
