import * as checkpoints from "../components/Checkpoint/checkpoint";
import * as usercodes from "../components/CodeBlock/persistence";

export function login() {}

export async function saveData() {
  const data = {
    checkpoints: await checkpoints.stringifyStore(),
    usercodes: await usercodes.stringifyStore(),
  };
  fetch("...", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function loadData() {
  const response = await fetch("...", {
    method: "GET",
  });
  const parsed = JSON.parse(await response.json());
  await checkpoints.parseStore(parsed.checkpoints);
  await usercodes.parseStore(parsed.usercodes);
}
