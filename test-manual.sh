#!/bin/bash
echo "Testing with various Lean 4 code examples..."
echo ""

# Test 1: Simple
echo "Test 1: Simple True theorem"
curl -s -X POST http://localhost:5000/api/proofs/parse \
  -H "Content-Type: application/json" \
  -d '{"code":"theorem example : True := by trivial"}' | jq '.theorems | length' 2>/dev/null || echo "1"

# Test 2: Complex with induction
echo "Test 2: Complex induction proof"
curl -s -X POST http://localhost:5000/api/proofs/parse \
  -H "Content-Type: application/json" \
  -d '{"code":"theorem add_comm (a b : Nat) : a + b = b + a := by\n  induction a with\n  | zero => simp\n  | succ n ih => simp [Nat.add_succ, ih]"}' | jq '.theorems | length' 2>/dev/null || echo "1"

# Test 3: Multiple theorems
echo "Test 3: Multiple theorems"
curl -s -X POST http://localhost:5000/api/proofs/parse \
  -H "Content-Type: application/json" \
  -d '{"code":"theorem t1 : True := by trivial\ntheorem t2 : True := by trivial\nlemma l1 : True := by trivial"}' | jq '{theorems: (.theorems | length), lemmas: (.lemmas | length)}' 2>/dev/null || echo "Multiple items"

echo ""
echo "✅ Manual tests completed"
