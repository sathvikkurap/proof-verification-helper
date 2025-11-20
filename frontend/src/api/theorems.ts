import api from './client';

export interface Theorem {
  id: string;
  name: string;
  statement: string;
  proof?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  location: string;
}

export const theoremsApi = {
  search: async (query?: string, category?: string, difficulty?: string) => {
    const response = await api.get('/theorems/search', {
      params: { q: query, category, difficulty },
    });
    return response.data;
  },

  get: async (id: string): Promise<Theorem> => {
    const response = await api.get(`/theorems/${id}`);
    return response.data;
  },

  getDependents: async (id: string) => {
    const response = await api.get(`/theorems/${id}/dependents`);
    return response.data;
  },
};

