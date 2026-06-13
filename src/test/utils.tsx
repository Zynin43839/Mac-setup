import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Custom render function with providers if needed
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { ...options }),
  };
}

export * from '@testing-library/react';
export { customRender as render };
export { userEvent };

// Test data factories
export const createMockMeeting = (overrides = {}) => ({
  id: `mtg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  title: 'Test Meeting',
  department: 'Engineering',
  date: new Date().toISOString(),
  transcript: 'This is a test transcript. We need to do action A. We decided to proceed with plan B.',
  summary: 'Test summary of the meeting.',
  actionItems: ['Action item 1', 'Action item 2'],
  duration: 3600,
  status: 'completed' as const,
  provider: 'local' as const,
  fileName: 'test-audio.mp3',
  fileSize: 1024 * 1024,
  ...overrides,
});

export const createMockSettings = (overrides = {}) => ({
  provider: 'local' as const,
  apiKeys: {
    openai: undefined,
    google: undefined,
    assemblyai: undefined,
    deepgram: undefined,
    claude: undefined,
  },
  localWhisper: {
    model: 'base' as const,
    language: 'th',
  },
  summarization: {
    enabled: true,
    provider: 'local' as const,
  },
  ...overrides,
});

export const createMockFile = (name = 'test.mp3', size = 1024 * 1024) => {
  const file = new File(['audio content'], name, { type: 'audio/mpeg' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// In-memory mock for /api/meetings endpoints (replaces old localStorage-based store)
let mockMeetingsDb: any[] = [];
export function mockMeetingsApi(initialMeetings: any[] = []) {
  mockMeetingsDb = [...initialMeetings];
  const fn = vi.fn((url: string, opts?: RequestInit) => {
    const urlStr = (url || '').toString();
    if (urlStr === '/api/meetings' && (!opts || opts.method === 'GET' || opts.method === undefined)) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMeetingsDb) });
    }
    if (urlStr === '/api/meetings' && opts?.method === 'POST') {
      const body = JSON.parse(opts.body as string);
      mockMeetingsDb.unshift(body);
      return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
    }
    if (urlStr.startsWith('/api/meetings/') && opts?.method === 'DELETE') {
      const id = urlStr.split('/').pop();
      mockMeetingsDb = mockMeetingsDb.filter((m: any) => m.id !== id);
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }
    if (urlStr.startsWith('/api/meetings/') && opts?.method === 'PUT') {
      const id = urlStr.split('/').pop();
      const updates = JSON.parse(opts.body as string);
      mockMeetingsDb = mockMeetingsDb.map((m: any) => m.id === id ? { ...m, ...updates } : m);
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }
    if (urlStr === 'https://api.anthropic.com/v1/messages') {
      return new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ content: [{ text: '📋 รายงานการประชุม\n✅ สรุปการประชุม\n• 讨论了项目进度\n• 确定了下一步计划' }] }),
        }), 50);
      });
    }
    return Promise.reject(new Error('Unhandled URL in mock: ' + urlStr));
  });
  global.fetch = fn;
  return fn;
}
