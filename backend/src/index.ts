import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import proofRoutes from './routes/proofs';
import theoremRoutes from './routes/theorems';
import userRoutes from './routes/user';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001; // Changed from 5000 to avoid AirPlay conflict

// Middleware - CORS with proper configuration (allow all origins in dev)
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// Explicit OPTIONS handler for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/proofs', proofRoutes);
app.use('/api/theorems', theoremRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proof Verification Helper API' });
});

// Debug endpoint to check Ollama status
app.get('/api/debug/ollama', async (req, res) => {
  console.log('🔍 Debug endpoint called');
  try {
    console.log('📦 Importing Ollama service...');
    const { checkOllamaAvailability, getOllamaSuggestions } = await import('./services/ollamaService.js');
    console.log('✅ Import successful');

    console.log('🔎 Checking availability...');
    const available = await checkOllamaAvailability();
    console.log('📊 Available:', available);

    // Test Ollama suggestions
    let testSuggestions = [];
    try {
      console.log('🤖 Testing suggestions...');
      testSuggestions = await getOllamaSuggestions({
        proofCode: 'theorem test : true := by',
        currentGoal: 'true'
      });
      console.log('✅ Got suggestions:', testSuggestions.length);
    } catch (e) {
      console.log('❌ Test suggestions failed:', e.message);
    }

    res.json({
      ollama_available: available,
      ollama_url: 'http://localhost:11434',
      model: 'llama3.2',
      test_suggestions_count: testSuggestions.length,
      functions_available: {
        checkOllamaAvailability: typeof checkOllamaAvailability,
        getOllamaSuggestions: typeof getOllamaSuggestions
      }
    });
  } catch (error) {
    console.log('❌ Debug endpoint error:', error);
    res.json({
      ollama_available: false,
      error: error.message,
      ollama_url: 'http://localhost:11434',
      model: 'llama3.2',
      functions_available: null
    });
  }
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

