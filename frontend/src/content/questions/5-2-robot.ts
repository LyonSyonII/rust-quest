import type { RobotGameProps } from "@components/RobotGame/RobotGameTypes";

export const question: RobotGameProps = {
  code: "",
  boards: [
    {
      start: 7,
      enemies: [1],
      steps: 2,
    },
  ],
  rows: 3,
  cols: 3,
};
