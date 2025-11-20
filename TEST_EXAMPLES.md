# Test Examples for Proof Verification Helper

Copy and paste these examples into the editor to test different features!

## 🟢 Simple Examples (Start Here)

### 1. Basic True Theorem
```lean
theorem example : True := by trivial
```
**What to test:** Should parse as 1 theorem, no errors, status: complete

### 2. Addition Zero
```lean
theorem add_zero (n : Nat) : n + 0 = n := by simp
```
**What to test:** Should suggest `Nat.add_zero` lemma, parse correctly

### 3. Reflexivity
```lean
theorem refl_example (n : Nat) : n = n := by reflexivity
```
**What to test:** Should parse, suggest `rfl` or `reflexivity` tactic

### 4. Simple Implication
```lean
theorem simple_impl (P : Prop) : P → P := by
  intro h
  exact h
```
**What to test:** Should show intro tactic, parse multiple steps

---

## 🟡 Intermediate Examples

### 5. Commutativity of Addition
```lean
theorem add_comm (a b : Nat) : a + b = b + a := by
  induction a with
  | zero => simp
  | succ n ih => simp [Nat.add_succ, ih]
```
**What to test:** 
- Should parse as 1 theorem
- Should detect dependencies: `Nat.add_succ`
- Should suggest induction-related tactics
- Visualization should show dependencies

### 6. Multiple Theorems
```lean
theorem add_zero (n : Nat) : n + 0 = n := by simp

theorem add_succ (a b : Nat) : a + succ b = succ (a + b) := by
  induction a with
  | zero => simp
  | succ n ih => simp [ih]

lemma helper : True := by trivial
```
**What to test:**
- Should parse as 2 theorems and 1 lemma
- Visualization should show all three
- Should detect relationships

### 7. Logical Connectives - And
```lean
theorem and_example (P Q : Prop) : P → Q → P ∧ Q := by
  intro h1 h2
  constructor
  exact h1
  exact h2
```
**What to test:**
- Should suggest `And.intro` lemma
- Should show multiple proof steps
- Should parse correctly

### 8. Logical Connectives - Or
```lean
theorem or_example (P Q : Prop) : P → P ∨ Q := by
  intro h
  left
  exact h
```
**What to test:**
- Should suggest `Or.inl` for left disjunction
- Should parse correctly

### 9. Existential Proof
```lean
theorem exists_example : ∃ n : Nat, n = 0 := by
  use 0
  reflexivity
```
**What to test:**
- Should suggest `use` tactic for existentials
- Should parse correctly

---

## 🔴 Complex Examples

### 10. Complex Induction with Multiple Cases
```lean
theorem add_assoc (a b c : Nat) : (a + b) + c = a + (b + c) := by
  induction a with
  | zero => simp
  | succ n ih => 
    simp [Nat.add_succ]
    rw [ih]
```
**What to test:**
- Should parse complex structure
- Should detect multiple dependencies
- Should suggest relevant lemmas

### 11. Multiple Theorems with Dependencies
```lean
theorem zero_add (n : Nat) : 0 + n = n := by simp

theorem add_comm (a b : Nat) : a + b = b + a := by
  induction a with
  | zero => simp [zero_add]
  | succ n ih => 
    simp [Nat.add_succ]
    rw [ih]

theorem add_assoc (a b c : Nat) : (a + b) + c = a + (b + c) := by
  induction a with
  | zero => simp
  | succ n ih => 
    simp [Nat.add_succ]
    rw [ih]
```
**What to test:**
- Should show dependency graph
- Should detect that `add_comm` uses `zero_add`
- Visualization should show relationships

### 12. Definition with Theorem
```lean
def double (n : Nat) : Nat := n + n

theorem double_zero : double 0 = 0 := by
  simp [double]

theorem double_succ (n : Nat) : double (succ n) = succ (succ (double n)) := by
  simp [double]
  rw [Nat.add_succ, Nat.succ_add]
```
**What to test:**
- Should parse definition
- Should show definition in visualization
- Should detect theorem dependencies on definition

---

## ⚠️ Error Cases (Test Error Handling)

### 13. Type Error
```lean
theorem bad : Nat := by trivial
```
**What to test:**
- Should detect type error
- AI should suggest: "Check type annotations"
- Should show error message clearly

### 14. Incomplete Proof
```lean
theorem incomplete : True := by
  -- missing proof
```
**What to test:**
- Should detect incomplete proof
- Should suggest: `trivial` or `exact True.intro`
- Should show helpful error

### 15. Syntax Error
```lean
theorem syntax_error : True = by trivial
```
**What to test:**
- Should detect syntax issue
- Should suggest proper syntax: `: True := by trivial`
- Should show clear error message

### 16. Unknown Identifier
```lean
theorem unknown : undefined_function 0 = 0 := by trivial
```
**What to test:**
- Should detect unknown identifier
- Should suggest: "Check that all variables are defined"
- Should show helpful error

### 17. Type Mismatch
```lean
theorem type_mismatch : True := by
  exact (0 : Nat)
```
**What to test:**
- Should detect type mismatch
- Should suggest: "Check type compatibility"
- Should show clear error

---

## 🎯 Feature-Specific Tests

### 18. Test AI Suggestions - Simple
```lean
theorem needs_suggestion : 0 + 5 = 5 := by
  -- What should go here?
```
**What to test:**
- Save this proof
- Check AI suggestions panel
- Should suggest: `simp`, `rw [zero_add]`, or `Nat.add_zero`

### 19. Test AI Suggestions - Complex
```lean
theorem complex_suggestion (a b : Nat) : a + b = b + a := by
  -- Need help with induction
```
**What to test:**
- Save this proof
- AI should suggest: `induction a`, `Nat.add_comm`, related tactics

### 20. Test Visualization - Multiple Items
```lean
theorem t1 : True := by trivial
theorem t2 : True := by trivial
lemma l1 : True := by trivial
def d1 : Nat := 0
```
**What to test:**
- Should show all 4 items in visualization
- Different colors for theorems, lemmas, definitions
- Interactive graph

### 21. Test Save/Load
```lean
theorem my_proof : True := by trivial
```
**What to test:**
1. Paste this code
2. Click "Save"
3. Change the code
4. Reload page
5. Should restore saved version

---

## 🚀 Quick Test Checklist

Use these to quickly verify everything works:

1. **Simple parsing:** Example #1
2. **Complex parsing:** Example #5
3. **Multiple items:** Example #6
4. **Error detection:** Example #13
5. **AI suggestions:** Example #18 (save first!)
6. **Visualization:** Example #20
7. **Save/load:** Example #21

---

## 💡 Tips for Testing

1. **Always save before checking AI suggestions** - The suggestions require a saved proof ID
2. **Check visualization** - Toggle it on/off to see dependency graphs
3. **Try errors** - The error handling is a key feature!
4. **Test apply suggestions** - Click the checkmark to apply AI suggestions
5. **Explore all pages** - Search, Builder, Tutorials all have features to test

---

## 🎨 UI Features to Test

- ✅ Syntax highlighting in editor
- ✅ Real-time parsing as you type
- ✅ Toast notifications when saving
- ✅ Loading states on buttons
- ✅ Error messages with dismiss button
- ✅ Expand/collapse suggestions
- ✅ Interactive graph visualization
- ✅ Responsive design (try resizing window)

Happy testing! 🎉

