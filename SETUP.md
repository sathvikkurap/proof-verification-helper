# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```

2. **Configure Environment**
   
   Create `backend/.env` file:
   ```env
   PORT=5000
   JWT_SECRET=your-secret-key-change-in-production
   DATABASE_PATH=./data/proofs.db
   ```

3. **Start Development Servers**
   ```bash
   npm run dev
   ```

   This starts:
   - Backend API: http://localhost:5000
   - Frontend: http://localhost:3000

## First Time Setup

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (see above)

4. The database will be created automatically on first run

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running Individual Services

### Backend Only
```bash
cd backend
npm run dev
```

### Frontend Only
```bash
cd frontend
npm run dev
```

## Production Build

```bash
npm run build
```

Then start the backend:
```bash
cd backend
npm start
```

And serve the frontend (using a static file server):
```bash
cd frontend
# Serve the dist/ directory with your preferred server
# Example with serve:
npx serve -s dist
```

## Troubleshooting

### Port Already in Use

If port 5000 or 3000 is already in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.ts`

### Database Issues

If you encounter database errors:
- Delete `backend/data/proofs.db` to reset
- Ensure the `backend/data/` directory exists

### Module Not Found Errors

Run `npm run install:all` again to ensure all dependencies are installed.

## Next Steps

1. Open http://localhost:3000 in your browser
2. Create an account or start using the editor
3. Try pasting some Lean 4 code to see the parser in action
4. Explore the different features from the navigation menu

