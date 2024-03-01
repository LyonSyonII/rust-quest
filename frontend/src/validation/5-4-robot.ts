import type { RobotGameProps } from "@components/RobotGame/RobotGame";

export default {
  boards: [
    {
      start: 7,
      enemies: [1],
      steps: 2
    },
    {
      start: 7,
      enemies: [4],
      steps: 1
    },
  ],
  rows: 3,
  cols: 3,
  start: 7,
} as RobotGameProps;

