import { FreeQuestion } from "./2-1";
import { mc, mo } from "./CodeQuestion";

export const question = FreeQuestion({
  code: `0 <= ${mo}?${mc}`,
  solution: `0 <= ${mo}10${mc}`,
  correct: "Fantastic!",
  validators: [/^0<=-?\d+$/, /^-?\d+>=0$/],
  preprocess: (code) => code.replace("0 <=", "0i128 <=")
});
