#!/bin/bash

# Test script for Proof Verification Helper
# This script tests all major components of the application

echo "🧪 Testing Proof Verification Helper"
echo "===================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo -e "\n${YELLOW}Checking backend server...${NC}"
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running. Start it with: cd backend && npm run dev${NC}"
    exit 1
fi

# Test health endpoint
echo -e "\n${YELLOW}Testing health endpoint...${NC}"
HEALTH=$(curl -s http://localhost:5000/api/health)
if echo "$HEALTH" | grep -q "status"; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    exit 1
fi

# Test proof parsing
echo -e "\n${YELLOW}Testing proof parsing...${NC}"
PARSE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/proofs/parse \
  -H "Content-Type: application/json" \
  -d '{"code":"theorem example : True := by trivial"}')

if echo "$PARSE_RESPONSE" | grep -q "theorems"; then
    echo -e "${GREEN}✓ Proof parsing works${NC}"
else
    echo -e "${RED}✗ Proof parsing failed${NC}"
    echo "Response: $PARSE_RESPONSE"
fi

# Test user registration
echo -e "\n${YELLOW}Testing user registration...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test$(date +%s)@test.com\",\"username\":\"testuser$(date +%s)\",\"password\":\"testpass123\"}")

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ User registration works${NC}"
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}✗ User registration failed${NC}"
    echo "Response: $REGISTER_RESPONSE"
    TOKEN=""
fi

# Test proof creation
echo -e "\n${YELLOW}Testing proof creation...${NC}"
if [ -n "$TOKEN" ]; then
    CREATE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/proofs \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"name":"Test Proof","code":"theorem example : True := by trivial"}')
    
    if echo "$CREATE_RESPONSE" | grep -q "id"; then
        echo -e "${GREEN}✓ Proof creation works${NC}"
        PROOF_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    else
        echo -e "${RED}✗ Proof creation failed${NC}"
        PROOF_ID=""
    fi
else
    echo -e "${YELLOW}⚠ Skipping proof creation (no token)${NC}"
    PROOF_ID=""
fi

# Test AI suggestions
echo -e "\n${YELLOW}Testing AI suggestions...${NC}"
if [ -n "$PROOF_ID" ]; then
    SUGGESTIONS_RESPONSE=$(curl -s -X POST http://localhost:5000/api/proofs/$PROOF_ID/suggestions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{}')
    
    if echo "$SUGGESTIONS_RESPONSE" | grep -q "suggestions"; then
        echo -e "${GREEN}✓ AI suggestions work${NC}"
    else
        echo -e "${RED}✗ AI suggestions failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipping suggestions test (no proof ID)${NC}"
fi

# Test theorem search
echo -e "\n${YELLOW}Testing theorem search...${NC}"
SEARCH_RESPONSE=$(curl -s "http://localhost:5000/api/theorems/search?q=add")
if echo "$SEARCH_RESPONSE" | grep -q "theorems"; then
    echo -e "${GREEN}✓ Theorem search works${NC}"
else
    echo -e "${YELLOW}⚠ Theorem search returned empty (expected if no theorems in DB)${NC}"
fi

# Check frontend
echo -e "\n${YELLOW}Checking frontend...${NC}"
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠ Frontend is not running. Start it with: cd frontend && npm run dev${NC}"
fi

echo -e "\n${GREEN}====================================${NC}"
echo -e "${GREEN}✅ Testing complete!${NC}"
echo -e "${GREEN}====================================${NC}"

