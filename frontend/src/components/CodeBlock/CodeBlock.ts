import type {
  Compartment,
  EditorState,
  Extension,
  RangeSet,
} from "@codemirror/state";
import type { Decoration, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

import {
  type CodeQuestion,
  cleanProtectedCode,
  getModifiableRanges,
  getModifiableSelection,
  getNearestModifiable,
  getNearestModifiableInLine,
  getProtectedRanges,
  importQuestion,
  mc,
  mo,
} from "src/content/questions/CodeQuestion";
import { onThemeChange } from "src/utils/onThemeChange";
import { $ } from "src/utils/querySelector";
import * as persistence from "../../persistence/codeBlock";
import { type EvalResponse, evaluate } from "./evaluate";
import type { AnsiUp } from "ansi_up";

export class CodeBlock extends HTMLElement {
  output: HTMLOutputElement;
  runButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;

  code = "";
  rangeProtected = false;
  setup = "__VALUE__";
  validator: (value: string, test: (regex: RegExp) => boolean) => string | undefined = () =>
    undefined;
  onsuccess: (stdout: string, value: string) => void = () => {};
  errorMsg: string;

  editor!: EditorView;
  EditorState!: typeof EditorState;
  readonly!: Compartment;
  theme!: Compartment;
  themeObserver: MutationObserver;

  ansiUp!: AnsiUp;

  constructor() {
    super();

    this.output = $("output", this);
    this.runButton = $("#run", this);
    this.resetButton = $("#reset", this);
    this.runButton.addEventListener("click", () => this.handleRun());
    this.resetButton.addEventListener("click", () => {
      this.setValue(this.code);
      this.dispatchEvent(new ResetEvent(this));
    });
    this.setup = this.getAttribute("setup") || this.setup;
    this.errorMsg = this.getAttribute("errorMsg") || "ERROR NOT DEFINED";
    this.themeObserver = onThemeChange((theme) => {
      this.setTheme(theme);
    });

    importQuestion(this.id).then(async (q) => {
      this.setProps(q);

      await this.loadCodemirror();
      this.setValue((await persistence.get(this.id)) || this.code);
      // replace placeholder with the real editor
      this.querySelector("pre")?.replaceWith(this.editor.dom);
      // avoid line gutter collapsing
      this.editor.requestMeasure();
    });

    if (import.meta.env.DEV) {
      const reset = $("#DEV-RESET", this);
      reset.addEventListener("click", async () => {
        await (await import("../../persistence/checkpoint")).remove(this.id);
        await (await import("../../persistence/codeBlock")).remove(this.id);
        location.reload();
      });
    }
  }

  async loadCodemirror() {
    const { closeBrackets, closeBracketsKeymap } = await import("@codemirror/autocomplete");
    const { defaultKeymap, history, historyKeymap, insertTab } = await import(
      "@codemirror/commands"
    );
    const { rust } = await import("@codemirror/lang-rust");
    const { bracketMatching, foldKeymap, indentOnInput } = await import("@codemirror/language");
    const { Compartment, EditorState: _EditorState, RangeSet, Prec } = await import("@codemirror/state");
    const {
      EditorView,
      highlightActiveLine,
      ViewPlugin,
      Decoration,
      highlightActiveLineGutter,
      keymap,
      lineNumbers,
      placeholder,
    } = await import("@codemirror/view");

    this.EditorState = _EditorState;

    const lineNums = this.getAttribute("showLineNumbers") === "true" ? lineNumbers() : [];
    const basicSetup = [
      lineNums,
      highlightActiveLineGutter(),
      history(),
      this.EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      highlightActiveLine(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap.filter((k) => k.key !== "Mod-Enter" && k.key !== "Shift-Enter"),
        ...historyKeymap,
        ...foldKeymap,
      ]),
    ];

    this.readonly = new Compartment();
    this.theme = new Compartment();

    const runKeymap = Prec.highest(
      keymap.of([
        {
          key: "Shift-Enter",
          run: () => {
            this.handleRun();
            return true;
          },
          stopPropagation: true,
          preventDefault: true
        },
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
          key: "Tab",
          run: insertTab,
          stopPropagation: true,
          preventDefault: true,
        },
      ]),
    );
    const editable = this.getAttribute("editable") === "true";
    const theme: string = document.documentElement.dataset.theme || "light";

    const protectedRangesExtensions =
      (this.rangeProtected && [
        domHandlers(EditorView),
        navigationExtension(this.EditorState),
        rangeHighlighter(ViewPlugin, EditorView, RangeSet, Decoration),
        protectedRangesExtension(this.EditorState),
      ]) ||
      [];

    this.editor = new EditorView({
      state: this.EditorState.create({
        doc: this.code,
        extensions: [
          rust(),
          basicSetup,
          runKeymap,
          placeholder(this.getAttribute("placeholder") || "PLACEHOLDER NOT DEFINED"),
          this.theme.of(await this.importTheme(theme)),
          this.readonly.of(this.EditorState.readOnly.of(!editable)),
          EditorView.editable.of(editable),
          EditorView.contentAttributes.of({ "aria-label": "Code Block" }),
          ...protectedRangesExtensions,
        ],
      }),
    });
    // Can't disable outline in any other way
    this.editor.dom.style.outline = "none";

    this.ansiUp = new (await import("ansi_up")).AnsiUp();
  }

  public setProps({ setup, vars = [], validator, onsuccess }: CodeQuestion) {
    const replaceVars = (r: string) =>
      vars.reduce(
        (acc, { v, d, c = (v) => v }) => acc.replaceAll(`$${v}`, c(localStorage.getItem(v) || d)),
        r,
      );
    this.code = replaceVars(this.getAttribute("code") || this.code);
    this.rangeProtected = this.code.includes(mo) && this.code.includes(mc);
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
      effects: this.readonly.reconfigure(this.EditorState.readOnly.of(readonly)),
    });
  }

  public async importTheme(theme: string): Promise<Extension> {
    return theme === "light"
      ? (await import("./codemirror-themes/github-light")).githubLight
      : (await import("./codemirror-themes/github-dark")).githubDark;
  }

  public async setTheme(theme: "light" | "dark") {
    this.editor.dispatch({
      effects: this.theme.reconfigure(await this.importTheme(theme)),
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
    (await import("../../persistence/checkpoint")).add(this.id);
    this.persistCode();
  }

  public async setOutput(output: string) {
    const out = output.replace("SUCCESS", "");
    if (this.id && output.length !== out.length) {
      await this.setSuccess();
      this.onsuccess(out.trim(), this.getValue());
    }

    this.output.innerHTML = this.ansiUp.ansi_to_html(out.trim());
    console.log(this.output.innerHTML);
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
    snippet = cleanProtectedCode(snippet);
    const v = this.validator(snippet, (regex: RegExp, ignoreWhitespace = false) =>
      ignoreWhitespace ? regex.test(snippet.replaceAll(/\s/g, "")) : regex.test(snippet),
    )?.trim();

    return v;
  }

  /** Evaluates `snippet` and returns the response. */
  public async evaluateSnippet(snippet: string): Promise<EvalResponse> {
    // minimize code by removing all extra spaces and newlines
    const setup = this.setup.replaceAll("__VALUE__", snippet);
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

function rangeHighlighter(
  _ViewPlugin: typeof ViewPlugin,
  { atomicRanges }: typeof EditorView,
  _RangeSet: typeof RangeSet,
  _Decoration: typeof Decoration,
) {
  return _ViewPlugin.fromClass(
    class {
      private readonly: [start: number, end: number][] = [];
      private modifiable: [start: number, end: number][] = [];

      constructor(view: EditorView) {
        this.updateRanges(view.state);
      }
      update(view: ViewUpdate) {
        this.updateRanges(view.state);
      }

      updateRanges(state: EditorState) {
        this.readonly = getProtectedRanges(state.doc.toString());
        this.modifiable = getModifiableRanges(this.readonly);
      }

      rangesToDec() {
        return {
          readonly: this.readonlyDec(),
          modifiable: this.modifiableDec(),
        };
      }

      readonlyDec() {
        return this.readonly.map(([start, end]) => _Decoration.mark({}).range(start, end));
      }

      modifiableDec() {
        const style = (start: number, end: number) => {
          return `
          text-decoration:${(end - start >= 3 && "dashed") || ""} underline;
          text-underline-offset:4px; 
          text-decoration-thickness:2px;
          ${end - start === 0 && "padding-right:1ch; border-bottom: 2px solid"}
          `.replaceAll("\n", "");
        };
        //! BUG: end + 1 causes an invisible modifiable section to appear, which can't be interacted with except if the real one is empty
        //! Currently does not affect user experience
        return this.modifiable.map(([start, end]) => {
          return _Decoration
            .mark({
              inclusive: false,
              attributes: {
                style: style(start, end),
              },
            })
            .range(start, end + 1);
        });
      }
    },
    {
      decorations: (instance) => {
        const { readonly, modifiable } = instance.rangesToDec();
        return _Decoration.set([...modifiable, ...readonly], true);
      },

      provide: (plugin) => {
        return atomicRanges.of((view: EditorView) =>
          _Decoration.set(view.plugin(plugin)?.readonlyDec() || []),
        );
      },
    },
  );
}

const domHandlers = ({ domEventHandlers }: typeof EditorView) =>
  domEventHandlers({
    copy(event, view) {
      const clip = event.clipboardData;
      if (!clip) return;

      const selection = view.state.selection.main;
      const data = view.state.sliceDoc(selection.from, selection.to);
      const replaced = cleanProtectedCode(data);
      clip.setData("text/plain", replaced);
      return true;
    },
    cut(_event, view) {
      const ranges = getProtectedRanges(view.state.doc.toString());
      for (const { from, to } of view.state.selection.ranges) {
        for (const [start, end] of ranges) {
          if (from >= start && from < end) return true;
          if (to > start && to <= end) return true;
        }
      }
      return false;
    },
  });

const navigationExtension = ({ transactionFilter }: typeof EditorState) =>
  transactionFilter.of((tr) => {
    if (tr.docChanged || !tr.selection) return tr;

    // allow selecting all text
    if (Math.abs(tr.newSelection.main.from - tr.newSelection.main.to) > 0) {
      return tr;
    }

    const pos = tr.startState.selection.main.head;
    const newPos = tr.newSelection.main.head;

    const doc = tr.newDoc;
    const text = doc.toString();
    const protectedRanges = getProtectedRanges(text);
    const modifiableRanges = getModifiableRanges(protectedRanges);

    const line = doc.lineAt(pos);
    const newLine = doc.lineAt(newPos);
    const lineDist = line.number - newLine.number;

    // if editor is trying to skip two lines (and is not mouse)
    if (!tr.isUserEvent("select.pointer") && Math.abs(line.number - newLine.number) > 1) {
      // workaround line skip bug
      let nearestLine = line;
      if (lineDist > 1) {
        nearestLine = doc.line(line.number - 1);
      } else if (lineDist < 0) {
        nearestLine = doc.line(line.number + 1);
      }
      const col = pos - line.from;
      const newPos = Math.min(nearestLine.to, nearestLine.from + col);
      const { nearest, index } = getNearestModifiableInLine(newPos, modifiableRanges, nearestLine);
      // if modifiable section found in line
      if (nearest !== Number.POSITIVE_INFINITY)
        return getModifiableSelection(nearest, modifiableRanges[index], doc);
    }

    // get nearest modifiable section and go to it
    const { nearest, index } = getNearestModifiable(newPos, modifiableRanges);
    return nearest !== Number.POSITIVE_INFINITY
      ? getModifiableSelection(nearest, modifiableRanges[index], doc)
      : [];
  });

const protectedRangesExtension = ({ changeFilter }: typeof EditorState) =>
  changeFilter.of((tr) => {
    if (!tr.selection) return true;

    const doc = tr.startState.doc.toString();
    const ranges = getProtectedRanges(doc).flat(2);
    if (ranges.length === 0) return true;
    // first and last parts are always protected
    const { from, to } = tr.startState.selection.main;
    if (from === to && (from === 0 || from === doc.length)) {
      return false;
    }
    return ranges;
  });

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

// TODO: Hook into Codemirror's Duplicate Line to avoid duplicating Protected Ranges.
// TODO: Hook into Codemirror's Move Line to avoid moving Protected Ranges.