import api from './client';

export const authApi = {
  register: async (email: string, username: string, password: string) => {
    const response = await api.post('/auth/register', {
      email,
      username,
      password,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },
};

