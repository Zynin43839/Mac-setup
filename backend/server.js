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

// ── Health ──

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
