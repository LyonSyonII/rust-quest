import type { RobotGameProps } from "@components/RobotGame/RobotGameTypes";

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
  return ("question" in module) ? module.question : module.default;
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

export function protectedRanges(code: string): [number, number][] {
  const chars = [...code];
  const ranges: [number, number][] = [];
  
  let inProtected = false;
  let start = 0;
  for (const [i, c] of chars.entries()) {
    if (c !== mo) continue;

    if (inProtected) {
      inProtected = false;
      start = i;
    } else {
      inProtected = true;
      ranges.push([start, i+1]);
    }
  }
  if (ranges.length === 0) return [];
  ranges.push([start, chars.length]);

  return ranges;
}
export function modifiableRanges(protectedRanges: [number, number][]): [number, number][] {
  const ranges: [number, number][] = [];
  let prev = 0;
  for (const [start, end] of protectedRanges) {
    if (start > prev) ranges.push([prev, start-1]);
    prev = end;
  }
  return ranges;
}

export function isModifiable(code: string, pos: number): boolean {
  const chars = [...code];

  let i = pos-1;
  console.log("left");
  while (i >= 0) {
    console.log(chars[i]);
    // if closes before opening, not modifiable
    if (chars[i] === mc) return false;
    // if opens, modifiable
    if (chars[i] === mo) break;
    i -= 1;
  }
  // if reached start, not modifiable
  if (i === -1) return false;
  
  i = pos;
  console.log("right");
  while (i < chars.length) {
    console.log(chars[i]);
    // if opens before closing, not modifiable
    if (chars[i] === mo) return false;
    // if closes, modifiable
    if (chars[i] === mc) break;
    i += 1;
  }
  // if reached end, not modifiable
  if (i === chars.length) return false;

  return true;
}

export function cleanProtectedCode(code: string): string {
  return code.replaceAll(/‎|‎/g, "");
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
