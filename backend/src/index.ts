import swaggerUi from 'swagger-ui-express';import { specs as swaggerSpecs, swaggerUiOptions } from './docs/swagger';import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import proofRoutes from './routes/proofs';
import theoremRoutes from './routes/theorems';
import userRoutes from './routes/user';
import { errorHandler, notFoundHandler, corsErrorHandler } from './middleware/errorHandler';
import { requestLogger } from './utils/logger';
import {
  generalLimiter,
  authLimiter,
  aiLimiter,
  helmetConfig,
  sanitizeInput,
  securityHeaders
} from './middleware/security';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001; // Changed from 5000 to avoid AirPlay conflict

// Security middleware
app.use(helmetConfig);
app.use(securityHeaders);

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/proofs/*/suggestions', aiLimiter);
app.use(generalLimiter);

// Request logging
app.use(requestLogger);

// Input sanitization
app.use(sanitizeInput);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || false
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Explicit OPTIONS handler for all routes
app.options('*', cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/proofs', proofRoutes);
app.use('/api/theorems', theoremRoutes);
app.use('/api/user', userRoutes);

// API Documentation
if (process.env.NODE_ENV !== 'production' || process.env.API_DOCS_ENABLED === 'true') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, swaggerUiOptions));
  console.log('📚 API Documentation available at http://localhost:' + PORT + '/api-docs');
}
// Health check with detailed system info
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'ok',
    message: 'Proof Verification Helper API',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
  };
  res.json(healthCheck);
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
      console.log('❌ Test suggestions failed:', (e as Error).message);
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
      error: (error as Error).message,
      ollama_url: 'http://localhost:11434',
      model: 'llama3.2',
      functions_available: null
    });
  }
});

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Error handling
app.use(corsErrorHandler);
app.use(errorHandler);

// Graceful shutdown handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Proof Verification Helper API v${process.env.npm_package_version || '1.0.0'}`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: ${process.env.NODE_ENV === 'production' ? 'Enabled' : 'Development mode'}`);
});

// Export app for testing
export { app, server };

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

