import { useState, useEffect } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { proofsApi } from '../api/proofs';

interface Suggestion {
  id: string;
  type: 'lemma' | 'tactic' | 'fix' | 'step';
  content: string;
  explanation: string;
  confidence: number;
  context: string;
}

interface SuggestionsPanelProps {
  proofId: string;
  currentGoal?: string;
  errorMessage?: string;
  onApply?: (suggestion: Suggestion) => void;
}

export default function SuggestionsPanel({
  proofId,
  currentGoal,
  errorMessage,
  onApply,
}: SuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSuggestions();
  }, [proofId, currentGoal, errorMessage]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data = await proofsApi.getSuggestions(proofId, currentGoal, errorMessage);
      setSuggestions(data.suggestions || []);
      // Expand first suggestion by default
      if (data.suggestions && data.suggestions.length > 0) {
        setExpanded(new Set([data.suggestions[0].id]));
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lemma':
        return 'bg-blue-100 text-blue-800';
      case 'tactic':
        return 'bg-green-100 text-green-800';
      case 'fix':
        return 'bg-red-100 text-red-800';
      case 'step':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-500 animate-pulse" />
          <span className="text-sm text-gray-600">Loading suggestions...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-gray-500">
          <Lightbulb className="w-5 h-5" />
          <span className="text-sm">No suggestions available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900">AI Suggestions</h3>
          <span className="text-sm text-gray-500">({suggestions.length})</span>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(
                      suggestion.type
                    )}`}
                  >
                    {suggestion.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {suggestion.content}
                </p>
                {expanded.has(suggestion.id) && (
                  <p className="text-sm text-gray-600 mt-2">
                    {suggestion.explanation}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {onApply && (
                  <button
                    onClick={() => onApply(suggestion)}
                    className="p-1 text-green-600 hover:text-green-700"
                    title="Apply suggestion"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => toggleExpand(suggestion.id)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  {expanded.has(suggestion.id) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

