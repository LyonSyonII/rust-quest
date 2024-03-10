import { Functions, type RobotGameProps } from "@components/RobotGame/RobotGame";
import { codeMess, replace } from "./CodeQuestion";
import { createRegExp, exactly, maybe, not, oneOrMore, word } from "magic-regexp";
import { _, end, line, start } from "./regex";

export default {
  solveWithMinimumSteps: true,
  functions: Functions.LOOK_HORIZONTAL,
  rows: 3,
  cols: 3,
  boards: [
    {
      start: 6,
      enemies: [5],
      steps: 3
    },
    {
      start: 8,
      enemies: [3],
      steps: 3
    },
  ],
  validator
} as RobotGameProps;

function validator(value: string): string | undefined {
  const instructions = exactly(_, oneOrMore(not.whitespace)).times.any();
  const regex = createRegExp(
    start, _,
    line, _,
    "if", _, exactly("?").or(word, "()", maybe(";")).as("first"), _, "{", instructions.as("inst1"), _, "}", _,
    "if", _, exactly("?").or(word, "()", maybe(";")).as("second"), _, "{", instructions.as("inst2"), _, "}", _,
    end
  );
  const matches = value.match(regex);
  if (!matches) return codeMess;
  
  const { first, second, inst1 = "", inst2 = "" } = matches.groups;
  if (!first || !second) return codeMess;

  const wrong = "Look closely at the instructions, you don't need a semicolon!";
  
  // slice to remove last semicolon
  const instCount = Math.max(
    inst1.trim().slice(0, -1).split(";").length, 
    inst2.trim().slice(0, -1).split(";").length
  );
  
  return value.includes("?") && replace
    || instCount > 2 && "You don't need more than two instructions in each condition!"
    || first.includes(";") && `[first condition] ${wrong}`
    || second.includes(";") && `[second condition] ${wrong}`
    || undefined
}