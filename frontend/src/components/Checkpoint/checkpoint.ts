import { writable } from "@macfja/svelte-persistent-store";

export const checkpointStore = writable("checkpoints", new Set<string>());

