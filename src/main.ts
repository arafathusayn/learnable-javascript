import "./style.css";
import {
  EditorView,
  keymap,
  lineNumbers,
  drawSelection,
  rectangularSelection,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import {
  defaultKeymap,
  standardKeymap,
  historyKeymap,
  history,
  indentWithTab,
} from "@codemirror/commands";
import { dracula } from "thememirror";

const $ = document.querySelector.bind(document);
const container = $<HTMLDivElement>("#app");
const codeContainer = $<HTMLDivElement>("#app #code");
const outputContainer = $<HTMLDivElement>("#app #output");

if (!container || !codeContainer || !outputContainer)
  throw new Error("html not set properly");

let code = `
// script.js
function binarySearch(array = ["a", "b", "c", "d", "e"], value = "f")
{
  // Try editing the code
  let iterations = 1;
  let start = 0;
  let end = array.length - 1;

  while (start <= end) { // while (true) won't loop infinitely
    // middle of array
    const mid = Math.floor((start + end) / 2);

    const current = array[mid];

    if (current === value) {
      // found value in array
      return mid;
    }

    if (value < array[mid]) {
      end = mid - 1;
      // only to visualize:
      start = start;
    } else {
      start = mid + 1;
      // only to visualize:
      end = end;
    }

    iterations += 1; // iterations++
  }

  // not found value in array
  return -1;
}
`.trim();

const worker = new ComlinkWorker<typeof import("./worker")>(
  new URL("./worker", import.meta.url),
);

const updateDom = async (code: string, maxValues: number) => {
  const result = await worker.runCodeInWorker(code, maxValues);

  if (!result) {
    return;
  }

  if (result instanceof Map) {
    outputContainer.innerHTML = "";

    const table = document.createElement("table");

    result.forEach((values, key) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");

      let td = document.createElement("td");

      th.textContent = key;

      tr.appendChild(th);

      if (values instanceof Array) {
        values.forEach((value, i) => {
          td = document.createElement("td");
          td.classList.add("cell");

          if (values.length > 1) {
            td.classList.add("right-border");

            if (i === 0) {
              td.classList.add("left-border");
            }
          }

          try {
            td.textContent =
              typeof value !== "undefined"
                ? JSON.stringify(value)
                : "undefined";
          } catch (error) {
            console.error(error);
            td.textContent = value as string;
          }
          tr.appendChild(td);
        });
      } else if (values instanceof Error) {
        const td = document.createElement("td");

        td.innerHTML = `<p style="color:#ff79c6;">${
          values.stack?.split("\n")[0] || values.message
        }</p>`;

        tr.appendChild(td);
      }

      if (key === "return") {
        let tr = document.createElement("tr");
        tr.innerHTML = "&nbsp;";
        table.appendChild(tr);
        tr = document.createElement("tr");
        tr.innerHTML = "&nbsp;";
        table.appendChild(tr);
      }

      table.appendChild(tr);
    });

    outputContainer.appendChild(table);
  } else if (typeof result === "object" && result.type === "error") {
    outputContainer.innerHTML = `<p style="color:#ff79c6;">${result.message}</p>`;
  }
};

const run = async (code: string) => {
  outputContainer.innerHTML = "";
  updateDom(
    code,
    "maxValues" in window && typeof window.maxValues === "number"
      ? window.maxValues
      : 51,
  );
};

const state = EditorState.create({
  doc: code,
  extensions: [
    dracula,

    javascript({ jsx: false }),

    history({ minDepth: 1000 }),

    drawSelection(),

    rectangularSelection(),

    keymap.of([
      ...defaultKeymap,
      ...standardKeymap,
      ...historyKeymap,
      indentWithTab,
    ]),

    lineNumbers(),

    EditorState.allowMultipleSelections.of(true),

    EditorView.updateListener.of((e) => {
      run(e.state.doc.toString());
    }),
  ],
});

new EditorView({
  parent: codeContainer,
  state,
});
