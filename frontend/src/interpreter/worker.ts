import { initInterpreter } from "./interpreter";

let running = false;

(async () => {
  // Build main Interpreter
  const interpreter = await initInterpreter();

  // When code is received run it
  addEventListener("message", async (event) => {
    while (running) {
      await new Promise<void>(r => setTimeout(() => r(), 10));
    }
    running = true;
    const { code } = event.data;
    const result = await interpreter.run(code);
    postMessage({ result, code });
    running = false;
  });

  // Send a message when finished loading
  postMessage({ loaded: true });
})();
