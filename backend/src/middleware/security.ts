// Security middleware for production deployment
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Rate limiting configurations
export const createRateLimit = (
  windowMs: number,
  max: number,
  message: string,
  skipSuccessfulRequests = false
) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
      });
      res.status(429).json({ error: message });
    },
  });
};

// General API rate limiting
export const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

// Authentication rate limiting (stricter)
export const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 auth attempts per windowMs
  'Too many authentication attempts, please try again later.',
  true // skip successful requests
);

// AI suggestions rate limiting (expensive operations)
export const aiLimiter = createRateLimit(
  60 * 1000, // 1 minute
  10, // limit each IP to 10 AI requests per minute
  'Too many AI requests, please slow down.'
);

// Helmet configuration for security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// CORS error handler
export const corsErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent'),
    });
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }
  next(err);
};

// Request sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Basic input sanitization
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential script tags and other dangerous content
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

// Security headers for API responses
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Only allow HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

// Additional security middleware for production hardening

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Content Security Policy for additional protection
export const strictCSP = (req: Request, res: Response, next: NextFunction) => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' http://localhost:11434", // Ollama
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  next();
};

// Request size limiting
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');

    if (contentLength > parseSize(maxSize)) {
      logger.warn('Request size limit exceeded', {
        ip: req.ip,
        url: req.url,
        contentLength,
        maxSize,
      });
      return res.status(413).json({ error: 'Request entity too large' });
    }

    next();
  };
};

// Parse size string to bytes
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return Math.floor(value * units[unit]);
}

// API key authentication for services
export const apiKeyAuth = (validKeys: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey || !validKeys.includes(apiKey)) {
      logger.warn('Invalid API key attempt', {
        ip: req.ip,
        url: req.url,
        apiKey: apiKey ? '***' + apiKey.slice(-4) : 'none',
      });
      return res.status(401).json({ error: 'Invalid API key' });
    }

    next();
  };
};

// IP whitelist for sensitive operations
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || '';

    if (!allowedIPs.includes(clientIP)) {
      logger.warn('IP not in whitelist', {
        ip: clientIP,
        url: req.url,
        method: req.method,
      });
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

// Request ID middleware for tracing
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = crypto.randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('x-request-id', id);
  next();
};

// Prevent parameter pollution
export const preventParamPollution = (req: Request, res: Response, next: NextFunction) => {
  const checkObject = (obj: any, path: string[] = []): boolean => {
    if (Array.isArray(obj)) {
      // Check for duplicate parameters
      const seen = new Set();
      for (const item of obj) {
        if (typeof item === 'string' && seen.has(item)) {
          logger.warn('Parameter pollution detected', {
            ip: req.ip,
            url: req.url,
            path: path.join('.'),
            duplicate: item,
          });
          return false;
        }
        seen.add(item);
      }
    } else if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        if (!checkObject(value, [...path, key])) {
          return false;
        }
      }
    }
    return true;
  };

  if (!checkObject(req.query) || !checkObject(req.body)) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  next();
};

// Security headers for API responses
export const apiSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');

  // Add security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

// Log security events
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  res.send = function(data) {
    // Log potential security issues
    if (res.statusCode >= 400) {
      logger.warn('Security event: Error response', {
        statusCode: res.statusCode,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).userId,
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

// SQL injection protection (additional layer)
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const dangerousPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /(-{2}|\/\*|\*\/)/, // Comments
    /('|(\\x27)|(\\x2D))/, // Quotes and dashes
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return dangerousPatterns.some(pattern => pattern.test(value));
    } else if (Array.isArray(value)) {
      return value.some(checkValue);
    } else if (value && typeof value === 'object') {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    logger.warn('Potential SQL injection attempt detected', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      body: JSON.stringify(req.body).substring(0, 200),
    });
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  next();
};

// XSS protection (additional layer beyond CSP)
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return xssPatterns.some(pattern => pattern.test(value));
    } else if (Array.isArray(value)) {
      return value.some(checkValue);
    } else if (value && typeof value === 'object') {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  if (checkValue(req.body) || checkValue(req.query)) {
    logger.warn('Potential XSS attempt detected', {
      ip: req.ip,
      url: req.url,
      method: req.method,
    });
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  next();
};
