<script lang="ts">
  import CodeMirror from "svelte-codemirror-editor";
  import { rust } from "@codemirror/lang-rust";
  import { githubLight } from "../codemirror-themes/github-light";
  import { githubDark } from "../codemirror-themes/github-dark";
  import "../styles/custom.css";

  export let value = "";
  const theme = document.documentElement.attributes.getNamedItem("data-theme")?.value ===
    "dark"
      ? githubDark
      : githubLight;

</script>

<div class="wrapper not-content">
  <CodeMirror
    class="not-content"
    bind:value
    lang={rust()}
    {theme}
    basic={true}
  />
  <button class="action primary">Run</button>
</div>

<style>
  .wrapper {
    display: grid;
    grid-template-columns: 1fr auto;
    font-size: 1rem;
  }
  button {
    background-color: var(--sl-color-accent-high);
  }
  /* button {
    appearance: none;
    background-color: #fff;
    border: 1px solid rgba(27, 31, 35, 0.15);
    border-radius: 6px;
    box-shadow:
      rgba(27, 31, 35, 0.04) 0 1px 0,
      rgba(255, 255, 255, 0.25) 0 1px 0 inset;
    box-sizing: border-box;
    color: #24292e;
    cursor: pointer;
    display: inline-block;
    font-family: -apple-system, system-ui, "Segoe UI", Helvetica, Arial,
      sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    font-size: 1rem;
    font-weight: 500;
    line-height: 20px;
    list-style: none;
    padding: 6px 16px;
    position: relative;
    transition: background-color 0.2s cubic-bezier(0.3, 0, 0.5, 1);
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    vertical-align: middle;
    white-space: nowrap;
    word-wrap: break-word;
  }

  button:hover {
    background-color: var(--sl-color-gray-7);
    text-decoration: none;
    transition-duration: 0.1s;
  }
  
  button:disabled {
    background-color: var(--sl-color-gray-6);
    border-color: rgba(27, 31, 35, 0.15);
    color: #959da5;
    cursor: default;
  }

  button:active {
    background-color: var(--sl-color-gray-6);
    box-shadow: rgba(225, 228, 232, 0.2) 0 1px 0 inset;
    transition: none 0s;
  }

  button:focus {
    outline: 1px transparent;
  }

  button:before {
    display: none;
  }

  button:-webkit-details-marker {
    display: none;
  } */
</style>
