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

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      department TEXT DEFAULT 'Engineering',
      status TEXT DEFAULT 'planning',
      priority TEXT DEFAULT 'medium',
      startDate TEXT DEFAULT '',
      targetDate TEXT DEFAULT '',
      completedDate TEXT DEFAULT '',
      progress INTEGER DEFAULT 0,
      lead TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS roadmap_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      module TEXT DEFAULT '',
      quarter TEXT DEFAULT '',
      year INTEGER DEFAULT 2026,
      department TEXT DEFAULT 'Engineering',
      status TEXT DEFAULT 'planned',
      priority TEXT DEFAULT 'medium',
      featureIds TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS briefing_items (
      id TEXT PRIMARY KEY,
      category TEXT DEFAULT 'news',
      title TEXT NOT NULL,
      summary TEXT DEFAULT '',
      source TEXT DEFAULT '',
      url TEXT DEFAULT '',
      date TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT (datetime('now'))
    );
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

// ── Projects CRUD ──

function parseProject(row) {
  if (!row) return null;
  return { ...row, tags: JSON.parse(row.tags || '[]') };
}

export function getAllProjects() {
  return getDb().prepare('SELECT * FROM projects ORDER BY updatedAt DESC').all().map(parseProject);
}

export function getProject(id) {
  return parseProject(getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id));
}

export function createProject(data) {
  const id = data.id || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const stmt = getDb().prepare(`
    INSERT INTO projects (id, name, description, department, status, priority, startDate, targetDate, progress, lead, tags)
    VALUES (@id, @name, @description, @department, @status, @priority, @startDate, @targetDate, @progress, @lead, @tags)
  `);
  stmt.run({
    id, name: data.name || '', description: data.description || '',
    department: data.department || 'Engineering', status: data.status || 'planning',
    priority: data.priority || 'medium', startDate: data.startDate || '',
    targetDate: data.targetDate || '', progress: data.progress || 0,
    lead: data.lead || '', tags: JSON.stringify(data.tags || []),
  });
  return getProject(id);
}

export function updateProject(id, updates) {
  const existing = getProject(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  const stmt = getDb().prepare(`
    UPDATE projects SET name=@name, description=@description, department=@department, status=@status,
      priority=@priority, startDate=@startDate, targetDate=@targetDate, completedDate=@completedDate,
      progress=@progress, lead=@lead, tags=@tags, updatedAt=@updatedAt WHERE id=@id
  `);
  stmt.run(merged);
  return getProject(id);
}

export function deleteProject(id) {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// ── Roadmap CRUD ──

function parseRoadmap(row) {
  if (!row) return null;
  return { ...row, featureIds: JSON.parse(row.featureIds || '[]') };
}

export function getAllRoadmapItems() {
  return getDb().prepare('SELECT * FROM roadmap_items ORDER BY year DESC, quarter DESC').all().map(parseRoadmap);
}

export function getRoadmapItem(id) {
  return parseRoadmap(getDb().prepare('SELECT * FROM roadmap_items WHERE id = ?').get(id));
}

export function createRoadmapItem(data) {
  const id = data.id || `road_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const stmt = getDb().prepare(`
    INSERT INTO roadmap_items (id, title, description, module, quarter, year, department, status, priority, featureIds)
    VALUES (@id, @title, @description, @module, @quarter, @year, @department, @status, @priority, @featureIds)
  `);
  stmt.run({
    id, title: data.title || '', description: data.description || '',
    module: data.module || '', quarter: data.quarter || 'Q1', year: data.year || 2026,
    department: data.department || 'Engineering', status: data.status || 'planned',
    priority: data.priority || 'medium', featureIds: JSON.stringify(data.featureIds || []),
  });
  return getRoadmapItem(id);
}

export function updateRoadmapItem(id, updates) {
  const existing = getRoadmapItem(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  const stmt = getDb().prepare(`
    UPDATE roadmap_items SET title=@title, description=@description, module=@module, quarter=@quarter,
      year=@year, department=@department, status=@status, priority=@priority, featureIds=@featureIds, updatedAt=@updatedAt WHERE id=@id
  `);
  stmt.run(merged);
  return getRoadmapItem(id);
}

export function deleteRoadmapItem(id) {
  getDb().prepare('DELETE FROM roadmap_items WHERE id = ?').run(id);
}

// ── Briefing CRUD ──

function parseBriefing(row) {
  if (!row) return null;
  return { ...row, tags: JSON.parse(row.tags || '[]') };
}

export function getAllBriefings() {
  return getDb().prepare('SELECT * FROM briefing_items ORDER BY date DESC, createdAt DESC').all().map(parseBriefing);
}

export function createBriefing(data) {
  const id = data.id || `brief_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const stmt = getDb().prepare(`
    INSERT INTO briefing_items (id, category, title, summary, source, url, date, tags)
    VALUES (@id, @category, @title, @summary, @source, @url, @date, @tags)
  `);
  stmt.run({
    id, category: data.category || 'news', title: data.title || '',
    summary: data.summary || '', source: data.source || '',
    url: data.url || '', date: data.date || new Date().toISOString().split('T')[0],
    tags: JSON.stringify(data.tags || []),
  });
  return getBriefing(id);
}

export function getBriefing(id) {
  return parseBriefing(getDb().prepare('SELECT * FROM briefing_items WHERE id = ?').get(id));
}

export function deleteBriefing(id) {
  getDb().prepare('DELETE FROM briefing_items WHERE id = ?').run(id);
}
