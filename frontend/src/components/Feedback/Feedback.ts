export class FeedbackElement extends HTMLElement {
  constructor() {
    super();
    
    const dialog = this.querySelector("dialog")!;
    const form = dialog.querySelector("form")!;
    const cancel = form.querySelector("#cancel")!;
    cancel.addEventListener("click", () => dialog.close());
    const submit = form.querySelector("#submit")!;
    submit.innerHTML = "Submit";

    form.onsubmit = async () => {
      // e.preventDefault();
      const data = {
        id: form.id,
        score: parseInt((form.querySelector("#score") as HTMLInputElement).value),
        review: (
          form.querySelector("#review") as HTMLTextAreaElement
        ).value.trim(),
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