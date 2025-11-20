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

  let currentTheorem: { name: string; statement: string; proof: string; lineStart: number } | null = null;
  let braceDepth = 0;
  let inProof = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for theorem/lemma declarations
    const theoremMatch = trimmed.match(/^(theorem|lemma)\s+(\w+)\s*[:=]/);
    if (theoremMatch) {
      if (currentTheorem) {
        // Save previous theorem
        const type = currentTheorem.name.startsWith('lemma_') ? 'lemma' : 'theorem';
        const info: TheoremInfo = {
          name: currentTheorem.name,
          statement: currentTheorem.statement,
          proof: currentTheorem.proof,
          lineStart: currentTheorem.lineStart,
          lineEnd: i - 1,
        };
        if (type === 'lemma') {
          lemmas.push(info);
        } else {
          theorems.push(info);
        }
      }

      const name = theoremMatch[2];
      const statement = line.substring(line.indexOf(':') + 1).trim();
      currentTheorem = {
        name,
        statement,
        proof: '',
        lineStart: i,
      };
      inProof = false;
      braceDepth = 0;
    }

    // Check for definitions
    const defMatch = trimmed.match(/^def\s+(\w+)\s*[:=]/);
    if (defMatch) {
      const name = defMatch[1];
      const type = line.includes(':') ? line.substring(line.indexOf(':') + 1, line.indexOf('=') !== -1 ? line.indexOf('=') : undefined).trim() : '';
      const value = line.includes('=') ? line.substring(line.indexOf('=') + 1).trim() : undefined;
      
      definitions.push({
        name,
        type,
        value,
        lineStart: i,
        lineEnd: i,
      });
    }

    // Track proof content
    if (currentTheorem) {
      if (trimmed.includes(':=') || trimmed.includes('by')) {
        inProof = true;
      }

      if (inProof) {
        currentTheorem.proof += line + '\n';
        
        // Count braces for proof boundaries
        for (const char of line) {
          if (char === '{') braceDepth++;
          if (char === '}') braceDepth--;
        }

        // Check for dependencies (using statements)
        const useMatch = trimmed.match(/use\s+(\w+)/);
        if (useMatch) {
          dependencies.push(useMatch[1]);
        }

        const applyMatch = trimmed.match(/apply\s+(\w+)/);
        if (applyMatch) {
          dependencies.push(applyMatch[1]);
        }

        // End of proof
        if (braceDepth === 0 && trimmed && !trimmed.startsWith('--')) {
          if (trimmed.match(/^(theorem|lemma|def|end|namespace)/)) {
            // Save current theorem
            const type = currentTheorem.name.startsWith('lemma_') ? 'lemma' : 'theorem';
            const info: TheoremInfo = {
              name: currentTheorem.name,
              statement: currentTheorem.statement,
              proof: currentTheorem.proof.trim(),
              lineStart: currentTheorem.lineStart,
              lineEnd: i - 1,
            };
            if (type === 'lemma') {
              lemmas.push(info);
            } else {
              theorems.push(info);
            }
            currentTheorem = null;
            inProof = false;
          }
        }
      }
    }
  }

  // Save last theorem if exists
  if (currentTheorem) {
    const type = currentTheorem.name.startsWith('lemma_') ? 'lemma' : 'theorem';
    const info: TheoremInfo = {
      name: currentTheorem.name,
      statement: currentTheorem.statement,
      proof: currentTheorem.proof.trim(),
      lineStart: currentTheorem.lineStart,
      lineEnd: lines.length - 1,
    };
    if (type === 'lemma') {
      lemmas.push(info);
    } else {
      theorems.push(info);
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

