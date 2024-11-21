import type { CodeBlock, ResetEvent } from "@components/CodeBlock/CodeBlock";
import type { EvalResponse } from "@components/CodeBlock/evaluate";
import { type CodeQuestion, importRobotQuestion } from "src/content/questions/CodeQuestion";
import { confetti } from "src/utils/confetti";
import { $ } from "src/utils/querySelector";
import { parenthesisCheck } from "../../content/questions/0-robot";
import { type Board, Functions } from "./RobotGameTypes";

export class RobotGame extends HTMLElement {
  readonly codeblock: CodeBlock;
  readonly startingHtmlBoards: HTMLTableElement[];

  boards: Board[] = [];
  functions: Functions = Functions.BASIC;
  solveWithMinimumSteps = false;
  winText = "You win!";
  loseText = "There are some Slimes left, try again!";

  constructor() {
    super();

    this.codeblock = $("x-code-block", this);
    this.startingHtmlBoards = [...this.querySelectorAll("table")].map(
      (t) => t.cloneNode(true) as HTMLTableElement,
    );

    importRobotQuestion(this.id).then((props) => {
      this.functions = props.functions || this.functions;
      this.winText = props.winText || this.winText;
      this.loseText = props.loseText || this.loseText;
      this.solveWithMinimumSteps = props.solveWithMinimumSteps || this.solveWithMinimumSteps;

      this.boards = [...this.querySelectorAll("table")].map((htmlTable, i) => ({
        htmlTable,
        robot: $("#robot", htmlTable),
        tableChanged: false,
        numEnemies: props.boards[i]?.enemies.length || 0,
        rows: props.boards[i]?.rows || 3,
        cols: props.boards[i]?.cols || 3,
        ...props.boards[i],
      }));
    });
  }

  connectedCallback() {
    this.codeblock.addEventListener("run", async (e) => {
      e.preventDefault();

      this.codeblock.setRunning(true);
      this.codeblock.setOutput("Compiling...");

      this.resetBoards();

      const value = this.codeblock.getValue();

      const v = parenthesisCheck(value) || (await this.codeblock.validateSnippet(value));
      if (v !== undefined) {
        // Wait a bit to emphasize that the code is running
        await new Promise((resolve) => setTimeout(resolve, 50));
        this.codeblock.setOutput(v);
        this.codeblock.setRunning(false);
        return Promise.reject();
      }

      const responses: [Promise<EvalResponse>, Board][] = await Promise.all(
        this.boards.map(async (board) => {
          const { rows, cols, start, enemies } = board;
          await this.setupCodeBlock(rows, cols, start, enemies, this.functions);

          const response = this.codeblock.evaluateSnippet(value);
          return [response, board];
        }),
      );

      const simulationError = async (err?: { error: string }) => {
        this.codeblock.setOutput(
          err?.error || "There was an error during the simulation, please try again.",
        );
        await new Promise((r) => setTimeout(r, 1000));
        this.codeblock.setRunning(false);
        this.resetBoards();
      };

      if (responses === undefined || responses.length !== this.boards.length) {
        return simulationError();
      }

      for (const [r, board] of responses) {
        const response = await r;
        if (typeof response !== "string") {
          return simulationError(response);
        }

        const steps = await this.handleResponse(response, board);
        if (steps === undefined) {
          this.codeblock.setOutput(this.loseText);
          await new Promise((r) => setTimeout(r, 1000));
          this.codeblock.setRunning(false);
          this.resetBoards();
          return;
        }
        if (this.solveWithMinimumSteps && board.steps < steps) {
          this.codeblock.setOutput("You took too many steps, try again!");
          this.codeblock.setRunning(false);
          return;
        }
      }

      this.codeblock.setOutput(`${this.winText}SUCCESS`);
      confetti({ count: 20 });
      this.codeblock.setRunning(false);
    });

    this.codeblock.addEventListener("reset", ((e: ResetEvent) => {
      this.resetBoards();
      e.codeBlock.hideOutput();
    }) as EventListener);
  }

  async setupCodeBlock(
    rows: number,
    cols: number,
    startPos: number,
    enemies: number[],
    functions: Functions,
  ) {
    const questions = await import("../../content/questions/0-robot");

    let question: CodeQuestion;
    switch (functions) {
      case Functions.BASIC:
        question = questions.basicMovement;
        break;
      case Functions.LOOK_HORIZONTAL:
        question = questions.lookLeftRight(rows, cols, startPos, enemies);
        break;
      default:
        question = questions.default;
        break;
    }
    this.codeblock.setProps(question);
  }

  async resetBoards() {
    for (let i = 0; i < this.boards.length; i += 1) {
      const board = this.boards[i];

      if (!board.tableChanged) {
        break;
      }

      board.tableChanged = false;
      board.htmlTable.style.opacity = "0";
      await new Promise((r) => setTimeout(r, 200));
      this.startingHtmlBoards[i].style.opacity = "0";

      const newTable = this.startingHtmlBoards[i].cloneNode(true) as HTMLTableElement;
      board.htmlTable.replaceWith(newTable);
      board.htmlTable = newTable;

      await new Promise((r) => setTimeout(r, 20));
      board.htmlTable.style.opacity = "1";
      board.robot = $("#robot", board.htmlTable);
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  /** Returns `number` representing the number of steps.
   *
   *  If the robot didn't kill all the slimes, return `undefined`.
   */
  async handleResponse(response: string, board: Board): Promise<number | undefined> {
    const cells = board.htmlTable.querySelectorAll("td");
    let killedEnemies = 0;
    let currentPos = board.start;
    let steps = 0;

    const wait = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const setPos = async (newPos: number, direction: string) => {
      board.tableChanged = true;
      steps += 1;
      board.robot.classList.add(direction);
      await wait(350);
      board.robot.classList.remove(direction);
      ({ currentPos, killedEnemies } = this.setPos(
        currentPos,
        newPos,
        board.robot,
        cells,
        killedEnemies,
      ));
    };

    this.codeblock.setOutput("Simulating...");

    for (const c of response.split("\n")) {
      switch (c) {
        case "UP": {
          const newPos = currentPos - board.cols;
          if (newPos >= 0) {
            await setPos(newPos, "up");
          }
          break;
        }
        case "DOWN": {
          const newPos = currentPos + board.cols;
          if (newPos <= cells.length) {
            await setPos(newPos, "down");
          }
          break;
        }
        case "LEFT": {
          const newPos = currentPos - 1;
          if (currentPos % board.cols !== 0 && newPos >= 0) {
            await setPos(newPos, "left");
          }
          break;
        }
        case "RIGHT": {
          const newPos = currentPos + 1;
          if (newPos % board.cols !== 0 && newPos <= cells.length) {
            await setPos(newPos, "right");
          }
          break;
        }

        default:
          continue;
      }

      await wait(150);
    }

    if (killedEnemies < board.numEnemies) {
      return undefined;
    }
    return steps;
  }

  setPos(
    currentPos: number,
    newPos: number,
    robot: HTMLImageElement,
    cells: NodeListOf<HTMLTableCellElement>,
    killedEnemies: number,
  ): { currentPos: number; killedEnemies: number } {
    const currentCell = cells[currentPos];
    const newCell = cells[newPos];

    const child = newCell.firstElementChild;
    if (child === null) {
      throw "child null error";
    }
    const killed: 0 | 1 = child.id === "slime" ? 1 : 0;

    child.replaceWith(robot);

    const newP = document.createElement("p");
    newP.textContent = currentPos.toString();
    currentCell.appendChild(newP);

    return { currentPos: newPos, killedEnemies: killedEnemies + killed };
  }
}
