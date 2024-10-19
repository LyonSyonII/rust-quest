import {
  Functions,
  type RobotGameProps,
} from "@components/RobotGame/RobotGameTypes";
import { createRegExp } from "magic-regexp";
import { type Validator, codeMessQuestion, replace } from "./CodeQuestion";
import { _, end, line, semicolon, start } from "./regex";

const code = `
up();
if is_slime_left() {
  
} else {
  
}`;

const validator: Validator = (value) => {
  const regex = createRegExp(
    start, _,
    "up()", semicolon,
    "if", _, "is_slime_left()", _, "{", _, line, _, line.as("extra1"), _, "}", _, "else", _, "{", _, line, _, line.as("extra2"), _, "}", _,
    end
  );
  const matches = value.match(regex);
  if (!matches) return codeMessQuestion;

  const { extra1, extra2 } = matches.groups;
  
  return value.includes("?") && replace
    || (extra1 || extra2) && "You don't need more than one line in each condition!"
    || undefined
};

export const question: RobotGameProps = {
  code,
  solveWithMinimumSteps: true,
  functions: Functions.LOOK_HORIZONTAL,
  rows: 3,
  cols: 3,
  boards: [
    {
      start: 7,
      enemies: [3],
      steps: 2,
    },
    {
      start: 7,
      enemies: [1],
      steps: 2,
    },
  ],
  validator,
};
