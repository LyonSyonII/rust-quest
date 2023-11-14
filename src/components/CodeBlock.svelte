<script lang="ts">
  import CodeMirror from "svelte-codemirror-editor";
  import { rust } from "@codemirror/lang-rust";
  import { githubLight } from "../codemirror-themes/github-light";
  import { githubDark } from "../codemirror-themes/github-dark";
  import "../styles/custom.css";

  export let value = "";
  let running = false;

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
      code: `fn main() { ${value} }`,
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
      .then((response) => console.log(response.result))
      .catch((error) => console.log(error))
      .finally(() => (running = false));
    // .then(response => result_block.innerText = response.result)
    //.catch(error => result_block.innerText = "Playground Communication: " + error.message);
  };
</script>

<div class="wrapper not-content">
  <CodeMirror
    class="not-content"
    bind:value
    lang={rust()}
    {theme}
    basic={true}
  />
  <button disabled={running} on:click={handleRun}
    >{running ? "Running..." : "Run"}</button
  >
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
  }
  button {
    background-color: var(--accent);
    cursor: pointer;
    border: 1px solid rgba(27, 31, 35, 0.15);
    border-radius: 6px;
    padding: 0px 16px;
  }
</style>
