import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Proof Verification Helper API',
      version: '1.0.0',
      description: 'AI-powered Lean 4 proof verification and assistance platform',
      contact: {
        name: 'Proof Verification Helper',
        url: 'https://github.com/yourusername/proof-verification-helper',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Development server',
      },
      {
        url: 'https://api.proof-helper.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Proof: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            code: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['complete', 'incomplete', 'error'] 
            },
            user_id: { type: 'string', format: 'uuid', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            parsed: { $ref: '#/components/schemas/ParsedProof' },
          },
        },
        ParsedProof: {
          type: 'object',
          properties: {
            theorems: {
              type: 'array',
              items: { $ref: '#/components/schemas/TheoremInfo' },
            },
            lemmas: {
              type: 'array',
              items: { $ref: '#/components/schemas/TheoremInfo' },
            },
            definitions: {
              type: 'array',
              items: { $ref: '#/components/schemas/DefinitionInfo' },
            },
            dependencies: {
              type: 'array',
              items: { type: 'string' },
            },
            errors: {
              type: 'array',
              items: { $ref: '#/components/schemas/ParseError' },
            },
          },
        },
        TheoremInfo: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            statement: { type: 'string' },
            proof: { type: 'string' },
            lineStart: { type: 'integer' },
            lineEnd: { type: 'integer' },
          },
        },
        DefinitionInfo: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            value: { type: 'string', nullable: true },
            lineStart: { type: 'integer' },
            lineEnd: { type: 'integer' },
          },
        },
        ParseError: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            line: { type: 'integer' },
            column: { type: 'integer' },
          },
        },
        Suggestion: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { 
              type: 'string', 
              enum: ['tactic', 'lemma', 'fix', 'step'] 
            },
            content: { type: 'string' },
            explanation: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.ts'], // Path to the API routes
};

export const specs = swaggerJsdoc(options);

export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  customSiteTitle: 'Proof Verification Helper API Documentation',
  customfavIcon: '/favicon.ico',
};
