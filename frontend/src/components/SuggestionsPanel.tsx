import { useState, useEffect } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, CheckCircle, Sparkles, Target, Zap, BookOpen } from 'lucide-react';
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
    if (proofId) {
      loadSuggestions();
    }
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tactic':
        return <Zap className="w-4 h-4" />;
      case 'lemma':
        return <BookOpen className="w-4 h-4" />;
      case 'fix':
        return <Target className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
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
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">AI Proof Copilot</h3>
          <span className="text-sm text-gray-500">({suggestions.length} suggestions)</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">Intelligent guidance for your mathematical proof</p>
      </div>
      <div className="divide-y divide-gray-100">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`p-1.5 rounded ${getTypeColor(suggestion.type).replace('text-', 'bg-').replace('-800', '-100')}`}>
                    {getTypeIcon(suggestion.type)}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(
                      suggestion.type
                    )}`}
                  >
                    {suggestion.type}
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-gray-500">
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 border-l-4 border-purple-200 pl-3 py-2 mb-2">
                  <code className="text-sm font-mono font-medium text-gray-900 bg-white px-2 py-1 rounded border">
                    {suggestion.content}
                  </code>
                </div>
                {expanded.has(suggestion.id) && (
                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {suggestion.explanation}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {onApply && (
                  <button
                    onClick={() => onApply(suggestion)}
                    className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1"
                    title="Apply this suggestion to your proof"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Apply</span>
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

