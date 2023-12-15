<script lang="ts">
  import { onMount } from "svelte";
  
  export let id: string;
  export let total: number;
  export let confetti: boolean = true;
  
  let value: number = 0;
  onMount(async () => {
    const confettis = await import("confettis");
    const checkpoints = await import("./Checkpoint/checkpoint");
    checkpoints.subscribe(id, (checkpoint) => {
      value = checkpoint.size < total ? checkpoint.size : total;
      if (confetti && value === total && !checkpoint.has(`${id}-confetti`)) {
        confettis.create({
          y: 2,
        });
        checkpoints.add(`${id}-confetti`);
      }
    });
  });
</script>

<div>
  <label for={id}>{value} / {total}</label>
  <progress {id} max={total} {value} />
  {#if import.meta.env.DEV}
    <button
      on:click={async () =>
        (await import("./Checkpoint/checkpoint")).remove(id)}>Reset</button
    >
  {/if}
</div>

<style>
  div {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 2rem;
    margin-bottom: -1rem;
  }
  progress {
    margin: 0 !important;
  }
</style>
