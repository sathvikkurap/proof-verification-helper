import { useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import SuggestionsPanel from '../components/SuggestionsPanel';
import { proofsApi } from '../api/proofs';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export default function ProofBuilder() {
  const [code, setCode] = useState('theorem example : True := by trivial');
  const [currentGoal, setCurrentGoal] = useState<string>('Prove: True');
  const [proofId, setProofId] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);

  const handleCreateProof = async () => {
    try {
      const proof = await proofsApi.create('Step-by-Step Proof', code);
      setProofId(proof.id);
    } catch (error) {
      console.error('Failed to create proof:', error);
    }
  };

  const handleApplySuggestion = (suggestion: any) => {
    const newCode = code + '\n  ' + suggestion.content;
    setCode(newCode);
    setSteps([...steps, suggestion.content]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Step-by-Step Proof Builder</h1>
        <p className="text-gray-600">
          Build your proof incrementally with guided suggestions and step-by-step verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Current Goal</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowRight className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">{currentGoal}</span>
              </div>
              <p className="text-sm text-blue-700">
                Use the suggestions panel to find the next step for your proof.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Proof Steps</h2>
            <div className="bg-white border border-gray-300 rounded-lg p-4 space-y-2">
              {steps.length === 0 ? (
                <p className="text-gray-500 text-sm">No steps added yet. Apply a suggestion to get started.</p>
              ) : (
                steps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Code Editor</h2>
            <CodeEditor value={code} onChange={setCode} height="400px" />
            <div className="mt-4">
              <button
                onClick={handleCreateProof}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Initialize Proof
              </button>
            </div>
          </div>
        </div>

        <div>
          {proofId ? (
            <SuggestionsPanel
              proofId={proofId}
              currentGoal={currentGoal}
              onApply={handleApplySuggestion}
            />
          ) : (
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Click "Initialize Proof" to start getting AI suggestions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

