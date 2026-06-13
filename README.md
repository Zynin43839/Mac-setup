# Cat Meeting — Working Station 🐱

All-in-one **Working Station** สำหรับประชุม จัดการโปรเจกต์ วางแผน roadmap และ briefing — ทำงานแบบ **Local First** (whisper.cpp STT + Ollama AI + SQLite) พร้อม **MCP Server** ให้ AI Agent (Claude/Cursor) เชื่อมต่อได้

---

## Quick Start

### Windows

```powershell
scripts\setup.bat
# แล้วเลือก [1] Start Both
# → http://localhost:5174
```

### macOS

```bash
bash scripts/setup-mac.sh
# รอจนเสร็จ แล้ว:
brew services start ollama
npm run dev
# → http://localhost:5174
```

### macOS (แยกขั้นตอน)

```bash
# Prerequisites (ถ้ายังไม่มี)
xcode-select --install
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node

# Project deps
npm install
cd backend && npm install && cd ..

# Local AI
brew install ollama
ollama serve &          # รันพื้นหลัง
ollama pull gemma3:12b  # ~8 GB ดาวน์โหลดครั้งเดียว

# STT Engine
git clone --depth 1 https://github.com/ggerganov/whisper.cpp.git backend/whisper.cpp
cd backend/whisper.cpp && make -j$(sysctl -n hw.logicalcpu) whisper-cli && cd ../..
bash scripts/download_model.sh medium  # ~1.5 GB

# Run
npm run dev
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│  ┌──────────────────────────────────────────────┐   │
│  │  React 19 + Vite + Tailwind 4 + Framer Motion │   │
│  │                                                │   │
│  │  Dashboard │ Upload │ Meetings │ Projects     │   │
│  │  Roadmap   │ Briefing │ AI Assistant │ Settings│   │
│  └──────────────────┬───────────────────────────┘   │
└─────────────────────┼───────────────────────────────┘
                      │ HTTP /api/*
                      ▼
┌─────────────────────────────────────────────────────┐
│           Backend — Express + better-sqlite3         │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐   │
│  │ Meetings │ │ Projects │ │ Roadmap + Briefing  │   │
│  │ CRUD API │ │ CRUD API │ │ CRUD API            │   │
│  └──────────┘ └──────────┘ └────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Transcriber — whisper.cpp bridge             │   │
│  │  Local AI — Ollama (gemma3:12b)              │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────┘
                      │
┌─────────────────────────────────────────────────────┐
│  MCP Server — JSON-RPC 2.0 over stdio               │
│  23 tools: meetings, projects, roadmap, briefing,   │
│  Jira, AI summarize, search                         │
│  Connect: Claude Desktop, Cursor, any MCP client    │
└─────────────────────────────────────────────────────┘
```

---

## Features

### 🎙 Meeting Transcription
- **Local STT** — whisper.cpp รองรับภาษาไทย
- **Cloud STT** — OpenAI Whisper API, Google STT, AssemblyAI, Deepgram
- Model management (download, switch, delete)
- Auto-transcribe + สรุปผลด้วย Local AI

### 📋 Working Station Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | ภาพรวม: stats meetings/projects/roadmap/briefing, recent activity, quick actions |
| **Upload Audio** | อัปโหลดไฟล์เสียง ถอดเทป ดูผลลัพธ์ |
| **Meetings** | ประวัติการประชุมทั้งหมด, search, filter, expand |
| **Projects** | CRUD โปรเจกต์: status (planning/active/paused/completed/cancelled), priority, progress bar, tags |
| **Roadmap** | ฟีเจอร์รายไตรมาส (Q1-Q4), filter ตาม department, click toggles status |
| **Briefing** | ข่าว/คู่แข่ง/เทรนด์ tech, category tabs, source URLs |
| **AI Assistant** | Claude API สำหรับวิเคราะห์ meeting, generate report, action items |
| **Settings** | STT provider, model management, Local AI endpoint |

### 🤖 MCP Server (Model Context Protocol)

รองรับ AI Agent ทุกตัวที่ implement MCP (Claude Desktop, Cursor, etc.)

**23 Tools:**

| Category | Tools |
|----------|-------|
| Meetings | `list_meetings`, `get_meeting`, `create_meeting`, `summarize_transcript`, `search_meetings`, `delete_meeting` |
| Projects | `list_projects`, `get_project`, `create_project`, `update_project`, `delete_project` |
| Roadmap | `list_roadmap`, `add_roadmap_item`, `update_roadmap_item`, `delete_roadmap_item` |
| Briefing | `list_briefings`, `add_briefing`, `delete_briefing` |
| Jira | `jira_list_projects`, `jira_search_issues`, `jira_get_issue`, `jira_get_sprint` |
| Utility | `list_departments` |

**3 Resources:** `meetings://list`, `meetings://departments`, `meetings://{id}`, `projects://list`, `roadmap://list`, `briefings://list`, `jira://projects`

**3 Prompts:** `summarize-meeting`, `daily-brief`, `project-status`

### 🔗 Jira Integration (MCP Tools)

ต้องตั้ง env vars ก่อนรัน MCP Server:

```bash
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=you@email.com
JIRA_TOKEN=your-api-token
node mcp-server/index.js
```

Tools: `jira_list_projects` | `jira_search_issues` (JQL) | `jira_get_issue` | `jira_get_sprint`

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4, Framer Motion, Lucide Icons |
| Backend | Express 4, better-sqlite3, multer |
| STT | whisper.cpp (local), OpenAI Whisper API, Google STT, AssemblyAI, Deepgram |
| AI | Ollama (gemma3:12b default), Claude API (optional) |
| MCP | JSON-RPC 2.0 over stdio (zero npm deps) |
| Test | Vitest, Testing Library, jsdom |
| Build | vite-plugin-singlefile (single HTML output) |

---

## Project Structure

```
├── backend/
│   ├── server.js               # Express API (meetings, projects, roadmap, briefing)
│   ├── transcriber.js          # whisper.cpp bridge + model download
│   ├── database.js             # SQLite (meetings, projects, roadmap_items, briefing_items, settings)
│   ├── package.json
│   └── models/                 # Whisper model files (.bin)
├── mcp-server/
│   └── index.js                # MCP Server (23 tools, 7 resources, 3 prompts)
├── scripts/
│   ├── setup.bat               # Windows one-click setup
│   ├── setup-mac.sh            # macOS full setup (Homebrew → Ollama → whisper.cpp)
│   ├── download_model.ps1      # Windows model downloader
│   └── download_model.sh       # macOS/Linux model downloader
├── src/
│   ├── App.tsx                 # Main app (sidebar navigation)
│   ├── types.ts                # TypeScript interfaces
│   ├── store.ts                # API calls + state
│   ├── modules/
│   │   ├── Dashboard.tsx       # Overview / stats
│   │   ├── Projects.tsx        # Project CRUD
│   │   ├── Roadmap.tsx         # Quarterly planning
│   │   └── Briefing.tsx        # News/competitor/tech
│   └── components/
│       ├── FileUploader.tsx    # Audio upload + transcribe
│       ├── MeetingHistory.tsx  # Meeting list/search
│       ├── AIAssistant.tsx     # Claude chat
│       └── SettingsPanel.tsx   # STT provider + model mgmt
├── temp/                       # Temp audio files
└── data/                       # SQLite database
```

---

## Configuration

### Environment Variables

```bash
# Backend (optional)
PORT=8080                        # Backend port

# MCP Server (optional)
BACKEND_URL=http://localhost:8080 # Backend URL
JIRA_URL=...                     # Jira instance URL
JIRA_EMAIL=...                   # Jira account email
JIRA_TOKEN=...                   # Jira API token

# Frontend (via Settings panel)
# Ollama endpoint: http://localhost:11434
# Model: gemma3:12b
```

### Default AI Model

`gemma3:12b` — 128K context, vision support, ~8 GB RAM on M2 16GB MacBook
เปลี่ยนได้ที่ Settings → Local AI → Model name

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite frontend (port 5174) |
| `npm run build` | Build production (single HTML) |
| `npm test` | Run tests (watch) |
| `npm run test:run` | Run tests once |
| `cd backend && node server.js` | Start backend (port 8080) |
| `node mcp-server/index.js` | Start MCP Server (stdio) |

---

## Testing

101 tests (6 test files):

```
src/
├── store.test.ts              # 29 unit tests (CRUD, settings, API keys)
├── integration.test.tsx       # 12 integration tests (navigation, flow, persistence)
└── components/
    ├── FileUploader.test.tsx   # 11 tests
    ├── MeetingHistory.test.tsx # 14 tests
    ├── AIAssistant.test.tsx    # 17 tests
    └── SettingsPanel.test.tsx  # 18 tests
```

---

## License

MIT
