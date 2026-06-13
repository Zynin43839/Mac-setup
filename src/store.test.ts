import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadMeetings,
  saveMeetings,
  addMeeting,
  deleteMeeting,
  updateMeeting,
  generateId,
  loadSettings,
  saveSettings,
  updateSettings,
  setApiKey,
  getApiKey,
  hasValidKey,
  hasClaudeKey,
  getClaudeKey,
  localSummarize,
  formatFileSize,
  formatDuration,
  defaultSettings,
} from './store';
import { Meeting } from './types';

function mockApi(data: Meeting[]) {
  let meetings = [...data];
  global.fetch = vi.fn((url: string, opts?: RequestInit) => {
    if (url === '/api/meetings' && (!opts || opts.method === 'GET' || opts.method === undefined)) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(meetings) });
    }
    if (url === '/api/meetings' && opts?.method === 'POST') {
      const body = JSON.parse(opts.body as string);
      meetings.unshift(body);
      return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
    }
    if (url?.toString().startsWith('/api/meetings/') && opts?.method === 'DELETE') {
      const id = url.toString().split('/').pop();
      meetings = meetings.filter(m => m.id !== id);
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }
    if (url?.toString().startsWith('/api/meetings/') && opts?.method === 'PUT') {
      const id = url.toString().split('/').pop();
      const updates = JSON.parse(opts.body as string);
      meetings = meetings.map(m => m.id === id ? { ...m, ...updates } : m);
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  });
}

describe('Store - Meetings CRUD', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadMeetings', () => {
    it('should return empty array when no meetings exist', async () => {
      mockApi([]);
      const meetings = await loadMeetings();
      expect(meetings).toEqual([]);
    });

    it('should return saved meetings', async () => {
      const mockMeetings: Meeting[] = [
        {
          id: 'mtg_1',
          title: 'Test Meeting',
          department: 'Engineering',
          date: '2024-01-01',
          transcript: 'Test transcript',
          summary: 'Test summary',
          actionItems: ['Item 1'],
          duration: 3600,
          status: 'completed',
          provider: 'local',
        },
      ];
      mockApi(mockMeetings);
      
      const meetings = await loadMeetings();
      expect(meetings).toHaveLength(1);
      expect(meetings[0].title).toBe('Test Meeting');
    });

    it('should throw when API fails', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      await expect(loadMeetings()).rejects.toThrow('Failed to load meetings from server');
    });
  });

  describe('saveMeetings', () => {
    it('should save meetings via API', async () => {
      const meetings: Meeting[] = [
        {
          id: 'mtg_1',
          title: 'Saved Meeting',
          department: 'Marketing',
          date: '2024-01-01',
          transcript: 'Transcript',
          summary: 'Summary',
          actionItems: [],
          duration: 1800,
          status: 'completed',
          provider: 'local',
        },
      ];
      
      mockApi([]);
      const result = await saveMeetings(meetings);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Saved Meeting');
    });
  });

  describe('addMeeting', () => {
    it('should add meeting and return full list', async () => {
      const meeting1: Meeting = {
        id: 'mtg_1',
        title: 'First',
        department: 'HR',
        date: '2024-01-01',
        transcript: '',
        summary: '',
        actionItems: [],
        duration: 0,
        status: 'completed',
        provider: 'local',
      };
      const meeting2: Meeting = {
        ...meeting1,
        id: 'mtg_2',
        title: 'Second',
      };

      mockApi([]);
      await addMeeting(meeting1);
      const result = await addMeeting(meeting2);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Second');
      expect(result[1].title).toBe('First');
    });
  });

  describe('deleteMeeting', () => {
    it('should remove meeting by id', async () => {
      const meetings: Meeting[] = [
        { id: 'mtg_1', title: 'Keep', department: 'Sales', date: '', transcript: '', summary: '', actionItems: [], duration: 0, status: 'completed', provider: 'local' },
        { id: 'mtg_2', title: 'Delete', department: 'Sales', date: '', transcript: '', summary: '', actionItems: [], duration: 0, status: 'completed', provider: 'local' },
      ];
      mockApi(meetings);

      const result = await deleteMeeting('mtg_2');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Keep');
    });
  });

  describe('updateMeeting', () => {
    it('should update meeting properties', async () => {
      const meetings: Meeting[] = [
        { id: 'mtg_1', title: 'Original', department: 'Operations', date: '', transcript: '', summary: '', actionItems: [], duration: 0, status: 'completed', provider: 'local' },
      ];
      mockApi(meetings);

      const result = await updateMeeting('mtg_1', { title: 'Updated' });

      expect(result[0].title).toBe('Updated');
      expect(result[0].department).toBe('Operations');
    });
  });

  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toMatch(/^mtg_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^mtg_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});

describe('Store - Settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('loadSettings', () => {
    it('should return default settings when none exist', () => {
      const settings = loadSettings();
      expect(settings).toEqual(defaultSettings);
    });

    it('should merge saved settings with defaults', () => {
      localStorage.setItem('meeting_app_settings', JSON.stringify({
        provider: 'openai',
      }));

      const settings = loadSettings();
      expect(settings.provider).toBe('openai');
      expect(settings.localWhisper).toEqual(defaultSettings.localWhisper);
    });
  });

  describe('saveSettings', () => {
    it('should save settings to localStorage', () => {
      const settings = { ...defaultSettings, provider: 'google' as const };
      saveSettings(settings);

      const saved = JSON.parse(localStorage.getItem('meeting_app_settings') || '{}');
      expect(saved.provider).toBe('google');
    });
  });

  describe('updateSettings', () => {
    it('should partially update settings', () => {
      const result = updateSettings({ provider: 'assemblyai' });
      
      expect(result.provider).toBe('assemblyai');
      expect(result.localWhisper).toEqual(defaultSettings.localWhisper);
    });
  });

  describe('API Key functions', () => {
    // Root cause fix: loadSettings() in store.ts now returns a COPY of defaultSettings
    // instead of a direct reference, preventing setApiKey from mutating the shared default object.
    // Belt + suspenders: still clear before each test for extra isolation.
    beforeEach(() => {
      localStorage.clear();
    });

    it('setApiKey should save API key', () => {
      setApiKey('openai', 'sk-test-key');
      
      const settings = loadSettings();
      expect(settings.apiKeys.openai).toBe('sk-test-key');
    });

    it('getApiKey should retrieve API key', () => {
      setApiKey('claude', 'sk-ant-test-key');
      
      const key = getApiKey('claude');
      expect(key).toBe('sk-ant-test-key');
    });

    it('hasValidKey should return true for valid keys', () => {
      setApiKey('openai', 'sk-1234567890abc');
      expect(hasValidKey('openai')).toBe(true);
    });

    it('hasValidKey should return true for local provider', () => {
      expect(hasValidKey('local')).toBe(true);
    });

    it('hasValidKey should return false for missing keys', () => {
      expect(hasValidKey('openai')).toBe(false);
    });

    it('hasClaudeKey should validate Claude key format', () => {
      expect(hasClaudeKey()).toBe(false);
      
      setApiKey('claude', 'sk-ant-api03-valid-key');
      expect(hasClaudeKey()).toBe(true);
    });

    it('getClaudeKey should return Claude API key', () => {
      setApiKey('claude', 'sk-ant-test');
      expect(getClaudeKey()).toBe('sk-ant-test');
    });
  });
});

describe('Store - Utilities', () => {
  describe('localSummarize', () => {
    it('should extract summary from transcript', () => {
      const transcript = 'First sentence here. Second sentence. We need to do this task. Third sentence.';
      
      const result = localSummarize(transcript);
      
      expect(result.summary).toContain('First sentence');
      expect(result.actionItems.length).toBeGreaterThan(0);
    });

    it('should extract action items with keywords', () => {
      const transcript = 'Introduction. We need to complete the report. Should review the code. Must finish by Friday.';
      
      const result = localSummarize(transcript);
      
      expect(result.actionItems.some(item => item.includes('need') || item.includes('Should') || item.includes('Must'))).toBe(true);
    });

    it('should handle empty transcript', () => {
      const result = localSummarize('');
      
      expect(result.summary).toBe('No summary could be generated from the transcript.');
      expect(result.actionItems).toContain('No specific action items detected.');
    });

    it('should detect Thai action keywords', () => {
      const transcript = 'สวัสดีครับ นี่คือการประชุม. ต้องทำงานให้เสร็จภายในวันศุกร์. ควรตรวจสอบเอกสารด้วย.';
      
      const result = localSummarize(transcript);
      
      expect(result.actionItems.length).toBeGreaterThan(0);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(formatDuration(45)).toBe('0:45');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(125)).toBe('2:05');
    });

    it('should format hours, minutes and seconds', () => {
      expect(formatDuration(3725)).toBe('1:02:05');
    });
  });
});
