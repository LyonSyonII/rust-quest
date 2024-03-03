import type { CodeQuestion } from "src/validation/CodeQuestion";
import type { EvalResponse } from "./evaluate";

class CodeBlock extends HTMLElement {
  public setProps(question: CodeQuestion): void;
  public getValue(): string;
  public setValue(value: string): void;
  public setReadonly(readonly: boolean): void;
  public setTheme(theme: "light" | "dark"): void;
  public setSuccess(): void;
  public setRunning(running: boolean): void;
  public setOutput(output: string): void;
  public hideOutput(): void;
  public async validateSnippet(snippet: string): Promise<string | undefined>;
  public async evaluateSnippet(snippet: string): Promise<EvalResponse>;

  public addEventListener<K extends keyof CustomEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: CustomEventMap[K]) => void,
  ): void;
}

interface CustomEventMap {
  run: RunEvent;
  response: ResponseEvent;
  reset: ResetEvent;
}

class RunEvent extends Event {
  readonly codeBlock: CodeBlock;
}

class ResponseEvent extends Event {
  readonly codeBlock: CodeBlock;
  readonly response: string;
}

class ResetEvent extends Event {
  readonly codeBlock: CodeBlock;
}
