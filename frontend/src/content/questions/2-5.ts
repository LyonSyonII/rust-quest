import { FreeQuestion } from "./2-1";
import { mc, mo } from "./CodeQuestion";

export const question = FreeQuestion({
  code: `200 > ${mo}?${mc}`,
  correct: "Perfect!",
  validators: [/^200>-?\d+$/, /^-?\d+<200$/],
});
