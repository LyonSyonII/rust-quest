<script lang="ts">
  import CodeMirror from "svelte-codemirror-editor";
  import { rust } from "@codemirror/lang-rust";
  import { githubLight } from "../codemirror-themes/github-light";
  import { githubDark } from "../codemirror-themes/github-dark";
  import "../styles/custom.css";
  import { shortcut } from "@svelte-put/shortcut";
  import { clickoutside } from "@svelte-put/clickoutside";
  import Icon from "@iconify/svelte";
  import { writable } from "svelte/store";
  import { onThemeChange } from "src/utils/onThemeChange";
  import { onDestroy } from "svelte";

  /** Code that will be sent to the playground, replaces __VALUE__ with the code in the editor */
  export let setup = "__VALUE__";
  /** Code visible in the editor */
  export let code = "";
  /** Error message in case the code doesn't compile */
  export let errorMsg = 'Woops, something went wrong and the code does not compile!\n\nIf you\'ve mistakenly messed up the code, click the "Reset" button to return it back to its original state.\n\nRemember to replace ? with your answer.';
  
  const theme = writable(document.documentElement.dataset.theme);
  const observer = onThemeChange((newtheme) => {
    theme.set(newtheme);
  });
  onDestroy(() => {
    observer.disconnect()
  });

  let value = code;
  let running = false;
  let focused = false;
  let playground_response = "";

  const handleRun = async (f = false) => {
    if (!f && !focused) {
      return;
    }

    running = true;
    
    playground_response = "Compiling...";

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
    theme={$theme === "dark" ? githubDark : githubLight}
    basic={false}
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
