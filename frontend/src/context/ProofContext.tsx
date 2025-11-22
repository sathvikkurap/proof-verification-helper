import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { proofsApi } from '../api/proofs';

export interface ParsedProof {
  theorems: Array<{
    name: string;
    statement: string;
    proof: string;
    lineStart: number;
    lineEnd: number;
  }>;
  lemmas: Array<{
    name: string;
    statement: string;
    proof: string;
    lineStart: number;
    lineEnd: number;
  }>;
  definitions: Array<{
    name: string;
    type: string;
    value?: string;
    lineStart: number;
    lineEnd: number;
  }>;
  dependencies: string[];
  errors: Array<{
    message: string;
    line: number;
    column: number;
  }>;
}

export interface Proof {
  id: string;
  name: string;
  code: string;
  status: 'complete' | 'incomplete' | 'error';
  user_id?: string;
  created_at: string;
  updated_at: string;
  parsed?: ParsedProof;
  dependencies?: string[];
  dependents?: string[];
}

export interface Suggestion {
  id: string;
  type: 'lemma' | 'tactic' | 'fix' | 'step';
  content: string;
  explanation: string;
  confidence: number;
  context?: string;
  category?: string;
  prerequisites?: string[];
  examples?: string[];
}

interface ProofContextType {
  currentProof: Proof | null;
  suggestions: Suggestion[];
  loading: boolean;
  error: string | null;
  createProof: (name: string, code: string) => Promise<Proof>;
  updateProof: (id: string, updates: Partial<Proof>) => Promise<Proof>;
  loadProof: (id: string) => Promise<Proof>;
  parseCode: (code: string) => Promise<ParsedProof>;
  getSuggestions: (proofId: string, currentGoal?: string, errorMessage?: string) => Promise<Suggestion[]>;
  verifyProof: (id: string) => Promise<{ valid: boolean; errors: any[]; message: string }>;
  saveToLibrary: (proofId: string, tags?: string, notes?: string) => Promise<void>;
  clearError: () => void;
}

const ProofContext = createContext<ProofContextType | undefined>(undefined);

export const useProof = () => {
  const context = useContext(ProofContext);
  if (context === undefined) {
    throw new Error('useProof must be used within a ProofProvider');
  }
  return context;
};

interface ProofProviderProps {
  children: ReactNode;
}

export const ProofProvider: React.FC<ProofProviderProps> = ({ children }) => {
  const [currentProof, setCurrentProof] = useState<Proof | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createProof = useCallback(async (name: string, code: string): Promise<Proof> => {
    setLoading(true);
    setError(null);
    try {
      const response = await proofsApi.create({ name, code });
      const proof = response.data;
      setCurrentProof(proof);
      return proof;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create proof';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProof = useCallback(async (id: string, updates: Partial<Proof>): Promise<Proof> => {
    setLoading(true);
    setError(null);
    try {
      const response = await proofsApi.update(id, updates);
      const updatedProof = response.data;
      if (currentProof?.id === id) {
        setCurrentProof(updatedProof);
      }
      return updatedProof;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update proof';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentProof]);

  const loadProof = useCallback(async (id: string): Promise<Proof> => {
    setLoading(true);
    setError(null);
    try {
      const response = await proofsApi.get(id);
      const proof = response.data;
      setCurrentProof(proof);
      return proof;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load proof';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const parseCode = useCallback(async (code: string): Promise<ParsedProof> => {
    try {
      const response = await proofsApi.parse(code);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to parse code';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const getSuggestions = useCallback(async (
    proofId: string,
    currentGoal?: string,
    errorMessage?: string
  ): Promise<Suggestion[]> => {
    try {
      const response = await proofsApi.getSuggestions(proofId, { currentGoal, errorMessage });
      const newSuggestions = response.data.suggestions;
      setSuggestions(newSuggestions);
      return newSuggestions;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to get suggestions';
      setError(errorMessage);
      // Return empty array on error to avoid breaking UI
      return [];
    }
  }, []);

  const verifyProof = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await proofsApi.verify(id);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to verify proof';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveToLibrary = useCallback(async (proofId: string, tags?: string, notes?: string) => {
    try {
      await proofsApi.saveToLibrary(proofId, { tags, notes });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to save to library';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const value: ProofContextType = {
    currentProof,
    suggestions,
    loading,
    error,
    createProof,
    updateProof,
    loadProof,
    parseCode,
    getSuggestions,
    verifyProof,
    saveToLibrary,
    clearError,
  };

  return <ProofContext.Provider value={value}>{children}</ProofContext.Provider>;
};
