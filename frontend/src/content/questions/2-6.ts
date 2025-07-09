import { FreeQuestion } from "./2-1";
import { mc, mo } from "./CodeQuestion";

export const question = FreeQuestion({
  code: `0 >= ${mc}?${mo}`,
  solution: `0 >= ${mc}-5${mo}`,
  correct: "Good answer!",
  validators: [/^0>=-?\d+$/, /^-?\d+<=0$/],
  preprocess: (code) => code.replace("0 >=", "0i128 >=")
});
