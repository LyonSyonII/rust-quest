import {
  Functions,
  type RobotGameProps,
} from "@components/RobotGame/RobotGameTypes";
import { createRegExp, exactly, maybe, word } from "magic-regexp";
import { type Validator, codeMessQuestion, replace } from "./CodeQuestion";
import { _, end, line, semicolon, start } from "./regex";

const code = `
up();
if ? {
  
} else if ? {
  
} else {
  
}`;

const validator: Validator = (value) => {
  const condition = exactly("?").or(word, "()", maybe(";"));
  const regex = createRegExp(
    start, _,
    "up()", semicolon,
    "if", _, condition.as("first"), _, "{", _, line, _, line.as("extra1"), _, "}", _, 
    "else if", _, condition.as("second"), _, "{", _, line, _, line.as("extra2"), _, "}", _, 
    "else", _, "{", _, line, _, line.as("extra3"), _, "}", _,
    end
  );
  const matches = value.match(regex);
  if (!matches) return codeMessQuestion;

  const { first, second, extra1, extra2, extra3 } = matches.groups;
  if (!first || !second) return codeMessQuestion;

  const wrong = "Look closely at the instructions, you don't need a semicolon!";
  
  return value.includes("?") && replace
    || (extra1 || extra2 || extra3) && "You don't need more than one line in each condition!"
    || first.includes(";") && `[first condition] ${wrong}`
    || second.includes(";") && `[second condition] ${wrong}`
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
    {
      start: 7,
      enemies: [5],
      steps: 2,
    },
  ],
  validator,
};
