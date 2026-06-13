import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'meetings.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department TEXT DEFAULT '',
      date TEXT DEFAULT '',
      transcript TEXT DEFAULT '',
      summary TEXT DEFAULT '',
      actionItems TEXT DEFAULT '[]',
      duration INTEGER DEFAULT 0,
      status TEXT DEFAULT 'completed',
      provider TEXT DEFAULT 'local',
      fileName TEXT DEFAULT '',
      fileSize INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      data TEXT DEFAULT '{}'
    );

    INSERT OR IGNORE INTO settings (id, data) VALUES (1, '{}');
  `);
}

function parseRow(row) {
  if (!row) return null;
  let departments = [];
  try {
    const parsed = JSON.parse(row.department);
    departments = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
  } catch {
    departments = row.department ? [row.department] : [];
  }
  return {
    ...row,
    department: departments[0] || '',
    departments,
    actionItems: JSON.parse(row.actionItems || '[]'),
  };
}

function deptForDb(departments) {
  if (!departments || !Array.isArray(departments)) return '';
  return JSON.stringify(departments.filter(Boolean));
}

export function getAllMeetings() {
  const rows = getDb().prepare('SELECT * FROM meetings ORDER BY date DESC').all();
  return rows.map(parseRow);
}

export function getMeeting(id) {
  const row = getDb().prepare('SELECT * FROM meetings WHERE id = ?').get(id);
  return parseRow(row);
}

export function createMeeting(meeting) {
  const depts = meeting.departments || (meeting.department ? [meeting.department] : []);
  const stmt = getDb().prepare(`
    INSERT INTO meetings (id, title, department, date, transcript, summary, actionItems, duration, status, provider, fileName, fileSize)
    VALUES (@id, @title, @department, @date, @transcript, @summary, @actionItems, @duration, @status, @provider, @fileName, @fileSize)
  `);
  stmt.run({
    id: meeting.id,
    title: meeting.title || '',
    department: deptForDb(depts),
    date: meeting.date || '',
    transcript: meeting.transcript || '',
    summary: meeting.summary || '',
    actionItems: JSON.stringify(meeting.actionItems || []),
    duration: meeting.duration || 0,
    status: meeting.status || 'completed',
    provider: meeting.provider || 'local',
    fileName: meeting.fileName || '',
    fileSize: meeting.fileSize || 0,
  });
  return getMeeting(meeting.id);
}

export function updateMeeting(id, updates) {
  const existing = getMeeting(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates };
  const depts = merged.departments || (merged.department ? [merged.department] : []);
  const stmt = getDb().prepare(`
    UPDATE meetings SET title=@title, department=@department, date=@date, transcript=@transcript,
      summary=@summary, actionItems=@actionItems, duration=@duration, status=@status,
      provider=@provider, fileName=@fileName, fileSize=@fileSize
    WHERE id=@id
  `);
  stmt.run({
    id: merged.id,
    title: merged.title || '',
    department: deptForDb(depts),
    date: merged.date || '',
    transcript: merged.transcript || '',
    summary: merged.summary || '',
    actionItems: JSON.stringify(merged.actionItems || []),
    duration: merged.duration || 0,
    status: merged.status || 'completed',
    provider: merged.provider || 'local',
    fileName: merged.fileName || '',
    fileSize: merged.fileSize || 0,
  });
  return getMeeting(id);
}

export function deleteMeeting(id) {
  const stmt = getDb().prepare('DELETE FROM meetings WHERE id = ?');
  stmt.run(id);
}

export function loadSettings() {
  const row = getDb().prepare('SELECT data FROM settings WHERE id = 1').get();
  return row ? JSON.parse(row.data) : {};
}

export function saveSettings(settings) {
  const stmt = getDb().prepare('UPDATE settings SET data = ? WHERE id = 1');
  stmt.run(JSON.stringify(settings));
}
