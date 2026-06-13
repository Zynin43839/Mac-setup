#!/usr/bin/env bash
#
# ─── Cat Meeting — macOS Setup Script ──────────────────────
# One-command setup for a brand-new MacBook.
# Installs: Homebrew → Node.js → Ollama → Qwen 2.5 → Whisper → Project deps
# ─────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()   { printf "${GREEN}[✓]${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}[!]${NC} %s\n" "$*"; }
err()   { printf "${RED}[✗]${NC} %s\n" "$*"; }
step()  { printf "\n${CYAN}══════════════════════════════════════════════${NC}\n"; printf "${CYAN}  %s${NC}\n" "$*"; printf "${CYAN}══════════════════════════════════════════════${NC}\n"; }

# ── 0. Detect macOS ──
if [[ "$(uname)" != "Darwin" ]]; then
  err "This script is for macOS only."
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# ── 1. Xcode Command Line Tools ──
step "1/8 — Xcode Command Line Tools"
if ! xcode-select -p &>/dev/null; then
  xcode-select --install
  warn "Please complete Xcode CLT installation in the popup, then re-run this script."
  warn "After installed, run: sudo xcode-select --switch /Library/Developer/CommandLineTools"
  exit 1
else
  log "Xcode CLT already installed"
fi

# ── 2. Homebrew ──
step "2/8 — Homebrew"
if ! command -v brew &>/dev/null; then
  log "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  
  # Add brew to PATH for Apple Silicon
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
  log "Homebrew installed"
else
  log "Homebrew already installed"
fi

# ── 3. Node.js ──
step "3/8 — Node.js"
if ! command -v node &>/dev/null; then
  brew install node
  log "Node.js $(node -v) installed"
else
  log "Node.js $(node -v) already installed"
fi

# ── 4. Project npm dependencies ──
step "4/8 — Project npm dependencies"
log "Installing frontend dependencies..."
npm install

log "Installing backend dependencies..."
cd backend
npm install
cd "$PROJECT_DIR"

# ── 5. Ollama ──
step "5/8 — Ollama"
if ! command -v ollama &>/dev/null; then
  log "Installing Ollama..."
  brew install ollama
  log "Ollama installed"
else
  log "Ollama already installed"
fi

# ── 6. Pull Gemma 3 12B (Local AI model — AI Secretary) ──
step "6/9 — Pull Gemma 3 12B (Local AI model)"
log "Starting Ollama in background..."
ollama serve &
OLLAMA_PID=$!
sleep 3

log "Pulling gemma3:12b (128K context, vision, ~8 GB)..."
ollama pull gemma3:12b

kill $OLLAMA_PID 2>/dev/null || true
log "gemma3:12b ready"

# ── 7. whisper.cpp (Local STT engine) ──
step "7/9 — whisper.cpp (speech-to-text engine)"
WHISPER_DIR="$PROJECT_DIR/backend/whisper.cpp"
WHISPER_BIN="$WHISPER_DIR/build/bin/whisper-cli"

if [[ -f "$WHISPER_BIN" ]]; then
  log "whisper.cpp already compiled at $WHISPER_BIN"
else
  log "Cloning whisper.cpp..."
  if [[ -d "$WHISPER_DIR" ]]; then
    rm -rf "$WHISPER_DIR"
  fi
  git clone --depth 1 "https://github.com/ggerganov/whisper.cpp.git" "$WHISPER_DIR"

  log "Compiling whisper.cpp (this takes ~2 min)..."
  cd "$WHISPER_DIR"
  make -j$(sysctl -n hw.logicalcpu) whisper-cli
  cd "$PROJECT_DIR"

  if [[ -f "$WHISPER_BIN" ]]; then
    log "whisper.cpp compiled successfully"
  else
    warn "whisper.cpp compilation failed. Trying Homebrew..."
    # Create symlink so findWhisperBinary() can find it
    if command -v whisper-cpp &>/dev/null; then
      log "Found whisper-cpp from Homebrew"
    else
      warn "whisper.cpp not compiled. Use cloud STT providers (Settings) or compile manually."
    fi
  fi
fi

# ── 8. Whisper model download ──
step "8/9 — Whisper model (medium)"
if bash scripts/download_model.sh medium; then
  log "Whisper model ready"
else
  warn "Model download failed — run later: bash scripts/download_model.sh medium"
fi

# ── 9. Create data directory ──
step "Finalizing..."
mkdir -p data temp
log "Data directories ready"

# ── Done ──
echo ""
printf "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}\n"
printf "${CYAN}║${NC}  ${GREEN}🎉 Cat Meeting — Setup Complete!${NC}                        ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}                                                          ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}  ${YELLOW}Run the project:${NC}                                          ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}                                                          ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}  ${YELLOW}1. Start Ollama (first time only):${NC}                        ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}     brew services start ollama${NC}                                 ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}     (or: ollama serve)${NC}                                         ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}                                                          ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}  ${YELLOW}2. Start the app:${NC}                                         ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}     npm run dev${NC}                                                  ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}                                                          ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}  ${YELLOW}3. Open browser:${NC}                                          ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}     http://localhost:5173${NC}                                        ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}                                                          ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}  ${YELLOW}4. AI model (gemma3:12b):${NC}                                    ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}     Settings → Local AI → model = gemma3:12b${NC}                           ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}                                                          ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}  ${YELLOW}5. MCP Server (for AI Agent):${NC}                              ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}     node mcp-server/index.js${NC}                                       ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}                                                          ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}  ${YELLOW}Troubleshooting:${NC}                                          ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}     Backend:  node backend/server.js${NC}                           ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}     Tests:    npm test -- --run${NC}                                 ${CYAN}║${NC}\n"
printf "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}\n"
