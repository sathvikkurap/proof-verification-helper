# Lean 4 Examples for Testing

This file contains various Lean 4 code examples you can use to test the proof verification helper. Start with simple examples and progress to more complex ones.

## Simple Examples

### Example 1: Basic Arithmetic
```lean
theorem add_zero (n : Nat) : n + 0 = n := by
  -- Your proof here
```

### Example 2: Simple Logic
```lean
theorem and_comm (p q : Prop) : p ∧ q → q ∧ p := by
  -- Your proof here
```

### Example 3: Equality Reasoning
```lean
theorem eq_trans (a b c : Nat) : a = b → b = c → a = c := by
  -- Your proof here
```

## Intermediate Examples

### Example 4: Induction
```lean
theorem add_succ (n m : Nat) : n + succ m = succ (n + m) := by
  induction n with
  | zero => rfl
  | succ n' ih => rw [ih]
```

### Example 5: Working with Lists
```lean
theorem length_append (xs ys : List α) : (xs ++ ys).length = xs.length + ys.length := by
  induction xs with
  | nil => simp
  | cons x xs' ih => simp [ih]
```

### Example 6: Natural Number Properties
```lean
theorem mul_zero (n : Nat) : n * 0 = 0 := by
  induction n with
  | zero => rfl
  | succ n' ih => simp [ih]
```

## Advanced Examples

### Example 7: Complex Induction
```lean
theorem fib_add (n : Nat) : fib (n + 2) = fib (n + 1) + fib n := by
  induction n with
  | zero =>
    simp [fib]
    -- fib 2 = fib 1 + fib 0
    -- 1 = 1 + 0 ✓
  | succ n' ih =>
    -- Your proof here
```

### Example 8: List Reversal
```lean
theorem reverse_append (xs ys : List α) : (xs ++ ys).reverse = ys.reverse ++ xs.reverse := by
  induction xs with
  | nil => simp
  | cons x xs' ih =>
    simp [ih]
    -- Your proof here
```

### Example 9: Tree Structures
```lean
inductive Tree (α : Type) where
  | leaf : α → Tree α
  | node : Tree α → Tree α → Tree α

def tree_size : Tree α → Nat
  | leaf _ => 1
  | node l r => tree_size l + tree_size r

theorem size_positive (t : Tree α) : tree_size t > 0 := by
  cases t with
  | leaf v => simp [tree_size]
  | node l r =>
    -- Your proof here
```

## Very Complex Examples

### Example 10: Binary Search Tree
```lean
inductive BST (α : Type) [LT α] where
  | leaf : BST α
  | node : α → BST α → BST α → BST α

def insert : α → BST α → BST α
  | x, leaf => node x leaf leaf
  | x, node y l r =>
    if x < y then
      node y (insert x l) r
    else
      node y l (insert x r)

theorem insert_preserves_bst : ∀ (x : α) (t : BST α), is_bst (insert x t) := by
  -- This is quite complex and requires careful case analysis
```

### Example 11: Prime Numbers
```lean
def divides (m n : Nat) : Prop := ∃ k, n = m * k

def is_prime (n : Nat) : Prop :=
  n > 1 ∧ ∀ m, m > 1 → m < n → ¬ divides m n

theorem primes_infinite : ∀ n, ∃ p, is_prime p ∧ p > n := by
  -- This requires advanced techniques
```

### Example 12: Group Theory
```lean
class Group (G : Type) where
  mul : G → G → G
  one : G
  inv : G → G
  mul_assoc : ∀ a b c, mul (mul a b) c = mul a (mul b c)
  mul_one : ∀ a, mul a one = a
  one_mul : ∀ a, mul one a = a
  mul_inv : ∀ a, mul a (inv a) = one
  inv_mul : ∀ a, mul (inv a) a = one

theorem mul_left_cancel {G : Type} [Group G] {a b c : G} :
  a * b = a * c → b = c := by
  -- Your proof here
```

## Testing Strategy

1. **Start Simple**: Begin with Example 1-3 to get familiar with the interface
2. **Build Confidence**: Try Examples 4-6 to practice induction and basic tactics
3. **Challenge Yourself**: Attempt Examples 7-9 for more complex reasoning
4. **Advanced Topics**: Examples 10-12 are for experienced users

## Common Issues to Test

- **Syntax Errors**: Try misspelling keywords or forgetting colons
- **Type Errors**: Pass wrong types to functions
- **Incomplete Proofs**: Leave proofs unfinished to see suggestions
- **Wrong Tactics**: Use incorrect tactics to see error messages
- **Missing Imports**: Use functions without proper imports

## Expected Behaviors

- **Visualizations**: Should show dependency graphs for theorems with dependencies
- **Suggestions**: Should provide relevant tactics and lemmas for each context
- **Error Messages**: Should be clear and actionable
- **AI Assistance**: With Ollama running, suggestions should be more detailed

Try these examples and let us know how the system performs!
