#!/bin/bash

# Comprehensive Test Suite for Proof Verification Helper

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     COMPREHENSIVE FUNCTIONALITY TEST SUITE                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:5000"
PASS=0
FAIL=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ PASS: $2"
        ((PASS++))
    else
        echo "❌ FAIL: $2"
        ((FAIL++))
    fi
}

echo "1. Testing Backend Health..."
curl -s $BASE_URL/api/health | grep -q "status" 
test_result $? "Backend health check"

echo ""
echo "2. Testing Simple Proof Parsing..."
SIMPLE_CODE='theorem example : True := by trivial'
RESPONSE=$(curl -s -X POST $BASE_URL/api/proofs/parse \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$SIMPLE_CODE\"}")
echo "$RESPONSE" | grep -q "theorems"
test_result $? "Simple proof parsing"

echo ""
echo "3. Testing Complex Proof Parsing..."
COMPLEX_CODE='theorem add_comm (a b : Nat) : a + b = b + a := by
  induction a with
  | zero => simp
  | succ n ih => simp [Nat.add_succ, ih]'
RESPONSE=$(curl -s -X POST $BASE_URL/api/proofs/parse \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$COMPLEX_CODE\"}")
echo "$RESPONSE" | grep -q "theorems"
test_result $? "Complex proof parsing"

echo ""
echo "4. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test$(date +%s)@test.com\",\"username\":\"testuser$(date +%s)\",\"password\":\"testpass123\"}")
echo "$REGISTER_RESPONSE" | grep -q "token"
if [ $? -eq 0 ]; then
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    test_result 0 "User registration"
else
    test_result 1 "User registration"
    TOKEN=""
fi

echo ""
echo "5. Testing Proof Creation..."
if [ -n "$TOKEN" ]; then
    CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/api/proofs \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"name\":\"Test Proof\",\"code\":\"$SIMPLE_CODE\"}")
    echo "$CREATE_RESPONSE" | grep -q "id"
    if [ $? -eq 0 ]; then
        PROOF_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        test_result 0 "Proof creation"
    else
        test_result 1 "Proof creation"
        PROOF_ID=""
    fi
else
    test_result 1 "Proof creation (no token)"
    PROOF_ID=""
fi

echo ""
echo "6. Testing Proof Retrieval..."
if [ -n "$PROOF_ID" ]; then
    curl -s -X GET "$BASE_URL/api/proofs/$PROOF_ID" \
      -H "Authorization: Bearer $TOKEN" | grep -q "id"
    test_result $? "Proof retrieval"
else
    test_result 1 "Proof retrieval (no proof ID)"
fi

echo ""
echo "7. Testing Proof Analysis..."
if [ -n "$PROOF_ID" ]; then
    curl -s -X POST "$BASE_URL/api/proofs/$PROOF_ID/analyze" \
      -H "Authorization: Bearer $TOKEN" | grep -q "analysis"
    test_result $? "Proof analysis"
else
    test_result 1 "Proof analysis (no proof ID)"
fi

echo ""
echo "8. Testing AI Suggestions..."
if [ -n "$PROOF_ID" ]; then
    SUGGESTIONS=$(curl -s -X POST "$BASE_URL/api/proofs/$PROOF_ID/suggestions" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{}')
    echo "$SUGGESTIONS" | grep -q "suggestions"
    test_result $? "AI suggestions"
else
    test_result 1 "AI suggestions (no proof ID)"
fi

echo ""
echo "9. Testing Proof Verification..."
if [ -n "$PROOF_ID" ]; then
    VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/proofs/$PROOF_ID/verify" \
      -H "Authorization: Bearer $TOKEN")
    echo "$VERIFY_RESPONSE" | grep -q "valid"
    test_result $? "Proof verification"
else
    test_result 1 "Proof verification (no proof ID)"
fi

echo ""
echo "10. Testing Theorem Search..."
curl -s "$BASE_URL/api/theorems/search?q=add" | grep -q "theorems"
test_result $? "Theorem search"

echo ""
echo "11. Testing Complex Proof with Multiple Theorems..."
MULTI_CODE='theorem add_zero (n : Nat) : n + 0 = n := by simp

theorem add_succ (a b : Nat) : a + succ b = succ (a + b) := by
  induction a with
  | zero => simp
  | succ n ih => simp [ih]

lemma helper : True := by trivial'
RESPONSE=$(curl -s -X POST $BASE_URL/api/proofs/parse \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$MULTI_CODE\"}")
echo "$RESPONSE" | grep -q "theorems"
test_result $? "Multiple theorems parsing"

echo ""
echo "12. Testing Error Handling..."
ERROR_CODE='theorem bad : Nat := by trivial'
RESPONSE=$(curl -s -X POST $BASE_URL/api/proofs/parse \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$ERROR_CODE\"}")
echo "$RESPONSE" | grep -q "theorems\|errors"
test_result $? "Error handling"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "TEST RESULTS:"
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  Total: $((PASS + FAIL))"
echo "═══════════════════════════════════════════════════════════"

if [ $FAIL -eq 0 ]; then
    echo ""
    echo "🎉 ALL TESTS PASSED! 🎉"
    exit 0
else
    echo ""
    echo "⚠️  Some tests failed. Please review."
    exit 1
fi

