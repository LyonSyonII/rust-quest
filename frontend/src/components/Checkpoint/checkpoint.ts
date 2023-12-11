import {
  writable
} from "@macfja/svelte-persistent-store";

const checkpointStore = writable("checkpoints", new Map<string, Set<string>>());

export function add(id: string) {
  const k = id.split("-")[0];
  if (k === undefined) {
    throw "Invalid id";
  }

  checkpointStore.update((checkpoints) => {
    const checkpoint = checkpoints.get(k);
    if (checkpoint === undefined) {
      checkpoints.set(k, new Set([id]));
    } else {
      checkpoint.add(id);
    }
    return checkpoints;
  });
}

export function subscribe(id: string, run: (checkpoint: Set<string>) => void) {
    const k = id.split("-")[0];
    if (k === undefined) {
        throw "Invalid id";
    }
    checkpointStore.update(checkpoints => 
        !checkpoints.has(k) && checkpoints.set(k, new Set([])) || checkpoints
    );
    checkpointStore.subscribe((checkpoints) => {
        run(checkpoints.get(k) as Set<string>)
    })
}