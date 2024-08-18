import { type CodeQuestion, codeMess, replace, rustRandomNum } from "./CodeQuestion";

const MAX_TEMP = 0;
const MIN_TEMP = -2;
const temps = [MAX_TEMP + 5, MIN_TEMP - 5];

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
      println!("Remember the instructions, set 'target' to the minimum or maximum temperature!");
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
    return undefined;
  }
} as CodeQuestion;