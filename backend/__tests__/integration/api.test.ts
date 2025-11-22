import request from 'supertest';
import { app } from '../../src/index';
import { generateId } from '../../src/utils/id';

describe('API Integration Tests', () => {
  const testAgent = request(app);

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await testAgent
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('Proof Parsing', () => {
    it('should parse simple Lean code', async () => {
      const response = await testAgent
        .post('/api/proofs/parse')
        .send({ code: 'theorem test : True := trivial' })
        .expect(200);

      expect(response.body).toHaveProperty('theorems');
      expect(response.body.theorems).toHaveLength(1);
      expect(response.body.theorems[0].name).toBe('test');
    });

    it('should handle invalid input', async () => {
      const response = await testAgent
        .post('/api/proofs/parse')
        .send({ code: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should parse complex multi-theorem code', async () => {
      const complexCode = `
        def add (n m : Nat) : Nat := n + m
        theorem add_zero : ∀ n, add n 0 = n := sorry
        lemma add_succ : ∀ n m, add n (succ m) = succ (add n m) := sorry
      `;

      const response = await testAgent
        .post('/api/proofs/parse')
        .send({ code: complexCode })
        .expect(200);

      expect(response.body.definitions).toHaveLength(1);
      expect(response.body.theorems).toHaveLength(1);
      expect(response.body.lemmas).toHaveLength(1);
    });
  });

  describe('Proof Management', () => {
    let testProofId: string;

    it('should create a new proof', async () => {
      const response = await testAgent
        .post('/api/proofs')
        .send({
          name: 'Integration Test Proof',
          code: 'theorem integration_test : True := trivial'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Integration Test Proof');
      expect(response.body).toHaveProperty('status', 'complete');
      testProofId = response.body.id;
    });

    it('should retrieve created proof', async () => {
      const response = await testAgent
        .get(`/api/proofs/${testProofId}`)
        .expect(200);

      expect(response.body.id).toBe(testProofId);
      expect(response.body.name).toBe('Integration Test Proof');
      expect(response.body).toHaveProperty('parsed');
    });

    it('should get AI suggestions for proof', async () => {
      const response = await testAgent
        .post(`/api/proofs/${testProofId}/suggestions`)
        .send({ currentGoal: 'Prove True' })
        .expect(200);

      expect(response.body).toHaveProperty('suggestions');
      expect(Array.isArray(response.body.suggestions)).toBe(true);
      expect(response.body).toHaveProperty('metadata');
    });

    it('should verify proof', async () => {
      const response = await testAgent
        .post(`/api/proofs/${testProofId}/verify`)
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Authentication', () => {
    let authToken: string;
    let testUserId: string;

    it('should register a new user', async () => {
      const response = await testAgent
        .post('/api/auth/register')
        .send({
          username: 'testuser_integration',
          email: 'integration@test.com',
          password: 'TestPass123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('integration@test.com');
      authToken = response.body.token;
      testUserId = response.body.user.id;
    });

    it('should login with registered user', async () => {
      const response = await testAgent
        .post('/api/auth/login')
        .send({
          email: 'integration@test.com',
          password: 'TestPass123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(testUserId);
    });

    it('should access protected routes with token', async () => {
      const response = await testAgent
        .get('/api/user/proofs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('proofs');
      expect(Array.isArray(response.body.proofs)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent proof', async () => {
      const fakeId = generateId();
      const response = await testAgent
        .get(`/api/proofs/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle invalid UUID format', async () => {
      const response = await testAgent
        .get('/api/proofs/invalid-uuid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle malformed JSON', async () => {
      const response = await testAgent
        .post('/api/proofs/parse')
        .set('Content-Type', 'application/json')
        .send('{ invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rapid requests gracefully', async () => {
      const promises = Array(10).fill(null).map(() =>
        testAgent
          .get('/api/health')
          .then(res => res.status)
          .catch(err => err.response?.status || 500)
      );

      const results = await Promise.all(promises);

      // At least some requests should succeed
      expect(results.some(status => status === 200)).toBe(true);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await testAgent
        .options('/api/health')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });
});
