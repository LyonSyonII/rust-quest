import { FreeQuestion } from "./2-1";
import type { CodeQuestion } from "./CodeQuestion";

export default FreeQuestion({
  correct: "Fantastic!",
  validators: [
    /^0<=-?\d+$/,
    /^-?\d+>=0$/,
  ]
}) as CodeQuestion;