// Basic Lean 4 parser for extracting proof structure
export interface ParsedProof {
  theorems: TheoremInfo[];
  lemmas: TheoremInfo[];
  definitions: DefinitionInfo[];
  dependencies: string[];
  errors: ParseError[];
}

export interface TheoremInfo {
  name: string;
  statement: string;
  proof?: string;
  lineStart: number;
  lineEnd: number;
}

export interface DefinitionInfo {
  name: string;
  type: string;
  value?: string;
  lineStart: number;
  lineEnd: number;
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
}

export function parseLeanCode(code: string): ParsedProof {
  const lines = code.split('\n');
  const theorems: TheoremInfo[] = [];
  const lemmas: TheoremInfo[] = [];
  const definitions: DefinitionInfo[] = [];
  const dependencies: string[] = [];
  const errors: ParseError[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Parse theorems and lemmas
    const theoremMatch = trimmed.match(/^(theorem|lemma)\s+([^\s:]+)\s*:?\s*([^=]*)\s*:?=\s*(.*)$/);
    if (theoremMatch) {
      const [, type, name, statement, proof] = theoremMatch;
      const isLemma = type === 'lemma';

      const info: TheoremInfo = {
        name: name.replace(/[^\w]/g, ''), // Clean name
        statement: statement.trim(),
        proof: trimmed,
        lineStart: i,
        lineEnd: i,
      };

      if (isLemma) {
        lemmas.push(info);
      } else {
        theorems.push(info);
      }
    }

    // Parse definitions
    const defMatch = trimmed.match(/^def\s+([^\s:]+)\s*:?\s*([^=]*)\s*:?=\s*(.*)$/);
    if (defMatch) {
      const [, name, type, value] = defMatch;

      definitions.push({
        name: name.replace(/[^\w]/g, ''), // Clean name
        type: type.trim(),
        value: value.trim(),
        lineStart: i,
        lineEnd: i,
      });
    }

    // Extract dependencies from proof content
    if (trimmed.includes('apply') || trimmed.includes('rw') || trimmed.includes('exact')) {
      const depMatches = trimmed.match(/(?:apply|rw|exact)\s+([^\s]+)/g);
      if (depMatches) {
        depMatches.forEach(match => {
          const dep = match.split(/\s+/)[1];
          if (dep && !dep.includes('(') && !dep.includes('[')) {
            dependencies.push(dep);
          }
        });
      }
    }
  }

  return {
    theorems,
    lemmas,
    definitions,
    dependencies: [...new Set(dependencies)],
    errors,
  };
}

