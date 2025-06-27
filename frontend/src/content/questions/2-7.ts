import { FreeQuestion } from "./2-1";
import { mc, mo } from "./CodeQuestion";

export const question = FreeQuestion({
  code: `0 <= ${mo}?${mc}`,
  correct: "Fantastic!",
  validators: [/^0<=-?\d+$/, /^-?\d+>=0$/],
});
