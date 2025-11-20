import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export default function CodeEditor({ value, onChange, height = '600px', readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    // Register Lean 4 language
    monaco.languages.register({ id: 'lean4' });

    monaco.languages.setMonarchTokensProvider('lean4', {
      tokenizer: {
        root: [
          [/--.*$/, 'comment'],
          [/\/-[\s\S]*?-\//, 'comment'],
          [/\b(theorem|lemma|def|example|axiom|structure|class|instance|namespace|end|import|open|variable|variables|section|end)\b/, 'keyword'],
          [/\b(if|then|else|by|have|let|in|match|with|fun|λ|→|∀|∃|∧|∨|¬|↔|:=|:)\b/, 'keyword'],
          [/\b(rw|simp|apply|exact|intro|use|constructor|split|left|right|cases|induction|reflexivity|symmetry|transitivity)\b/, 'keyword'],
          [/\b(Prop|Type|Type\*|Sort|Nat|Int|Real|Bool|String|List|Array|Option|Result)\b/, 'type'],
          [/[0-9]+/, 'number'],
          [/"[^"]*"/, 'string'],
          [/[a-z_][a-zA-Z0-9_']*/, 'identifier'],
          [/[A-Z][a-zA-Z0-9_']*/, 'type.identifier'],
        ],
      },
    });

    monaco.editor.defineTheme('lean4-theme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955' },
        { token: 'keyword', foreground: '0000ff', fontStyle: 'bold' },
        { token: 'type', foreground: '267f99' },
        { token: 'type.identifier', foreground: '267f99' },
        { token: 'string', foreground: 'a31515' },
        { token: 'number', foreground: '098658' },
      ],
      colors: {},
    });
  }, []);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <Editor
        height={height}
        defaultLanguage="lean4"
        theme="lean4-theme"
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          readOnly,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  );
}

