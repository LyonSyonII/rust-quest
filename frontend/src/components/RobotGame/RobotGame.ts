export const Functions = {
  BASIC: "BASIC",
  LOOK_HORIZONTAL: "LOOK_HORIZONTAL",
  LOOKAROUND: "LOOKAROUND",
} as const;
export type Functions = (typeof Functions)[keyof typeof Functions];

export type Board = {
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
  boards: Board[];
  /** Abilities available to the programmer. */
  functions?: Functions;
  /** If the boards need to be solved with the minimum steps. */
  solveWithMinimum?: boolean;
  winText?: string;
  loseText?: string;
};
