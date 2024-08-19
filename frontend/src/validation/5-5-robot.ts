import { Functions, type RobotGameProps } from "@components/RobotGame/RobotGameTypes";
import { createRegExp, exactly, maybe, word } from "magic-regexp";
import { codeMessQuestion, replace } from "./CodeQuestion";
import { _, end, semicolon, start } from "./regex";

export default {
  solveWithMinimumSteps: true,
  functions: Functions.LOOK_HORIZONTAL,
  rows: 3,
  cols: 3,
  boards: [
    {
      start: 7,
      enemies: [6],
      steps: 1
    },
    {
      start: 7,
      enemies: [8],
      steps: 1
    },
  ],
  validator
} as RobotGameProps;

function validator(value: string): string | undefined {
  const regex = createRegExp(
    start, _,
    "if", _, exactly("?").or(word, "()", maybe(";")).as("first"), _, "{", _, "left()", _, semicolon, "}", _,
    "if", _, exactly("?").or(word, "()", maybe(";")).as("second"), _, "{", _, "right()", _, semicolon, "}", _,
    end
  );
  const matches = value.match(regex);
  if (!matches) return codeMessQuestion;

  const { first, second } = matches.groups;
  if (!first) return codeMessQuestion;
  if (!second) return codeMessQuestion;

  const wrong = "Look closely at the instructions, you don't need a semicolon!";

  return value.includes("?") && replace
    || first.includes(";") && `[first condition] ${wrong}`
    || second.includes(";") && `[second condition] ${wrong}`
    || undefined
}