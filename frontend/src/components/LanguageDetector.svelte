<script>
  import { onMount } from "svelte";
  import { langs } from "src/utils/langs";

  onMount(() => {
    const preferred = navigator.languages;
    for (const l of preferred) {
      if (Object.keys(langs).includes(l)) {
        console.log({
          base: import.meta.env.BASE_URL,
          location: window.location,
          origin: window.location.origin,
        });
        window.location.href =
          window.location.origin + import.meta.env.BASE_URL + `${l}`;
        break;
      }
    }
  });
</script>
