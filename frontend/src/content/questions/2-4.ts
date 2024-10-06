import { FreeQuestion } from "./2-1";

export const question = FreeQuestion({
  code: "200 < ?",
  correct: "Correct!",
  validators: [
    /^200\<\-?\d+$/,
    /^-?\d+\>200$/,
  ]
});