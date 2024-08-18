import { stringifyStore as getCheckpoints, parseStore as setCheckpoints } from "@components/Checkpoint/checkpoint";
import { stringifyStore as getUserCodes, parseStore as setUserCodes } from "@components/CodeBlock/persistence";
import { compressToUint8Array, decompressFromUint8Array } from "lz-string";


type SaveData = {
  checkpoints: string,
  userCodes: string
};

export async function importData() {
  const input = document.createElement("input");
  input.type = "file";
  
  input.addEventListener("change", async function () {
    if (!this.files) return;
    
    const file = this.files[0];
    const data = new Uint8Array(await file.arrayBuffer());
    const json = decompressFromUint8Array(data);
    const save: SaveData = JSON.parse(json);
    
    Promise.all([setCheckpoints(save.checkpoints), setUserCodes(save.userCodes)]);
    this.remove();
    location.reload();
  });

  input.click();
}

export async function exportData() {
  const [checkpoints, userCodes] = await Promise.all([getCheckpoints(), getUserCodes()]);
  const save: SaveData = { checkpoints, userCodes };
  const json = JSON.stringify(save);
  const compressed = compressToUint8Array(json);
  
  const blob = new Blob([compressed]);
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = "RustQuest.sav";
  link.click();
}