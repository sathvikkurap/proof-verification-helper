import express, { Request, Response } from 'express';
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
import { asyncHandler, ValidationError, NotFoundError, AuthorizationError } from '../middleware/errorHandler';
import {
  validateProofCreation,
  validateProofUpdate,
  validateProofId,
  validateAISuggestions,
} from '../middleware/validation';

const router = express.Router();

/**
 * @swagger
 * /api/proofs/parse:
 *   post:
 *     tags:
 *       - Proofs
 *     summary: Parse Lean 4 code
 *     description: Parse Lean 4 code and extract theorems, lemmas, definitions, and dependencies
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Lean 4 code to parse
 *                 maxLength: 10000
 *     responses:
 *       200:
 *         description: Successfully parsed code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParsedProof'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/parse', asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    throw new ValidationError('Code is required and must be a string');
  }

  if (code.length > 10000) {
    throw new ValidationError('Code exceeds maximum length of 10000 characters');
  }

  const parsed = parseLeanCode(code);
  res.json(parsed);
}));

/**
 * @swagger
 * /api/proofs:
 *   post:
 *     tags:
 *       - Proofs
 *     summary: Create a new proof
 *     description: Create a new proof with Lean 4 code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               code:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 10000
 *     responses:
 *       201:
 *         description: Proof created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 code:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [complete, incomplete, error]
 *                 dependencies:
 *                   type: array
 *                   items:
 *                     type: string
 *                 parsed:
 *                   $ref: '#/components/schemas/ParsedProof'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 */
router.post('/', validateProofCreation, optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, code } = req.body;

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
    message: 'Proof created successfully',
  });
}));

/**
 * @swagger
 * /api/proofs/{id}:
 *   get:
 *     tags:
 *       - Proofs
 *     summary: Get proof by ID
 *     description: Retrieve a specific proof with its parsed structure and dependencies
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Proof ID
 *     responses:
 *       200:
 *         description: Proof retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Proof'
 *                 - type: object
 *                   properties:
 *                     dependencies:
 *                       type: array
 *                       items:
 *                         type: string
 *                     dependents:
 *                       type: array
 *                       items:
 *                         type: string
 *       404:
 *         description: Proof not found
 *       403:
 *         description: Access denied
 */
router.get('/:id', validateProofId, optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const proof = getProofById(id);

  if (!proof) {
    throw new NotFoundError('Proof');
  }

  // Check if user has access to private proof
  if (proof.user_id && proof.user_id !== req.userId) {
    throw new AuthorizationError('Access denied to this proof');
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
}));

/**
 * @swagger
 * /api/proofs/{id}/suggestions:
 *   post:
 *     tags:
 *       - AI
 *     summary: Get AI suggestions for proof
 *     description: Get AI-powered suggestions for continuing or fixing a proof
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Proof ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentGoal:
 *                 type: string
 *                 maxLength: 500
 *               errorMessage:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Suggestions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Suggestion'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     suggestionCount:
 *                       type: integer
 *                     model:
 *                       type: string
 *                     processingTime:
 *                       type: integer
 *       404:
 *         description: Proof not found
 */
router.post('/:id/suggestions', validateAISuggestions, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { currentGoal, errorMessage } = req.body;

  const proof = getProofById(id);
  if (!proof) {
    throw new NotFoundError('Proof');
  }

  const ollamaSuggestions = await getOllamaSuggestions({
    proofCode: proof.code,
    currentGoal,
    errorMessage,
  });

  res.json({
    suggestions: ollamaSuggestions,
    metadata: {
      suggestionCount: ollamaSuggestions.length,
      model: 'llama3.2',
      processingTime: Date.now(),
    }
  });
}));

/**
 * @swagger
 * /api/proofs/{id}/verify:
 *   post:
 *     tags:
 *       - Proofs
 *     summary: Verify proof
 *     description: Verify that a proof is syntactically correct and complete
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Proof ID
 *     responses:
 *       200:
 *         description: Verification completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 message:
 *                   type: string
 *       404:
 *         description: Proof not found
 */
router.post('/:id/verify', validateProofId, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const proof = getProofById(id);
  if (!proof) {
    throw new NotFoundError('Proof');
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
}));

export default router;

/**
 * @swagger
 * /api/proofs/{id}/export:
 *   get:
 *     tags:
 *       - Proofs
 *     summary: Export proof
 *     description: Export a proof in various formats (JSON, Lean, Markdown)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, lean, markdown]
 *           default: json
 *     responses:
 *       200:
 *         description: Proof exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proof'
 *           text/plain:
 *             schema:
 *               type: string
 *           text/markdown:
 *             schema:
 *               type: string
 *       404:
 *         description: Proof not found
 */
router.get('/:id/export', validateProofId, optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { format = 'json' } = req.query;

  const proof = getProofById(id);
  if (!proof) {
    throw new NotFoundError('Proof');
  }

  // Check access permissions
  if (proof.user_id && proof.user_id !== req.userId) {
    throw new AuthorizationError('Access denied to this proof');
  }

  const parsed = parseLeanCode(proof.code);
  const { ExportService } = await import('../services/exportService');

  let exportData: any;
  let contentType: string;
  let filename: string;

  switch (format) {
    case 'lean':
      exportData = ExportService.exportToLean(proof, parsed);
      contentType = 'text/plain';
      filename = `${proof.name.replace(/\s+/g, '_')}.lean`;
      break;
    case 'markdown':
      exportData = ExportService.exportToMarkdown(proof, parsed);
      contentType = 'text/markdown';
      filename = `${proof.name.replace(/\s+/g, '_')}.md`;
      break;
    default:
      exportData = ExportService.exportProof(proof, parsed);
      contentType = 'application/json';
      filename = `${proof.name.replace(/\s+/g, '_')}.json`;
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(exportData);
}));

/**
 * @swagger
 * /api/proofs/import:
 *   post:
 *     tags:
 *       - Proofs
 *     summary: Import proof
 *     description: Import a proof from JSON export or Lean code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [json]
 *                   data:
 *                     $ref: '#/components/schemas/Proof'
 *               - type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [lean]
 *                   code:
 *                     type: string
 *                   name:
 *                     type: string
 *     responses:
 *       201:
 *         description: Proof imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 proof:
 *                   $ref: '#/components/schemas/Proof'
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 warnings:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid import data
 *       401:
 *         description: Authentication required
 */
router.post('/import', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, data, code, name } = req.body;
  const { ExportService } = await import('../services/exportService');

  let result: any;

  if (type === 'json' && data) {
    result = ExportService.importProof(data);
  } else if (type === 'lean' && code) {
    result = ExportService.importFromLean(code, name);
  } else {
    return res.status(400).json({
      success: false,
      errors: ['Invalid import type or missing data'],
      warnings: []
    });
  }

  if (!result.success) {
    return res.status(400).json(result);
  }

  // Save the imported proof
  createProof({
    id: result.proof.id,
    user_id: req.userId || null,
    name: result.proof.name,
    code: result.proof.code,
    status: result.proof.status,
  });

  res.status(201).json({
    success: true,
    proof: result.proof,
    errors: result.errors,
    warnings: result.warnings,
    message: 'Proof imported successfully',
  });
}));

/**
 * @swagger
 * /api/proofs/{id}/share:
 *   post:
 *     tags:
 *       - Proofs
 *     summary: Share proof
 *     description: Create a shareable public link for a proof
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Share link created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shareUrl:
 *                   type: string
 *                   format: uri
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Proof not found
 */
router.post('/:id/share', validateProofId, authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const proof = getProofById(id);
  if (!proof) {
    throw new NotFoundError('Proof');
  }

  if (proof.user_id !== req.userId) {
    throw new AuthorizationError('You can only share your own proofs');
  }

  const { ExportService } = await import('../services/exportService');
  const shareUrl = ExportService.generateShareLink(id);

  // In a real implementation, you'd store share metadata with expiration
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  res.json({
    shareUrl,
    expiresAt: expiresAt.toISOString(),
    message: 'Proof shared successfully',
  });
}));
