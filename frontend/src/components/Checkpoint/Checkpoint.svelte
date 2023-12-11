<script lang="ts">
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";

  /** Id of the checkpoint.
   *
   * The children of this component will only be shown when "id" is present in LocalStorage. */
  export let id: string;
  export let scroll: boolean = true;
  let loaded = false;
  let show = false;

  onMount(async () => {
    const checkpointStore = await import("./checkpoint");
    checkpointStore.subscribe(id, async (s) => {
      if (!s.has(id)) {
        loaded = true;
        return;
      }

      show = true;
      // Avoid scrolling if it's not the first time
      if (loaded) {
        loaded = false;
        await new Promise((resolve) => setTimeout(resolve, 400));
        scroll && scrollBy({ top: 400, behavior: "smooth" });
        return;
      }
    });
  });
</script>

{#if show}
  <div in:fade>
    <slot />
  </div>
{/if}

<style>
  div:first-child {
    margin-top: 1.5rem;
  }
</style>
