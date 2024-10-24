import { FreeQuestion } from "./2-1";

export const question = FreeQuestion({
  code: "200 > ?",
  correct: "Perfect!",
  validators: [
    /^200>\-?\d+$/,
    /^-?\d+<200$/,
  ]
});