// Ollama Local LLM Integration for Enhanced AI Suggestions
// This provides better AI capabilities while remaining 100% free and local

// Using global fetch (Node 18+) - no import needed for modern Node
// For older Node versions, install: npm install node-fetch@2

// Use global fetch (available in Node 18+)
const fetchFn = globalThis.fetch;

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
console.log('🔧 Ollama service loaded');

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
      return []; // Fall back to rule-based
    }

    // Build enhanced prompt for Lean 4 proof assistance
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
      return []; // Fall back to rule-based
    }

    const data = await response.json() as { response: string };
    console.log('🤖 Raw Ollama response:', data.response);
    const suggestions = parseOllamaResponse(data.response, context);
    console.log('📝 Parsed suggestions:', suggestions.length, suggestions);

    return suggestions;
  } catch (error) {
    // Silently fall back to rule-based system
    return [];
  }
}

function buildLeanPrompt(context: AIContext): string {
  let prompt = `You are an expert Lean 4 proof assistant. Analyze this Lean 4 code and provide helpful suggestions.

Code:
\`\`\`lean
${context.proofCode}
\`\`\`

`;

  if (context.errorMessage) {
    prompt += `Error: ${context.errorMessage}\n\n`;
    prompt += `Suggest 3 fixes for this error.`;
  } else if (context.currentGoal) {
    prompt += `Current goal: ${context.currentGoal}\n\n`;
    prompt += `Suggest 3 next steps to prove this goal.`;
  } else {
    prompt += `Suggest 3 improvements or next steps for this proof.`;
  }

  prompt += `\n\nFormat as simple numbered list:
1. [tactic] exact_lean_code - brief explanation
2. [lemma] exact_lean_code - brief explanation
3. [step] exact_lean_code - brief explanation`;

  return prompt;
}

function parseOllamaResponse(response: string, context: AIContext): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const lines = response.split('\n').filter(line => line.trim());

  let currentSuggestion: Partial<Suggestion> | null = null;

  for (const line of lines) {
    // Match numbered list items
    const numberMatch = line.match(/^\d+\.\s*(.+)$/);
    if (numberMatch) {
      // Save previous suggestion
      if (currentSuggestion && currentSuggestion.content) {
        suggestions.push({
          id: `ollama-${suggestions.length}`,
          type: currentSuggestion.type || 'step',
          content: currentSuggestion.content,
          explanation: currentSuggestion.explanation || 'AI suggested tactic',
          confidence: 0.8,
          context: context.proofCode,
        });
      }

      const content = numberMatch[1].trim();
      // Extract code in backticks and type
      const codeMatch = content.match(/`([^`]+)`(?:\s*(\w+))?/);
      if (codeMatch) {
        const [, code, type] = codeMatch;
        currentSuggestion = {
          content: code,
          type: (['lemma', 'tactic', 'fix', 'step'].includes(type) ? type : 'tactic') as any,
        };
      } else {
        // Fallback: take everything before "exact_lean_code" or similar
        const cleanContent = content.replace(/exact_lean_code/g, '').trim();
        currentSuggestion = {
          content: cleanContent,
          type: 'tactic',
        };
      }
    } else if (currentSuggestion && line.includes('Brief Explanation:')) {
      // Extract explanation
      const explanationMatch = line.match(/Brief Explanation:\s*(.+)$/);
      if (explanationMatch) {
        currentSuggestion.explanation = explanationMatch[1].trim();
      }
    }
  }

  // Add last suggestion
  if (currentSuggestion && currentSuggestion.content) {
    suggestions.push({
      id: `ollama-${suggestions.length}`,
      type: currentSuggestion.type || 'step',
      content: currentSuggestion.content,
      explanation: currentSuggestion.explanation || 'AI suggested tactic',
      confidence: 0.8,
      context: context.proofCode,
    });
  }

  return suggestions.slice(0, 3); // Limit to 3 suggestions
}

/**
 * Check if Ollama is available and running
 */
export async function checkOllamaAvailability(
  baseUrl: string = DEFAULT_CONFIG.baseUrl!
): Promise<boolean> {
  console.log('🔍 Checking Ollama at:', baseUrl);
  try {
    const response = await fetchFn(`${baseUrl}/api/tags`, {
      method: 'GET',
    });
    const isOk = response.ok;
    console.log('📊 Ollama response OK:', isOk);
    return isOk;
  } catch (error: any) {
    console.log('❌ Ollama check error:', error.message);
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
    const data = await response.json() as { models?: Array<{ name: string }> };
    return data.models?.map((m) => m.name) || [];
  } catch {
    return [];
  }
}

