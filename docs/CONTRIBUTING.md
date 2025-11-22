# 🤝 Contributing to Proof Verification Helper

Thank you for your interest in contributing to Proof Verification Helper! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Community](#community)

## 🤝 Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Docker & Docker Compose** (recommended)
- **Ollama** (for AI features)
- **Git** for version control

### Quick Setup

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/yourusername/proof-verification-helper.git
cd proof-verification-helper

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Start development environment
docker-compose up -d ollama
npm run dev:all

# Open browser
open http://localhost:3000
```

## 🏗️ Project Structure

```
proof-verification-helper/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   └── docs/           # API documentation
│   └── dist/               # Compiled JavaScript
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   └── api/           # API client functions
│   └── dist/              # Built assets
├── docs/                  # Documentation
├── docker/                # Docker configuration
├── scripts/               # Build and deployment scripts
├── LEAN_EXAMPLES.md       # Lean 4 examples
└── docker-compose.yml     # Docker services
```

## 🔄 Development Workflow

### 1. Choose an Issue

- Check [GitHub Issues](https://github.com/yourusername/proof-verification-helper/issues)
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

### 2. Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Make Changes

- Write clear, focused commits
- Test your changes thoroughly
- Update documentation if needed
- Follow the coding standards below

### 4. Test Your Changes

```bash
# Run all tests
npm test

# Run linting
npm run lint

# Check TypeScript types
npm run type-check

# Manual testing
npm run dev
```

### 5. Submit a Pull Request

- Push your branch to GitHub
- Create a pull request with a clear description
- Reference any related issues
- Wait for review and address feedback

## 💻 Coding Standards

### TypeScript/JavaScript

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb config with some modifications
- **Prettier**: Consistent code formatting
- **Imports**: Group by external, internal, types

```typescript
// Good: Organized imports
import React, { useState, useEffect } from 'react';
import { Button, TextField } from '@mui/material';

import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/validation';
import type { User } from '../types/user';
```

### React Components

- **Functional components** with hooks
- **TypeScript interfaces** for props
- **Custom hooks** for complex logic
- **Error boundaries** for error handling

```tsx
interface UserProfileProps {
  user: User;
  onUpdate: (updates: Partial<User>) => Promise<void>;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    try {
      setLoading(true);
      setError(null);
      await onUpdate(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-profile">
      {/* Component JSX */}
    </div>
  );
};
```

### API Design

- **RESTful conventions**
- **Consistent error responses**
- **Input validation** with express-validator
- **OpenAPI documentation**

```typescript
// Route with validation and documentation
router.post('/proofs',
  validateProofCreation,
  asyncHandler(async (req: AuthRequest, res) => {
    const proof = await createProof(req.body);
    res.status(201).json(proof);
  })
);
```

### Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

Examples:
```
feat(auth): add JWT token refresh
fix(parser): handle multiline theorems correctly
docs(api): update OpenAPI specification
```

## 🧪 Testing

### Test Structure

```
__tests__/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- src/services/aiService.test.ts

# E2E tests
npm run test:e2e
```

### Writing Tests

```typescript
// Unit test example
describe('parseLeanCode', () => {
  it('should parse simple theorems', () => {
    const code = 'theorem test : True := trivial';
    const result = parseLeanCode(code);
    
    expect(result.theorems).toHaveLength(1);
    expect(result.theorems[0].name).toBe('test');
  });

  it('should handle parse errors', () => {
    const code = 'invalid lean code {{{';
    const result = parseLeanCode(code);
    
    expect(result.errors).toHaveLengthGreaterThan(0);
  });
});
```

### Test Coverage Goals

- **Backend**: >80% coverage
- **Frontend**: >70% coverage
- **Critical paths**: 100% coverage

## 📚 Documentation

### API Documentation

- Use JSDoc comments for all public functions
- Keep OpenAPI spec updated
- Document breaking changes

### Code Documentation

```typescript
/**
 * Parses Lean 4 code and extracts structure
 * @param code - The Lean 4 source code to parse
 * @returns Parsed proof structure with theorems, lemmas, etc.
 * @throws ValidationError if code is invalid
 */
export function parseLeanCode(code: string): ParsedProof {
  // Implementation
}
```

### README Updates

- Update README.md for new features
- Keep examples current
- Update screenshots/diagrams

## 🔄 Submitting Changes

### Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Update** documentation
6. **Commit** with clear messages
7. **Push** to your fork
8. **Create** pull request

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots
If applicable, add screenshots of changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Breaking changes documented
```

### Review Process

- At least one maintainer review required
- CI checks must pass
- Conflicts resolved before merge
- Squash commits for clean history

## 🌐 Community

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General discussion and questions
- **Discord**: Real-time chat (if available)

### Getting Help

1. Check existing issues and documentation
2. Search GitHub Discussions
3. Create a new issue with detailed information
4. Join community discussions

### Recognition

Contributors are recognized in:
- README.md contributors section
- GitHub's contributor insights
- Release notes

## 🎯 Areas for Contribution

### High Priority

- [ ] Performance optimizations
- [ ] Additional Lean 4 tactics support
- [ ] Mobile responsiveness improvements
- [ ] Accessibility (a11y) enhancements

### Medium Priority

- [ ] Plugin system for custom tactics
- [ ] Export/import functionality
- [ ] Collaboration features
- [ ] Additional language support

### Future Ideas

- [ ] VS Code extension
- [ ] Educational content and tutorials
- [ ] Research paper integration
- [ ] Multi-language theorem prover support

## 📞 Contact

- **Maintainers**: @yourusername
- **Issues**: [GitHub Issues](https://github.com/yourusername/proof-verification-helper/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/proof-verification-helper/discussions)

Thank you for contributing to Proof Verification Helper! 🎉
