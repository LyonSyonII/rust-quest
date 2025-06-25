import type { Text } from "@codemirror/state";
import type { RobotGameProps } from "@components/RobotGame/RobotGameTypes";
import { createRegExp, exactly } from "magic-regexp";

/** Generates a random number in Rust */
export const rustRandomNum = `{
  use std::collections::hash_map::RandomState;
  use std::hash::{BuildHasher, Hasher};
  RandomState::new().build_hasher().finish()
}`.trim();

export const replace = "Replace ? with your answer.";
export const codeMess = `Seems like you've messed up the code, click the "Reset" button to return it back to its original state.`;
export const codeMessQuestion = `${codeMess}\nRemember to only modify the ? symbol.`;
export const codeMessBlanks = `${codeMess}\nRemember to only modify the blank spaces.`;
export const codeMessLines = (lines: number[]) => {
  let msg = codeMess;
  if (lines.length === 0) return msg;

  const mkLine = (line: number) => {
    const ends = ["th", "st", "nd", "rd"];
    return `${line}${ends[line] || ends[0]}`;
  };

  if (lines.length === 1) {
    return `${msg}\nYou only need to modify the ${mkLine(lines[0])} line.`;
  }
  msg += "\nYou only need to modify the ";
  // 1st, 3rd, and 4th lines.
  for (const line of lines.slice(0, -2)) {
    msg += `${mkLine(line)}, `;
  }
  const [l, l2] = lines.slice(-2);
  return `${msg}${mkLine(l)} and ${mkLine(l2)} lines.`;
};

/** Gets a substring between `s` and `;` */
export function getAnswer(s: string, value: string): string {
  const f = value.indexOf(s) + s.length;
  return value.substring(f, value.indexOf(";", f)).trim();
}

/** Dynamically imports a question from `id` */
export async function importQuestion(id: string): Promise<CodeQuestion> {
  const module = await import(`../questions/${id}.ts`);
  return "question" in module ? module.question : module.default;
}

export async function importRobotQuestion(id: string): Promise<RobotGameProps> {
  const question = await importQuestion(id);
  if ("boards" in question) {
    return question as RobotGameProps;
  }
  throw `Failed importing '${id}' as a RobotGame question`;
}

/** Modifiable opening marker. */
// export const mo = "→";
/** Modifiable closing marker. */
// export const mc = "←";
/** Modifiable opening marker. */
export const mo = "\u200B";
/** Modifiable closing marker. */
export const mc = "\u200B";

export function getProtectedRanges(
  code: string,
): [start: number, end: number][] {
  const chars = [...code];
  const ranges: [number, number][] = [];

  let inProtected = false;
  let start = 0;
  for (const [i, c] of chars.entries()) {
    if (c === mc && inProtected) {
      inProtected = false;
      start = i;
    } else if (c === mo && !inProtected) {
      inProtected = true;
      ranges.push([start, i + 1]);
    }
  }
  if (ranges.length === 0) return [];
  ranges.push([start, chars.length]);

  return ranges;
}
export function getModifiableRanges(
  protectedRanges: [start: number, end: number][],
): [start: number, end: number][] {
  const ranges: [number, number][] = [];
  // first range is always protected
  let prev = protectedRanges[0][1];
  for (const [start, end] of protectedRanges.slice(1)) {
    if (start >= prev) ranges.push([prev, start]);
    prev = end;
  }
  return ranges;
}

/// Returns the position of the nearest modifiable section.
type NearestModifiable = {
  index: number;
  nearest: number;
};
export function getNearestModifiable(
  pos: number,
  modifiableRanges: [start: number, end: number][],
  { seekLeft = true, seekRight = true, seekDifferent = false } = {},
): NearestModifiable {
  if (!seekLeft && !seekRight) return { nearest: Number.POSITIVE_INFINITY, index: -1 };
  
  let dist = Number.POSITIVE_INFINITY;
  let index = -1;
  for (const [i, [start, end]] of modifiableRanges.entries()) {
    const distL = start - pos;
    const distR = end - pos;
    if (pos < start && !seekRight) continue;
    if (pos > end && !seekLeft) continue;
    if (pos > start && pos < end) {
      if (seekDifferent) continue;
      return { nearest: pos, index: i };
    }
    if (Math.abs(distL) < Math.abs(dist)) { 
      dist = distL;
      index = i;
    }
    if (Math.abs(distR) < Math.abs(dist)) { 
      dist = distR;
      index = i;
    }
  }
  return { nearest: pos + dist, index: index };
}

// Returns the position of the nearest modifiable section in the specified line.
export function getNearestModifiableInLine(
  pos: number,
  modifiableRanges: [start: number, end: number][],
  { from: lineStart, to: lineEnd }: { from: number; to: number },
): NearestModifiable {
  let dist = Number.POSITIVE_INFINITY;
  let index = -1;
  for (const [i, [start, end]] of modifiableRanges.entries()) {
    const distL = start - pos;
    const distR = end - pos;
    if (start < lineStart || end > lineEnd) continue;
    if (Math.abs(distL) < Math.abs(dist)) { 
      dist = distL;
      index = i;
    }
    if (Math.abs(distR) < Math.abs(dist)) { 
      dist = distR;
      index = i;
    }
  }
  return { nearest: pos + dist, index };
}


export function getModifiableSelection(pos: number, [start, end]: [number, number], doc: Text): { selection: { anchor: number, head: number } } {
  // const string = doc.sliceString(start, end);
  // console.log({pos, start, end, line: doc.lineAt(pos).number});
  // TODO: Does not work as expected, first and last modifiable sections are not even selectable
  // if (false && (string.length === 0 || string.match(/^\s+$/))) {
  //   return { selection: { anchor: start, head: end } };
  // }
  
  return { selection: { anchor: pos, head: pos } };
}

export function cleanProtectedCode(code: string): string {
  return code.replaceAll(createRegExp(exactly(mo).or(mc), ["g"]), "");
}

export type Validator = (
  value: string,
  test: (regex: RegExp, ignoreWhitespace?: boolean) => boolean,
) => string | undefined;

export type CodeQuestion = {
  /** Code of the question, if blank a placeholder will be shown instead. */
  readonly code: string | "";
  /** Invisible part of the code.
   *
   *  All instances of `__VALUE__` will be replaced with the current editor value. */
  readonly setup?: string;
  readonly vars?: {
    /** Name of the variable. */
    readonly v: string;
    /** Default value if variable does not exist. */
    readonly d: string;
    /** Transform the variable's value before replacing it. */
    readonly c?: (value: string) => string;
  }[];
  /** Function to validate the code entered by the user.
   *
   *  If it returns `Some`, it will be displayed in the output and the code will not be executed. */
  readonly validator?: Validator;
  /** Callback that will be called when "SUCCESS" is returned. */
  readonly onsuccess?: (stdout: string, value: string) => void;
};
