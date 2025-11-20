// Basic API tests - run with: npm test (when test framework is set up)
// For now, these are manual test cases

import { testProofs, createTestUser } from '../src/utils/testHelpers';

export const testCases = {
  // Authentication tests
  auth: {
    register: async (api: any) => {
      const user = createTestUser();
      const response = await api.post('/api/auth/register', user);
      console.log('Register test:', response.status === 201 ? 'PASS' : 'FAIL');
      return response.data;
    },
    login: async (api: any, email: string, password: string) => {
      const response = await api.post('/api/auth/login', { email, password });
      console.log('Login test:', response.status === 200 ? 'PASS' : 'FAIL');
      return response.data;
    },
  },

  // Proof tests
  proofs: {
    parse: async (api: any) => {
      const response = await api.post('/api/proofs/parse', { code: testProofs.simple });
      console.log('Parse test:', response.status === 200 ? 'PASS' : 'FAIL');
      return response.data;
    },
    create: async (api: any, token?: string) => {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await api.post('/api/proofs', {
        name: 'Test Proof',
        code: testProofs.simple,
      }, { headers });
      console.log('Create proof test:', response.status === 201 ? 'PASS' : 'FAIL');
      return response.data;
    },
    get: async (api: any, id: string) => {
      const response = await api.get(`/api/proofs/${id}`);
      console.log('Get proof test:', response.status === 200 ? 'PASS' : 'FAIL');
      return response.data;
    },
    analyze: async (api: any, id: string) => {
      const response = await api.post(`/api/proofs/${id}/analyze`);
      console.log('Analyze test:', response.status === 200 ? 'PASS' : 'FAIL');
      return response.data;
    },
    suggestions: async (api: any, id: string) => {
      const response = await api.post(`/api/proofs/${id}/suggestions`);
      console.log('Suggestions test:', response.status === 200 ? 'PASS' : 'FAIL');
      return response.data;
    },
  },

  // Theorem tests
  theorems: {
    search: async (api: any) => {
      const response = await api.get('/api/theorems/search?q=add');
      console.log('Search test:', response.status === 200 ? 'PASS' : 'FAIL');
      return response.data;
    },
  },
};

