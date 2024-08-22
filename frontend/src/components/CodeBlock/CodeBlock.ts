import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { rust } from "@codemirror/lang-rust";
import {
  bracketMatching,
  foldKeymap,
  indentOnInput,
} from "@codemirror/language";
import { highlightSelectionMatches } from "@codemirror/search";
import { Compartment, EditorState } from "@codemirror/state";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder,
  rectangularSelection,
} from "@codemirror/view";
import { githubDark } from "src/codemirror-themes/github-dark";
import { githubLight } from "src/codemirror-themes/github-light";
import {
  type CodeQuestion,
  importQuestion,
} from "src/content/questions/CodeQuestion";
import { onThemeChange } from "src/utils/onThemeChange";
import { $ } from "src/utils/querySelector";
import { type EvalResponse, evaluate } from "./evaluate";
import * as persistence from "./persistence";

export class CodeBlock extends HTMLElement {
  output: HTMLOutputElement;
  runButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;

  code = "";
  setup = "__VALUE__";
  validator: (
    value: string,
    test: (regex: RegExp) => boolean,
  ) => string | undefined = () => undefined;
  onsuccess: (stdout: string, value: string) => void = () => {};
  errorMsg: string;

  editor: EditorView;
  readonly: Compartment;
  theme: Compartment;
  themeObserver: MutationObserver;

  constructor() {
    super();

    this.output = $("output", this);
    this.runButton = $(".run", this);
    this.resetButton = $(".reset", this);
    this.runButton.addEventListener("click", () => this.handleRun());
    this.resetButton.addEventListener("click", () => {
      this.setValue(this.code);
      this.dispatchEvent(new ResetEvent(this));
    });
    this.setup = this.getAttribute("setup") || this.setup;
    this.errorMsg = this.getAttribute("errorMsg") || "ERROR NOT DEFINED";

    this.readonly = new Compartment();
    this.theme = new Compartment();
    this.themeObserver = onThemeChange((theme) => {
      this.setTheme(theme);
    });
    const lineNums =
      this.getAttribute("showLineNumbers") === "true" ? lineNumbers() : [];

    const basicSetup = [
      lineNums,
      highlightActiveLineGutter(),
      history(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      rectangularSelection(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap.filter((k) => k.key !== "Mod-Enter"),
        ...historyKeymap,
        ...foldKeymap,
        indentWithTab,
      ]),
    ];

    const runKeymap = keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          this.handleRun();
          return true;
        },
        stopPropagation: true,
        preventDefault: true,
      },
      {
        key: "Shift-Enter",
        run: () => {
          this.handleRun();
          return true;
        },
        stopPropagation: true,
        preventDefault: true,
      },
    ]);
    const editable = this.getAttribute("editable") === "true";
    const theme = document.documentElement.dataset.theme || "light";

    this.editor = new EditorView({
      state: EditorState.create({
        doc: this.code,
        extensions: [
          basicSetup,
          rust(),
          runKeymap,
          placeholder(
            this.getAttribute("placeholder") || "PLACEHOLDER NOT DEFINED",
          ),
          this.theme.of(theme === "light" ? githubLight : githubDark),
          EditorView.editable.of(editable),
          this.readonly.of(EditorState.readOnly.of(!editable)),
        ],
      }),
    });
    // Can't disable outline in any other way
    this.editor.dom.style.outline = "none";

    importQuestion(this.id).then(async (q) => {
      this.setProps(q);
      this.setValue((await persistence.get(this.id)) || this.code);
      // replace placeholder with the real editor
      this.querySelector("pre")?.replaceWith(this.editor.dom);
      // avoid line gutter collapsing
      this.editor.requestMeasure();
    });

    if (import.meta.env.DEV) {
      const reset = $(".DEV-RESET", this);
      reset.addEventListener("click", async () => {
        const remove = (await import("../Checkpoint/checkpoint")).remove;
        await remove(this.id);
        location.reload();
      });
    }
  }

  public setProps({ setup, vars = [], validator, onsuccess }: CodeQuestion) {
    const replaceVars = (r: string) =>
      vars.reduce(
        (acc, { v, d, c = (v) => v }) =>
          acc.replaceAll(`$${v}`, c(localStorage.getItem(v) || d)),
        r,
      );
    this.code = replaceVars(this.getAttribute("code") || this.code);
    this.setup = replaceVars(setup || this.setup);
    this.validator = validator || this.validator;
    this.onsuccess = onsuccess || this.onsuccess;
  }

  public getValue(): string {
    return this.editor.state.doc.toString();
  }

  public setValue(value: string) {
    this.editor.dispatch({
      changes: { from: 0, to: this.editor.state.doc.length, insert: value },
    });
  }

  public setReadonly(readonly: boolean) {
    this.editor.dispatch({
      effects: this.readonly.reconfigure(EditorState.readOnly.of(readonly)),
    });
  }

  public setTheme(theme: "light" | "dark") {
    this.editor.dispatch({
      effects: this.theme.reconfigure(
        theme === "light" ? githubLight : githubDark,
      ),
    });
  }

  public isRunning(): boolean {
    return this.runButton.disabled;
  }

  public setRunning(running: boolean) {
    if (running) {
      this.setReadonly(true);
      this.runButton.disabled = this.resetButton.disabled = true;
    } else {
      this.setReadonly(false);
      this.runButton.disabled = this.resetButton.disabled = false;
    }
  }

  public async setSuccess() {
    (await import("../Checkpoint/checkpoint")).add(this.id);
    this.persistCode();
  }

  public async setOutput(output: string) {
    const out = output.replace("SUCCESS", "");
    if (this.id && output.length !== out.length) {
      await this.setSuccess();
      this.onsuccess(out.trim(), this.getValue());
    }

    this.output.innerText = out.trim();
    this.output.style.display = "block";
  }

  public hideOutput() {
    this.output.innerText = "";
    this.output.style.display = "none";
  }

  async handleRun() {
    if (this.isRunning()) {
      return;
    }
    // If event is cancelled, don't run
    if (this.dispatchEvent(new RunEvent(this)) === false) {
      return;
    }

    this.setOutput("Compiling...");
    this.setRunning(true);

    const value = this.getValue();
    const v = await this.validateSnippet(value);
    if (v !== undefined) {
      // Wait a bit to emphasize that the code is running
      await new Promise((resolve) => setTimeout(resolve, 50));
      this.setResponse(v);
      this.setRunning(false);
      return;
    }

    const response = await this.evaluateSnippet(value);
    this.setResponse(typeof response === "string" ? response : response.error);
  }

  /** Returns `undefined` if the validation was successful or a `string` with the error. */
  public async validateSnippet(snippet: string): Promise<string | undefined> {
    const v = this.validator(
      snippet,
      (regex: RegExp, ignoreWhitespace = false) =>
        ignoreWhitespace
          ? regex.test(snippet.replaceAll(/\s/g, ""))
          : regex.test(snippet),
    )?.trim();

    return v;
  }

  /** Evaluates `snippet` and returns the response. */
  public async evaluateSnippet(snippet: string): Promise<EvalResponse> {
    // minimize code by removing all extra spaces and newlines
    const setup = this.setup.replaceAll("__VALUE__", snippet); //.replaceAll(/\s+/g, " ");
    const code = `#![allow(warnings)] fn main() { \n${setup}\n }`;
    return evaluate(code, this.errorMsg);
  }

  setResponse(response: string): boolean {
    // Only show output if there is something and event isn't cancelled
    if (this.dispatchEvent(new ResponseEvent(this, response)) && response) {
      this.setOutput(response);
      this.setRunning(false);
    } else {
      this.hideOutput();
    }

    return true;
  }

  persistCode(value?: string) {
    value = value || this.getValue();
    value && persistence.set(this.id, value);
  }
}

export interface CustomEventMap {
  run: RunEvent;
  response: ResponseEvent;
  reset: ResetEvent;
}

export class RunEvent extends Event {
  readonly codeBlock: CodeBlock;

  constructor(cb: CodeBlock) {
    super("run", {
      bubbles: true,
      cancelable: true,
    });
    this.codeBlock = cb;
  }
}

export class ResponseEvent extends Event {
  readonly codeBlock: CodeBlock;
  readonly response: string;

  constructor(cb: CodeBlock, response: string) {
    super("response", {
      bubbles: true,
      cancelable: true,
    });
    this.codeBlock = cb;
    this.response = response;
  }
}

export class ResetEvent extends Event {
  readonly codeBlock: CodeBlock;

  constructor(cb: CodeBlock) {
    super("reset", {
      bubbles: true,
      cancelable: true,
    });
    this.codeBlock = cb;
  }
}
