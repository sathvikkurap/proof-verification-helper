import { Suggestion } from '../types';
import { parseLeanCode } from '../utils/leanParser';
import { getOllamaSuggestions, checkOllamaAvailability } from './ollamaService';

export interface AIContext {
  proofCode: string;
  currentGoal?: string;
  errorMessage?: string;
  proofState?: string;
}

// Lean 4 Knowledge Base - Common lemmas and tactics
const LEAN_KNOWLEDGE_BASE = {
  lemmas: [
    { name: 'Nat.add_comm', description: 'Commutativity of addition: a + b = b + a', category: 'arithmetic' },
    { name: 'Nat.add_assoc', description: 'Associativity of addition: (a + b) + c = a + (b + c)', category: 'arithmetic' },
    { name: 'Nat.mul_comm', description: 'Commutativity of multiplication: a * b = b * a', category: 'arithmetic' },
    { name: 'Nat.mul_assoc', description: 'Associativity of multiplication: (a * b) * c = a * (b * c)', category: 'arithmetic' },
    { name: 'Nat.add_zero', description: 'Adding zero: n + 0 = n', category: 'arithmetic' },
    { name: 'Nat.mul_zero', description: 'Multiplying by zero: n * 0 = 0', category: 'arithmetic' },
    { name: 'Nat.add_succ', description: 'Successor addition: a + succ b = succ (a + b)', category: 'arithmetic' },
    { name: 'Nat.zero_add', description: 'Zero addition: 0 + n = n', category: 'arithmetic' },
    { name: 'Nat.one_mul', description: 'One multiplication: 1 * n = n', category: 'arithmetic' },
    { name: 'Nat.mul_one', description: 'Multiplication by one: n * 1 = n', category: 'arithmetic' },
    { name: 'Eq.symm', description: 'Symmetry of equality: a = b → b = a', category: 'logic' },
    { name: 'Eq.trans', description: 'Transitivity of equality: a = b → b = c → a = c', category: 'logic' },
    { name: 'Eq.refl', description: 'Reflexivity of equality: a = a', category: 'logic' },
    { name: 'And.intro', description: 'Introduction of conjunction', category: 'logic' },
    { name: 'Or.inl', description: 'Left disjunction introduction', category: 'logic' },
    { name: 'Or.inr', description: 'Right disjunction introduction', category: 'logic' },
    { name: 'True.intro', description: 'Proof of True', category: 'logic' },
    { name: 'False.elim', description: 'Elimination of False (ex falso)', category: 'logic' },
  ],
  tactics: [
    { name: 'simp', description: 'Simplify using available lemmas', when: 'goal can be simplified', confidence: 0.8 },
    { name: 'rw', description: 'Rewrite using an equality lemma', when: 'you have an equality to apply', confidence: 0.7 },
    { name: 'apply', description: 'Apply a theorem to the goal', when: 'goal matches theorem conclusion', confidence: 0.7 },
    { name: 'exact', description: 'Provide exact proof term', when: 'you have the exact proof', confidence: 0.9 },
    { name: 'intro', description: 'Introduce a hypothesis', when: 'goal is an implication or forall', confidence: 0.8 },
    { name: 'use', description: 'Provide witness for existential', when: 'goal is an existential', confidence: 0.8 },
    { name: 'constructor', description: 'Apply constructor of inductive type', when: 'goal is inductive type', confidence: 0.7 },
    { name: 'cases', description: 'Case analysis on a variable', when: 'you need to consider cases', confidence: 0.7 },
    { name: 'induction', description: 'Prove by induction', when: 'proving property of natural numbers or lists', confidence: 0.8 },
    { name: 'trivial', description: 'Solve trivial goals', when: 'goal is obviously true', confidence: 0.9 },
    { name: 'reflexivity', description: 'Prove equality by reflexivity', when: 'goal is x = x', confidence: 0.9 },
    { name: 'assumption', description: 'Use an assumption from context', when: 'goal matches an assumption', confidence: 0.9 },
  ],
  patterns: [
    {
      pattern: /theorem.*:.*True/,
      suggestions: ['trivial', 'exact True.intro'],
      explanation: 'For proving True, use trivial or exact True.intro',
    },
    {
      pattern: /theorem.*:.*(\w+)\s*=\s*\1/,
      suggestions: ['reflexivity', 'rfl'],
      explanation: 'For equality with same term on both sides, use reflexivity',
    },
    {
      pattern: /theorem.*:.*(\w+)\s*\+\s*(\w+)\s*=\s*\2\s*\+\s*\1/,
      suggestions: ['Nat.add_comm', 'rw [Nat.add_comm]'],
      explanation: 'For commutativity of addition, use Nat.add_comm',
    },
    {
      pattern: /theorem.*:.*(\w+)\s*\*\s*(\w+)\s*=\s*\2\s*\*\s*\1/,
      suggestions: ['Nat.mul_comm', 'rw [Nat.mul_comm]'],
      explanation: 'For commutativity of multiplication, use Nat.mul_comm',
    },
    {
      pattern: /theorem.*:.*(\w+)\s*→/,
      suggestions: ['intro', 'assume'],
      explanation: 'For implications, start with intro to assume the hypothesis',
    },
    {
      pattern: /theorem.*:.*∃/,
      suggestions: ['use', 'constructor'],
      explanation: 'For existentials, use "use" to provide a witness',
    },
  ],
};

export async function getAISuggestions(context: AIContext): Promise<Suggestion[]> {
  // Auto-detect Ollama: try it automatically, fall back gracefully if not available
  // This makes it work seamlessly for non-technical users - no configuration needed!
  const ollamaAvailable = await checkOllamaAvailability();
  
  if (ollamaAvailable) {
    try {
      const ollamaSuggestions = await getOllamaSuggestions(context);
      if (ollamaSuggestions.length > 0) {
        // Combine with rule-based for best results
        const ruleBased = getIntelligentSuggestions(context);
        // Merge and deduplicate, prioritizing Ollama
        return mergeSuggestions(ollamaSuggestions, ruleBased);
      }
    } catch (error) {
      // Silently fall back to rule-based - works great even without Ollama
      console.log('Ollama unavailable, using rule-based suggestions');
    }
  }
  
  // Use intelligent rule-based system (free and high quality)
  // This always works, even without Ollama - perfect for non-technical users!
  return getIntelligentSuggestions(context);
}

function mergeSuggestions(ollama: Suggestion[], ruleBased: Suggestion[]): Suggestion[] {
  const merged: Suggestion[] = [...ollama];
  const seen = new Set(ollama.map(s => s.content.toLowerCase()));
  
  // Add rule-based suggestions that aren't duplicates
  for (const suggestion of ruleBased) {
    if (!seen.has(suggestion.content.toLowerCase())) {
      merged.push(suggestion);
      seen.add(suggestion.content.toLowerCase());
    }
  }
  
  // Sort by confidence and return top 5
  return merged
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

function getIntelligentSuggestions(context: AIContext): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const parsed = parseLeanCode(context.proofCode);

  // Analyze error messages
  if (context.errorMessage) {
    suggestions.push(...analyzeError(context.errorMessage, context.proofCode));
  }

  // Pattern-based suggestions
  suggestions.push(...analyzePatterns(context.proofCode));

  // Context-aware lemma suggestions
  suggestions.push(...suggestRelevantLemmas(parsed, context.proofCode));

  // Tactic suggestions based on proof state
  suggestions.push(...suggestTactics(parsed, context.currentGoal));

  // If no suggestions, provide general helpful ones
  if (suggestions.length === 0) {
    suggestions.push(...getGeneralSuggestions(context));
  }

  // Sort by confidence and return top suggestions
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

function analyzeError(errorMessage: string, code: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const lowerError = errorMessage.toLowerCase();

  if (lowerError.includes('type') || lowerError.includes('mismatch')) {
    suggestions.push({
      id: 'fix-type-1',
      type: 'fix',
      content: 'Check type annotations and ensure all terms have compatible types',
      explanation: 'Type mismatch errors usually mean you need to add type annotations or use type-correct terms. Check that function arguments match expected types.',
      confidence: 0.85,
      context: code,
    });
    suggestions.push({
      id: 'fix-type-2',
      type: 'fix',
      content: 'Try adding explicit type annotations: (variable : Type)',
      explanation: 'Explicit type annotations can help Lean understand your intent when types are ambiguous.',
      confidence: 0.75,
      context: code,
    });
  }

  if (lowerError.includes('unknown') || lowerError.includes('not found')) {
    suggestions.push({
      id: 'fix-unknown-1',
      type: 'fix',
      content: 'Check that all variables and lemmas are properly defined or imported',
      explanation: 'Unknown identifier errors mean the name is not in scope. Check imports, definitions, and variable declarations.',
      confidence: 0.9,
      context: code,
    });
  }

  if (lowerError.includes('syntax') || lowerError.includes('parse')) {
    suggestions.push({
      id: 'fix-syntax-1',
      type: 'fix',
      content: 'Check syntax: ensure proper use of :=, →, and parentheses',
      explanation: 'Syntax errors often come from missing :=, incorrect arrow syntax (→ vs ->), or mismatched parentheses/brackets.',
      confidence: 0.8,
      context: code,
    });
  }

  if (lowerError.includes('goal') || lowerError.includes('not proved')) {
    suggestions.push({
      id: 'fix-goal-1',
      type: 'fix',
      content: 'The proof is incomplete. Try adding more tactics or lemmas',
      explanation: 'Incomplete proof means you need more steps. Consider using simp, apply, or other tactics to make progress.',
      confidence: 0.8,
      context: code,
    });
  }

  return suggestions;
}

function analyzePatterns(code: string): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const patternInfo of LEAN_KNOWLEDGE_BASE.patterns) {
    if (patternInfo.pattern.test(code)) {
      patternInfo.suggestions.forEach((suggestion, index) => {
        suggestions.push({
          id: `pattern-${suggestions.length}`,
          type: suggestion.includes('_') ? 'lemma' : 'tactic',
          content: suggestion,
          explanation: patternInfo.explanation,
          confidence: 0.75 - index * 0.1,
          context: code,
        });
      });
    }
  }

  return suggestions;
}

function suggestRelevantLemmas(parsed: any, code: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const codeLower = code.toLowerCase();

  // Check for arithmetic operations
  if (code.includes('+') || code.includes('add')) {
    const arithmeticLemmas = LEAN_KNOWLEDGE_BASE.lemmas.filter(l => l.category === 'arithmetic');
    arithmeticLemmas.slice(0, 3).forEach(lemma => {
      suggestions.push({
        id: `lemma-${lemma.name}`,
        type: 'lemma',
        content: lemma.name,
        explanation: lemma.description,
        confidence: codeLower.includes('comm') ? 0.8 : 0.6,
        context: code,
      });
    });
  }

  // Check for equality
  if (code.includes('=') && !code.includes('==')) {
    const logicLemmas = LEAN_KNOWLEDGE_BASE.lemmas.filter(l => l.category === 'logic' && l.name.includes('Eq'));
    logicLemmas.slice(0, 2).forEach(lemma => {
      suggestions.push({
        id: `lemma-${lemma.name}`,
        type: 'lemma',
        content: lemma.name,
        explanation: lemma.description,
        confidence: 0.7,
        context: code,
      });
    });
  }

  // Check for logical connectives
  if (code.includes('∧') || code.includes('And')) {
    suggestions.push({
      id: 'lemma-And.intro',
      type: 'lemma',
      content: 'And.intro',
      explanation: 'To prove A ∧ B, use And.intro with proofs of A and B',
      confidence: 0.8,
      context: code,
    });
  }

  if (code.includes('∨') || code.includes('Or')) {
    suggestions.push({
      id: 'lemma-Or',
      type: 'lemma',
      content: 'Or.inl or Or.inr',
      explanation: 'To prove A ∨ B, use Or.inl for left side or Or.inr for right side',
      confidence: 0.8,
      context: code,
    });
  }

  return suggestions;
}

function suggestTactics(parsed: any, currentGoal?: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const goal = currentGoal?.toLowerCase() || '';

  // Suggest tactics based on goal type
  for (const tactic of LEAN_KNOWLEDGE_BASE.tactics) {
    let confidence = tactic.confidence;

    // Increase confidence if tactic matches goal
    if (goal.includes('simpl') && tactic.name === 'simp') confidence = 0.9;
    if (goal.includes('equality') && tactic.name === 'reflexivity') confidence = 0.9;
    if (goal.includes('implication') && tactic.name === 'intro') confidence = 0.9;
    if (goal.includes('existential') && tactic.name === 'use') confidence = 0.9;

    suggestions.push({
      id: `tactic-${tactic.name}`,
      type: 'tactic',
      content: tactic.name,
      explanation: `${tactic.description}. ${tactic.when}.`,
      confidence,
      context: '',
    });
  }

  // Always suggest common tactics
  const commonTactics = ['simp', 'apply', 'exact', 'trivial'].map(name => {
    const tactic = LEAN_KNOWLEDGE_BASE.tactics.find(t => t.name === name);
    return {
      id: `tactic-common-${name}`,
      type: 'tactic' as const,
      content: name,
      explanation: tactic?.description || 'Common proof tactic',
      confidence: 0.7,
      context: '',
    };
  });

  return [...suggestions, ...commonTactics];
}

function getGeneralSuggestions(context: AIContext): Suggestion[] {
  return [
    {
      id: 'general-1',
      type: 'step',
      content: 'Try using simp to simplify the goal',
      explanation: 'simp is a powerful tactic that automatically simplifies goals using available lemmas',
      confidence: 0.6,
      context: context.proofCode,
    },
    {
      id: 'general-2',
      type: 'step',
      content: 'Check if you can apply a relevant lemma using apply or rw',
      explanation: 'Many proofs can be completed by applying existing lemmas from the standard library',
      confidence: 0.6,
      context: context.proofCode,
    },
    {
      id: 'general-3',
      type: 'step',
      content: 'Break down complex goals into simpler subgoals',
      explanation: 'Use tactics like constructor, cases, or split to break complex goals into manageable parts',
      confidence: 0.5,
      context: context.proofCode,
    },
  ];
}
