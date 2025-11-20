# Ollama Local LLM Setup Guide

## Why Use Ollama?

Ollama allows you to use a **local LLM** for better AI suggestions while remaining:
- ✅ 100% FREE (no API costs)
- ✅ Privacy-focused (all local)
- ✅ Offline capable
- ✅ No rate limits

## Installation

### 1. Install Ollama

**macOS:**
```bash
brew install ollama
# Or download from https://ollama.com
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from https://ollama.com/download

### 2. Pull a Code Model

Recommended models for Lean 4:

```bash
# Small, fast model (4-8GB RAM)
ollama pull llama3.2

# Better for code (8-16GB RAM)
ollama pull codellama

# Best for coding (12-24GB RAM)
ollama pull deepseek-coder

# Large, powerful (24GB+ RAM)
ollama pull qwen2.5-coder
```

### 3. Configure Backend

Add to `backend/.env`:

```env
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### 4. Start Ollama

```bash
ollama serve
```

This starts Ollama on `http://localhost:11434`

### 5. Restart Backend

The backend will automatically detect and use Ollama if enabled.

## How It Works

1. **Hybrid Approach**: 
   - Tries Ollama first (if enabled and available)
   - Falls back to rule-based system if Ollama fails
   - Combines both for best results

2. **Smart Fallback**:
   - If Ollama is not running → uses rule-based
   - If Ollama errors → uses rule-based
   - Always works, even without Ollama

3. **Best of Both**:
   - Ollama provides creative, context-aware suggestions
   - Rule-based provides reliable, fast suggestions
   - Combined = best experience

## Testing

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Test a query
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "How do I prove commutativity in Lean 4?",
  "stream": false
}'
```

## Model Recommendations

| Model | RAM Needed | Speed | Quality | Best For |
|-------|-----------|-------|---------|----------|
| llama3.2 | 4-8GB | Fast | Good | Quick suggestions |
| codellama | 8-16GB | Medium | Better | Code-focused |
| deepseek-coder | 12-24GB | Medium | Excellent | Best coding quality |
| qwen2.5-coder | 24GB+ | Slower | Excellent | Complex proofs |

## Troubleshooting

### Ollama not detected?
1. Check if running: `ollama list`
2. Check port: `curl http://localhost:11434/api/tags`
3. Check env vars in `backend/.env`

### Model not found?
```bash
ollama pull llama3.2  # or your chosen model
```

### Out of memory?
- Use smaller model (llama3.2)
- Or use quantized version
- Or stick with rule-based (still excellent!)

## Benefits Over Rule-Based

✅ **More Creative**: Can suggest novel approaches
✅ **Better Context**: Understands proof flow better
✅ **Natural Language**: Better explanations
✅ **Adaptive**: Learns from context

## Benefits Over Cloud AI

✅ **Free**: No API costs
✅ **Private**: All data stays local
✅ **Fast**: No network latency
✅ **Offline**: Works without internet
✅ **Unlimited**: No rate limits

## Current Status

The app works great with just the rule-based system. Ollama is an **optional enhancement** that makes it even better!

