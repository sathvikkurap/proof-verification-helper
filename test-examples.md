# Test Examples for Proof Verification Helper

## Simple Examples

### 1. Basic True Theorem
```lean
theorem example : True := by trivial
```
**Expected**: Should parse as 1 theorem, no errors, status: complete

### 2. Addition Zero
```lean
theorem add_zero (n : Nat) : n + 0 = n := by simp
```
**Expected**: Should parse as 1 theorem, suggest `Nat.add_zero` lemma

### 3. Reflexivity
```lean
theorem refl_example (n : Nat) : n = n := by reflexivity
```
**Expected**: Should parse correctly, suggest `rfl` or `reflexivity`

## Complex Examples

### 4. Commutativity with Induction
```lean
theorem add_comm (a b : Nat) : a + b = b + a := by
  induction a with
  | zero => simp
  | succ n ih => simp [Nat.add_succ, ih]
```
**Expected**: Should parse as 1 theorem, detect dependencies on `Nat.add_succ`, suggest induction-related tactics

### 5. Multiple Theorems
```lean
theorem add_zero (n : Nat) : n + 0 = n := by simp

theorem add_succ (a b : Nat) : a + succ b = succ (a + b) := by
  induction a with
  | zero => simp
  | succ n ih => simp [ih]

lemma helper : True := by trivial
```
**Expected**: Should parse as 2 theorems and 1 lemma, show all in visualization

### 6. Logical Connectives
```lean
theorem and_example (P Q : Prop) : P → Q → P ∧ Q := by
  intro h1 h2
  constructor
  exact h1
  exact h2
```
**Expected**: Should parse correctly, suggest `And.intro`, show multiple proof steps

### 7. Existential
```lean
theorem exists_example : ∃ n : Nat, n = 0 := by
  use 0
  reflexivity
```
**Expected**: Should parse, suggest `use` tactic for existentials

## Error Cases

### 8. Type Error
```lean
theorem bad : Nat := by trivial
```
**Expected**: Should detect error, suggest type fixes

### 9. Incomplete Proof
```lean
theorem incomplete : True := by
  -- missing proof
```
**Expected**: Should detect incomplete proof, suggest `trivial` or `exact True.intro`

### 10. Syntax Error
```lean
theorem syntax_error : True = by trivial
```
**Expected**: Should detect syntax issue, suggest proper syntax

