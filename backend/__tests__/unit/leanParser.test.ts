import { parseLeanCode } from '../../src/utils/leanParser';
import { ParsedProof } from '../../src/utils/leanParser';

describe('Lean Parser', () => {
  describe('Simple Theorems', () => {
    it('should parse simple theorem correctly', () => {
      const code = 'theorem test : True := trivial';
      const result: ParsedProof = parseLeanCode(code);

      expect(result.theorems).toHaveLength(1);
      expect(result.theorems[0]).toEqual({
        name: 'test',
        statement: 'True :',
        proof: 'theorem test : True := trivial',
        lineStart: 0,
        lineEnd: 0,
      });
      expect(result.errors).toHaveLength(0);
    });

    it('should parse theorem with complex statement', () => {
      const code = 'theorem add_comm (n m : Nat) : n + m = m + n := by rfl';
      const result = parseLeanCode(code);

      expect(result.theorems).toHaveLength(1);
      expect(result.theorems[0].name).toBe('add_comm');
      expect(result.theorems[0].statement).toBe('(n m : Nat) : n + m');
    });
  });

  describe('Definitions', () => {
    it('should parse simple definitions', () => {
      const code = 'def add (n m : Nat) : Nat := n + m';
      const result = parseLeanCode(code);

      expect(result.definitions).toHaveLength(1);
      expect(result.definitions[0]).toEqual({
        name: 'add',
        type: '(n m : Nat) : Nat :',
        value: 'n + m',
        lineStart: 0,
        lineEnd: 0,
      });
    });
  });

  describe('Lemmas', () => {
    it('should parse lemmas', () => {
      const code = 'lemma add_zero (n : Nat) : n + 0 = n := rfl';
      const result = parseLeanCode(code);

      expect(result.lemmas).toHaveLength(1);
      expect(result.lemmas[0].name).toBe('add_zero');
    });
  });

  describe('Multi-line Code', () => {
    it('should handle multiple theorems', () => {
      const code = `
        theorem t1 : True := trivial
        theorem t2 : False = False := rfl
        lemma l1 : ∀ n, n = n := λ n => rfl
      `;
      const result = parseLeanCode(code);

      expect(result.theorems).toHaveLength(2);
      expect(result.lemmas).toHaveLength(1);
    });

    it('should handle mixed content', () => {
      const code = `
        def add (n m : Nat) : Nat := n + m

        theorem add_zero : ∀ n, add n 0 = n := by
          intro n
          induction n
          case zero => rfl
          case succ n' ih => exact ih

        lemma add_succ : ∀ n m, add n (succ m) = succ (add n m) := by
          intros n m
          induction n
          case zero => rfl
          case succ n' ih => simp [add, ih]
      `;
      const result = parseLeanCode(code);

      expect(result.definitions).toHaveLength(1);
      expect(result.theorems).toHaveLength(1);
      expect(result.lemmas).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Dependencies', () => {
    it('should extract dependencies from proofs', () => {
      const code = `
        theorem dep_test : True := by
          apply some_theorem
          exact another_lemma
          rw [some_def]
      `;
      const result = parseLeanCode(code);

      expect(result.dependencies).toContain('some_theorem');
      expect(result.dependencies).toContain('another_lemma');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty code', () => {
      const result = parseLeanCode('');
      expect(result.theorems).toHaveLength(0);
      expect(result.lemmas).toHaveLength(0);
      expect(result.definitions).toHaveLength(0);
    });

    it('should handle invalid syntax gracefully', () => {
      const code = 'invalid {{{ syntax }}}';
      const result = parseLeanCode(code);

      // Parser should not crash, even with invalid syntax
      expect(result).toBeDefined();
      expect(Array.isArray(result.theorems)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle theorems with special characters', () => {
      const code = 'theorem ∀_test : ∀ x, x = x := λ x => rfl';
      const result = parseLeanCode(code);

      expect(result.theorems).toHaveLength(1);
      expect(result.theorems[0].name).toBe('_test');
    });
  });
});
