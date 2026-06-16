import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getAllMeetings, getMeeting, createMeeting, updateMeeting, deleteMeeting,
  getAllProjects, getProject, createProject, updateProject, deleteProject,
  getAllRoadmapItems, getRoadmapItem, createRoadmapItem, updateRoadmapItem, deleteRoadmapItem,
  getAllBriefings, getBriefing, createBriefing, deleteBriefing,
  loadSettings as loadDbSettings, saveSettings as saveDbSettings,
} from './database.js';
import { transcribe, listModels, downloadModel, getWhisperStatus } from './transcriber.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '..', 'temp');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const upload = multer({
  dest: TEMP_DIR,
  limits: { fileSize: 200 * 1024 * 1024 },
});

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

function cleanUp(filePath) {
  if (filePath) {
    try { fs.unlinkSync(filePath); } catch {}
  }
}

// ── Meetings ──

app.get('/api/meetings', (_req, res) => {
  const meetings = getAllMeetings();
  res.json(meetings);
});

app.get('/api/meetings/:id', (req, res) => {
  const meeting = getMeeting(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
  res.json(meeting);
});

app.post('/api/meetings', (req, res) => {
  const meeting = createMeeting(req.body);
  res.status(201).json(meeting);
});

app.put('/api/meetings/:id', (req, res) => {
  const meeting = updateMeeting(req.params.id, req.body);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
  res.json(meeting);
});

app.delete('/api/meetings/:id', (req, res) => {
  deleteMeeting(req.params.id);
  res.json({ success: true });
});

// ── Settings ──

app.get('/api/settings', (_req, res) => {
  const settings = loadDbSettings();
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  saveDbSettings(req.body);
  res.json({ success: true });
});

// ── Transcription ──

app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    filePath = req.file.path;
    const settings = req.body.settings ? JSON.parse(req.body.settings) : {};

    const result = await transcribe(filePath, settings);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    cleanUp(filePath);
  }
});

// ── Models ──

app.get('/api/models', (_req, res) => {
  const models = listModels();
  res.json(models);
});

app.post('/api/models/download', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Model name required' });
  try {
    const result = await downloadModel(name);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/whisper-status', (_req, res) => {
  const status = getWhisperStatus();
  res.json(status);
});

// ── Local AI Summarization ──

app.post('/api/local-ai/summarize', async (req, res) => {
  try {
    const { transcript, endpoint, model } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript required' });
    if (!endpoint) return res.status(400).json({ error: 'Endpoint required' });
    if (!model) return res.status(400).json({ error: 'Model required' });

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

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `ช่วยวิเคราะห์และสรุป transcript การประชุมนี้:\n\n${transcript}` },
      ],
      temperature: 0.3,
      max_tokens: 2048,
      stream: false,
    };

    const url = `${endpoint.replace(/\/+$/, '')}/v1/chat/completions`;

    const aiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120000),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text().catch(() => '');
      return res.status(502).json({ error: `Local AI returned ${aiRes.status}: ${text || aiRes.statusText}` });
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content || '';

    const summaryMatch = content.match(/SUMMARY:\s*(.+?)(?:\n|$)/);
    const actionsMatch = content.match(/ACTION_ITEMS:\s*(.+?)(?:\n|$)/);

    const summary = summaryMatch?.[1]?.trim() || content.slice(0, 200).trim();
    const actionItems = actionsMatch?.[1]
      ?.split('|')
      .map(s => s.trim())
      .filter(Boolean) || [];

    res.json({
      summary,
      actionItems: actionItems.length > 0 ? actionItems : ['No specific action items detected.'],
      report: content,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Projects ──

app.get('/api/projects', (_req, res) => res.json(getAllProjects()));
app.get('/api/projects/:id', (req, res) => {
  const p = getProject(req.params.id);
  p ? res.json(p) : res.status(404).json({ error: 'Not found' });
});
app.post('/api/projects', (req, res) => res.status(201).json(createProject(req.body)));
app.put('/api/projects/:id', (req, res) => {
  const p = updateProject(req.params.id, req.body);
  p ? res.json(p) : res.status(404).json({ error: 'Not found' });
});
app.delete('/api/projects/:id', (req, res) => {
  deleteProject(req.params.id);
  res.json({ success: true });
});

// ── Roadmap ──

app.get('/api/roadmap', (_req, res) => res.json(getAllRoadmapItems()));
app.get('/api/roadmap/:id', (req, res) => {
  const r = getRoadmapItem(req.params.id);
  r ? res.json(r) : res.status(404).json({ error: 'Not found' });
});
app.post('/api/roadmap', (req, res) => res.status(201).json(createRoadmapItem(req.body)));
app.put('/api/roadmap/:id', (req, res) => {
  const r = updateRoadmapItem(req.params.id, req.body);
  r ? res.json(r) : res.status(404).json({ error: 'Not found' });
});
app.delete('/api/roadmap/:id', (req, res) => {
  deleteRoadmapItem(req.params.id);
  res.json({ success: true });
});

// ── Briefing ──

app.get('/api/briefings', (_req, res) => res.json(getAllBriefings()));
app.get('/api/briefings/:id', (req, res) => {
  const b = getBriefing(req.params.id);
  b ? res.json(b) : res.status(404).json({ error: 'Not found' });
});
app.post('/api/briefings', (req, res) => res.status(201).json(createBriefing(req.body)));
app.delete('/api/briefings/:id', (req, res) => {
  deleteBriefing(req.params.id);
  res.json({ success: true });
});

// ── Jira Integration ──

function getJiraConfig() {
  const settings = loadDbSettings();
  return settings.jira || { url: '', email: '', token: '' };
}

function jiraHeaders(config) {
  const encoded = Buffer.from(`${config.email}:${config.token}`).toString('base64');
  return {
    Authorization: `Basic ${encoded}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

async function jiraFetch(config, path) {
  const url = `${config.url.replace(/\/+$/, '')}${path}`;
  const res = await fetch(url, { headers: jiraHeaders(config) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Jira ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

app.get('/api/jira/config', (_req, res) => {
  const config = getJiraConfig();
  res.json({ url: config.url, email: config.email, hasToken: !!config.token });
});

app.post('/api/jira/config', (req, res) => {
  const { url, email, token } = req.body;
  const settings = loadDbSettings();
  settings.jira = { url: url || '', email: email || '', token: token || '' };
  saveSettings(settings);
  res.json({ success: true });
});

app.get('/api/jira/test', async (_req, res) => {
  try {
    const config = getJiraConfig();
    if (!config.url || !config.email || !config.token) {
      return res.status(400).json({ error: 'Jira not configured' });
    }
    const data = await jiraFetch(config, '/rest/api/3/project');
    res.json({ success: true, projectCount: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jira/projects', async (_req, res) => {
  try {
    const config = getJiraConfig();
    const data = await jiraFetch(config, '/rest/api/3/project');
    res.json(data.map(p => ({
      key: p.key, name: p.name, lead: p.lead?.displayName || '',
      category: p.projectCategory?.name || '', avatarUrl: p.avatarUrls?.['48x48'] || '',
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jira/issues', async (req, res) => {
  try {
    const config = getJiraConfig();
    const jql = req.query.jql || '';
    const maxResults = parseInt(req.query.maxResults) || 50;
    if (!jql) return res.status(400).json({ error: 'JQL query required' });
    const data = await jiraFetch(config, `/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`);
    res.json({
      total: data.total,
      issues: data.issues.map(i => ({
        key: i.key, summary: i.fields.summary,
        status: i.fields.status?.name || '', statusCategory: i.fields.status?.statusCategory?.name || '',
        assignee: i.fields.assignee?.displayName || '',
        reporter: i.fields.reporter?.displayName || '',
        priority: i.fields.priority?.name || '',
        labels: i.fields.labels || [],
        created: i.fields.created, updated: i.fields.updated, duedate: i.fields.duedate || '',
        fixVersions: (i.fields.fixVersions || []).map(v => v.name),
        storyPoints: i.fields.customfield_10016 || i.fields.customfield_10002 || null,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jira/issue/:key', async (req, res) => {
  try {
    const config = getJiraConfig();
    const data = await jiraFetch(config, `/rest/api/3/issue/${req.params.key}`);
    res.json({
      key: data.key, summary: data.fields.summary,
      description: data.fields.description,
      status: data.fields.status?.name || '',
      assignee: data.fields.assignee?.displayName || '',
      reporter: data.fields.reporter?.displayName || '',
      priority: data.fields.priority?.name || '',
      labels: data.fields.labels || [],
      created: data.fields.created, updated: data.fields.updated, duedate: data.fields.duedate || '',
      fixVersions: (data.fields.fixVersions || []).map(v => v.name),
      components: (data.fields.components || []).map(c => c.name),
      subtasks: (data.fields.subtasks || []).map(s => ({ key: s.key, summary: s.fields?.summary, status: s.fields?.status?.name })),
      storyPoints: data.fields.customfield_10016 || data.fields.customfield_10002 || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jira/sprint/:boardId', async (req, res) => {
  try {
    const config = getJiraConfig();
    const boardId = parseInt(req.params.boardId);
    const sprints = await jiraFetch(config, `/rest/agile/1.0/board/${boardId}/sprint?state=active`);
    const sprint = sprints.values?.[0];
    if (!sprint) return res.json({ sprint: null, issues: [] });
    const issuesData = await jiraFetch(config, `/rest/agile/1.0/sprint/${sprint.id}/issue`);
    const issues = issuesData.issues.map(i => ({
      key: i.key, summary: i.fields.summary,
      status: i.fields.status?.name || '',
      statusCategory: i.fields.status?.statusCategory?.name || '',
      assignee: i.fields.assignee?.displayName || '',
      priority: i.fields.priority?.name || '',
      storyPoints: i.fields.customfield_10016 || i.fields.customfield_10002 || null,
    }));
    const statusCounts = {};
    issues.forEach(i => { statusCounts[i.status] = (statusCounts[i.status] || 0) + 1; });
    const totalPoints = issues.reduce((s, i) => s + (i.storyPoints || 0), 0);
    const donePoints = issues.filter(i => i.statusCategory === 'Done').reduce((s, i) => s + (i.storyPoints || 0), 0);
    res.json({
      sprint: { id: sprint.id, name: sprint.name, goal: sprint.goal || '', startDate: sprint.startDate, endDate: sprint.endDate },
      total: issues.length, totalPoints, donePoints,
      statusCounts, issues,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jira/stats', async (req, res) => {
  try {
    const config = getJiraConfig();
    const project = req.query.project || '';
    const jql = project ? `project = ${project}` : '';
    if (!jql) return res.status(400).json({ error: 'Project key required' });
    const data = await jiraFetch(config, `/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=200`);
    const byStatus = {}; const byPriority = {}; const byAssignee = {};
    let totalPoints = 0;
    data.issues.forEach(i => {
      const s = i.fields.status?.name || 'Unknown';
      const p = i.fields.priority?.name || 'None';
      const a = i.fields.assignee?.displayName || 'Unassigned';
      const pts = i.fields.customfield_10016 || i.fields.customfield_10002 || 0;
      byStatus[s] = (byStatus[s] || 0) + 1;
      byPriority[p] = (byPriority[p] || 0) + 1;
      byAssignee[a] = (byAssignee[a] || 0) + 1;
      totalPoints += pts;
    });
    res.json({ total: data.total, totalPoints, byStatus, byPriority, byAssignee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health ──

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
