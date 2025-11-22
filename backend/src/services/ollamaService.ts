// Ollama Local LLM Integration for Enhanced AI Suggestions
// This provides better AI capabilities while remaining 100% free and local

// Using global fetch (Node 18+) - no import needed for modern Node
// For older Node versions, install: npm install node-fetch@2

// Use global fetch, fallback to node-fetch if available
const fetchFn = (globalThis as any).fetch;

export interface OllamaConfig {
  baseUrl?: string; // Default: http://localhost:11434
  model?: string; // Default: 'llama3.2' or 'codellama' or 'deepseek-coder'
  enabled?: boolean; // Whether to use Ollama (falls back to rule-based if false)
}

const DEFAULT_CONFIG: OllamaConfig = {
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llama3.2',
  enabled: process.env.OLLAMA_ENABLED !== 'false', // Enable by default unless explicitly disabled
};

export interface AIContext {
  proofCode: string;
  currentGoal?: string;
  errorMessage?: string;
  proofState?: string;
}

export interface Suggestion {
  id: string;
  type: 'lemma' | 'tactic' | 'fix' | 'step';
  content: string;
  explanation: string;
  confidence: number;
  context: string;
}

/**
 * Get AI suggestions using Ollama local LLM
 * Falls back to rule-based system if Ollama is not available
 */
export async function getOllamaSuggestions(
  context: AIContext,
  config: OllamaConfig = {}
): Promise<Suggestion[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // If Ollama is not enabled, return empty to use fallback
  if (!finalConfig.enabled) {
    return [];
  }

  try {
    // Check if Ollama is running
    const healthCheck = await fetchFn(`${finalConfig.baseUrl}/api/tags`, {
      method: 'GET',
    }).catch(() => null);

    if (!healthCheck || !healthCheck.ok) {
      console.log('Ollama not available, using rule-based fallback');
      return [];
    }

    // Build prompt for Lean 4 proof assistance
    const prompt = buildLeanPrompt(context);

    // Call Ollama API
    const response = await fetchFn(`${finalConfig.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: finalConfig.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const suggestions = parseOllamaResponse(data.response, context);

    return suggestions;
  } catch (error) {
    console.error('Ollama service error:', error);
    // Fall back to rule-based system
    return [];
  }
}

function buildLeanPrompt(context: AIContext): string {
  let prompt = `You are an expert in Lean 4 formal proof verification. Provide helpful suggestions for proof construction.

Given the following Lean 4 proof:

\`\`\`lean
${context.proofCode}
\`\`\`

`;

  if (context.errorMessage) {
    prompt += `Error: ${context.errorMessage}\n\n`;
    prompt += `Suggest fixes for this error. Provide 2-3 specific suggestions with explanations.\n`;
  } else if (context.currentGoal) {
    prompt += `Current goal: ${context.currentGoal}\n\n`;
    prompt += `Suggest the next step or relevant lemmas. Provide 2-3 specific suggestions.\n`;
  } else {
    prompt += `Suggest relevant lemmas, tactics, or next steps for this proof. Provide 3-5 specific suggestions.\n`;
  }

  prompt += `\nFormat your response as a numbered list. For each suggestion:
1. Type (lemma/tactic/fix/step)
2. The suggestion content
3. Brief explanation

Example:
1. [lemma] Nat.add_comm - Use commutativity of addition
2. [tactic] simp - Simplify the goal using available lemmas
3. [step] induction a - Prove by induction on variable a`;

  return prompt;
}

function parseOllamaResponse(response: string, context: AIContext): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const lines = response.split('\n').filter(line => line.trim());

  let currentSuggestion: Partial<Suggestion> | null = null;
  let suggestionIndex = 0;

  for (const line of lines) {
    // Match numbered list items
    const numberedMatch = line.match(/^\d+\.\s*\[?(\w+)\]?\s*(.+)/);
    if (numberedMatch) {
      // Save previous suggestion
      if (currentSuggestion && currentSuggestion.content) {
        suggestions.push({
          id: `ollama-${suggestionIndex++}`,
          type: (currentSuggestion.type as any) || 'step',
          content: currentSuggestion.content,
          explanation: currentSuggestion.explanation || '',
          confidence: 0.75,
          context: context.proofCode,
        });
      }

      const type = numberedMatch[1].toLowerCase();
      const content = numberedMatch[2].trim();

      currentSuggestion = {
        type: (['lemma', 'tactic', 'fix', 'step'].includes(type) ? type : 'step') as any,
        content: content.split(' - ')[0].trim(),
        explanation: content.includes(' - ') ? content.split(' - ').slice(1).join(' - ') : '',
      };
    } else if (currentSuggestion && line.trim()) {
      // Continue building explanation
      if (!currentSuggestion.explanation) {
        currentSuggestion.explanation = line.trim();
      } else {
        currentSuggestion.explanation += ' ' + line.trim();
      }
    }
  }

  // Add last suggestion
  if (currentSuggestion && currentSuggestion.content) {
    suggestions.push({
      id: `ollama-${suggestionIndex++}`,
      type: (currentSuggestion.type as any) || 'step',
      content: currentSuggestion.content,
      explanation: currentSuggestion.explanation || '',
      confidence: 0.75,
      context: context.proofCode,
    });
  }

  return suggestions;
}

/**
 * Check if Ollama is available and running
 */
export async function checkOllamaAvailability(
  baseUrl: string = DEFAULT_CONFIG.baseUrl!
): Promise<boolean> {
  try {
    const response = await fetchFn(`${baseUrl}/api/tags`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get available Ollama models
 */
export async function getAvailableModels(
  baseUrl: string = DEFAULT_CONFIG.baseUrl!
): Promise<string[]> {
  try {
    const response = await fetchFn(`${baseUrl}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch {
    return [];
  }
}

