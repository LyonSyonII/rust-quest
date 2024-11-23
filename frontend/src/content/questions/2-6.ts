import { FreeQuestion } from "./2-1";
import { mc, mo } from "./CodeQuestion";

export const question = FreeQuestion({
  code: `0 >= ${mc}?${mo}`,
  correct: "Good answer!",
  validators: [
    /^0>=-?\d+$/,
    /^-?\d+<=0$/,
  ]
});