import { confetti } from "src/utils/confetti";
import { $ } from "src/utils/querySelector";
import { exportData, importData } from "src/utils/saveData";
import { add, removeAll, subscribe } from "../Checkpoint/checkpoint";

export class Progress extends HTMLElement {
  constructor() {
    super();

    const progress = $("progress", this);
    const label = $("label", this);
    const launchConfetti: boolean = this.dataset.confetti === "true";
    const id: string = progress.id;
    const total: number = progress.max;

    subscribe(id, async (checkpoint) => {
      const value = checkpoint.size < total ? checkpoint.size : total;
      label.innerText = `${value} / ${total}`;
      progress.value = value;
      if (value !== total) {
        return;
      }
      const completedId = `${id}-completed`;
      if (launchConfetti && !checkpoint.has(completedId)) {
        confetti();
      }
      add(completedId);
    });

    $("button#import", this).addEventListener("click", () => importData());
    $("button#export", this).addEventListener("click", async () =>
      exportData(),
    );

    const feedback = $("dialog", this);
    $("button#feedback", this).addEventListener("click", () =>
      feedback.showModal(),
    );

    if (import.meta.env.DEV) {
      $("button#reset", this).addEventListener("click", async () => {
        await removeAll(id);
        location.reload();
      });
    }
  }
}
