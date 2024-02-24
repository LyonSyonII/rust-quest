import { FreeQuestion } from "./2-1";
import type { CodeQuestion } from "./CodeQuestion";

export default FreeQuestion({
  correct: "Perfect!",
  validators: [
    /^200>\-?\d+$/,
    /^-?\d+<200$/,
  ]
}) as CodeQuestion;