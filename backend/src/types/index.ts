export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Proof {
  id: string;
  user_id?: string;
  name: string;
  code: string;
  status: 'complete' | 'incomplete' | 'error';
  dependencies: string[];
  dependents: string[];
  created_at: string;
  updated_at: string;
}

export interface Theorem {
  id: string;
  name: string;
  statement: string;
  proof?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  location: string;
  created_at: string;
}

export interface Suggestion {
  id: string;
  type: 'lemma' | 'tactic' | 'fix' | 'step';
  content: string;
  explanation: string;
  confidence: number;
  context: string;
}

export interface ProofDependency {
  id: string;
  proof_id: string;
  depends_on_proof_id?: string;
  depends_on_theorem?: string;
  created_at: string;
}

export interface ProofComment {
  id: string;
  proof_id: string;
  user_id: string;
  content: string;
  line_number?: number;
  created_at: string;
}

