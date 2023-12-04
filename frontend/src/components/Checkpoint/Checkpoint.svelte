<script lang="ts">
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";

  /** Id of the checkpoint. Will only show inside when "id" is present in LocalStorage */
  export let id: string;
  let loaded = false;
  let show = false;

  onMount(async () => {
    const { checkpointStore } = await import("./checkpoint");
    checkpointStore.subscribe(async (s) => {
        if (!s.has(id)) {
          loaded = true;
          return;
        }
        
        show = true;
        // Avoid scrolling if it's not the first time
        if (loaded) {
          loaded = false;
          await new Promise((resolve) => setTimeout(resolve, 400));
          scrollBy({top: 400, behavior: "smooth"});
          return;
        }
    });
  })
</script>

{#if show}
   <div in:fade >
     <slot />
   </div>
{/if}

<style>
  div {
    margin-top: 1.5rem;
  }
</style>