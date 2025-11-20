import express from 'express';
import { getDatabase } from '../db';
import { generateId } from '../utils/id';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';
import { parseLeanCode } from '../utils/leanParser';
import { getAISuggestions } from '../services/aiService';

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
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: 'Failed to parse code' });
  }
});

// Create new proof
router.post('/', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const db = getDatabase();
    const id = generateId();
    const parsed = parseLeanCode(code);
    const status = parsed.errors.length > 0 ? 'error' : parsed.theorems.length > 0 ? 'complete' : 'incomplete';

    db.prepare(`
      INSERT INTO proofs (id, user_id, name, code, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.userId || null, name, code, status);

    // Save dependencies
    for (const dep of parsed.dependencies) {
      const depId = generateId();
      db.prepare(`
        INSERT INTO proof_dependencies (id, proof_id, depends_on_theorem)
        VALUES (?, ?, ?)
      `).run(depId, id, dep);
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
    const db = getDatabase();

    const proof = db.prepare('SELECT * FROM proofs WHERE id = ?').get(id) as any;
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    // Get dependencies
    const dependencies = db.prepare(`
      SELECT depends_on_proof_id, depends_on_theorem
      FROM proof_dependencies
      WHERE proof_id = ?
    `).all(id) as any[];

    // Get dependents
    const dependents = db.prepare(`
      SELECT proof_id
      FROM proof_dependencies
      WHERE depends_on_proof_id = ?
    `).all(id) as any[];

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
    const db = getDatabase();

    // Check if proof exists
    const proof = db.prepare('SELECT * FROM proofs WHERE id = ?').get(id) as any;
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

    db.prepare(`
      UPDATE proofs
      SET name = COALESCE(?, name),
          code = COALESCE(?, code),
          status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, code, status, id);

    // Update dependencies
    db.prepare('DELETE FROM proof_dependencies WHERE proof_id = ?').run(id);
    for (const dep of parsed.dependencies) {
      const depId = generateId();
      db.prepare(`
        INSERT INTO proof_dependencies (id, proof_id, depends_on_theorem)
        VALUES (?, ?, ?)
      `).run(depId, id, dep);
    }

    res.json({
      id,
      name: name || proof.name,
      code: code || proof.code,
      status,
      dependencies: parsed.dependencies,
      parsed,
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
    const db = getDatabase();

    const proof = db.prepare('SELECT * FROM proofs WHERE id = ?').get(id) as any;
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    if (proof.user_id && proof.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.prepare('DELETE FROM proofs WHERE id = ?').run(id);

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
    const db = getDatabase();

    const proof = db.prepare('SELECT * FROM proofs WHERE id = ?').get(id) as any;
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
    const db = getDatabase();

    const proof = db.prepare('SELECT * FROM proofs WHERE id = ?').get(id) as any;
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    const dependencies = db.prepare(`
      SELECT depends_on_proof_id, depends_on_theorem
      FROM proof_dependencies
      WHERE proof_id = ?
    `).all(id) as any[];

    const dependents = db.prepare(`
      SELECT proof_id
      FROM proof_dependencies
      WHERE depends_on_proof_id = ?
    `).all(id) as any[];

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
    const db = getDatabase();

    const proof = db.prepare('SELECT * FROM proofs WHERE id = ?').get(id) as any;
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
});

// Verify proof (mock - would integrate with Lean server)
router.post('/:id/verify', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const proof = db.prepare('SELECT * FROM proofs WHERE id = ?').get(id) as any;
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    const parsed = parseLeanCode(proof.code);
    const isValid = parsed.errors.length === 0 && parsed.theorems.length > 0;

    // Update status
    db.prepare(`
      UPDATE proofs
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(isValid ? 'complete' : 'error', id);

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

