import express from 'express';
import { getDatabase } from '../db';
import { generateId } from '../utils/id';

const router = express.Router();

// Search theorems
router.get('/search', (req, res) => {
  try {
    const { q, category, difficulty } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM theorems WHERE 1=1';
    const params: any[] = [];

    if (q) {
      query += ' AND (name LIKE ? OR statement LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY name LIMIT 50';

    const theorems = db.prepare(query).all(...params) as any[];

    res.json({
      theorems: theorems.map(t => ({
        ...t,
        tags: t.tags ? t.tags.split(',') : [],
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
    const db = getDatabase();

    const theorem = db.prepare('SELECT * FROM theorems WHERE id = ?').get(id) as any;
    if (!theorem) {
      return res.status(404).json({ error: 'Theorem not found' });
    }

    res.json({
      ...theorem,
      tags: theorem.tags ? theorem.tags.split(',') : [],
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
    const db = getDatabase();

    const dependents = db.prepare(`
      SELECT DISTINCT p.id, p.name, p.status
      FROM proofs p
      JOIN proof_dependencies pd ON p.id = pd.proof_id
      WHERE pd.depends_on_theorem = ?
    `).all(id) as any[];

    res.json({ dependents });
  } catch (error) {
    console.error('Get dependents error:', error);
    res.status(500).json({ error: 'Failed to get dependents' });
  }
});

export default router;

