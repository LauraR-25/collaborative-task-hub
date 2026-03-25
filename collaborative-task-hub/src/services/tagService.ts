import api from './api';
import { loadJson, nowIso, saveJson } from '@/lib/mockStorage';
import { MOCK_KEYS, USE_MOCK, mockCreateId, mockPickColor, mockRequireUserId, mockSeedIfNeeded, type MockTag } from '@/lib/mockData';

export interface Tag {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  created_at: string;
}

export const tagService = {
  getAll: async (): Promise<Tag[]> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();
      const tags = loadJson<MockTag[]>(MOCK_KEYS.tags, []).filter((t) => t.owner_id === userId);
      return tags.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    }
    const { data } = await api.get('/tags');
    return data.tags || [];
  },

  create: async (payload: { name: string; color?: string }): Promise<Tag> => {
    if (USE_MOCK) {
      mockSeedIfNeeded();
      const userId = mockRequireUserId();
      const created: MockTag = {
        id: mockCreateId('tag'),
        owner_id: userId,
        name: payload.name,
        color: payload.color || mockPickColor(payload.name),
        created_at: nowIso(),
      };
      const tags = loadJson<MockTag[]>(MOCK_KEYS.tags, []);
      saveJson(MOCK_KEYS.tags, [created, ...tags]);
      return created;
    }
    const { data } = await api.post('/tags', payload);
    return data.tag;
  },
};
