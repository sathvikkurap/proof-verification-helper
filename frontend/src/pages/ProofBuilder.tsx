import { useState, useEffect } from 'react';
import CodeEditor from '../components/CodeEditor';
import SuggestionsPanel from '../components/SuggestionsPanel';
import { proofsApi } from '../api/proofs';
import { CheckCircle, XCircle, ArrowRight, Sparkles, Target, BookOpen, Zap } from 'lucide-react';

export default function ProofBuilder() {
  const [code, setCode] = useState('theorem add_zero (n : Nat) : n + 0 = n := by');
  const [currentGoal, setCurrentGoal] = useState<string>('Prove: ∀ n : Nat, n + 0 = n');
  const [proofId, setProofId] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [parsedProof, setParsedProof] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    parseCurrentCode();
  }, [code]);

  const parseCurrentCode = async () => {
    try {
      const parsed = await proofsApi.parse(code);
      setParsedProof(parsed);
      // Extract current goal from parsed data
      if (parsed?.theorems?.[0]) {
        const theorem = parsed.theorems[0];
        setCurrentGoal(`Prove: ${theorem.statement}`);
      }
    } catch (error) {
      console.error('Parse error:', error);
    }
  };

  const handleCreateProof = async () => {
    try {
      const proof = await proofsApi.create('Interactive Proof Construction', code);
      setProofId(proof.id);
    } catch (error) {
      console.error('Failed to create proof:', error);
    }
  };

  const handleApplySuggestion = (suggestion: any) => {
    // Insert suggestion at cursor position or at the end
    const lines = code.split('\n');
    const lastLine = lines[lines.length - 1];

    let newCode;
    if (lastLine.includes(':= by')) {
      // Replace the ":= by" with the tactic
      newCode = code.replace(':= by', `:= by\n  ${suggestion.content}`);
    } else if (lastLine.trim() === 'by') {
      // Add first tactic after "by"
      newCode = code + '\n  ' + suggestion.content;
    } else {
      // Add additional tactics
      newCode = code + '\n  ' + suggestion.content;
    }

    setCode(newCode);
    setSteps([...steps, suggestion.content]);
    setCurrentStep(currentStep + 1);
  };

  const handleVerifyStep = async () => {
    if (!proofId) return;

    try {
      const result = await proofsApi.verify(proofId);
      if (result.valid) {
        setIsComplete(true);
        // Show success message
        const msg = document.createElement('div');
        msg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        msg.textContent = '🎉 Proof completed successfully!';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 4000);
      }
    } catch (error) {
      console.error('Verification error:', error);
    }
  };

  const resetProof = () => {
    setCode('theorem add_zero (n : Nat) : n + 0 = n := by');
    setCurrentGoal('Prove: ∀ n : Nat, n + 0 = n');
    setSteps([]);
    setCurrentStep(0);
    setIsComplete(false);
    setProofId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <span>AI Proof Assistant</span>
          </h1>
          <p className="text-gray-600">
            Your intelligent mathematical copilot for constructing formal proofs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={resetProof}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            New Proof
          </button>
          {proofId && (
            <button
              onClick={handleVerifyStep}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Verify Proof</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Current Goal */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Target className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-blue-900">Current Goal</h2>
            </div>
            <div className="bg-white border border-blue-100 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowRight className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">{currentGoal}</span>
              </div>
              <p className="text-sm text-blue-700">
                {isComplete ? '🎉 Proof completed!' : 'AI suggestions will help you reach this goal step by step.'}
              </p>
            </div>
          </div>

          {/* Proof Progress */}
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BookOpen className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold">Proof Progress</h2>
              <span className="text-sm text-gray-500">Step {currentStep + 1}</span>
            </div>
            <div className="space-y-3">
              {steps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Ready to start your proof!</p>
                  <p className="text-xs mt-1">Apply AI suggestions to build your proof incrementally.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-green-900 text-sm">{step}</span>
                        <p className="text-xs text-green-700 mt-1">Step {index + 1} applied</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Code Editor */}
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-bold">λ</span>
              </div>
              <h2 className="text-lg font-semibold">Lean 4 Code</h2>
            </div>
            <CodeEditor value={code} onChange={setCode} height="400px" />
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {parsedProof?.theorems?.length || 0} theorems, {parsedProof?.lemmas?.length || 0} lemmas, {parsedProof?.definitions?.length || 0} definitions parsed
              </div>
              <button
                onClick={handleCreateProof}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start AI Assistance</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI Suggestions Panel */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">AI Proof Copilot</h3>
            </div>
            <p className="text-sm text-purple-700">
              Intelligent suggestions powered by formal mathematics reasoning
            </p>
          </div>

          {proofId ? (
            <SuggestionsPanel
              proofId={proofId}
              currentGoal={currentGoal}
              onApply={handleApplySuggestion}
            />
          ) : (
            <div className="bg-white border border-gray-300 rounded-lg p-6 text-center">
              <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Ready for AI Assistance</h3>
              <p className="text-sm text-gray-600 mb-4">
                Click "Start AI Assistance" to begin getting intelligent proof suggestions.
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>✨ Context-aware tactic suggestions</p>
                <p>📚 Relevant lemma recommendations</p>
                <p>🔧 Automatic error detection & fixes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

