import api from './client';
import { Proof, ParsedProof } from '../store/proofStore';

export const proofsApi = {
  parse: async (code: string): Promise<ParsedProof> => {
    const response = await api.post('/proofs/parse', { code });
    return response.data;
  },

  create: async (name: string, code: string): Promise<Proof> => {
    const response = await api.post('/proofs', { name, code });
    return response.data;
  },

  get: async (id: string): Promise<Proof> => {
    const response = await api.get(`/proofs/${id}`);
    return response.data;
  },

  update: async (id: string, name?: string, code?: string): Promise<Proof> => {
    const response = await api.put(`/proofs/${id}`, { name, code });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/proofs/${id}`);
  },

  analyze: async (id: string) => {
    const response = await api.post(`/proofs/${id}/analyze`);
    return response.data;
  },

  getDependencies: async (id: string) => {
    const response = await api.get(`/proofs/${id}/dependencies`);
    return response.data;
  },

  getSuggestions: async (id: string, currentGoal?: string, errorMessage?: string) => {
    const response = await api.post(`/proofs/${id}/suggestions`, {
      currentGoal,
      errorMessage,
    });
    return response.data;
  },

  verify: async (id: string) => {
    const response = await api.post(`/proofs/${id}/verify`);
    return response.data;
  },
};

