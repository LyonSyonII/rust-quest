<script lang="ts">
  import CodeMirror from "svelte-codemirror-editor";
  import { rust } from "@codemirror/lang-rust";
  import { githubLight } from "../codemirror-themes/github-light";
  import { githubDark } from "../codemirror-themes/github-dark";
  import "../styles/custom.css";
  import { shortcut } from "../utils/shortcut";

  export let value = "";
  export let setup = "__VALUE__";
  let running = false;
  let playground_response = "";

  const theme =
    document.documentElement.attributes.getNamedItem("data-theme")?.value ===
    "dark"
      ? githubDark
      : githubLight;
  const handleRun = () => {
    running = true;
    const params = {
      version: "stable",
      optimize: "0",
      code: `fn main() { ${setup.replace("__VALUE__", value)} }`,
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
      .then((response) => playground_response = response.result)
      .catch((error) => playground_response = error.message)
      .finally(() => {running = false; console.log(playground_response)});
  };
</script>

<div class="wrapper not-content">
  <CodeMirror
    class="not-content"
    bind:value
    lang={rust()}
    {theme}
    basic={true}
    editable={!running}
  />
  <button title="Run (Shift+Enter)" disabled={running} on:click={handleRun} use:shortcut={{shift: true, code: "Enter" }}>{running ? "Running..." : "Run"}</button>
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
    grid-template-columns: 1fr auto;
    font-size: 1rem;
    border-radius: 6px;
    margin: 1rem;
  }
  button {
    background-color: var(--accent);
    cursor: pointer;
    border: 1px solid rgba(27, 31, 35, 0.15);
    border-radius: 6px;
    padding: 0px 16px;
    margin-left: 1rem;
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
