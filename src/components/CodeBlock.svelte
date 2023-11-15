<script lang="ts">
  import CodeMirror from "svelte-codemirror-editor";
  import { rust } from "@codemirror/lang-rust";
  import { githubLight } from "../codemirror-themes/github-light";
  import { githubDark } from "../codemirror-themes/github-dark";
  import "../styles/custom.css";
  import { shortcut } from "@svelte-put/shortcut";
  import { clickoutside } from "@svelte-put/clickoutside";
  import Icon from "@iconify/svelte";

  /** Code that will be sent to the playground, replaces __VALUE__ with the code in the editor */
  export let setup = "__VALUE__";
  /** Code in the editor */
  export let code = "";
  export let errorMsg = "";

  let value = code;
  let running = false;
  let focused = false;
  let playground_response = "";

  const handleRun = async (f = false) => {
    if (!f && !focused) {
      return;
    }

    running = true;

    // Wait for the editor to update `value`
    await new Promise((resolve) => setTimeout(resolve, 100));

    const params = {
      version: "stable",
      optimize: "0",
      code: `fn main() { ${setup.replaceAll("__VALUE__", value)} }`,
      edition: "2021",
    };

    fetch("https://play.rust-lang.org/evaluate.json", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      mode: "cors",
      body: JSON.stringify(params),
    })
      .then((response) => response.json())
      .then((response) => {
        console.log({ params, response });
        return response;
      })
      .then((response) => {
        if (response.error === null) {
          playground_response = response.result;
        } else {
          playground_response = errorMsg || response.error;
        }
      })
      .catch((error) => (playground_response = errorMsg || error.message))
      .finally(() => (running = false));
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
    theme={document.documentElement.attributes.getNamedItem("data-theme")
      ?.value === "dark"
      ? githubDark
      : githubLight}
    basic={true}
    editable={!running}
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
    grid-template-columns: 1fr auto auto;
    font-size: 1rem;
    border-radius: 6px;
    margin: 0rem;
  }
  button {
    background-color: rgba(0, 0, 0, 0);
    color: var(--sl-color-white);
    cursor: pointer;
    border: 0px;
    margin-left: 0.5rem;
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
    grid-column: span 2;
    margin-top: 1rem;
    white-space: pre-line;
  }
</style>
