import { createRegExp } from "magic-regexp";
import { type CodeQuestion, codeMessLines, codeMessQuestion, replace, rustRandomNum } from "./CodeQuestion";
import { _, any, end, line, start } from "./regex";

const MAX_TEMP = 0;
const MIN_TEMP = -2;

export const code = `
if temp > MAX_TEMP {
  target = MAX_TEMP;
} else if temp < MIN_TEMP {
  target = MIN_TEMP;
}
`;

const instructions = "Remember the instructions, set 'target' to the minimum or maximum temperature!";

export default {
  setup: `
  const MAX_TEMP: i32 = ${MAX_TEMP};
  const MIN_TEMP: i32 = ${MIN_TEMP};

  let check = |temp, target| {
    if temp >= MAX_TEMP && target >= MAX_TEMP {
      println!("'temp' is {}°C above the maximum temperature", temp - MAX_TEMP);
      println!("'target' is set to maximum temperature\n");
      println!("The current and target temperatures are too high, the fish will spoil!");
      return false;
    } else if temp <= MIN_TEMP && target <= MIN_TEMP {
      println!("'temp' is {}°C below the minimum temperature", MIN_TEMP - temp);
      println!("'target' is set to minimum temperature\n");
      println!("The current and target temperatures are too low, the fish will freeze!");
      return false;
    } else if target != MAX_TEMP && target != MIN_TEMP {
      println!("${instructions}");
      return false;
    }
    return true;
  };
  
  let temps = if ${rustRandomNum} % 2 == 0 { 
    [MAX_TEMP + 5, MIN_TEMP - 5]
  } else {
    [MIN_TEMP - 5, MAX_TEMP + 5]
  };
  
  for temp in temps {
    let mut target = 0;
    {
      __VALUE__
    }
    if !check(temp, target) { return }
  }
  
  let temp = *temps.iter().min().unwrap();
  println!("'temp' is {}°C below the minimum temperature", MIN_TEMP - temp);
  println!("'target' is set to maximum temperature\n");
  println!("The temperature target now adjusts correctly!\nSUCCESS");
  `,
  validator: (value, test) => {
    const regex = createRegExp(
      start, _,
      "if", _, "temp", _, ">", _, "MAX_TEMP", _, "{", _,
      "target", _, "=", _, any.times.any().as("first"), _, ";", _,
      "}", _, "else", _, "if", _, "temp", _, "<", _, "MIN_TEMP", _, "{", _,
      "target", _, "=", _, any.times.any().as("second"), _, ";", _,
      "}", _, end
    );
    const matches = value.match(regex);
    if (!matches) return codeMessLines([2, 4]);
    
    const { first = "", second = "" } = matches.groups;
    const valid = ["MAX_TEMP", "MIN_TEMP"];
    return !valid.includes(first.trim()) && `There's an error in the assignment on the 2nd line.\n${instructions}`
      || !valid.includes(second.trim()) && `There's an error in the assignment on the 4th line.\n${instructions}`
      || undefined;
  }
} as CodeQuestion;