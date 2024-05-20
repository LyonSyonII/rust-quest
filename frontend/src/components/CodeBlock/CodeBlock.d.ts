import type { CodeBlock } from "./CodeBlock";

export interface CustomEventMap {
  run: RunEvent;
  response: ResponseEvent;
  reset: ResetEvent;
}

declare class RunEvent extends Event {
  readonly codeBlock: CodeBlock;
}

declare class ResponseEvent extends Event {
  readonly codeBlock: CodeBlock;
  readonly response: string;
}

declare class ResetEvent extends Event {
  readonly codeBlock: CodeBlock;
}
