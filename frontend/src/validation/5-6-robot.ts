import { Functions, type RobotGameProps } from "@components/RobotGame/RobotGameTypes";
import { codeMess, replace } from "./CodeQuestion";
import { char, createRegExp, exactly, maybe, oneOrMore } from "magic-regexp";
import { _, __, end, fn, line, start } from "./regex";

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
  const instructions = exactly(oneOrMore(char), __).times.any();
  const regex = createRegExp(
    start, _,
    line, _,
    "if", _, exactly("?").or(fn, maybe(";")).as("first"), _, "{", _, instructions.as("inst1"), "}", _,
    "if", _, exactly("?").or(fn, maybe(";")).as("second"), _, "{", _, instructions.as("inst2"), "}", _,
    end
  );
  console.log(regex.source)
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