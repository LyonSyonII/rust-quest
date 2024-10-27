import { $ } from "src/utils/querySelector";

export class FeedbackElement extends HTMLElement {
  constructor() {
    super();

    const dialog = $("dialog", this);
    const form = $("form", dialog);
    const cancel = $("#cancel", form);
    cancel.addEventListener("click", () => dialog.close());
    const submit = $("#submit", form);
    submit.innerHTML = "Submit";
    
    // TODO: Fix feedbacker
    form.onsubmit = async () => {
      // e.preventDefault();
      const data = {
        id: form.id,
        score: Number.parseInt($("input#score", form).value),
        review: $("textarea#review", form).value.trim(),
      };

      await fetch("http://rust-quest.garriga.dev", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      dialog.close();
    };
  }
}
