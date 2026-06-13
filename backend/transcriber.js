import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, 'models');
const TEMP_DIR = path.join(__dirname, '..', 'temp');

for (const dir of [MODELS_DIR, TEMP_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const MODEL_FILES = {
  'tiny': 'ggml-tiny.bin',
  'tiny.en': 'ggml-tiny.en.bin',
  'base': 'ggml-base.bin',
  'base.en': 'ggml-base.en.bin',
  'small': 'ggml-small.bin',
  'small.en': 'ggml-small.en.bin',
  'medium': 'ggml-medium.bin',
  'medium.en': 'ggml-medium.en.bin',
  'large': 'ggml-large-v3.bin',
  'large-v3': 'ggml-large-v3.bin',
};

const MODEL_URLS = {
  'tiny': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
  'tiny.en': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
  'base': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
  'base.en': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin',
  'small': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
  'small.en': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin',
  'medium': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
  'medium.en': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin',
  'large-v3': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin',
};

function findWhisperBinary() {
  const candidates = [
    'whisper-cli.exe',
    'whisper.exe',
    'whisper-cli',
    'whisper',
    path.join(__dirname, 'whisper-cli.exe'),
    path.join(__dirname, 'whisper.cpp', 'build', 'bin', 'Release', 'whisper-cli.exe'),
    path.join(__dirname, 'whisper.cpp', 'build', 'bin', 'whisper-cli'),
    path.join(__dirname, 'whisper.cpp', 'build', 'bin', 'Release', 'whisper.exe'),
    path.join(__dirname, 'whisper.cpp', 'build', 'bin', 'whisper'),
  ];

  for (const cmd of candidates) {
    try {
      const whichCmd = process.platform === 'win32' ? 'where' : 'which';
      execSync(`${whichCmd} ${cmd}`, { stdio: 'ignore' });
      return cmd;
    } catch {
      if (fs.existsSync(cmd)) return cmd;
    }
  }
  return null;
}

async function transcribeLocal(filePath, settings) {
  const binary = findWhisperBinary();
  if (!binary) {
    return {
      transcript: '',
      provider: 'local',
      duration: 0,
      error: 'whisper.cpp binary not found. Install whisper.cpp or use OpenAI API.',
    };
  }

  const model = settings.localWhisper?.model || 'base';
  const modelFile = MODEL_FILES[model] || MODEL_FILES.base;
  const modelPath = path.join(MODELS_DIR, modelFile);
  const lang = settings.localWhisper?.language || 'th';

  if (!fs.existsSync(modelPath) || fs.statSync(modelPath).size < 1024) {
    try {
      await downloadModel(model);
    } catch (err) {
      return {
        transcript: '',
        provider: 'local',
        duration: 0,
        error: `Failed to download model "${model}": ${err.message}`,
      };
    }
  }

  // Verify model file is valid before running whisper
  const modelSize = fs.statSync(modelPath).size;
  if (modelSize < 1024 * 1024) {
    try { fs.unlinkSync(modelPath); } catch {}
    return {
      transcript: '',
      provider: 'local',
      duration: 0,
      error: `Model file "${model}" is corrupted (${(modelSize / 1024).toFixed(0)} KB). Please re-download from Settings.`,
    };
  }

  return new Promise((resolve) => {
    const outFile = path.join(TEMP_DIR, `whisper_out_${Date.now()}`);
    const args = [
      '-f', filePath,
      '-m', modelPath,
      '-l', lang,
      '--output-txt',
      '-of', outFile,
      '-t', '4',
      '--no-prints',
    ];

    if (lang === 'auto') {
      args.splice(args.indexOf('-l'), 2);
    }

    const proc = spawn(binary, args);
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      const outputTxt = `${outFile}.txt`;
      if (code === 0 && fs.existsSync(outputTxt)) {
        const transcript = fs.readFileSync(outputTxt, 'utf-8').trim();
        resolve({
          transcript: transcript || '(silence)',
          provider: 'local',
          model,
          duration: 0,
        });
      } else {
        const codeMap = {
          1: 'Generic error',
          2: 'Invalid input file or arguments',
          3: 'Failed to load model (corrupted or incompatible)',
        };
        const codeHint = codeMap[code] || `Exit code ${code}`;
        resolve({
          transcript: '',
          provider: 'local',
          duration: 0,
          error: `whisper.cpp ${codeHint}${stderr ? '. ' + stderr.slice(0, 300) : ''}`,
          note: stderr.slice(0, 500),
        });
      }

      for (const f of [outputTxt, `${outFile}.srt`, `${outFile}.vtt`, `${outFile}.csv`]) {
        try { fs.unlinkSync(f); } catch {}
      }
    });

    proc.on('error', (err) => {
      resolve({
        transcript: '',
        provider: 'local',
        duration: 0,
        error: `Failed to start whisper.cpp: ${err.message}`,
      });
    });
  });
}

async function transcribeCloud(filePath, settings) {
  const apiKey = settings.apiKeys?.openai;
  if (!apiKey) {
    return {
      transcript: '',
      provider: 'openai',
      duration: 0,
      error: 'OpenAI API key not configured.',
      note: 'Set your OpenAI API key in Settings.',
    };
  }

  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 25 * 1024 * 1024) {
      return {
        transcript: '',
        provider: 'openai',
        duration: 0,
        error: 'File too large for OpenAI API (max 25MB). Use local mode or compress the file.',
      };
    }

    const audioBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).slice(1) || 'mpeg';
    const blob = new Blob([audioBuffer], { type: `audio/${ext}` });
    const formData = new FormData();
    formData.append('file', blob, path.basename(filePath));
    formData.append('model', 'whisper-1');
    formData.append('language', settings.localWhisper?.language || 'th');
    formData.append('response_format', 'json');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      return {
        transcript: '',
        provider: 'openai',
        duration: 0,
        error: `OpenAI API error: ${res.status}`,
        note: err,
      };
    }

    const data = await res.json();
    return {
      transcript: data.text || '',
      provider: 'openai',
      duration: 0,
    };
  } catch (err) {
    return {
      transcript: '',
      provider: 'openai',
      duration: 0,
      error: `Failed to call OpenAI API: ${err.message}`,
    };
  }
}

export async function transcribe(filePath, settings) {
  const provider = settings.provider || 'local';

  if (provider === 'openai' && settings.apiKeys?.openai) {
    return transcribeCloud(filePath, settings);
  }

  if (provider === 'local') {
    return transcribeLocal(filePath, settings);
  }

  return transcribeLocal(filePath, settings);
}

export function listModels() {
  const downloaded = [];
  if (fs.existsSync(MODELS_DIR)) {
    for (const file of fs.readdirSync(MODELS_DIR)) {
      const modelName = Object.keys(MODEL_FILES).find(k => MODEL_FILES[k] === file);
      if (modelName) {
        const stat = fs.statSync(path.join(MODELS_DIR, file));
        downloaded.push({ name: modelName, file, size: stat.size, downloaded: true });
      }
    }
  }

  const available = Object.entries(MODEL_FILES).map(([name, file]) => {
    const filePath = path.join(MODELS_DIR, file);
    const isDownloaded = fs.existsSync(filePath);
    const stat = isDownloaded ? fs.statSync(filePath) : null;
    const realSize = stat?.size || 0;
    return {
      name,
      file,
      size: realSize,
      downloaded: isDownloaded && realSize > 0,
      url: MODEL_URLS[name],
    };
  });

  return available;
}

export async function downloadModel(modelName) {
  if (!MODEL_FILES[modelName]) throw new Error(`Unknown model: ${modelName}`);

  const fileName = MODEL_FILES[modelName];
  const destPath = path.join(MODELS_DIR, fileName);

  // Valid existing file → skip
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
    return { name: modelName, file: fileName, size: fs.statSync(destPath).size, downloaded: true };
  }

  const url = MODEL_URLS[modelName];
  if (!url) throw new Error(`No URL for model: ${modelName}`);

  if (process.platform === 'win32') {
    // Windows: use PowerShell download script
    const escapePsArg = (arg) => `"${arg.replace(/"/g, '`"')}"`;
    const psScript = path.join(__dirname, '..', 'scripts', 'download_model.ps1');
    const psCmd = `Start-Process -FilePath powershell -ArgumentList ${escapePsArg(`-NoLogo -NoProfile -ExecutionPolicy Bypass -File "${psScript}" "${modelName}"`)} -Wait -WindowStyle Normal; exit $LASTEXITCODE`;

    return new Promise((resolve, reject) => {
      const proc = spawn('powershell', ['-NoLogo', '-NoProfile', '-Command', psCmd], {
        windowsHide: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
          const stat = fs.statSync(destPath);
          resolve({ name: modelName, file: fileName, size: stat.size, downloaded: true });
        } else {
          reject(new Error(`Download failed (exit ${code}): ${stderr || stdout || 'see terminal window for details'}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to start download: ${err.message}`));
      });
    });
  }

  // macOS / Linux: use curl directly
  return new Promise((resolve, reject) => {
    const tmpPath = destPath + '.tmp';
    const proc = spawn('curl', ['-L', url, '-o', tmpPath, '--progress-bar'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(tmpPath) && fs.statSync(tmpPath).size > 0) {
        fs.renameSync(tmpPath, destPath);
        const stat = fs.statSync(destPath);
        resolve({ name: modelName, file: fileName, size: stat.size, downloaded: true });
      } else {
        try { fs.unlinkSync(tmpPath); } catch {}
        reject(new Error(`Download failed (exit ${code}): ${stderr.slice(0, 300)}`));
      }
    });

    proc.on('error', (err) => {
      try { fs.unlinkSync(tmpPath); } catch {}
      reject(new Error(`Failed to start download: ${err.message}`));
    });
  });
}

export function getWhisperStatus() {
  const binary = findWhisperBinary();
  const modelsDir = MODELS_DIR;
  const tempDir = TEMP_DIR;

  const downloadedModels = listModels().filter(m => m.downloaded);

  return {
    binaryFound: !!binary,
    binaryPath: binary,
    modelsDir,
    tempDir,
    modelsDirExists: fs.existsSync(modelsDir),
    tempDirExists: fs.existsSync(tempDir),
    downloadedModels,
  };
}
