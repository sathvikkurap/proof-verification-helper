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

    const data = await response.json();
    const suggestions = parseOllamaResponse(data.response, context);

    return suggestions;
  } catch (error) {
    // Silently fall back to rule-based system
    return [];
  }
}

function buildLeanPrompt(context: AIContext): string {
  let prompt = `You are an expert Lean 4 formal proof assistant with deep knowledge of theorem proving, tactics, and the Lean 4 standard library. Provide detailed, actionable suggestions for formal proof construction.

Given the following Lean 4 proof context:

\`\`\`lean
${context.proofCode}
\`\`\`

`;

  if (context.errorMessage) {
    prompt += `ERROR MESSAGE: ${context.errorMessage}\n\n`;
    prompt += `Analyze this error and provide 3-4 detailed suggestions to fix it. Focus on:\n`;
    prompt += `- Specific tactics or lemmas to apply\n`;
    prompt += `- Code structure changes needed\n`;
    prompt += `- Import statements that might be missing\n`;
    prompt += `- Type annotations or syntax corrections\n\n`;
  } else if (context.currentGoal) {
    prompt += `CURRENT PROOF GOAL: ${context.currentGoal}\n\n`;
    prompt += `Analyze this goal and suggest 4-5 detailed proof steps. Consider:\n`;
    prompt += `- Which tactics would be most effective\n`;
    prompt += `- Relevant lemmas from the standard library\n`;
    prompt += `- Proof strategies (induction, case analysis, etc.)\n`;
    prompt += `- When to use automation vs manual steps\n\n`;
  } else {
    prompt += `Suggest 4-6 detailed improvements and next steps for this proof. Analyze:\n`;
    prompt += `- Proof structure and completeness\n`;
    prompt += `- Missing lemmas or definitions\n`;
    prompt += `- Optimization opportunities\n`;
    prompt += `- Standard library theorems to use\n\n`;
  }

  prompt += `Format your response as a numbered list with EXACTLY this structure:

1. **[TYPE]** Suggestion Title
   **Content:** exact code/tactic to use
   **Why it works:** detailed explanation of the mathematical reasoning
   **When to use:** specific conditions where this applies
   **Example:** concrete code example showing usage

2. **[TYPE]** Another Suggestion Title
   **Content:** exact code/tactic to use
   **Why it works:** detailed explanation of the mathematical reasoning
   **When to use:** specific conditions where this applies
   **Example:** concrete code example showing usage

IMPORTANT:
- Use [tactic] for proof tactics, [lemma] for theorems/lemmas, [fix] for error fixes, [step] for general advice
- Be specific about Lean 4 syntax and standard library functions
- Explain the mathematical logic behind each suggestion
- Include working code examples
- Focus on correctness and clarity`;

  return prompt;
}

function parseOllamaResponse(response: string, context: AIContext): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const sections = response.split(/\d+\.\s*\*\*[^*]+\*\*/).filter(s => s.trim());

  // Alternative parsing for the detailed format
  const numberedSections = response.split(/\d+\.\s*\*\*(\w+)\*\*\s*([^\n]+)/);

  for (let i = 1; i < numberedSections.length; i += 3) {
    const type = numberedSections[i]?.toLowerCase() || 'step';
    const title = numberedSections[i + 1]?.trim() || '';

    if (!title) continue;

    // Extract content, why it works, when to use, and example
    const sectionContent = numberedSections[i + 2] || '';
    const contentMatch = sectionContent.match(/\*\*Content:\*\*\s*([^\n]+)/);
    const whyMatch = sectionContent.match(/\*\*Why it works:\*\*\s*([^\n]+)/);
    const whenMatch = sectionContent.match(/\*\*When to use:\*\*\s*([^\n]+)/);
    const exampleMatch = sectionContent.match(/\*\*Example:\*\*\s*([^\n]+)/);

    const content = contentMatch?.[1]?.trim() || title;
    const explanation = [
      whyMatch?.[1]?.trim(),
      whenMatch?.[1]?.trim(),
      exampleMatch?.[1]?.trim() ? `Example: ${exampleMatch[1].trim()}` : null
    ].filter(Boolean).join('\n\n');

    if (content) {
      suggestions.push({
        id: `ollama-${suggestions.length}`,
        type: (['lemma', 'tactic', 'fix', 'step'].includes(type) ? type : 'step') as any,
        content: content,
        explanation: explanation || `Advanced suggestion: ${title}`,
        confidence: 0.85, // Higher confidence for Ollama suggestions
        context: context.proofCode,
      });
    }
  }

  // Fallback parsing if the new format doesn't match
  if (suggestions.length === 0) {
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
  }

  return suggestions.slice(0, 5); // Limit to 5 suggestions
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
  } catch (error) {
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
    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch {
    return [];
  }
}

