import api from './api';

export interface Tag {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  created_at: string;
}

export const tagService = {
  getAll: async (): Promise<Tag[]> => {
    const { data } = await api.get('/tags');
    return data.tags || [];
  },

  create: async (payload: { name: string; color?: string }): Promise<Tag> => {
    const { data } = await api.post('/tags', payload);
    return data.tag;
  },
};
