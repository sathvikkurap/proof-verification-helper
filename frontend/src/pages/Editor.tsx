import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import ProofVisualization from '../components/ProofVisualization';
import SuggestionsPanel from '../components/SuggestionsPanel';
import { proofsApi } from '../api/proofs';
import { useProofStore } from '../store/proofStore';
import { Save, Play, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProof, setCurrentProof, updateProofCode } = useProofStore();
  const [code, setCode] = useState('');
  const [name, setName] = useState('Untitled Proof');
  const [parsed, setParsed] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showVisualization, setShowVisualization] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentGoal, setCurrentGoal] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadProof(id);
    } else {
      // New proof with helpful example
      const exampleCode = `-- Welcome! Try editing this proof
theorem example : True := by trivial

-- Or try a more complex example:
-- theorem add_zero (n : Nat) : n + 0 = n := by simp`;
      setCode(exampleCode);
      setName('New Proof');
      parseCode(exampleCode);
    }
  }, [id]);

  const loadProof = async (proofId: string) => {
    setLoading(true);
    try {
      const proof = await proofsApi.get(proofId);
      setCurrentProof(proof);
      setCode(proof.code);
      setName(proof.name);
      setParsed(proof.parsed);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load proof');
    } finally {
      setLoading(false);
    }
  };

  const parseCode = async (codeToParse: string) => {
    try {
      const parsedData = await proofsApi.parse(codeToParse);
      setParsed(parsedData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to parse code');
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    updateProofCode(newCode);
    // Debounce parsing
    const timeout = setTimeout(() => {
      parseCode(newCode);
    }, 1000);
    return () => clearTimeout(timeout);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parse code first to get latest parsed data
      const parsedData = await proofsApi.parse(code);
      setParsed(parsedData);
      
      if (currentProof?.id) {
        const updatedProof = await proofsApi.update(currentProof.id, name, code);
        setCurrentProof(updatedProof);
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successMsg.textContent = '✓ Proof saved successfully!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      } else {
        const proof = await proofsApi.create(name, code);
        setCurrentProof(proof);
        setParsed(proof.parsed || parsedData);
        navigate(`/editor/${proof.id}`);
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successMsg.textContent = '✓ Proof created and saved!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      }
    } catch (err: any) {
      console.error('Save error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to save proof';
      setError(errorMsg);
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorDiv.textContent = `✗ ${errorMsg}`;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      let proofId = currentProof?.id;
      if (!proofId) {
        const proof = await proofsApi.create(name, code);
        setCurrentProof(proof);
        proofId = proof.id;
      }
      const result = await proofsApi.verify(proofId);
      const msg = document.createElement('div');
      msg.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        result.valid ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
      }`;
      msg.textContent = result.valid 
        ? '✓ Proof is valid!' 
        : `⚠ Proof has ${result.errors.length} error(s)`;
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 4000);
      if (!result.valid && result.errors.length > 0) {
        setError(result.errors.map((e: any) => e.message).join('; '));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify proof');
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return <div className="text-center py-12">Loading proof...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2"
            placeholder="Proof name"
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowVisualization(!showVisualization)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            {showVisualization ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>Visualization</span>
          </button>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Verify'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 text-red-800 flex items-start space-x-3">
          <span className="text-red-500 font-bold">⚠</span>
          <div className="flex-1">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Code Editor</h2>
            <CodeEditor value={code} onChange={handleCodeChange} height="600px" />
          </div>

          {showVisualization && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Proof Structure</h2>
              <ProofVisualization parsed={parsed} proofId={currentProof?.id} />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">AI Suggestions</h2>
              {!currentProof?.id && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Save proof to get suggestions
                </span>
              )}
            </div>
            {currentProof?.id ? (
              <SuggestionsPanel
                proofId={currentProof.id}
                errorMessage={parsed?.errors?.[0]?.message}
                currentGoal={currentGoal}
                onApply={(suggestion) => {
                  // Apply suggestion to code
                  const newCode = code + '\n  ' + suggestion.content;
                  setCode(newCode);
                  handleCodeChange(newCode);
                  const msg = document.createElement('div');
                  msg.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                  msg.textContent = `✓ Applied: ${suggestion.content}`;
                  document.body.appendChild(msg);
                  setTimeout(() => msg.remove(), 2000);
                }}
              />
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                <p className="text-sm">Save your proof to get AI-powered suggestions</p>
                <p className="text-xs mt-2">Click the 'Save' button above to create a proof</p>
              </div>
            )}
          </div>

          {parsed && (
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Proof Analysis</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Theorems:</span>
                  <span className="font-medium">{parsed.theorems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lemmas:</span>
                  <span className="font-medium">{parsed.lemmas.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Definitions:</span>
                  <span className="font-medium">{parsed.definitions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dependencies:</span>
                  <span className="font-medium">{parsed.dependencies.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Errors:</span>
                  <span className={`font-medium ${parsed.errors.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {parsed.errors.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

