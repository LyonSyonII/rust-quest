import { $ } from "src/utils/querySelector";

export class FeedbackElement extends HTMLElement {
  constructor() {
    super();

    const iframe = $("iframe", this);
    const dialog = $("dialog", this);
    const close = $("button", dialog);
    let load = 0;
    iframe.addEventListener("load", () => {
      if (load) {
        load = 0;
        iframe.src += "";
        dialog.close();
        return;
      }
      load += 1;
    });
    close.addEventListener("click", () => dialog.close());
  }
}
