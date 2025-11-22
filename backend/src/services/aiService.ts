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
    {
      name: 'simp',
      description: 'Automatically simplify expressions using available lemmas',
      when: 'Goal contains arithmetic, logical operations, or can be simplified',
      confidence: 0.8,
      examples: ['simp', 'simp at h1', 'simp [Nat.add_comm, Nat.mul_comm]']
    },
    {
      name: 'rw',
      description: 'Rewrite expressions using equality lemmas',
      when: 'You have an equality that can replace part of your goal',
      confidence: 0.7,
      examples: ['rw [Nat.add_comm]', 'rw [← Nat.add_assoc]', 'rw [h1] at h2']
    },
    {
      name: 'apply',
      description: 'Apply a theorem or lemma to the current goal',
      when: 'The conclusion of a theorem matches your goal',
      confidence: 0.7,
      examples: ['apply Nat.add_comm', 'apply h1']
    },
    {
      name: 'exact',
      description: 'Provide the exact proof term when you know it',
      when: 'You have a direct proof term that matches the goal exactly',
      confidence: 0.9,
      examples: ['exact rfl', 'exact h1', 'exact Nat.zero_add x']
    },
    {
      name: 'intro',
      description: 'Introduce universal quantifiers or implications',
      when: 'Goal starts with ∀ (forall) or → (implies)',
      confidence: 0.8,
      examples: ['intro x', 'intro h', 'intros x y h1 h2']
    },
    {
      name: 'use',
      description: 'Provide a witness for existential quantification',
      when: 'Goal starts with ∃ (exists)',
      confidence: 0.8,
      examples: ['use 0', 'use (x + 1)', 'use ⟨x, h⟩']
    },
    {
      name: 'constructor',
      description: 'Apply constructors of inductive types',
      when: 'Goal is an inductive type like And, Or, Prod, Sum',
      confidence: 0.7,
      examples: ['constructor', 'left', 'right', 'split']
    },
    {
      name: 'cases',
      description: 'Perform case analysis on inductive types',
      when: 'You need to consider all possible constructors of a type',
      confidence: 0.7,
      examples: ['cases h', 'cases x with h1 h2', 'rcases h with ⟨x, y, hxy⟩']
    },
    {
      name: 'induction',
      description: 'Prove by structural induction',
      when: 'Proving properties of recursive structures (Nat, List, Tree)',
      confidence: 0.8,
      examples: ['induction x', 'induction n with d hd', 'induction l with x xs ih']
    },
    {
      name: 'trivial',
      description: 'Solve obviously true goals',
      when: 'Goal is true, or follows directly from assumptions',
      confidence: 0.9,
      examples: ['trivial']
    },
    {
      name: 'reflexivity',
      description: 'Prove equality by reflexivity',
      when: 'Goal is x = x or similar obvious equality',
      confidence: 0.9,
      examples: ['rfl', 'reflexivity']
    },
    {
      name: 'assumption',
      description: 'Use a hypothesis that matches the goal exactly',
      when: 'One of your assumptions is identical to the goal',
      confidence: 0.9,
      examples: ['assumption']
    },
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
      content: 'Add explicit type annotations for variables',
      explanation: 'Type mismatch errors occur when Lean cannot infer the correct types. Add type annotations like (variable : Type) to clarify your intent. For example: let x : Nat := 5; instead of let x := 5;',
      confidence: 0.85,
      context: code,
    });
    suggestions.push({
      id: 'fix-type-2',
      type: 'fix',
      content: 'Check function argument types match expected parameters',
      explanation: 'Functions require specific argument types. If you see "type mismatch", verify that the arguments you\'re passing match the function signature. For example, Nat.add expects Nat arguments, not arbitrary types.',
      confidence: 0.8,
      context: code,
    });
    suggestions.push({
      id: 'fix-type-3',
      type: 'fix',
      content: 'Use type conversion functions when needed',
      explanation: 'If you need to convert between types, use explicit conversion functions. For example, to convert Int to Nat, use Int.toNat; for String to Nat, use String.toNat!.',
      confidence: 0.7,
      context: code,
    });
  }

  if (lowerError.includes('unknown') || lowerError.includes('not found')) {
    suggestions.push({
      id: 'fix-unknown-1',
      type: 'fix',
      content: 'Import required modules or definitions',
      explanation: 'Unknown identifier errors mean the name is not in scope. Add import statements at the top of your file. For example: import Mathlib.Data.Nat.Basic -- for Nat functions; import Mathlib.Tactic -- for common tactics.',
      confidence: 0.9,
      context: code,
    });
    suggestions.push({
      id: 'fix-unknown-2',
      type: 'fix',
      content: 'Check variable names and spelling',
      explanation: 'Verify that all variable names are spelled correctly and match their definitions. Lean is case-sensitive, so "Nat" ≠ "nat". Also check that variables are defined before use.',
      confidence: 0.85,
      context: code,
    });
    suggestions.push({
      id: 'fix-unknown-3',
      type: 'fix',
      content: 'Use fully qualified names for standard library functions',
      explanation: 'Some functions need full qualification. For example, use Nat.add instead of add, or List.length instead of length. This avoids naming conflicts and makes code clearer.',
      confidence: 0.75,
      context: code,
    });
  }

  if (lowerError.includes('syntax') || lowerError.includes('parse')) {
    suggestions.push({
      id: 'fix-syntax-1',
      type: 'fix',
      content: 'Fix syntax: use := for definitions, → for functions',
      explanation: 'Lean uses := for definitions and → for function types. For example: def add (x y : Nat) : Nat := x + y; not def add (x y : Nat) : Nat = x + y; Also check for proper spacing and punctuation.',
      confidence: 0.8,
      context: code,
    });
    suggestions.push({
      id: 'fix-syntax-2',
      type: 'fix',
      content: 'Check parentheses and bracket matching',
      explanation: 'Every opening parenthesis/brace/bracket must have a matching closing one. Use parentheses for function calls: f(x), and curly braces for implicit arguments: {α : Type}.',
      confidence: 0.75,
      context: code,
    });
    suggestions.push({
      id: 'fix-syntax-3',
      type: 'fix',
      content: 'Verify theorem/proof structure is correct',
      explanation: 'Theorems should follow: theorem name (args) : proposition := proof. Proofs use by/intro/induction etc. Check that your structure matches Lean\'s expected format.',
      confidence: 0.7,
      context: code,
    });
  }

  if (lowerError.includes('goal') || lowerError.includes('not proved')) {
    suggestions.push({
      id: 'fix-goal-1',
      type: 'fix',
      content: 'Complete the proof by adding more tactics',
      explanation: 'The proof is incomplete. After stating the theorem, you need a proof block with tactics. For example: theorem example : true := trivial; or use a proof block: theorem example : true := by trivial;',
      confidence: 0.9,
      context: code,
    });
    suggestions.push({
      id: 'fix-goal-2',
      type: 'fix',
      content: 'Use "by" keyword for tactic-mode proofs',
      explanation: 'For tactic-mode proofs, use "by" followed by tactics. For example: theorem add_comm : ∀ x y : Nat, x + y = y + x := by rw [Nat.add_comm]; This tells Lean to use tactics to construct the proof.',
      confidence: 0.85,
      context: code,
    });
    suggestions.push({
      id: 'fix-goal-3',
      type: 'fix',
      content: 'Check that all cases are covered in case analysis',
      explanation: 'If using cases or induction, ensure you prove all branches. Each case in a match or inductive proof must be handled. Use sorry; as a placeholder if stuck on a case.',
      confidence: 0.75,
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
