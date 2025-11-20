# Testing Guide

## Manual Testing Checklist

### Authentication
- [ ] User registration works
- [ ] User login works
- [ ] JWT token is stored correctly
- [ ] Logout clears session
- [ ] Protected routes require authentication

### Proof Editor
- [ ] Code editor loads with syntax highlighting
- [ ] Lean 4 syntax is properly highlighted
- [ ] Code changes trigger parsing
- [ ] Proof can be saved
- [ ] Proof can be loaded
- [ ] Proof can be updated
- [ ] Proof can be deleted

### Proof Parsing
- [ ] Simple theorem is parsed correctly
- [ ] Multiple theorems are detected
- [ ] Lemmas are identified
- [ ] Definitions are extracted
- [ ] Dependencies are found
- [ ] Errors are reported

### Proof Visualization
- [ ] Dependency graph renders
- [ ] Nodes are clickable
- [ ] Graph is interactive (zoom/pan)
- [ ] Different node types have different colors
- [ ] Empty proof shows appropriate message

### AI Suggestions
- [ ] Suggestions appear for valid proofs
- [ ] Suggestions appear for proofs with errors
- [ ] Suggestions are context-aware
- [ ] Suggestions can be applied
- [ ] Confidence scores are shown
- [ ] Different suggestion types work (lemma, tactic, fix, step)

### Proof Search
- [ ] Search by query works
- [ ] Filter by category works
- [ ] Filter by difficulty works
- [ ] Results are displayed correctly
- [ ] Empty results show appropriate message

### Proof Builder
- [ ] Step-by-step interface loads
- [ ] Current goal is displayed
- [ ] Suggestions are shown
- [ ] Steps can be added
- [ ] Proof can be initialized

### Tutorials
- [ ] Tutorial list displays
- [ ] Example proofs are shown
- [ ] Code examples are formatted correctly

### User Library
- [ ] Library page loads (requires auth)
- [ ] Saved proofs are listed
- [ ] Proofs can be opened from library
- [ ] Proofs can be deleted from library
- [ ] Empty library shows appropriate message

## Automated Testing

### Run Test Script

```bash
./test-app.sh
```

This script tests:
- Backend health check
- Proof parsing
- User registration
- Proof creation
- AI suggestions
- Theorem search

### Manual API Testing

Use curl or Postman to test endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Parse proof
curl -X POST http://localhost:5000/api/proofs/parse \
  -H "Content-Type: application/json" \
  -d '{"code":"theorem example : True := by trivial"}'

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","password":"testpass"}'
```

## Browser Testing

### Test in Different Browsers
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (responsive design)

### Test Features
- [ ] All pages load correctly
- [ ] Navigation works
- [ ] Forms submit correctly
- [ ] Errors are displayed
- [ ] Loading states work
- [ ] Responsive design on mobile

## Performance Testing

- [ ] Page load times are acceptable
- [ ] API responses are fast
- [ ] Large proofs parse in reasonable time
- [ ] Graph visualization is smooth
- [ ] No memory leaks

## Security Testing

- [ ] Passwords are hashed
- [ ] JWT tokens are validated
- [ ] Protected routes require auth
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React escapes by default)
- [ ] CORS is configured correctly

## Known Issues

None currently. Report issues via GitHub Issues.

