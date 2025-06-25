import type { EvalResponse } from "@components/CodeBlock/evaluate";

type WorkerMessage = {
  data:
    | { downloaded: string }
    | { loaded: boolean }
    | { result: EvalResponse; uuid: string }
    | { other?: string };
};
/**
 * Wrapper of the Miri interpreter.
 *
 * Runs the code in a Web Worker to minimize slowdowns.
 *
 * To interact with the Interpreter use the `run` and `onResult` methods.
 */
export class Interpreter {
  private readonly worker: Worker;
  private onrun: (() => void)[];
  private onresult: ((result: EvalResponse) => void)[];
  private ondownloaded: ((name: string) => void)[];
  private onloaded: (() => void)[];
  private loaded: boolean;

  /**
   * Creates a new Interpreter.
   *
   * The constructor is asyncronous, check `onLoaded` for status on when it can be used.
   *
   * @example
   * const interpreter = new Interpreter();
   * interpreter.onLoaded(() => {
   *   interpreter.run('println!("Hello, World!");');
   * })
   */
  constructor() {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    this.onrun = [];
    this.onresult = [];
    this.ondownloaded = [];
    this.onloaded = [];
    this.loaded = false;

    this.worker.onmessage = ({ data }: WorkerMessage) => {
      if ("result" in data) {
        for (const ev of this.onresult) {
          ev(data.result);
        }
      } else if ("loaded" in data) {
        for (const ev of this.onloaded) {
          ev();
        }
        this.loaded = true;
      } else if ("downloaded" in data) {
        for (const ev of this.ondownloaded) {
          ev(data.downloaded);
        }
      } else {
        console.log("Received message", data);
      }
    };
  }

  /**
   * Execute a snippet of code with Miri.
   *
   * The code is automatically wrapped with a `main` function.
   *
   * @param code Code that will be interpreted.
   */
  public run(code: string, printLast = false) {
    for (const ev of this.onrun) {
      ev();
    }
    this.worker.postMessage({ code, printLast });
  }

  /**
   * Execute a snippet of code with Miri asyncronously.
   *
   * The code is automatically wrapped with a `main` function.
   *
   * @param code Code that will be interpreted.
   *
   * @returns The evaluation response.
   */
  public async runAsync(code: string): Promise<EvalResponse> {
    for (const ev of this.onrun) {
      ev();
    }
    const uuid = crypto.randomUUID();
    this.worker.postMessage({ code, uuid });
    return await new Promise((resolve) => {
      const callback = ({ data }: WorkerMessage) => {
        if ("result" in data && uuid === data.uuid) {
          console.log(data);
          this.worker.removeEventListener("message", callback);
          resolve(data.result);
        }
      };

      this.worker.addEventListener("message", callback);
    });
  }

  /**
   * @param onrun Called when the Interpreter executes some code.
   */
  public onRun(onrun: () => void) {
    this.onrun.push(onrun);
  }

  /**
   * @param onresult Called when the Interpreter has finished executing code and has a result.
   */
  public onResult(onresult: (result: EvalResponse) => void) {
    this.onresult.push(onresult);
  }

  /**
   * @param ondownloaded Called when the Interpreter constructor has downloaded an asset.
   */
  public onAssetDownloaded(ondownloaded: (name: string) => void) {
    this.ondownloaded.push(ondownloaded);
  }

  /**
   * @param onloaded Called when the Interpreter has finished loading.
   */
  public onLoaded(onloaded: () => void) {
    this.onloaded.push(onloaded);
  }

  public isLoaded(): boolean {
    return this.loaded;
  }
}
