# Proof Verification Helper

An intelligent web application designed to assist mathematicians and computer scientists working with formal proof verification systems, particularly Lean 4. The application leverages AI and interactive visualization to help users understand, debug, and construct formal proofs more efficiently.

## Features

### Core Features

- **Interactive Proof Editor**: Write and edit Lean 4 code with syntax highlighting and real-time parsing
- **Enhanced Proof Visualization**: Interactive dependency graphs with click-to-explore functionality, hover effects, and detailed tooltips
- **Advanced AI-Powered Suggestions**: Detailed explanations, code examples, and context-aware recommendations
- **Local LLM Integration**: Automatic Ollama detection for enhanced AI suggestions (enabled by default)
- **Proof Search**: Search and explore theorems from mathlib and your own proofs
- **Step-by-Step Proof Builder**: Build proofs incrementally with guided suggestions
- **Comprehensive Examples**: Extensive collection of Lean 4 examples from simple to advanced
- **User Library**: Save and organize your proofs
- **Authentication**: User accounts with secure authentication

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Monaco Editor for code editing
- Cytoscape.js for graph visualization
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation

### Backend
- Node.js with TypeScript
- Express.js for REST API
- SQLite (better-sqlite3) for database
- JWT for authentication
- Intelligent rule-based AI suggestions (free, no API key required)

## Getting Started

### Quick Start Examples

Ready to test the system? Check out our [comprehensive Lean 4 examples](./LEAN_EXAMPLES.md) ranging from basic arithmetic to advanced proofs!

### For Non-Technical Users (Easiest)

**Option 1: One-Click Setup (Recommended)**
```bash
# Clone and run everything automatically
git clone https://github.com/sathvikkurap/proof-verification-helper.git
cd proof-verification-helper
./launch.sh
```
That's it! The script automatically installs dependencies, sets up Ollama AI, and starts the app!

**Option 2: Download Standalone App**
- macOS: Download `.dmg` file, drag to Applications, and launch
- Windows: Download `.exe` installer, run and follow wizard
- Linux: Download `.AppImage`, make executable, and run

**The app automatically includes AI setup** - no manual configuration needed!

### AI Features (Automatic)

🎉 **AI is now built-in and automatic!**
- Ollama local LLM is installed and configured automatically
- Enhanced proof suggestions with detailed explanations
- Works offline and privately on your machine
- Falls back gracefully if AI setup fails
- No manual configuration needed!

**The app automatically:**
- Installs Ollama on first run
- Downloads the recommended AI model (llama3.2)
- Starts the AI service when you launch the app
- Provides intelligent proof suggestions

**For advanced users:** See [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) for manual configuration options.

### For Developers

#### Prerequisites

- Node.js 18+ and npm

#### Installation

**Quick Start (Recommended for everyone):**
```bash
git clone https://github.com/sathvikkurap/proof-verification-helper.git
cd proof-verification-helper
./launch.sh
```
This automatically installs everything, sets up Ollama AI, and starts the app!

**Manual Installation (for developers):**

1. Clone the repository:
```bash
git clone https://github.com/sathvikkurap/proof-verification-helper.git
cd proof-verification-helper
```

2. Install dependencies (includes automatic AI setup):
```bash
npm run install:all
```

3. Start the development servers:
```bash
npm run dev
```

This will start:
- Ollama AI service (automatic)
- Backend API on http://localhost:5001
- Frontend on http://localhost:3000

#### Building Standalone App

```bash
npm run build:app
```

This creates a standalone application in `electron/dist/`

### Building for Production

```bash
npm run build
```

The built files will be in:
- `frontend/dist/` - Frontend build
- `backend/dist/` - Backend build

## Project Structure

```
proof-verification-helper/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── api/       # API client functions
│   │   ├── components/ # React components
│   │   ├── pages/     # Page components
│   │   ├── store/     # State management
│   │   └── App.tsx    # Main app component
│   └── package.json
├── backend/            # Node.js backend API
│   ├── src/
│   │   ├── routes/    # API routes
│   │   ├── db/        # Database setup
│   │   ├── services/  # Business logic
│   │   ├── middleware/# Express middleware
│   │   └── index.ts   # Server entry point
│   └── package.json
└── package.json        # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Proofs
- `POST /api/proofs/parse` - Parse Lean code
- `POST /api/proofs` - Create new proof
- `GET /api/proofs/:id` - Get proof by ID
- `PUT /api/proofs/:id` - Update proof
- `DELETE /api/proofs/:id` - Delete proof
- `POST /api/proofs/:id/analyze` - Analyze proof structure
- `GET /api/proofs/:id/dependencies` - Get dependency graph
- `POST /api/proofs/:id/suggestions` - Get AI suggestions
- `POST /api/proofs/:id/verify` - Verify proof

### Theorems
- `GET /api/theorems/search` - Search theorems
- `GET /api/theorems/:id` - Get theorem by ID
- `GET /api/theorems/:id/dependents` - Get dependents

### User
- `GET /api/user/proofs` - Get user's proofs
- `POST /api/user/proofs/:id/save` - Save proof to library

## Usage

### Creating a Proof

1. Navigate to the Editor page
2. Enter your Lean 4 code in the editor
3. The app will automatically parse and analyze your proof
4. View the dependency graph and AI suggestions
5. Save your proof (requires login)

### Using AI Suggestions

1. Create or open a proof
2. The suggestions panel will show AI-powered recommendations
3. Click the checkmark icon to apply a suggestion
4. Suggestions are ranked by confidence score

### Visualizing Proofs

1. Open a proof in the editor
2. The visualization panel shows the dependency graph
3. Click on nodes to see details
4. The graph is interactive - zoom and pan to explore

### Searching Theorems

1. Go to the Search page
2. Enter search terms or use filters
3. Browse results and click to view details

## Development

### Running Tests

(Add test commands when tests are added)

### Code Style

The project uses:
- ESLint for linting
- TypeScript for type checking
- Prettier (recommended) for formatting

## Configuration

### Database

The app uses SQLite by default. To use PostgreSQL:

1. Update `backend/src/db/index.ts` to use PostgreSQL
2. Update connection string in environment variables

### AI Suggestions

The application uses an **intelligent hybrid AI system**:

1. **Auto-Detects Ollama** (if installed):
   - Uses local LLM for better suggestions
   - 100% free, private, and offline
   - Automatically enabled if Ollama is running
   - No configuration needed!

2. **Rule-Based Fallback**:
   - Always works, even without Ollama
   - High-quality suggestions using Lean 4 knowledge base
   - Instant responses
   - Perfect for non-technical users

**For best results (optional):**
- Install Ollama: `brew install ollama` (or download from ollama.com)
- Pull a model: `ollama pull llama3.2`
- Start Ollama: `ollama serve`
- The app automatically detects and uses it!

**No configuration needed** - works great out of the box!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Future Enhancements

- Integration with Lean 4 language server for real-time verification
- Support for other proof assistants (Coq, Isabelle)
- Advanced proof refactoring tools
- Collaborative real-time editing
- Proof templates library
- Mobile app support

## Support

For issues and questions, please open an issue on GitHub.

