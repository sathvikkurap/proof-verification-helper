import express from 'express';
import {
  addDependency,
  clearDependencies,
  createProof,
  deleteProof,
  getDependenciesForProof,
  getDependentsForProof,
  getProofById,
  updateProof,
} from '../db';
import { generateId } from '../utils/id';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';
import { parseLeanCode } from '../utils/leanParser';
import { getAISuggestions } from '../services/aiService';
import { getOllamaSuggestions } from '../services/ollamaService';


const router = express.Router();

// Parse Lean code
router.post('/parse', (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required' });
    }

    const parsed = parseLeanCode(code);

    res.json(parsed);
  } catch (error: any) {
    console.error('Parse error:', error);
    const errorMessage = error?.message || 'Failed to parse code';
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
});

// Create new proof
router.post('/', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const id = generateId();
    const parsed = parseLeanCode(code);
    const status = parsed.errors.length > 0 ? 'error' : parsed.theorems.length > 0 ? 'complete' : 'incomplete';
    createProof({
      id,
      user_id: req.userId || null,
      name,
      code,
      status,
    });

    // Save dependencies
    for (const dep of parsed.dependencies) {
      addDependency({
        proof_id: id,
        depends_on_theorem: dep,
      });
    }

    res.status(201).json({
      id,
      name,
      code,
      status,
      dependencies: parsed.dependencies,
      parsed,
    });
  } catch (error) {
    console.error('Create proof error:', error);
    res.status(500).json({ error: 'Failed to create proof' });
  }
});

// Get proof by ID
router.get('/:id', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const proof = getProofById(id);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    // Get dependencies
    const dependencies = getDependenciesForProof(id);
    const dependents = getDependentsForProof(id);
    const parsed = parseLeanCode(proof.code);

    res.json({
      ...proof,
      dependencies: dependencies.map(d => d.depends_on_proof_id || d.depends_on_theorem).filter(Boolean),
      dependents: dependents.map(d => d.proof_id),
      parsed,
    });
  } catch (error) {
    console.error('Get proof error:', error);
    res.status(500).json({ error: 'Failed to get proof' });
  }
});

// Update proof
router.put('/:id', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    // Check if proof exists
    const proof = getProofById(id);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    // Check ownership only if proof has a user_id
    if (proof.user_id) {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required to update this proof' });
      }
      if (proof.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    const parsed = parseLeanCode(code || proof.code);
    const status = parsed.errors.length > 0 ? 'error' : parsed.theorems.length > 0 ? 'complete' : 'incomplete';

    updateProof(id, {
      name: name || proof.name,
      code: code || proof.code,
      status,
    });

    // Update dependencies
    clearDependencies(id);
    for (const dep of parsed.dependencies) {
      addDependency({
        proof_id: id,
        depends_on_theorem: dep,
      });
    }

    res.json({
      id,
      name: name || proof.name,
      code: code || proof.code,
      status,
      dependencies: parsed.dependencies,
      parsed,
      user_id: proof.user_id,
      created_at: proof.created_at,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Update proof error:', error);
    res.status(500).json({ error: 'Failed to update proof' });
  }
});

// Delete proof
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const proof = getProofById(id);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    if (proof.user_id && proof.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    deleteProof(id);

    res.json({ message: 'Proof deleted' });
  } catch (error) {
    console.error('Delete proof error:', error);
    res.status(500).json({ error: 'Failed to delete proof' });
  }
});

// Analyze proof structure
router.post('/:id/analyze', (req, res) => {
  try {
    const { id } = req.params;
    const proof = getProofById(id);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    const parsed = parseLeanCode(proof.code);

    res.json({
      proof: {
        id: proof.id,
        name: proof.name,
        status: proof.status,
      },
      analysis: {
        theoremCount: parsed.theorems.length,
        lemmaCount: parsed.lemmas.length,
        definitionCount: parsed.definitions.length,
        dependencyCount: parsed.dependencies.length,
        errorCount: parsed.errors.length,
      },
      parsed,
    });
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze proof' });
  }
});

// Get dependency graph
router.get('/:id/dependencies', (req, res) => {
  try {
    const { id } = req.params;
    const proof = getProofById(id);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    const dependencies = getDependenciesForProof(id);
    const dependents = getDependentsForProof(id);

    res.json({
      proofId: id,
      dependencies: dependencies.map(d => ({
        proofId: d.depends_on_proof_id,
        theorem: d.depends_on_theorem,
      })),
      dependents: dependents.map(d => d.proof_id),
    });
  } catch (error) {
    console.error('Get dependencies error:', error);
    res.status(500).json({ error: 'Failed to get dependencies' });
  }
});

// Get AI suggestions
router.post('/:id/suggestions', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentGoal, errorMessage } = req.body;
    const proof = getProofById(id);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    const suggestions = await getAISuggestions({
      proofCode: proof.code,
      currentGoal,
      errorMessage,
    });

    res.json({ suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
    const { id } = req.params;
    const { currentGoal, errorMessage } = req.body;
    const proof = getProofById(id);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    // TEMPORARY: Force Ollama return for testing
    console.log('🔍 FORCE Ollama test...');

    const ollamaSuggestions = await getOllamaSuggestions({
      proofCode: proof.code,
      currentGoal,
      errorMessage,
    });

    return res.json({
      suggestions: ollamaSuggestions,
      debug: {
        ollama_called: true,
        suggestions_count: ollamaSuggestions.length,
        first_suggestion: ollamaSuggestions[0]?.content
      }
    });
});

// Verify proof (mock - would integrate with Lean server)
router.post('/:id/verify', (req, res) => {
  try {
    const { id } = req.params;
    const proof = getProofById(id);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    const parsed = parseLeanCode(proof.code);
    const isValid = parsed.errors.length === 0 && parsed.theorems.length > 0;

    // Update status
    updateProof(id, { status: isValid ? 'complete' : 'error' });

    res.json({
      valid: isValid,
      errors: parsed.errors,
      message: isValid ? 'Proof is valid' : 'Proof has errors',
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Failed to verify proof' });
  }
});

export default router;

