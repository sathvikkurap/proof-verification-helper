import { create } from 'zustand';

export interface ParsedProof {
  theorems: TheoremInfo[];
  lemmas: TheoremInfo[];
  definitions: DefinitionInfo[];
  dependencies: string[];
  errors: ParseError[];
}

export interface TheoremInfo {
  name: string;
  statement: string;
  proof?: string;
  lineStart: number;
  lineEnd: number;
}

export interface DefinitionInfo {
  name: string;
  type: string;
  value?: string;
  lineStart: number;
  lineEnd: number;
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
}

export interface Proof {
  id: string;
  name: string;
  code: string;
  status: 'complete' | 'incomplete' | 'error';
  dependencies: string[];
  dependents: string[];
  created_at: string;
  updated_at: string;
  parsed?: ParsedProof;
}

interface ProofState {
  currentProof: Proof | null;
  setCurrentProof: (proof: Proof | null) => void;
  updateProofCode: (code: string) => void;
}

export const useProofStore = create<ProofState>((set) => ({
  currentProof: null,
  setCurrentProof: (proof) => set({ currentProof: proof }),
  updateProofCode: (code) =>
    set((state) => ({
      currentProof: state.currentProof
        ? { ...state.currentProof, code }
        : null,
    })),
}));

