import { FreeQuestion } from "./2-1";
import { mc, mo } from "./CodeQuestion";

export const question = FreeQuestion({
  code: `200 < ${mo}?${mc}`,
  solution: `200 < ${mo}1000${mc}`,
  correct: "Correct!",
  validators: [/^200<-?\d+$/, /^-?\d+>200$/],
  preprocess: (code) => code.replace("200 <", "200u128 <")
});
