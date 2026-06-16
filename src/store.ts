import { Meeting, STTSettings, STTProvider, SummProvider } from './types';

const API_BASE = '/api';
const SETTINGS_KEY = 'meeting_app_settings';

export const defaultSettings: STTSettings = {
  provider: 'local',
  apiKeys: {},
  localWhisper: {
    model: 'small',
    language: 'th',
  },
  summarization: {
    enabled: true,
    provider: 'local-ai',
    localAI: {
      endpoint: 'http://localhost:11434',
      model: 'gemma3:12b',
    },
  },
};

async function apiCall(path: string, options: RequestInit = {}): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Meetings CRUD (API-only via better-sqlite3 backend) ──

export async function loadMeetings(): Promise<Meeting[]> {
  const data = await apiCall('/meetings');
  if (data === null) throw new Error('Failed to load meetings from server');
  return data;
}

export async function saveMeetings(meetings: Meeting[]): Promise<Meeting[]> {
  for (const m of meetings) {
    await apiCall('/meetings', { method: 'POST', body: JSON.stringify(m) });
  }
  return loadMeetings();
}

export async function addMeeting(meeting: Meeting): Promise<Meeting[]> {
  const result = await apiCall('/meetings', {
    method: 'POST',
    body: JSON.stringify(meeting),
  });
  if (!result) throw new Error('Failed to save meeting');
  return loadMeetings();
}

export async function deleteMeeting(id: string): Promise<Meeting[]> {
  await apiCall(`/meetings/${id}`, { method: 'DELETE' });
  return loadMeetings();
}

export async function updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting[]> {
  await apiCall(`/meetings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return loadMeetings();
}

export function generateId(): string {
  return `mtg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Settings CRUD (sync, localStorage only) ──

export function loadSettings(): STTSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return { ...defaultSettings, apiKeys: { ...defaultSettings.apiKeys }, localWhisper: { ...defaultSettings.localWhisper }, summarization: { ...defaultSettings.summarization, localAI: { ...defaultSettings.summarization.localAI } } };
    const saved = JSON.parse(data);
    return {
      ...defaultSettings,
      ...saved,
      apiKeys: { ...defaultSettings.apiKeys, ...saved.apiKeys },
      localWhisper: { ...defaultSettings.localWhisper, ...saved.localWhisper },
      summarization: { ...defaultSettings.summarization, ...saved.summarization, localAI: { ...defaultSettings.summarization.localAI, ...(saved.summarization?.localAI || {}) } },
    };
  } catch {
    return { ...defaultSettings, apiKeys: { ...defaultSettings.apiKeys }, localWhisper: { ...defaultSettings.localWhisper }, summarization: { ...defaultSettings.summarization, localAI: { ...defaultSettings.summarization.localAI } } };
  }
}

export function saveSettings(settings: STTSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  apiCall('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export function updateSettings(updates: Partial<STTSettings>): STTSettings {
  const current = loadSettings();
  const updated = { ...current, ...updates };
  saveSettings(updated);
  return updated;
}

export function setApiKey(provider: keyof STTSettings['apiKeys'], key: string): STTSettings {
  const settings = loadSettings();
  settings.apiKeys[provider] = key;
  saveSettings(settings);
  return settings;
}

export function getApiKey(provider: keyof STTSettings['apiKeys']): string | undefined {
  return loadSettings().apiKeys[provider];
}

export function hasValidKey(provider: STTProvider): boolean {
  if (provider === 'local') return true;
  const key = getApiKey(provider as keyof STTSettings['apiKeys']);
  return !!key && key.length > 10;
}

export function hasClaudeKey(): boolean {
  const key = getApiKey('claude');
  return !!key && key.startsWith('sk-ant-');
}

export function getClaudeKey(): string | undefined {
  return getApiKey('claude');
}

// ── Local Summarization ──

export function localSummarize(transcript: string): { summary: string; actionItems: string[]; report?: string } {
  const sentences = transcript.split(/[.!?。！？\n]+/).filter(s => s.trim().length > 10);

  const isThai = transcript.length > 20 && /[ก-๙]/.test(transcript);
  const nl = (t: string) => t;

  const actionKeywords = ['ต้อง', 'จะ', 'ควร', 'need', 'should', 'will', 'must', 'todo', 'action', 'deadline', 'assign', 'follow up', 'รับผิดชอบ', 'ดำเนินการ', 'prepare', 'implement', 'create', 'update'];
  const decisionKeywords = ['ตกลง', 'สรุป', 'decided', 'agreed', 'conclusion', 'approve', 'อนุมัติ', 'มติ', 'approved', 'confirmed', 'resolved'];
  const topicKeywords = ['เรื่อง', 'เกี่ยวกับ', 'ประเด็น', 'หัวข้อ', 'discuss', 'regarding', 'topic', 'agenda', 'เกี่ยวกับ'];
  const questionKeywords = ['คำถาม', 'สงสัย', '疑问', 'question', 'concern', 'issue', 'ปัญหา', 'อุปสรรค'];

  const actionItems = sentences
    .filter(s => actionKeywords.some(k => s.toLowerCase().includes(k)))
    .map(s => s.trim())
    .slice(0, 6);

  const keyDecisions = sentences.filter(s => decisionKeywords.some(k => s.toLowerCase().includes(k)));
  const topics = sentences.filter(s => topicKeywords.some(k => s.toLowerCase().includes(k)));
  const questions = sentences.filter(s => questionKeywords.some(k => s.toLowerCase().includes(k)));

  const topSentences = sentences.slice(0, 4);
  const uniqueSummary = [...new Set([...topSentences, ...keyDecisions.slice(0, 2)])].join('. ').trim();

  const reportSections: string[] = [];
  reportSections.push(`📌 เนื้อหาสำคัญ / KEY DISCUSSION POINTS\n${topSentences.slice(0, 3).map(s => `• ${s.trim()}`).join('\n')}`);
  if (keyDecisions.length > 0) {
    reportSections.push(`📊 การตัดสินใจ / DECISIONS MADE\n${keyDecisions.slice(0, 3).map(s => `• ${s.trim()}`).join('\n')}`);
  }
  if (actionItems.length > 0) {
    reportSections.push(`✅ Action Items\n${actionItems.map(s => `• ${s}`).join('\n')}`);
  }
  if (questions.length > 0) {
    reportSections.push(`💡 Concerns / Questions\n${questions.slice(0, 3).map(s => `• ${s.trim()}`).join('\n')}`);
  }

  const report = reportSections.join('\n\n');

  return {
    summary: uniqueSummary || 'No summary could be generated from the transcript.',
    actionItems: actionItems.length > 0 ? actionItems : ['No specific action items detected.'],
    report: report.length > 0 ? report : undefined,
  };
}

// ── Local AI Summarization ──

export async function summarizeWithLocalAI(
  transcript: string,
  localAI: { endpoint: string; model: string }
): Promise<{ summary: string; actionItems: string[]; report?: string }> {
  const systemPrompt = `คุณคือผู้ช่วยสรุปการประชุม ตอบเป็นภาษาไทย ใช้โครงสร้าง:

📌 เนื้อหาสำคัญ / KEY DISCUSSION POINTS
• (หัวข้อ)

📊 การตัดสินใจ / DECISIONS MADE  
• (การตัดสินใจ)

✅ Action Items
• (รายการที่ต้องทำ)

💡 Concerns / Questions
• (ข้อกังวล)

จากนั้นบรรทัดสุดท้ายให้เขียน:
SUMMARY: (สรุป 2-3 ประโยค)
ACTION_ITEMS: (รายการคั่นด้วย |)`;

  const userPrompt = `ช่วยวิเคราะห์และสรุป transcript การประชุมนี้:\n\n${transcript}`;

  const payload = {
    model: localAI.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 2048,
    stream: false,
  };

  const url = `${localAI.endpoint.replace(/\/+$/, '')}/v1/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Local AI error (${res.status}): ${text || res.statusText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';

  const summaryMatch = content.match(/SUMMARY:\s*(.+?)(?:\n|$)/);
  const actionsMatch = content.match(/ACTION_ITEMS:\s*(.+?)(?:\n|$)/);

  const summary = summaryMatch?.[1]?.trim() || content.slice(0, 200).trim();
  const actionItems = actionsMatch?.[1]
    ?.split('|')
    .map(s => s.trim())
    .filter(Boolean) || [];

  return {
    summary,
    actionItems: actionItems.length > 0 ? actionItems : ['No specific action items detected.'],
    report: content,
  };
}

// ── File Utilities ──

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export async function transcribeAudio(file: File, settings: STTSettings): Promise<{ transcript: string; provider: string; duration?: number; note?: string; error?: string } | null> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('settings', JSON.stringify(settings));
  try {
    const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) {
      return { transcript: '', provider: 'error', error: data.error || `HTTP ${res.status}` };
    }
    return data;
  } catch (err) {
    return { transcript: '', provider: 'error', error: `Cannot reach backend: ${err instanceof Error ? err.message : 'connection failed'}` };
  }
}

export async function fetchModels(): Promise<any[]> {
  const data = await apiCall('/models');
  return data || [];
}

export async function downloadModelFile(name: string): Promise<any> {
  const data = await apiCall('/models/download', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (!data) throw new Error('Failed to download model');
  return data;
}

// ── Projects API ──

export async function loadProjects() {
  const data = await apiCall('/projects');
  if (data === null) throw new Error('Failed to load projects');
  return data;
}

export async function createProjectAPI(project) {
  const result = await apiCall('/projects', { method: 'POST', body: JSON.stringify(project) });
  if (!result) throw new Error('Failed to create project');
  return loadProjects();
}

export async function updateProjectAPI(id, updates) {
  await apiCall(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  return loadProjects();
}

export async function deleteProjectAPI(id) {
  await apiCall(`/projects/${id}`, { method: 'DELETE' });
  return loadProjects();
}

// ── Roadmap API ──

export async function loadRoadmapItems() {
  const data = await apiCall('/roadmap');
  if (data === null) throw new Error('Failed to load roadmap');
  return data;
}

export async function createRoadmapItemAPI(item) {
  const result = await apiCall('/roadmap', { method: 'POST', body: JSON.stringify(item) });
  if (!result) throw new Error('Failed to create roadmap item');
  return loadRoadmapItems();
}

export async function updateRoadmapItemAPI(id, updates) {
  await apiCall(`/roadmap/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  return loadRoadmapItems();
}

export async function deleteRoadmapItemAPI(id) {
  await apiCall(`/roadmap/${id}`, { method: 'DELETE' });
  return loadRoadmapItems();
}

// ── Briefing API ──

export async function loadBriefings() {
  const data = await apiCall('/briefings');
  if (data === null) throw new Error('Failed to load briefings');
  return data;
}

export async function createBriefingAPI(briefing) {
  const result = await apiCall('/briefings', { method: 'POST', body: JSON.stringify(briefing) });
  if (!result) throw new Error('Failed to create briefing');
  return loadBriefings();
}

export async function deleteBriefingAPI(id) {
  await apiCall(`/briefings/${id}`, { method: 'DELETE' });
  return loadBriefings();
}

export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => resolve(audio.duration);
    audio.onerror = () => reject(new Error('Could not load audio file'));
    audio.src = URL.createObjectURL(file);
  });
}

// ── Jira API ──

export interface JiraConfig {
  url: string;
  email: string;
  token: string;
}

export function getJiraConfig(): JiraConfig {
  try {
    const raw = localStorage.getItem('jira_config');
    return raw ? JSON.parse(raw) : { url: '', email: '', token: '' };
  } catch { return { url: '', email: '', token: '' }; }
}

export function saveJiraConfig(config: JiraConfig) {
  localStorage.setItem('jira_config', JSON.stringify(config));
  apiCall('/jira/config', { method: 'POST', body: JSON.stringify(config) });
}

export async function testJiraConnection() {
  return apiCall('/jira/test');
}

export async function loadJiraProjects() {
  const data = await apiCall('/jira/projects');
  return data || [];
}

export async function loadJiraIssues(jql: string, maxResults = 50) {
  const data = await apiCall(`/jira/issues?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`);
  return data || { total: 0, issues: [] };
}

export async function loadJiraIssue(key: string) {
  return apiCall(`/jira/issue/${key}`);
}

export async function loadJiraSprint(boardId: number) {
  return apiCall(`/jira/sprint/${boardId}`);
}

export async function loadJiraStats(project: string) {
  return apiCall(`/jira/stats?project=${project}`);
}
