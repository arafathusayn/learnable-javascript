import "./style.css";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
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
function binarySearch(arr = ["a", "b", "c", "d", "e"], val = "f")
{
  let end = arr.length - 1;
  let start = 0;

  while (start <= end) { // while (true) won't loop infinitely
    const mid = ~~((start + end) / 2);

    if (arr[mid] === val) {
      return mid;
    }

    if (val < arr[mid]) {
      end = mid - 1;
    } else {
      start = mid + 1;
    }
  }

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
            td.textContent = JSON.stringify(value);
          } catch (error) {
            console.error(error);
            td.textContent = value as string;
          }
          tr.appendChild(td);
        });
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
      : 21,
  );
};

const state = EditorState.create({
  doc: code,
  extensions: [
    dracula,

    javascript({ jsx: false }),

    history({ minDepth: 1000 }),

    keymap.of(defaultKeymap),
    keymap.of(standardKeymap),
    keymap.of(historyKeymap),
    keymap.of([indentWithTab]),

    lineNumbers(),

    EditorView.updateListener.of((e) => {
      run(e.state.doc.toString());
    }),
  ],
});

new EditorView({
  parent: codeContainer,
  state,
});