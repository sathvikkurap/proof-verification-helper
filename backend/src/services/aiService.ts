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

  // Enhanced arithmetic lemmas
  if (code.includes('+') || code.includes('add') || codeLower.includes('sum')) {
    const arithmeticSuggestions = [
      {
        name: 'Nat.add_comm',
        content: 'Nat.add_comm',
        explanation: `Commutativity of addition: ∀ a b : Nat, a + b = b + a\n\nWhy it works: Addition is commutative for natural numbers\nWhen to use: When you need to swap addition operands\nExample: rw [Nat.add_comm] -- rewrites a + b to b + a`,
        confidence: codeLower.includes('comm') ? 0.9 : 0.7
      },
      {
        name: 'Nat.add_assoc',
        content: 'Nat.add_assoc',
        explanation: `Associativity of addition: ∀ a b c : Nat, (a + b) + c = a + (b + c)\n\nWhy it works: Addition is associative, allowing regrouping\nWhen to use: When rearranging addition parentheses\nExample: rw [Nat.add_assoc] -- changes grouping of additions`,
        confidence: 0.7
      },
      {
        name: 'Nat.add_zero',
        content: 'Nat.add_zero',
        explanation: `Adding zero: ∀ a : Nat, a + 0 = a\n\nWhy it works: Zero is the additive identity\nWhen to use: Simplifying expressions with + 0\nExample: rw [Nat.add_zero] -- removes + 0 from expressions`,
        confidence: code.includes('0') ? 0.8 : 0.6
      }
    ];

    arithmeticSuggestions.forEach(lemma => {
      suggestions.push({
        id: `lemma-${lemma.name}`,
        type: 'lemma',
        content: lemma.content,
        explanation: lemma.explanation,
        confidence: lemma.confidence,
        context: code,
      });
    });
  }

  // Enhanced multiplication lemmas
  if (code.includes('*') || code.includes('mul') || codeLower.includes('product')) {
    const multiplicationSuggestions = [
      {
        name: 'Nat.mul_comm',
        content: 'Nat.mul_comm',
        explanation: `Commutativity of multiplication: ∀ a b : Nat, a * b = b * a\n\nWhy it works: Multiplication is commutative for natural numbers\nWhen to use: When you need to swap multiplication operands\nExample: rw [Nat.mul_comm] -- rewrites a * b to b * a`,
        confidence: codeLower.includes('comm') ? 0.9 : 0.7
      },
      {
        name: 'Nat.mul_zero',
        content: 'Nat.mul_zero',
        explanation: `Multiplying by zero: ∀ a : Nat, a * 0 = 0\n\nWhy it works: Zero is the multiplicative annihilator\nWhen to use: Simplifying expressions with * 0\nExample: rw [Nat.mul_zero] -- simplifies a * 0 to 0`,
        confidence: code.includes('0') ? 0.8 : 0.6
      },
      {
        name: 'Nat.mul_one',
        content: 'Nat.mul_one',
        explanation: `Multiplying by one: ∀ a : Nat, a * 1 = a\n\nWhy it works: One is the multiplicative identity\nWhen to use: Simplifying expressions with * 1\nExample: rw [Nat.mul_one] -- removes * 1 from expressions`,
        confidence: code.includes('1') ? 0.8 : 0.6
      }
    ];

    multiplicationSuggestions.forEach(lemma => {
      suggestions.push({
        id: `lemma-${lemma.name}`,
        type: 'lemma',
        content: lemma.content,
        explanation: lemma.explanation,
        confidence: lemma.confidence,
        context: code,
      });
    });
  }

  // Enhanced logical lemmas
  if (code.includes('∧') || code.includes('And') || codeLower.includes('conjunction')) {
    suggestions.push({
      id: 'lemma-And.intro',
      type: 'lemma',
      content: 'And.intro',
      explanation: `Introduction rule for conjunction: ∀ a b : Prop, a → b → a ∧ b\n\nWhy it works: To prove A ∧ B, prove both A and B separately\nWhen to use: Goal is a conjunction (A ∧ B)\nExample: And.intro (proof_of_A) (proof_of_B)`,
      confidence: 0.85,
      context: code,
    });
  }

  if (code.includes('∨') || code.includes('Or') || codeLower.includes('disjunction')) {
    suggestions.push({
      id: 'lemma-Or.intro',
      type: 'lemma',
      content: 'Or.inl and Or.inr',
      explanation: `Introduction rules for disjunction: ∀ a b : Prop, a → a ∨ b, b → a ∨ b\n\nWhy it works: To prove A ∨ B, prove either A (Or.inl) or B (Or.inr)\nWhen to use: Goal is a disjunction (A ∨ B)\nExample: Or.inl proof_of_A -- proves left side\nExample: Or.inr proof_of_B -- proves right side`,
      confidence: 0.85,
      context: code,
    });
  }

  // Enhanced equality lemmas
  if (code.includes('=') && !code.includes('≠') && !code.includes('==')) {
    const equalitySuggestions = [
      {
        name: 'Eq.refl',
        content: 'Eq.refl',
        explanation: `Reflexivity of equality: ∀ a : α, a = a\n\nWhy it works: Everything equals itself\nWhen to use: Proving x = x or similar reflexive equalities\nExample: Eq.refl x -- proves x = x`,
        confidence: 0.8
      },
      {
        name: 'Eq.symm',
        content: 'Eq.symm',
        explanation: `Symmetry of equality: ∀ a b : α, a = b → b = a\n\nWhy it works: Equality is symmetric\nWhen to use: Need to flip an equality\nExample: Eq.symm h -- converts a = b to b = a`,
        confidence: 0.75
      },
      {
        name: 'Eq.trans',
        content: 'Eq.trans',
        explanation: `Transitivity of equality: ∀ a b c : α, a = b → b = c → a = c\n\nWhy it works: Equality chains together\nWhen to use: Combining multiple equalities\nExample: Eq.trans h₁ h₂ -- combines a = b and b = c into a = c`,
        confidence: 0.75
      }
    ];

    equalitySuggestions.forEach(lemma => {
      suggestions.push({
        id: `lemma-${lemma.name}`,
        type: 'lemma',
        content: lemma.content,
        explanation: lemma.explanation,
        confidence: lemma.confidence,
        context: code,
      });
    });
  }

  return suggestions;
}

function suggestTactics(parsed: any, currentGoal?: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const goal = currentGoal?.toLowerCase() || '';

  // Enhanced tactic suggestions with detailed explanations
  const enhancedTactics = [
    {
      name: 'simp',
      content: 'simp',
      explanation: `Automatically simplifies expressions using available lemmas and definitions. This tactic applies simplification rules, unfolds definitions, and uses arithmetic properties. Most effective when you have complex expressions that can be reduced to simpler forms.\n\nExample: simp at h₁ -- simplifies hypothesis h₁\nExample: simp [Nat.add_comm, Nat.mul_comm] -- uses specific lemmas`,
      confidence: goal.includes('simpl') ? 0.95 : 0.8,
      examples: ['simp', 'simp at h', 'simp [lemma1, lemma2]']
    },
    {
      name: 'rw',
      content: 'rw [Nat.add_comm]',
      explanation: `Rewrite expressions using equality lemmas. Replace left side with right side (or vice versa with ←). Essential for manipulating equations and using known equivalences.\n\nWhy it works: Transforms the goal using mathematical equivalences\nWhen to use: When you have equalities you want to apply to your goal\nExample: rw [Nat.add_comm] -- rewrite using commutativity\nExample: rw [← Nat.add_assoc] -- rewrite backwards`,
      confidence: goal.includes('equality') || goal.includes('=') ? 0.9 : 0.7,
      examples: ['rw [lemma]', 'rw [← lemma]', 'rw [h] at h2']
    },
    {
      name: 'apply',
      content: 'apply Nat.add_comm',
      explanation: `Apply a theorem or lemma to the current goal. Matches the goal conclusion with the lemma conclusion, generating subgoals for the lemma premises.\n\nWhy it works: Uses existing proved theorems to solve new goals\nWhen to use: When your goal matches a known theorem's conclusion\nExample: apply Nat.add_comm -- applies commutativity theorem`,
      confidence: goal.includes('implication') || goal.includes('→') ? 0.85 : 0.7,
      examples: ['apply theorem_name', 'apply h']
    },
    {
      name: 'exact',
      content: 'exact rfl',
      explanation: `Provide the exact proof term when you know it precisely. This is the most direct way to prove a goal when you have the exact proof.\n\nWhy it works: Directly gives Lean the proof term it needs\nWhen to use: When you know the exact proof or have a hypothesis that matches\nExample: exact rfl -- proves x = x\nExample: exact h -- uses hypothesis h directly`,
      confidence: 0.85,
      examples: ['exact proof_term', 'exact h']
    },
    {
      name: 'intro',
      content: 'intro x',
      explanation: `Introduce universal quantifiers (∀) or implications (→). Creates a hypothesis and focuses on the conclusion.\n\nWhy it works: Breaks down complex goals into manageable parts\nWhen to use: Goal starts with ∀ or →\nExample: intro x -- introduces ∀x\nExample: intros h₁ h₂ -- introduces multiple hypotheses`,
      confidence: goal.includes('∀') || goal.includes('→') ? 0.95 : 0.75,
      examples: ['intro x', 'intros h1 h2', 'intro (h : P)']
    },
    {
      name: 'induction',
      content: 'induction n',
      explanation: `Prove by structural induction on inductive types (Nat, List, Tree, etc.). Generates base case and inductive step.\n\nWhy it works: Mathematical induction principle for recursive structures\nWhen to use: Proving properties of recursive data types\nExample: induction n with | zero => ... | succ n ih => ...\nExample: induction l with | nil => ... | cons x xs ih => ...`,
      confidence: goal.includes('nat') || goal.includes('list') ? 0.9 : 0.7,
      examples: ['induction x', 'induction n with d hd', 'induction l with x xs ih']
    },
    {
      name: 'cases',
      content: 'cases h',
      explanation: `Case analysis on inductive types. Considers all possible constructors of a type.\n\nWhy it works: Exhaustive case analysis covers all possibilities\nWhen to use: Need to handle different cases of an inductive type\nExample: cases h -- case analysis on hypothesis h\nExample: cases x with | inl a => ... | inr b => ... -- pattern matching`,
      confidence: 0.75,
      examples: ['cases h', 'cases x with p1 p2', 'rcases h with ⟨x, y⟩']
    },
    {
      name: 'trivial',
      content: 'trivial',
      explanation: `Solves obviously true goals like True, equality of identical terms, or goals that follow immediately from assumptions.\n\nWhy it works: Recognizes trivial mathematical truths\nWhen to use: Goal is obviously true or follows directly from context\nExample: trivial -- solves True, rfl-style goals`,
      confidence: 0.9,
      examples: ['trivial']
    },
    {
      name: 'reflexivity',
      content: 'reflexivity',
      explanation: `Proves equality by reflexivity (x = x). Also handles more complex reflexive equalities.\n\nWhy it works: All things are equal to themselves\nWhen to use: Goal is x = x or similar reflexive equality\nExample: reflexivity -- proves x = x\nExample: rfl -- short form`,
      confidence: goal.includes('=') && !goal.includes('≠') ? 0.9 : 0.7,
      examples: ['reflexivity', 'rfl']
    }
  ];

  for (const tactic of enhancedTactics) {
    suggestions.push({
      id: `tactic-${tactic.name}`,
      type: 'tactic',
      content: tactic.content,
      explanation: tactic.explanation,
      confidence: tactic.confidence,
      context: '',
    });
  }

  return suggestions;
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
