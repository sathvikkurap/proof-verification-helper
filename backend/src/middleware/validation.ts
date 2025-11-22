// Comprehensive input validation middleware
import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';

// Validation middleware
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new ValidationError('Validation failed', {
      errors: errors.array(),
    });
    return next(validationError);
  }
  next();
};

// Proof validation rules
export const validateProofCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Proof name must be 1-200 characters')
    .matches(/^[a-zA-Z0-9\s\-_()]+$/)
    .withMessage('Proof name contains invalid characters'),

  body('code')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Proof code must be 1-10000 characters')
    .matches(/^(?!.*\b(import|require|eval|exec)\b)/i)
    .withMessage('Code contains potentially unsafe keywords'),

  handleValidationErrors,
];

export const validateProofUpdate = [
  param('id')
    .isUUID()
    .withMessage('Invalid proof ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Proof name must be 1-200 characters'),

  body('code')
    .optional()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Proof code must be 1-10000 characters'),

  handleValidationErrors,
];

export const validateProofId = [
  param('id')
    .isLength({ min: 10, max: 50 })
    .withMessage('Invalid proof ID'),

  handleValidationErrors,
];

// User validation rules
export const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  handleValidationErrors,
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors,
];

// Library validation rules
export const validateLibrarySave = [
  param('id')
    .isUUID()
    .withMessage('Invalid proof ID'),

  body('tags')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Tags must be less than 500 characters'),

  body('notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Notes must be less than 2000 characters'),

  handleValidationErrors,
];

// Search validation rules
export const validateSearch = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be 1-100 characters'),

  query('category')
    .optional()
    .isIn(['arithmetic', 'logic', 'set-theory', 'analysis', 'algebra', 'topology', 'other'])
    .withMessage('Invalid category'),

  query('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),

  handleValidationErrors,
];

// AI suggestions validation
export const validateAISuggestions = [
  param('id')
    .isLength({ min: 10, max: 50 })
    .withMessage('Invalid proof ID'),

  body('currentGoal')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Current goal must be less than 500 characters'),

  body('errorMessage')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Error message must be less than 1000 characters'),

  handleValidationErrors,
];
