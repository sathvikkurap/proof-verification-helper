import { getOllamaSuggestions } from './ollamaService';
import { parseLeanCode } from '../utils/leanParser';
import { logPerformance } from '../utils/logger';

export interface AIContext {
  proofCode: string;
  currentGoal?: string;
  errorMessage?: string;
  proofState?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface Suggestion {
  id: string;
  type: 'lemma' | 'tactic' | 'fix' | 'step';
  content: string;
  explanation: string;
  confidence: number;
  context: string;
  category?: string;
  prerequisites?: string[];
  examples?: string[];
}

// Enhanced Lean 4 Knowledge Base
const LEAN_KNOWLEDGE_BASE = {
  tactics: [
    {
      name: 'rfl',
      description: 'Reflexivity - proves x = x',
      when: 'You have a goal of the form x = x or need to prove equality of identical terms',
      confidence: 0.95,
      category: 'equality',
      examples: ['rfl', 'apply Eq.refl']
    },
    {
      name: 'rw',
      description: 'Rewrite using equality lemmas',
      when: 'You have an equality you want to apply to your goal or hypotheses',
      confidence: 0.9,
      category: 'equality',
      examples: ['rw [Nat.add_comm]', 'rw [← Nat.add_assoc]']
    },
    {
      name: 'simp',
      description: 'Simplify expressions using equational lemmas',
      when: 'You want to simplify complex expressions or unfold definitions',
      confidence: 0.85,
      category: 'simplification',
      examples: ['simp', 'simp [Nat.add_zero]', 'simp at h']
    },
    {
      name: 'apply',
      description: 'Apply a theorem or lemma to the current goal',
      when: 'You have a theorem that matches your goal or can transform it',
      confidence: 0.8,
      category: 'application',
      examples: ['apply Nat.zero_add', 'apply And.intro h1 h2']
    },
    {
      name: 'intro',
      description: 'Introduce variables for universal quantifiers or implications',
      when: 'Your goal is ∀x, P(x) or P → Q',
      confidence: 0.9,
      category: 'logic',
      examples: ['intro x', 'intros h1 h2']
    },
    {
      name: 'cases',
      description: 'Case analysis on inductive types or hypotheses',
      when: 'You need to consider different cases of an inductive type',
      confidence: 0.85,
      category: 'cases',
      examples: ['cases x', 'cases h with h1 h2']
    },
    {
      name: 'induction',
      description: 'Prove by induction on natural numbers or inductive types',
      when: 'Proving properties that hold for all natural numbers or inductive structures',
      confidence: 0.8,
      category: 'induction',
      examples: ['induction n with d hd', 'induction xs with x xs ih']
    },
    {
      name: 'constructor',
      description: 'Apply constructors of inductive types',
      when: 'Building values of inductive types or proving existence',
      confidence: 0.75,
      category: 'construction',
      examples: ['apply Or.inl', 'constructor', 'left', 'right']
    },
    {
      name: 'have',
      description: 'Introduce intermediate results',
      when: 'You need to prove a lemma or intermediate result within a proof',
      confidence: 0.7,
      category: 'intermediate',
      examples: ['have h : x = y := rfl', 'have := by simp']
    },
    {
      name: 'calc',
      description: 'Chain equalities step by step',
      when: 'Proving complex equalities that can be broken down into steps',
      confidence: 0.75,
      category: 'equality',
      examples: ['calc x = y := rfl\n     _ = z := by rw [h]']
    }
  ],
  lemmas: [
    {
      name: 'Nat.add_zero',
      description: 'n + 0 = n',
      category: 'arithmetic',
      confidence: 0.95
    },
    {
      name: 'Nat.zero_add',
      description: '0 + n = n',
      category: 'arithmetic',
      confidence: 0.95
    },
    {
      name: 'Nat.add_comm',
      description: 'n + m = m + n',
      category: 'arithmetic',
      confidence: 0.9
    },
    {
      name: 'Nat.add_assoc',
      description: '(n + m) + k = n + (m + k)',
      category: 'arithmetic',
      confidence: 0.9
    },
    {
      name: 'Nat.mul_zero',
      description: 'n * 0 = 0',
      category: 'arithmetic',
      confidence: 0.9
    },
    {
      name: 'Nat.zero_mul',
      description: '0 * n = 0',
      category: 'arithmetic',
      confidence: 0.9
    },
    {
      name: 'Nat.mul_one',
      description: 'n * 1 = n',
      category: 'arithmetic',
      confidence: 0.9
    },
    {
      name: 'Nat.one_mul',
      description: '1 * n = n',
      category: 'arithmetic',
      confidence: 0.9
    }
  ],
  patterns: {
    arithmetic: {
      induction: 'Most arithmetic proofs use induction on natural numbers',
      simplification: 'Use simp for basic arithmetic simplifications',
      commutativity: 'Addition and multiplication are commutative'
    },
    logic: {
      implication: 'P → Q means if P is true then Q must be true',
      conjunction: 'P ∧ Q means both P and Q are true',
      disjunction: 'P ∨ Q means at least one of P or Q is true'
    }
  }
};

function analyzeError(errorMessage: string, context: AIContext): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Common Lean 4 error patterns
  if (errorMessage.includes('unknown identifier') || errorMessage.includes('undefined')) {
    suggestions.push({
      id: 'fix-import',
      type: 'fix',
      content: 'import Mathlib',
      explanation: 'Missing import statement - Lean 4 requires explicit imports for most theorems',
      confidence: 0.9,
      context: context.proofCode,
      category: 'imports'
    });
  }

  if (errorMessage.includes('type mismatch') || errorMessage.includes('expected type')) {
    suggestions.push({
      id: 'fix-type-annotation',
      type: 'fix',
      content: 'Add explicit type annotations',
      explanation: 'Lean 4 sometimes needs explicit type annotations to resolve ambiguities',
      confidence: 0.7,
      context: context.proofCode,
      category: 'types'
    });
  }

  if (errorMessage.includes('tactic failed') || errorMessage.includes('does not apply')) {
    suggestions.push({
      id: 'fix-tactic-order',
      type: 'fix',
      content: 'Check tactic order and goal state',
      explanation: 'Some tactics must be applied in specific order or goal states',
      confidence: 0.6,
      context: context.proofCode,
      category: 'tactics'
    });
  }

  return suggestions;
}

function analyzePatterns(context: AIContext): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const parsed = parseLeanCode(context.proofCode);

  // Check for common patterns
  if (parsed.theorems.some(t => t.statement.includes('+'))) {
    suggestions.push(...LEAN_KNOWLEDGE_BASE.tactics
      .filter(t => t.category === 'arithmetic')
      .map(t => ({
        id: `pattern-arith-${t.name}`,
        type: 'tactic' as const,
        content: t.name,
        explanation: t.description,
        confidence: t.confidence,
        context: context.proofCode,
        category: 'pattern'
      })));
  }

  if (parsed.theorems.some(t => t.statement.includes('∀') || t.statement.includes('→'))) {
    suggestions.push(...LEAN_KNOWLEDGE_BASE.tactics
      .filter(t => t.category === 'logic')
      .map(t => ({
        id: `pattern-logic-${t.name}`,
        type: 'tactic' as const,
        content: t.name,
        explanation: t.description,
        confidence: t.confidence,
        context: context.proofCode,
        category: 'pattern'
      })));
  }

  if (parsed.theorems.some(t => t.statement.includes('Nat'))) {
    suggestions.push({
      id: 'pattern-induction',
      type: 'step',
      content: 'Consider induction for natural number proofs',
      explanation: 'Many properties of natural numbers are proved by induction',
      confidence: 0.8,
      context: context.proofCode,
      category: 'patterns'
    });
  }

  return suggestions.slice(0, 3);
}

function suggestRelevantLemmas(context: AIContext): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const parsed = parseLeanCode(context.proofCode);

  // Analyze proof content for relevant lemmas
  const code = context.proofCode.toLowerCase();

  if (code.includes('add') || code.includes('+')) {
    suggestions.push(...LEAN_KNOWLEDGE_BASE.lemmas
      .filter(l => l.category === 'arithmetic')
      .map(l => ({
        id: `lemma-${l.name}`,
        type: 'lemma' as const,
        content: l.name,
        explanation: l.description,
        confidence: l.confidence,
        context: context.proofCode,
        category: 'lemmas'
      })));
  }

  return suggestions.slice(0, 3);
}

function suggestTactics(context: AIContext): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Goal-directed tactic suggestions
  if (context.currentGoal) {
    const goal = context.currentGoal.toLowerCase();

    if (goal.includes('=') && !goal.includes('→') && !goal.includes('∀')) {
      // Equality goals
      suggestions.push(...LEAN_KNOWLEDGE_BASE.tactics
        .filter(t => ['equality', 'simplification'].includes(t.category || ''))
        .slice(0, 2)
        .map(t => ({
          id: `goal-eq-${t.name}`,
          type: 'tactic' as const,
          content: t.name,
          explanation: t.description,
          confidence: t.confidence,
          context: context.proofCode,
          category: 'goal-directed'
        })));
    }

    if (goal.includes('∀')) {
      // Universal quantification
      suggestions.push(...LEAN_KNOWLEDGE_BASE.tactics
        .filter(t => t.category === 'logic')
        .slice(0, 2)
        .map(t => ({
          id: `goal-forall-${t.name}`,
          type: 'tactic' as const,
          content: t.name,
          explanation: t.description,
          confidence: t.confidence,
          context: context.proofCode,
          category: 'goal-directed'
        })));
    }

    if (goal.includes('∧') || goal.includes('∨')) {
      // Logical connectives
      suggestions.push(...LEAN_KNOWLEDGE_BASE.tactics
        .filter(t => t.category === 'logic' || t.category === 'cases')
        .slice(0, 2)
        .map(t => ({
          id: `goal-logic-${t.name}`,
          type: 'tactic' as const,
          content: t.name,
          explanation: t.description,
          confidence: t.confidence,
          context: context.proofCode,
          category: 'goal-directed'
        })));
    }
  }

  return suggestions;
}

function getGeneralSuggestions(context: AIContext): Suggestion[] {
  return LEAN_KNOWLEDGE_BASE.tactics
    .filter(t => t.confidence > 0.8)
    .slice(0, 3)
    .map(t => ({
      id: `general-${t.name}`,
      type: 'tactic' as const,
      content: t.name,
      explanation: t.description,
      confidence: t.confidence,
      context: context.proofCode,
      category: 'general'
    }));
}

export async function getAISuggestions(context: AIContext): Promise<Suggestion[]> {
  const startTime = Date.now();

  try {
    const suggestions: Suggestion[] = [];

    // Error-specific suggestions
    if (context.errorMessage) {
      suggestions.push(...analyzeError(context.errorMessage, context));
    }

    // Pattern-based suggestions
    suggestions.push(...analyzePatterns(context));

    // Relevant lemmas
    suggestions.push(...suggestRelevantLemmas(context));

    // Tactic suggestions
    suggestions.push(...suggestTactics(context));

    // Fallback to general suggestions
    if (suggestions.length < 3) {
      suggestions.push(...getGeneralSuggestions(context));
    }

    // Get Ollama suggestions for advanced reasoning
    let ollamaSuggestions: Suggestion[] = [];
    try {
      ollamaSuggestions = await getOllamaSuggestions(context);
    } catch (error) {
      // Ollama failed, continue with rule-based suggestions
    }

    // Combine and deduplicate suggestions
    const allSuggestions = [...suggestions, ...ollamaSuggestions];
    const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.content === suggestion.content)
    );

    // Sort by confidence and limit
    const finalSuggestions = uniqueSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6);

    logPerformance('getAISuggestions', startTime, {
      suggestionCount: finalSuggestions.length,
      ollamaUsed: ollamaSuggestions.length > 0
    });

    return finalSuggestions;
  } catch (error) {
    logPerformance('getAISuggestions', startTime, { error: true });
    // Return basic fallback suggestions
    return getGeneralSuggestions(context);
  }
}
