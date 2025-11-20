import express from 'express';
import { getDatabase } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user's proofs
router.get('/proofs', authenticateToken, (req: AuthRequest, res) => {
  try {
    const db = getDatabase();

    const proofs = db.prepare(`
      SELECT * FROM proofs
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `).all(req.userId) as any[];

    res.json({ proofs });
  } catch (error) {
    console.error('Get user proofs error:', error);
    res.status(500).json({ error: 'Failed to get proofs' });
  }
});

// Save proof to library
router.post('/proofs/:id/save', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { tags, notes } = req.body;
    const db = getDatabase();

    // Check if proof exists
    const proof = db.prepare('SELECT * FROM proofs WHERE id = ?').get(id) as any;
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    // Check if already saved
    const existing = db.prepare(`
      SELECT * FROM user_proof_library
      WHERE user_id = ? AND proof_id = ?
    `).get(req.userId, id) as any;

    if (existing) {
      // Update
      db.prepare(`
        UPDATE user_proof_library
        SET tags = COALESCE(?, tags),
            notes = COALESCE(?, notes)
        WHERE id = ?
      `).run(tags, notes, existing.id);
    } else {
      // Insert
      const libId = `lib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT INTO user_proof_library (id, user_id, proof_id, tags, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(libId, req.userId, id, tags || null, notes || null);
    }

    res.json({ message: 'Proof saved to library' });
  } catch (error) {
    console.error('Save proof error:', error);
    res.status(500).json({ error: 'Failed to save proof' });
  }
});

export default router;

