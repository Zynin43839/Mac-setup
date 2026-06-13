# Meeting Summary Application

Voice-to-Text meeting analysis app built with React, TypeScript, Vite, and Tailwind CSS.
Uses local **whisper.cpp** for offline transcription (Thai support) + optional AI analysis via Claude API.

## Quick Start

```bash
# One-click setup (Windows)
scripts\setup.bat
```

Or manually:

```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Download whisper model
scripts\download_model.ps1 small

# Start
scripts\run_app.vbs
```

Open http://localhost:5174

## One-Click Setup (`setup.bat`)

Run `scripts\setup.bat` to automatically:

1. **Check prerequisites** — Node.js, npm
2. **Install dependencies** — Frontend + Backend `npm install`
3. **Download whisper.cpp** — Binary (~30 MB) from GitHub
4. **Download model** — Choose size interactively:

   | Option | Model | Size | Use Case |
   |--------|-------|------|----------|
   | 1 | Tiny | 74 MB | Fastest, low accuracy |
   | 2 | Base | 142 MB | Balanced |
   | 3 | **Small** | 466 MB | **Good accuracy, recommended for Thai** |
   | 4 | Medium | 1.5 GB | High accuracy, needs ~3 GB RAM |
   | 5 | Large | 2.9 GB | Best accuracy, slow |

Model downloads show **real-time progress** (percentage, speed, ETA) via `curl.exe`.

## Scripts

| Script | Description |
|--------|-------------|
| `scripts\setup.bat` | Full one-click setup (install + download everything) |
| `scripts\run_app.vbs` | Start backend + frontend + open browser |
| `scripts\download_model.ps1` | Download a specific model (`.\download_model.ps1 medium`) |

### npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite frontend dev server |
| `npm run build` | Build for production (single file) |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `cd backend && npm start` | Start backend server (port 8080) |

## Project Structure

```
├── backend/
│   ├── server.js          # Express API (transcribe, models, meetings)
│   ├── transcriber.js     # whisper.cpp bridge + model download
│   ├── database.js        # SQLite meetings CRUD
│   └── models/            # Downloaded .bin model files
├── scripts/
│   ├── setup.bat           # One-click installer
│   ├── run_app.vbs         # Start both servers + browser
│   └── download_model.ps1  # Standalone model downloader
├── src/
│   ├── components/
│   │   ├── AIAssistant.tsx       # Claude API chat (AI analysis)
│   │   ├── FileUploader.tsx      # Audio upload + transcribe
│   │   ├── SettingsPanel.tsx     # STT provider + model management
│   │   └── ...
│   ├── store.ts           # State management + API calls
│   ├── data/providers.ts  # STT provider configs
│   └── types.ts           # TypeScript types
└── temp/                  # Temporary audio/output files
```

## Features

### Local Transcription (whisper.cpp)
- **Offline** — no internet needed after model download
- **Thai language support** — `-l th` flag + `small` recommended model
- **Model management** — Download from Settings panel or upload page
- **Auto-download** — Missing model downloads automatically on first transcribe
- **Visible terminal** — Model downloads show real progress in a popup window
- **Error validation** — Corrupted/incomplete models detected before running

### AI Analysis (Claude API)
- Analyzes transcripts and generates structured meeting reports
- Extracts action items, decisions, department tasks
- Handles transcription errors — prompt instructs AI to infer correct meaning from context
- Quick actions: Full Report, Executive Summary, Action Items, etc.

### Cloud Providers
- OpenAI Whisper API, Google Speech-to-Text, AssemblyAI, Deepgram

## Model Downloads

**From the frontend:**
- Settings → Model Management → Download
- Upload page → Model dropdown → auto-downloads if missing

**From terminal:**
```powershell
# Download a specific model
powershell -ExecutionPolicy Bypass -File scripts\download_model.ps1 small
powershell -ExecutionPolicy Bypass -File scripts\download_model.ps1 medium
powershell -ExecutionPolicy Bypass -File scripts\download_model.ps1 base
```

Downloads use `curl.exe` with real-time progress bar. Falls back to `Invoke-WebRequest` if curl unavailable.

## Tech Stack

- React 19, TypeScript, Vite 7
- Tailwind CSS 4, Framer Motion
- whisper.cpp (local STT), Claude API (AI analysis)
- SQLite (via better-sqlite3) for meeting storage
- Vitest, Testing Library
- Single-file output via vite-plugin-singlefile

## Distribution

The project folder is lightweight (~2 MB source only). Run `setup.bat` on each machine to download heavy dependencies:
- `node_modules/` (~200 MB)
- `whisper-cli.exe` + DLLs (~30 MB)
- Model file (74 MB - 2.9 GB depending on choice)
