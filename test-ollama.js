// Test script to check Ollama functionality
const { checkOllamaAvailability, getOllamaSuggestions } = require('./backend/src/services/ollamaService.js');

async function test() {
  console.log('🔍 Testing Ollama availability...');

  try {
    const available = await checkOllamaAvailability();
    console.log('📊 Ollama available:', available);

    if (available) {
      console.log('🤖 Testing Ollama suggestions...');
      const suggestions = await getOllamaSuggestions({
        proofCode: 'theorem test : true := by',
        currentGoal: 'true'
      });
      console.log('✅ Ollama suggestions:', suggestions.length);
      console.log('📝 First suggestion:', suggestions[0]);
    } else {
      console.log('❌ Ollama not available');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
