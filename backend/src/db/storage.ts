import fs from 'fs';
import path from 'path';
import { generateId } from '../utils/id';

const STATE_FILE = process.env.STATE_FILE_PATH || path.join(__dirname, '../../data/state.json');

interface ProofRecord {
  id: string;
  user_id: string | null;
  name: string;
  code: string;
  status: 'error' | 'complete' | 'incomplete';
  created_at: string;
  updated_at: string;
}

interface DependencyRecord {
  id: string;
  proof_id: string;
  depends_on_proof_id?: string;
  depends_on_theorem?: string;
  created_at: string;
}

interface UserRecord {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

interface LibraryRecord {
  id: string;
  user_id: string;
  proof_id: string;
  tags?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface StateShape {
  proofs: ProofRecord[];
  dependencies: DependencyRecord[];
  users: UserRecord[];
  library: LibraryRecord[];
}

let state: StateShape | null = null;

function ensureDataDirectory() {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadState() {
  if (!state) {
    ensureDataDirectory();
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      try {
        state = JSON.parse(raw);
      } catch (error) {
        console.error('Failed to parse state file, rebuilding', error);
        state = { proofs: [], dependencies: [], users: [], library: [] };
      }
    } else {
      state = { proofs: [], dependencies: [], users: [], library: [] };
      saveState();
    }
  }
  return state;
}

function saveState() {
  if (!state) return;
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function now() {
  return new Date().toISOString();
}

// Proof helpers
export function createProof(record: Omit<ProofRecord, 'created_at' | 'updated_at'>) {
  const s = loadState();
  const timestamp = now();
  const proof: ProofRecord = {
    ...record,
    created_at: record.created_at ?? timestamp,
    updated_at: record.updated_at ?? timestamp,
  };
  s.proofs.push(proof);
  saveState();
  return proof;
}

export function getProofById(id: string) {
  return loadState().proofs.find((proof) => proof.id === id);
}

export function updateProof(id: string, updates: Partial<Omit<ProofRecord, 'id'>>) {
  const s = loadState();
  const proof = s.proofs.find((p) => p.id === id);
  if (!proof) return null;
  Object.assign(proof, updates, { updated_at: now() });
  saveState();
  return proof;
}

export function deleteProof(id: string) {
  const s = loadState();
  s.proofs = s.proofs.filter((proof) => proof.id !== id);
  s.dependencies = s.dependencies.filter(
    (dep) => dep.proof_id !== id && dep.depends_on_proof_id !== id
  );
  s.library = s.library.filter((entry) => entry.proof_id !== id);
  saveState();
}

export function getProofsByUser(userId: string | undefined | null) {
  const s = loadState();
  if (!userId) return [];
  return s.proofs
    .filter((proof) => proof.user_id === userId)
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

// Dependency helpers
export function clearDependencies(proofId: string) {
  const s = loadState();
  s.dependencies = s.dependencies.filter((dep) => dep.proof_id !== proofId);
  saveState();
}

export function addDependency(dep: Omit<DependencyRecord, 'id' | 'created_at'>) {
  const s = loadState();
  const entry: DependencyRecord = {
    id: generateId(),
    created_at: now(),
    ...dep,
  };
  s.dependencies.push(entry);
  saveState();
  return entry;
}

export function getDependenciesForProof(proofId: string) {
  return loadState().dependencies.filter((dep) => dep.proof_id === proofId);
}

export function getDependentsForProof(proofId: string) {
  return loadState().dependencies.filter((dep) => dep.depends_on_proof_id === proofId);
}

// User helpers
export function findUserByEmailOrUsername(email: string, username: string) {
  return loadState().users.find((user) => user.email === email || user.username === username);
}

export function findUserByEmail(email: string) {
  return loadState().users.find((user) => user.email === email);
}

export function createUser(record: Omit<UserRecord, 'created_at' | 'updated_at'>) {
  const s = loadState();
  const timestamp = now();
  const user: UserRecord = {
    ...record,
    created_at: timestamp,
    updated_at: timestamp,
  };
  s.users.push(user);
  saveState();
  return user;
}

// Library helpers
export function getLibraryEntry(userId: string, proofId: string) {
  return loadState().library.find(
    (entry) => entry.user_id === userId && entry.proof_id === proofId
  );
}

export function upsertLibraryEntry(params: {
  userId: string;
  proofId: string;
  tags?: string | null;
  notes?: string | null;
}) {
  const s = loadState();
  const timestamp = now();
  let entry = s.library.find(
    (item) => item.user_id === params.userId && item.proof_id === params.proofId
  );
  if (entry) {
    entry.tags = params.tags ?? entry.tags;
    entry.notes = params.notes ?? entry.notes;
    entry.updated_at = timestamp;
  } else {
    entry = {
      id: generateId(),
      user_id: params.userId,
      proof_id: params.proofId,
      tags: params.tags ?? null,
      notes: params.notes ?? null,
      created_at: timestamp,
      updated_at: timestamp,
    };
    s.library.push(entry);
  }
  saveState();
  return entry;
}

export const THEOREMS: { id: string; name: string; statement: string; category?: string }[] = [
  {
    id: 'fext',
    name: 'False.elim',
    statement: 'False.elim',
    category: 'logic',
  },
  {
    id: 'refl',
    name: 'eq.refl',
    statement: 'x = x',
    category: 'algebra',
  },
];

export function searchTheorems(query?: string, category?: string, difficulty?: string) {
  let results = [...THEOREMS];
  if (query) {
    const lower = query.toLowerCase();
    results = results.filter(
      (theorem) =>
        theorem.name.toLowerCase().includes(lower) ||
        theorem.statement.toLowerCase().includes(lower)
    );
  }
  if (category) {
    results = results.filter((theorem) => theorem.category === category);
  }
  return results.slice(0, 50);
}

export function getTheoremById(id: string) {
  return THEOREMS.find((theorem) => theorem.id === id);
}

export function getDependentsByTheorem(theoremId: string) {
  const proofs = loadState().proofs.filter((proof) =>
    loadState()
      .dependencies
      .some((dep) => dep.proof_id === proof.id && dep.depends_on_theorem === theoremId)
  );
  return proofs.map((proof) => ({
    id: proof.id,
    name: proof.name,
    status: proof.status,
  }));
}


