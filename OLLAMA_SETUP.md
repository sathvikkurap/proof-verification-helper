# Ollama Setup for Enhanced AI Suggestions

This guide helps you set up Ollama locally to get better AI-powered suggestions for your Lean 4 proofs.

## What is Ollama?

Ollama runs large language models locally on your machine, providing AI assistance without sending your code to external servers. It's completely private and free.

## Installation

### macOS
```bash
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows
Download from: https://ollama.ai/download

## Starting Ollama

After installation, start the Ollama service:

```bash
ollama serve
```

This will start Ollama on `http://localhost:11434`.

## Installing a Model

The system is configured to use `llama3.2` by default, but you can choose other models. Here are some good options for Lean 4:

### Recommended Models

1. **Llama 3.2** (Default - 3B parameters)
   ```bash
   ollama pull llama3.2
   ```

2. **CodeLlama** (Good for code understanding)
   ```bash
   ollama pull codellama
   ```

3. **DeepSeek Coder** (Specialized for coding)
   ```bash
   ollama pull deepseek-coder
   ```

4. **Mistral** (Good general performance)
   ```bash
   ollama pull mistral
   ```

## Configuration

The system automatically detects and uses Ollama if it's running. You can customize the configuration by creating a `.env` file in the `backend/` directory:

```env
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

## Testing Ollama

After setup, you can test if Ollama is working:

```bash
curl http://localhost:11434/api/tags
```

You should see your installed models listed.

## Benefits of Ollama

- **Enhanced Suggestions**: Get more detailed, context-aware proof suggestions
- **Privacy**: All AI processing happens locally on your machine
- **No API Keys**: No external service accounts needed
- **Offline**: Works without internet connection
- **Customizable**: Choose different models based on your needs

## Troubleshooting

### Ollama not found
- Make sure Ollama is installed and running
- Check that it's accessible at `http://localhost:11434`

### Model not available
- Install the model with `ollama pull <model-name>`
- Check available models with `ollama list`

### Performance issues
- Smaller models (like llama3.2) are faster but less capable
- Larger models give better suggestions but require more resources

## Automatic Fallback

The system automatically falls back to rule-based suggestions if Ollama is not available, so it works even without Ollama setup!