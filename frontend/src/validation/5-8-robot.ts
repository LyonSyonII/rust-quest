import { Functions, type RobotGameProps } from "@components/RobotGame/RobotGameTypes";
import { createRegExp } from "magic-regexp";
import { codeMess, replace } from "./CodeQuestion";
import { _, end, line, semicolon, start } from "./regex";

export default {
  solveWithMinimumSteps: true,
  functions: Functions.LOOK_HORIZONTAL,
  rows: 3,
  cols: 3,
  boards: [
    {
      start: 7,
      enemies: [3],
      steps: 2
    },
    {
      start: 7,
      enemies: [1],
      steps: 2
    },
  ],
  validator
} as RobotGameProps;

function validator(value: string): string | undefined {
  const regex = createRegExp(
    start, _,
    "up()", semicolon,
    "if", _, "is_slime_left()", _, "{", _, line, _, line.as("extra1"), _, "}", _, "else", _, "{", _, line, _, line.as("extra2"), _, "}", _,
    end
  );
  const matches = value.match(regex);
  if (!matches) return codeMess;

  const { extra1, extra2 } = matches.groups;
  
  return value.includes("?") && replace
    || (extra1 || extra2) && "You don't need more than one line in each condition!"
    || undefined
}