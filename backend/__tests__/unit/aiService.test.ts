import { getAISuggestions } from '../../src/services/aiService';
import { Suggestion } from '../../src/services/aiService';

describe('AI Service', () => {
  const mockContext = {
    proofCode: 'theorem test : True := trivial',
    currentGoal: 'Prove True',
  };

  describe('getAISuggestions', () => {
    it('should return suggestions for basic proof', async () => {
      const suggestions = await getAISuggestions(mockContext);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      suggestions.forEach((suggestion: Suggestion) => {
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('content');
        expect(suggestion).toHaveProperty('explanation');
        expect(suggestion).toHaveProperty('confidence');
        expect(suggestion.confidence).toBeGreaterThan(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should include rule-based suggestions', async () => {
      const suggestions = await getAISuggestions(mockContext);

      // Should include at least some rule-based suggestions
      const hasTactics = suggestions.some(s => s.type === 'tactic');
      expect(hasTactics).toBe(true);
    });

    it('should handle error context', async () => {
      const errorContext = {
        ...mockContext,
        errorMessage: 'unknown identifier',
      };

      const suggestions = await getAISuggestions(errorContext);

      // Should include error-specific suggestions
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should prioritize suggestions by confidence', async () => {
      const suggestions = await getAISuggestions(mockContext);

      // Check if suggestions are sorted by confidence (highest first)
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
      }
    });

    it('should handle complex Lean code', async () => {
      const complexContext = {
        proofCode: `
          def add (n m : Nat) : Nat := n + m
          theorem add_zero : ∀ n, add n 0 = n := sorry
        `,
        currentGoal: 'Prove add_zero',
      };

      const suggestions = await getAISuggestions(complexContext);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should limit suggestions to reasonable number', async () => {
      const suggestions = await getAISuggestions(mockContext);
      expect(suggestions.length).toBeLessThanOrEqual(6);
    });

    it('should handle empty context gracefully', async () => {
      const emptyContext = {
        proofCode: 'theorem empty : True := sorry',
      };

      const suggestions = await getAISuggestions(emptyContext);
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should provide relevant arithmetic suggestions', async () => {
      const arithmeticContext = {
        proofCode: 'theorem add_comm : ∀ n m : Nat, n + m = m + n := sorry',
        currentGoal: 'Prove commutativity of addition',
      };

      const suggestions = await getAISuggestions(arithmeticContext);

      // Should include arithmetic-related suggestions
      const hasArithmeticTactic = suggestions.some(s =>
        s.content.includes('Nat.add_comm') ||
        s.explanation.toLowerCase().includes('commutative')
      );
      expect(hasArithmeticTactic).toBe(true);
    });

    it('should handle induction proofs', async () => {
      const inductionContext = {
        proofCode: 'theorem add_zero_ind : ∀ n : Nat, n + 0 = n := sorry',
        currentGoal: 'Prove by induction',
      };

      const suggestions = await getAISuggestions(inductionContext);

      // Should include induction-related suggestions
      const hasInduction = suggestions.some(s =>
        s.content.includes('induction') ||
        s.explanation.toLowerCase().includes('induction')
      );
      expect(hasInduction).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      const startTime = Date.now();
      await getAISuggestions(mockContext);
      const duration = Date.now() - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed input gracefully', async () => {
      const malformedContext = {
        proofCode: 'invalid {{{ lean }}} code',
        currentGoal: 'broken goal',
      };

      // Should not throw, but return some suggestions
      const suggestions = await getAISuggestions(malformedContext);
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle very long proofs', async () => {
      const longCode = 'theorem long : True := ' + 'trivial '.repeat(1000);
      const longContext = {
        proofCode: longCode,
      };

      const suggestions = await getAISuggestions(longContext);
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
});
