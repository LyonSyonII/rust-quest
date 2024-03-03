import { anyOf, createRegExp, exactly } from "magic-regexp";
import type { CodeQuestion } from "./CodeQuestion";
import { _ } from "./regex";

export function parenthesisCheck(value: string): string | undefined {
  const up = exactly("up").notBefore(_, "(", _, ")", _);
  const down = exactly("down").notBefore(_, "(", _, ")", _);
  const left = exactly("left").notBefore(_, "(", _, ")", _);
  const right = exactly("right").notBefore(_, "(", _, ")", _);
  const isr = anyOf("isr", "is_slime_right").notBefore(_, "(", _, ")", _);
  const isl = anyOf("isl", "is_slime_left").notBefore(_, "(", _, ")", _);

  const parens = createRegExp(
    anyOf(up, down, left, right, isr, isl),
  );
  
  const match = value.match(parens);
  console.log({match});
  if (match && match[0]) {
    return `You need to call the function '${match[0]}' with parenthesis.\ne.g. '${match[0]}()'`;
  }

  const open = value.split("(").length - 1;
  const close = value.split(")").length - 1;
  if (open !== close) {
    return `You have ${open} open parenthesis and ${close} close parenthesis. Make sure you have the same amount of both!`;
  }

  return undefined;
}

/** `up` / `down` / `left` / `right` */
export const basicMovement: CodeQuestion = {
  setup: `
  fn up() { println!("UP") }
  fn down() { println!("DOWN") }
  fn left() { println!("LEFT") }
  fn right() { println!("RIGHT") }

  let u = up;
  let d = down;
  let l = left;
  let r = right;
  __VALUE__
  `.replaceAll("\n", "")
} as const;

export const lookLeftRight: (
  rows: number,
  cols: number,
  start: number,
  enemies: number[]
  ) => CodeQuestion = (rows, cols, start, enemies) => {
  return {
    setup: `
    const ROWS: usize = ${rows};
    const COLS: usize = ${cols};
    const ENEMIES: &[usize] = &[${enemies.join(", ")}];
    
    let pos = std::cell::RefCell::new(${start});
    
    let is_slime_left = || {
      let pos = *pos.borrow();
      
      if pos % COLS == 0 {
        return false;
      }
      for i in 0..ROWS {
        for j in 0..(pos % COLS) {
          if ENEMIES.contains(&(i * COLS + j)) { return true }
        }
      }
      false
    };
    let is_slime_right = || {
      let pos = *pos.borrow();

      if pos % COLS == COLS-1 {
        return false;
      }
      for i in 0..ROWS {
        for j in ((pos+1) % COLS)..COLS {
          if ENEMIES.contains(&(i * COLS + j)) { return true }
        }
      }
      false
    };
    let isl = is_slime_left;
    let isr = is_slime_right;
    
    let up = || {
      if *pos.borrow() < COLS {
        return;
      }
      *pos.borrow_mut() -= COLS;
      println!("UP");
    };
    let down =  || {
      if *pos.borrow() >= ROWS * (COLS-1) {
        return;
      }
      *pos.borrow_mut() += COLS;
      println!("DOWN");
    };
    let left = || { 
      if *pos.borrow() % COLS == 0 {
        return;
      }
      println!("LEFT");
      *pos.borrow_mut() -= 1;
    };
    let right = || { 
      if *pos.borrow() % COLS == COLS-1 {
        return;
      }
      println!("RIGHT");
      *pos.borrow_mut() += 1;
    };
    let u = up;
    let d = down;
    let l = left;
    let r = right;

    __VALUE__
    `.replaceAll(/\s\s|\n/g, "")
  }
};

export default basicMovement;
