import { add, removeAll as removeAllCheckpoints, subscribe } from "src/persistence/checkpoint";
import { removeAll as removeAllUserCodes } from "src/persistence/codeBlock";
import { exportDataToFile, exportDataToURI, importDataFromFile } from "src/persistence/saveData";
import { confetti } from "src/utils/confetti";
import { $ } from "src/utils/querySelector";

export class Progress extends HTMLElement {
  constructor() {
    super();

    const progress = $("progress", this);
    const label = $("label", this);
    const launchConfetti: boolean = this.dataset.confetti === "true";
    const id: string = progress.id;
    const total: number = progress.max;

    subscribe(
      id,
      async (checkpoint) => {
        const value = checkpoint.size < total ? checkpoint.size : total;
        label.innerText = `${value} / ${total}`;
        progress.value = value;
        if (value !== total) {
          return;
        }
        const completedId = `${id}-completed`;
        if (launchConfetti && !checkpoint.has(completedId)) {
          confetti({ x: 0.5, y: 1, count: 180 });
        }
        add(completedId);

        // exportDataToURI();
      },
      true,
    );

    $("button#import", this).addEventListener("click", () => importDataFromFile());
    $("button#export", this).addEventListener("click", () => exportDataToFile());

    const feedback = $("dialog", this);
    $("button#feedback", this).addEventListener("click", () => feedback.showModal());

    if (import.meta.env.DEV) {
      $("button#reset", this).addEventListener("click", async () => {
        await removeAllCheckpoints(id);
        await removeAllUserCodes(id);
        location.reload();
      });
    }
  }
}
