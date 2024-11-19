import type {
  Compartment,
  EditorState,
  Extension,
  RangeSet,
  Text,
} from "@codemirror/state";
import type {
  Decoration,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";

import {
  type CodeQuestion,
  cleanProtectedCode,
  importQuestion,
  mc,
  mo,
  modifiableRanges,
  protectedRanges,
} from "src/content/questions/CodeQuestion";
import { onThemeChange } from "src/utils/onThemeChange";
import { log } from "src/utils/popup";
import { $ } from "src/utils/querySelector";
import { reverseIndex } from "src/utils/strings";
import { type EvalResponse, evaluate } from "./evaluate";
import * as persistence from "./persistence";

export class CodeBlock extends HTMLElement {
  output: HTMLOutputElement;
  runButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;

  code = "";
  rangeProtected = false;
  setup = "__VALUE__";
  validator: (
    value: string,
    test: (regex: RegExp) => boolean,
  ) => string | undefined = () => undefined;
  onsuccess: (stdout: string, value: string) => void = () => {};
  errorMsg: string;

  editor!: EditorView;
  EditorState!: typeof EditorState;
  readonly!: Compartment;
  theme!: Compartment;
  themeObserver: MutationObserver;

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
        await (await import("../Checkpoint/checkpoint")).remove(this.id);
        await (await import("./persistence")).remove(this.id);
        location.reload();
      });
    }
  }

  async loadCodemirror() {
    const { closeBrackets, closeBracketsKeymap } = await import(
      "@codemirror/autocomplete"
    );
    const { defaultKeymap, history, historyKeymap, insertTab } = await import(
      "@codemirror/commands"
    );
    const { rust } = await import("@codemirror/lang-rust");
    const { bracketMatching, foldKeymap, indentOnInput } = await import(
      "@codemirror/language"
    );
    const { highlightSelectionMatches } = await import("@codemirror/search");
    const {
      Compartment,
      EditorState: _EditorState,
      RangeSet,
    } = await import("@codemirror/state");
    const {
      EditorView,
      highlightActiveLine,
      ViewPlugin,
      Decoration,
      highlightActiveLineGutter,
      keymap,
      lineNumbers,
      placeholder,
      rectangularSelection,
    } = await import("@codemirror/view");

    this.EditorState = _EditorState;

    const lineNums =
      this.getAttribute("showLineNumbers") === "true" ? lineNumbers() : [];
    const basicSetup = [
      lineNums,
      highlightActiveLineGutter(),
      history(),
      this.EditorState.allowMultipleSelections.of(true),
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
      ]),
    ];

    this.readonly = new Compartment();
    this.theme = new Compartment();

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
        key: "Tab",
        run: insertTab,
        stopPropagation: true,
        preventDefault: true,
      },
    ]);
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
          placeholder(
            this.getAttribute("placeholder") || "PLACEHOLDER NOT DEFINED",
          ),
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
  }

  public setProps({ setup, vars = [], validator, onsuccess }: CodeQuestion) {
    const replaceVars = (r: string) =>
      vars.reduce(
        (acc, { v, d, c = (v) => v }) =>
          acc.replaceAll(`$${v}`, c(localStorage.getItem(v) || d)),
        r,
      );
    this.code = replaceVars(this.getAttribute("code") || this.code);
    this.rangeProtected = this.code.includes(mo);
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
      effects: this.readonly.reconfigure(
        this.EditorState.readOnly.of(readonly),
      ),
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
    snippet = cleanProtectedCode(snippet);
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
        this.readonly = protectedRanges(state.doc.toString());
        this.modifiable = modifiableRanges(this.readonly);
      }

      rangesToDec() {
        return {
          readonly: this.readonlyDec(),
          modifiable: this.modifiableDec(),
        };
      }

      readonlyDec() {
        return this.readonly.map(([start, end]) =>
          _Decoration.mark({}).range(start, end),
        );
      }

      modifiableDec() {
        return this.modifiable.map(([start, end]) => {
          return _Decoration
            .mark({
              inclusive: false,
              attributes: {
                style: `text-decoration: ${(end - start >= 1 && "dashed") || ""} underline;text-underline-offset: 4px; text-decoration-thickness:2px`,
              },
            })
            .range(start, end + 1);
        });
      }
    },
    {
      decorations: (instance) => {
        const { readonly, modifiable } = instance.rangesToDec();

        return _Decoration.set([...readonly, ...modifiable], true);
      },

      provide: (plugin) => {
        const of = (view: EditorView) => {
          return _Decoration.set(view.plugin(plugin)?.readonlyDec() || []);
        };
        return atomicRanges.of(of);
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
    cut(event, view) {
      const ranges = protectedRanges(view.state.doc.toString());
      for (const { from, to } of view.state.selection.ranges) {
        for (const [start, end] of ranges) {
          if (from >= start && from < end) return true;
          if (to > start && to <= end) return true;
        }
      }
      return false;
    },
    click(event, view) {
      // TODO: Fix error when clicking too much at the left of a modifiable section and warping up
      /*       console.log(`Selected line ${view.state.doc.lineAt(view.state.selection.main.head).number}`);
      const doc = view.state.doc;
      const pos = view.state.selection.main.head;
      const line = doc.lineAt(pos).number;
      const { leftModifiable, rightModifiable } = getLeftRightModifiable(doc.toString(), pos);
      const nearestModifiable = getNearestModifiable(doc, pos, leftModifiable, rightModifiable, line);
      const something = view.lineBlockAtHeight(event.clientY);
      console.log({something, maybeLine: doc.lineAt(something.to).number});
      view.dispatch({ selection: { head: nearestModifiable, anchor: nearestModifiable } }); */
    },
  });

const navigationExtension = ({ transactionFilter }: typeof EditorState) =>
  transactionFilter.of((tr) => {
    if (tr.docChanged || !tr.selection) return tr;

    // allow selecting all text
    if (Math.abs(tr.newSelection.main.from - tr.newSelection.main.to) > 1) {
      return tr;
    }

    const doc = tr.startState.doc;
    const selection = tr.startState.selection.main.head;
    const newSelection = tr.newSelection.main.head;

    const { number: line, from: lineStart } = doc.lineAt(selection);
    let {
      number: newLine,
      from: newLineStart,
      text: newLineText,
    } = doc.lineAt(newSelection);
    let pos = tr.newSelection.main.from;
    // If editor skips a line when going up/down,
    // set it to nearest line with a modifiable range
    if (
      !tr.isUserEvent("select.pointer") &&
      line !== newLine &&
      Math.abs(line - newLine) > 1
    ) {
      const nearest = newLine > line ? line + 1 : line - 1;
      const nearestLine = doc.line(nearest);
      const lastModifiable = reverseIndex(newLineText, mc);
      if (lastModifiable > 0) {
        newLine = nearestLine.number;
        newLineStart = nearestLine.from;
        newLineText = nearestLine.text;

        const col = selection - lineStart;
        const newCol = Math.min(col, lastModifiable);
        pos = newLineStart + newCol;
      }
    }

    const text = doc.toString();
    const { leftModifiable, rightModifiable } = getLeftRightModifiable(
      text,
      pos,
    );

    // never allow to go to column 0
    // the first character is either a range delimiter or a protected section
    if (pos === 0)
      return {
        selection: { head: rightModifiable + 1, anchor: rightModifiable + 1 },
      };

    // TODO: Not really, could be between two ranges, but seems enough condition for the editor to solve it by itself
    // if in modifiable range, allow editor to continue
    if (pos > leftModifiable && pos < rightModifiable)
      return { selection: { head: pos, anchor: pos } };

    const nearestModifiable = getNearestModifiable(
      doc,
      pos,
      leftModifiable,
      rightModifiable,
    );
    return {
      selection: { head: nearestModifiable, anchor: nearestModifiable },
    };
  });

const protectedRangesExtension = ({ changeFilter }: typeof EditorState) =>
  changeFilter.of((tr) => {
    if (!tr.selection) return true;

    const doc = tr.startState.doc.toString();
    const ranges = protectedRanges(doc).flat(2);
    if (ranges.length === 0) return true;
    // first and last parts are always protected
    const { from, to } = tr.startState.selection.main;
    if (from === to && (from === 0 || from === doc.length)) {
      return false;
    }
    return ranges;
  });

function getLeftRightModifiable(text: string, pos: number) {
  return {
    leftModifiable: reverseIndex(text, mo, pos),
    rightModifiable: text.indexOf(mc, pos),
  };
}

function getNearestModifiable(
  doc: Text,
  pos: number,
  leftModifiable: number,
  rightModifiable: number,
  line?: number,
): number {
  const leftLine =
    (leftModifiable > 0 && doc.lineAt(leftModifiable).number) || 0;
  const rightLine =
    (rightModifiable > 0 && doc.lineAt(rightModifiable).number) || 0;

  // console.log({ leftLine, rightLine, line });

  // set position to nearest modifiable section
  let dist = Number.POSITIVE_INFINITY;
  if (leftModifiable > 0) {
    dist = leftModifiable - pos;
  }
  if (rightModifiable > 0 && rightModifiable - pos < Math.abs(dist)) {
    dist = rightModifiable - pos;
  }
  return pos + dist;
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
