import express from 'express';
import { getDependentsByTheorem, getTheoremById, searchTheorems } from '../db';

const router = express.Router();

// Search theorems
router.get('/search', (req, res) => {
  try {
    const { q, category, difficulty } = req.query;
    const results = searchTheorems(q as string | undefined, category as string | undefined, difficulty as string | undefined);
    res.json({
      theorems: results.map((t) => ({
        ...t,
        tags: [],
      })),
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search theorems' });
  }
});

// Get theorem by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const theorem = getTheoremById(id);
    if (!theorem) {
      return res.status(404).json({ error: 'Theorem not found' });
    }

    res.json({
      ...theorem,
      tags: [],
    });
  } catch (error) {
    console.error('Get theorem error:', error);
    res.status(500).json({ error: 'Failed to get theorem' });
  }
});

// Get dependents of a theorem
router.get('/:id/dependents', (req, res) => {
  try {
    const { id } = req.params;
    const dependents = getDependentsByTheorem(id);
    res.json({ dependents });
  } catch (error) {
    console.error('Get dependents error:', error);
    res.status(500).json({ error: 'Failed to get dependents' });
  }
});

export default router;

