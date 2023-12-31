class CodeBlock extends HTMLElement {
  
  public getValue(): string;
  public setValue(value: string);
  public setReadonly(readonly: boolean);
  public setTheme(theme: "light" | "dark");
  public setRunning(running: boolean);  
  public setOutput(output: string);
  public hideOutput();

  public addEventListener<K extends keyof CustomEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: CustomEventMap[K]) => void,
  ): void;
}

interface CustomEventMap {
  response: ResponseEvent;
}

class ResponseEvent extends Event {
  readonly codeBlock: CodeBlock;
  readonly response: string;
}
