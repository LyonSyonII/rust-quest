import { FreeQuestion } from "./2-1";

export const question = FreeQuestion({
  code: "0 <= ?",
  correct: "Fantastic!",
  validators: [
    /^0<=-?\d+$/,
    /^-?\d+>=0$/,
  ]
});