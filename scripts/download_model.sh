#!/usr/bin/env bash
#
# ─── Download Whisper Model (macOS/Linux) ────────────────
# Usage: bash scripts/download_model.sh <model>
#   e.g. bash scripts/download_model.sh medium
# ─────────────────────────────────────────────────────────────
set -euo pipefail

MODEL_NAME="${1:-}"
if [[ -z "$MODEL_NAME" ]]; then
  echo "Usage: $0 <model>"
  echo "Available: tiny, tiny.en, base, base.en, small, small.en, medium, medium.en, large, large-v3"
  exit 1
fi

declare -A MODEL_FILES=(
  [tiny]="ggml-tiny.bin"
  [tiny.en]="ggml-tiny.en.bin"
  [base]="ggml-base.bin"
  [base.en]="ggml-base.en.bin"
  [small]="ggml-small.bin"
  [small.en]="ggml-small.en.bin"
  [medium]="ggml-medium.bin"
  [medium.en]="ggml-medium.en.bin"
  [large]="ggml-large-v3.bin"
  [large-v3]="ggml-large-v3.bin"
)

declare -A MODEL_URLS=(
  [tiny]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin"
  [tiny.en]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin"
  [base]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin"
  [base.en]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin"
  [small]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"
  [small.en]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin"
  [medium]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin"
  [medium.en]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin"
  [large-v3]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin"
)

FILE="${MODEL_FILES[$MODEL_NAME]}"
URL="${MODEL_URLS[$MODEL_NAME]}"

if [[ -z "$FILE" || -z "$URL" ]]; then
  echo "ERROR: Unknown model '$MODEL_NAME'"
  echo "Available: ${!MODEL_FILES[*]}"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEST_DIR="$PROJECT_DIR/backend/models"
DEST_PATH="$DEST_DIR/$FILE"

mkdir -p "$DEST_DIR"

# Skip if already downloaded
if [[ -f "$DEST_PATH" && -s "$DEST_PATH" ]]; then
  SIZE=$(du -h "$DEST_PATH" | cut -f1)
  echo "Model already downloaded: $SIZE"
  exit 0
fi

echo "========================================"
echo "  Downloading $MODEL_NAME ($FILE)"
echo "  From: $URL"
echo "========================================"
echo ""

# Clean partial downloads
rm -f "${DEST_PATH}.tmp" "$DEST_PATH"

echo "Downloading..."
if command -v curl &>/dev/null; then
  curl -L "$URL" -o "${DEST_PATH}.tmp" --progress-bar
elif command -v wget &>/dev/null; then
  wget -O "${DEST_PATH}.tmp" "$URL"
else
  echo "ERROR: Neither curl nor wget found"
  exit 1
fi

if [[ ! -f "${DEST_PATH}.tmp" || ! -s "${DEST_PATH}.tmp" ]]; then
  echo "ERROR: Download failed"
  rm -f "${DEST_PATH}.tmp"
  exit 1
fi

SIZE=$(stat -f%z "${DEST_PATH}.tmp" 2>/dev/null || stat -c%s "${DEST_PATH}.tmp" 2>/dev/null)
mv "${DEST_PATH}.tmp" "$DEST_PATH"

echo ""
echo "SUCCESS: $MODEL_NAME model ($(( SIZE / 1024 / 1024 )) MB)"
echo "Saved to: $DEST_PATH"
