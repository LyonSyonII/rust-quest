class CodeBlock extends HTMLElement {
  public getValue(): string;
  public setValue(value: string): void;
  public setReadonly(readonly: boolean): void;
  public setTheme(theme: "light" | "dark"): void;
  public setSuccess(): void;
  public setRunning(running: boolean): void;
  public setOutput(output: string): void;
  public hideOutput(): void;

  public addEventListener<K extends keyof CustomEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: CustomEventMap[K]) => void,
  ): void;
}

interface CustomEventMap {
  response: ResponseEvent;
  reset: ResetEvent;
}

class ResponseEvent extends Event {
  readonly codeBlock: CodeBlock;
  readonly response: string;
}

class ResetEvent extends Event {
  readonly codeBlock: CodeBlock;
}
