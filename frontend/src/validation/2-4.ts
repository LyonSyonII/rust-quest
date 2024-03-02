import { FreeQuestion } from "./2-1";
import type { CodeQuestion } from "./CodeQuestion";

export default FreeQuestion({
  correct: "Correct!",
  validators: [
    /^200\<\-?\d+$/,
    /^-?\d+\>200$/,
  ]
}) as CodeQuestion;