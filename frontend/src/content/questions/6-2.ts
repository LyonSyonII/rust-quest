import { createRegExp } from "magic-regexp";
import { type CodeQuestion, replace } from "./CodeQuestion";
import { _ } from "./regex";

/* 
| Salmon  | 25.0  |
| Seabass | 28.5  |
| Tuna    | 28.0  |
| Trout   | 10.0  |
*/

export const question: CodeQuestion = {
  code: `
let price = if name == ? {
  25.0
} else if ? {
  ?
} else if ? {
  ?
} else if ? {
  ?
} else {
  // Fish not in table
  -1.0 
};
`,
  setup: `
  let get_price = |name| {
    __VALUE__
    price
  };
  
  for (name, expected) in [("salmon", 25.), ("seabass", 28.5), ("tuna", 28.), ("trout", 10.)] {
    if (get_price(name) != expected) {
      println!("")
    }
  }
  `,
  validator: (value) => {
    // TODO: `else if "Tuna"` without  `name ==`
    // TODO: Explain that it can be done with `match`
    // TODO: Ask for lowercase names
    const _regex = createRegExp();
/*     const regex = createRegExp(
      start, _,
      "if", _, "temp", _, ">", _, "MAX_TEMP", _, "{", _,
      "target", _, "=", _, any.times.any().as("first"), _, ";", _,
      "}", _, "else", _, "if", _, "temp", _, "<", _, "MIN_TEMP", _, "{", _,
      "target", _, "=", _, any.times.any().as("second"), _, ";", _,
      "}", _, end
    );
    const matches = value.match(regex);
    if (!matches) return codeMessLines([2, 4]); */

    return value.includes("?") && replace 
    || undefined;
  }
} as const;