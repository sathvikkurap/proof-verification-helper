# 🎬 Demo Guide - Proof Verification Helper

## Application is Running!

### Access Points:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Demo Walkthrough

### 1. Home Page
- Beautiful landing page with feature cards
- Clear navigation to all features
- "Get Started" button prominently displayed

### 2. Proof Editor (Main Feature)
**Navigate to**: http://localhost:3000/editor

**What to try:**
1. **See the example code** - A simple theorem is pre-loaded
2. **Edit the code** - Try changing the proof
3. **Watch real-time parsing** - The app automatically parses your code
4. **Save the proof** - Click "Save" button (creates account if needed)
5. **Get AI suggestions** - After saving, see intelligent suggestions
6. **View visualization** - See the dependency graph
7. **Verify proof** - Click "Verify" to check validity

### 3. Example Proofs to Try

#### Simple Example:
```lean
theorem example : True := by trivial
```

#### Addition Commutativity:
```lean
theorem add_comm (a b : Nat) : a + b = b + a := by
  simp [Nat.add_comm]
```

#### With Error (to see error handling):
```lean
theorem bad : Nat := by
  trivial
```

### 4. AI Suggestions Feature
- **Save a proof first** (required for suggestions)
- Suggestions appear in the right sidebar
- Click the checkmark to apply suggestions
- See confidence scores for each suggestion
- Expand/collapse to see explanations

### 5. Proof Visualization
- Toggle visualization on/off
- Interactive graph showing:
  - Theorems (blue nodes)
  - Lemmas (green nodes)
  - Definitions (purple nodes)
  - Dependencies (edges)

### 6. Other Features to Explore

**Search Page** (`/search`):
- Search for theorems
- Filter by category and difficulty

**Proof Builder** (`/builder`):
- Step-by-step proof construction
- Guided suggestions

**Tutorials** (`/tutorials`):
- Learning resources
- Example proofs

**Library** (`/library`):
- Your saved proofs (requires login)

## UI Improvements Made

✅ **Toast Notifications** - Success/error messages appear as toasts
✅ **Loading States** - Buttons show loading state during operations
✅ **Better Error Display** - Errors shown with clear formatting
✅ **Helpful Hints** - UI guides users (e.g., "Save to get suggestions")
✅ **Better Examples** - More helpful initial code examples
✅ **Visual Feedback** - Clear visual indicators for all actions

## Testing Checklist

- [ ] Home page loads correctly
- [ ] Editor page works
- [ ] Code editing is smooth
- [ ] Parsing happens automatically
- [ ] Save button works
- [ ] AI suggestions appear
- [ ] Visualization renders
- [ ] Error messages are clear
- [ ] Navigation works
- [ ] Responsive design (try resizing window)

## Stop Servers

When done with demo:
```bash
kill $(cat /tmp/backend.pid) 2>/dev/null
kill $(cat /tmp/frontend.pid) 2>/dev/null
```

Or manually:
- Find processes: `ps aux | grep -E "node|vite"`
- Kill them: `kill <PID>`

