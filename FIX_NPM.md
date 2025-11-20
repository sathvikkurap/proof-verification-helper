# Fixing npm Installation Issue

There's an npm configuration issue preventing installation. Here's how to fix it:

## Quick Fix:

1. **Try this command:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

2. **If that doesn't work, try:**
```bash
cd frontend
npm install --no-optional --legacy-peer-deps
```

3. **Or use yarn instead:**
```bash
cd frontend
yarn install
yarn dev
```

## Alternative: Use Backend Only

The backend is working! You can test the API directly:

```bash
# Test backend
curl http://localhost:5000/api/health

# Parse a proof
curl -X POST http://localhost:5000/api/proofs/parse \
  -H "Content-Type: application/json" \
  -d '{"code":"theorem example : True := by trivial"}'
```

## Manual Frontend Start

Once dependencies are installed, start frontend with:
```bash
cd frontend
npm run dev
```

Then open http://localhost:3000
