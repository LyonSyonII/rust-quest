// Necessary to avoid "HTMLElement is not defined"
// Caused by Astro by trying to access window.HTMLElement at compile time
 
import type { CodeQuestion } from "src/validation/CodeQuestion";

export const Functions = {
  BASIC: "BASIC",
  LOOK_HORIZONTAL: "LOOK_HORIZONTAL",
  LOOKAROUND: "LOOKAROUND",
} as const;

export type Functions = (typeof Functions)[keyof typeof Functions];

export type BoardProps = {
  rows?: number;
  cols?: number;
  /** Position where the robot starts. */
  start: number;
  /** Enemy positions. */
  enemies: number[];
  /** Minimum steps needed to solve the puzzle. */
  steps: number;
};

export type RobotGameProps = {
  rows?: number;
  cols?: number;
  boards: BoardProps[];
  /** Abilities available to the programmer. */
  functions?: Functions;
  /** If the boards need to be solved with the minimum steps. */
  solveWithMinimumSteps?: boolean;
  winText?: string;
  loseText?: string;
} & CodeQuestion;

export type Board = BoardProps & {
  htmlTable: HTMLTableElement;
  robot: HTMLImageElement;
  tableChanged: boolean;
  numEnemies: number;
  rows: number;
  cols: number;
};