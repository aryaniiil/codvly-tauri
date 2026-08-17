import { useEffect, useRef } from "react";
import { EditorState, Compartment, Annotation } from "@codemirror/state";

// Marks programmatic document swaps (file switching) so the change listener
// does not treat them as user edits.
const ExternalChange = Annotation.define<boolean>();
import { EditorView, keymap } from "@codemirror/view";
import type { ViewUpdate } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import type { Extension } from "@codemirror/state";

function languageFor(filename: string): Extension | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const name = filename.toLowerCase();
  if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx" || ext === "mjs" || ext === "cjs")
    return javascript({ jsx: true, typescript: true });
  if (ext === "json" || ext === "jsonc") return json();
  if (ext === "html" || ext === "htm") return html();
  if (ext === "css" || ext === "scss" || ext === "sass" || ext === "less") return css();
  if (ext === "md" || ext === "markdown" || ext === "mdx") return markdown();
  if (ext === "py") return python();
  if (name === "dockerfile") return null;
  return null;
}

export interface CodeEditorProps {
  value: string;
  filename: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

export function CodeEditor({ value, filename, onChange, onSave }: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langCompartment = useRef(new Compartment());
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);

  onChangeRef.current = onChange;
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!hostRef.current) return;
    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        oneDark,
        langCompartment.current.of(languageFor(filename) ?? []),
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": {
            fontFamily:
              '"SFMono-Regular", "JetBrains Mono", Menlo, Consolas, monospace',
            fontSize: "13px",
            lineHeight: "1.6",
          },
          ".cm-content": { padding: "10px 0" },
          "&.cm-focused": { outline: "none" },
        }),
        keymap.of([
          {
            key: "Mod-s",
            preventDefault: true,
            run: () => {
              onSaveRef.current();
              return true;
            },
          },
          indentWithTab,
        ]),
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            const isExternal = update.transactions.some((tr) =>
              tr.annotation(ExternalChange),
            );
            if (isExternal) return;
            const next = update.state.doc.toString();
            valueRef.current = next;
            onChangeRef.current(next);
          }
        }),
      ],
    });
    const view = new EditorView({ state: startState, parent: hostRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap document + language when a different file is opened.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (valueRef.current !== value) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
        annotations: ExternalChange.of(true),
      });
      valueRef.current = value;
    }
    view.dispatch({
      effects: langCompartment.current.reconfigure(languageFor(filename) ?? []),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filename, value]);

  return <div className="cm-host" ref={hostRef} />;
}
