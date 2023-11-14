import React, { useState } from "preact/compat";
import ReactDOM from "preact/compat";
import Editor from "@yozora/react-code-editor";

import hljs from "highlight.js";
import rust from "highlight.js/lib/languages/rust";
hljs.registerLanguage("rust", rust);
// const AceEditor = (await import("react-ace")).default;

function CodeBlock() {
  const [code, setCode] = useState<string>('println!("Hello world!")');
  return <Editor lang="rust" code={code} onChange={setCode} />;
}

export default CodeBlock;
