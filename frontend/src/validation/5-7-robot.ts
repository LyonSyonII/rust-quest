import { Functions, type RobotGameProps } from "@components/RobotGame/RobotGame";

export default {
  solveWithMinimumSteps: true,
  functions: Functions.LOOK_HORIZONTAL,
  rows: 3,
  cols: 3,
  boards: [
    {
      start: 7,
      enemies: [1],
      steps: 2
    },
    {
      start: 7,
      enemies: [0],
      steps: 3
    },
  ],
} as RobotGameProps;