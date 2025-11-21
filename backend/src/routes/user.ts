import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getLibraryEntry, getProofById, getProofsByUser, upsertLibraryEntry } from '../db';

const router = express.Router();

// Get user's proofs
router.get('/proofs', authenticateToken, (req: AuthRequest, res) => {
  try {
    const proofs = getProofsByUser(req.userId);
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

    // Check if proof exists
    const proof = getProofById(id);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }
    const existing = getLibraryEntry(req.userId, id);
    upsertLibraryEntry({
      userId: req.userId!,
      proofId: id,
      tags: tags ?? existing?.tags ?? null,
      notes: notes ?? existing?.notes ?? null,
    });

    res.json({ message: 'Proof saved to library' });
  } catch (error) {
    console.error('Save proof error:', error);
    res.status(500).json({ error: 'Failed to save proof' });
  }
});

export default router;

