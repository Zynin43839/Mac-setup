import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileAudio, X, Loader2, Sparkles, FileText, ListChecks, AlertCircle, CheckCircle2, Clock, HardDrive, Download, Check } from 'lucide-react';
import { Meeting, Department, WhisperModel } from '../types';
import { generateId, localSummarize, addMeeting, loadSettings, saveSettings, formatFileSize, formatDuration, getAudioDuration, hasValidKey, transcribeAudio, fetchModels, downloadModelFile, summarizeWithLocalAI } from '../store';
import { providers, supportedFormats, maxFileSizes, modelOptions } from '../data/providers';

interface Props {
  onMeetingCreated: (meetings: Meeting[]) => void;
}

const departments: Department[] = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];

type UploadStatus = 'idle' | 'selected' | 'processing' | 'transcribing' | 'summarizing' | 'done' | 'error';

export default function FileUploader({ onMeetingCreated }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  
  const [title, setTitle] = useState('');
  const [selectedDepts, setSelectedDepts] = useState<Department[]>(['Engineering', 'Marketing']);
  
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [models, setModels] = useState<WhisperModel[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settings = loadSettings();
  const provider = providers.find(p => p.id === settings.provider);
  const [selectedModel, setSelectedModel] = useState(settings.localWhisper.model);
  
  const canProcess = settings.provider === 'local' || hasValidKey(settings.provider);

  useEffect(() => {
    if (settings.provider === 'local') {
      fetchModels().then(setModels).catch(() => {});
    }
  }, []);

  const handleModelChange = async (model: string) => {
    setSelectedModel(model);
    const s = loadSettings();
    s.localWhisper.model = model;
    saveSettings(s);
    const found = models.find(m => m.name === model);
    if (!found?.downloaded) {
      setDownloading(model);
      try {
        await downloadModelFile(model);
        const updated = await fetchModels();
        setModels(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Download failed');
      } finally {
        setDownloading(null);
      }
    }
  };

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError('');
    
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ext || !supportedFormats.includes(ext)) {
      setError(`Unsupported format. Use: ${supportedFormats.join(', ')}`);
      return;
    }

    const maxSize = maxFileSizes[settings.provider];
    if (selectedFile.size > maxSize) {
      setError(`File too large. Max ${formatFileSize(maxSize)} for ${provider?.name}`);
      return;
    }

    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    setStatus('selected');

    try {
      const duration = await getAudioDuration(selectedFile);
      setAudioDuration(duration);
    } catch {
      setAudioDuration(0);
    }
  }, [settings.provider, provider?.name]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const processFile = async () => {
    if (!file || !canProcess) return;

    setStatus('processing');
    setProgress(10);

    try {
      setStatus('transcribing');
      setProgress(30);

      const processSettings = { ...settings, localWhisper: { ...settings.localWhisper, model: selectedModel } };
      const result = await transcribeAudio(file, processSettings);
      setProgress(60);

      if (!result || result.error) {
        throw new Error(result?.error || 'Transcription failed — check backend and STT settings');
      }

      const transcriptText = result.transcript;
      if (!transcriptText) {
        throw new Error('Transcription returned empty result');
      }

      setTranscript(transcriptText);
      setProgress(80);

      let generatedSummary = 'Summarization disabled';
      let generatedActionItems: string[] = [];

      if (settings.summarization.enabled) {
        setStatus('summarizing');
        await new Promise(r => setTimeout(r, 1000));

        if (settings.summarization.provider === 'local-ai') {
          const result = await summarizeWithLocalAI(transcriptText, settings.summarization.localAI);
          generatedSummary = result.report || result.summary;
          generatedActionItems = result.actionItems;
        } else {
          const result = localSummarize(transcriptText);
          generatedSummary = result.report || result.summary;
          generatedActionItems = result.actionItems;
        }
        
        setSummary(generatedSummary);
        setActionItems(generatedActionItems);
      }

      setProgress(100);
      setStatus('done');

      const meeting: Meeting = {
        id: generateId(),
        title: title || file.name,
        department: selectedDepts[0] || '',
        departments: selectedDepts,
        date: new Date().toISOString(),
        transcript: transcriptText,
        summary: generatedSummary,
        actionItems: generatedActionItems,
        duration: Math.floor(audioDuration),
        status: 'completed',
        provider: settings.provider,
        fileName: file.name,
        fileSize: file.size,
      };

      const updated = await addMeeting(meeting);
      onMeetingCreated(updated);

    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Processing failed');
    }
  };

  const reset = () => {
    setFile(null);
    setAudioDuration(0);
    setStatus('idle');
    setError('');
    setProgress(0);
    setTitle('');
    setTranscript('');
    setSummary('');
    setActionItems([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const statusMessages: Record<UploadStatus, string> = {
    idle: 'Select or drop an audio file',
    selected: 'Ready to process',
    processing: 'Preparing file...',
    transcribing: `Transcribing with ${provider?.name}...`,
    summarizing: 'Generating summary...',
    done: 'Transcription complete!',
    error: 'Processing failed',
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
          <Upload className="w-6 h-6 inline text-pink-400 mr-2" />
          Upload Audio File
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          Upload meeting recording → Transcribe with <span className="text-pink-300 font-bold">{provider?.name || 'selected provider'}</span> → Get summary
        </p>
      </div>

      <div className={`neo-card p-4 ${canProcess ? 'border-l-[3px] border-l-emerald-400' : 'border-l-[3px] border-l-amber-400'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{provider?.icon}</span>
            <div>
              <p className="text-white font-bold text-sm">{provider?.name}</p>
              <p className="text-slate-500 text-xs font-medium">{provider?.pricing}</p>
              {settings.provider === 'local' && (
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={selectedModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="neo-input text-xs px-2 py-1 w-auto"
                  >
                    {modelOptions.map(opt => {
                      const m = models.find(x => x.name === opt.value);
                      const isDownloaded = m?.downloaded;
                      const label = `${opt.label}${isDownloaded ? ' ✅' : ' ⬇️'}`;
                      return (
                        <option key={opt.value} value={opt.value}>{label}</option>
                      );
                    })}
                  </select>
                  {downloading && (
                    <span className="text-cyan-300 text-xs font-bold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Downloading...
                    </span>
                  )}
                  <span className="text-slate-600 text-xs font-medium">/ {settings.localWhisper.language === 'th' ? '🇹🇭 Thai' : settings.localWhisper.language}</span>
                </div>
              )}
            </div>
          </div>
          {canProcess ? (
            <span className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Ready
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              API key required
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="neo-card p-4 bg-red-500/10 border-red-400/40">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-300" />
            <span className="text-red-200 text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {status === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="neo-card p-12 text-center cursor-pointer border-dashed border-pink-400/30 hover:border-pink-400/60 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={supportedFormats.map(f => `.${f}`).join(',')}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <Upload className="w-12 h-12 text-pink-400/60 mx-auto mb-4" />
          <p className="text-white font-bold text-lg">Drop audio file here</p>
          <p className="text-slate-500 text-sm mt-1 font-medium">or click to browse</p>
          <p className="text-slate-600 text-xs mt-4 font-medium">
            Supports: {supportedFormats.join(', ')} • Max: {formatFileSize(maxFileSizes[settings.provider])}
          </p>
        </motion.div>
      )}

      {file && status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="neo-card p-5"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex items-center justify-center border-2 border-pink-400/30">
                <FileAudio className="w-6 h-6 text-pink-300" />
              </div>
              <div>
                <p className="text-white font-bold text-sm truncate max-w-xs">{file.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {formatFileSize(file.size)}
                  </span>
                  {audioDuration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(audioDuration)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {status === 'selected' && (
              <button onClick={reset} className="p-1.5 text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {(status === 'processing' || status === 'transcribing' || status === 'summarizing') && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-bold flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {statusMessages[status]}
                </span>
                <span className="text-pink-300 text-xs font-bold">{progress}%</span>
              </div>
              <div className="h-3 bg-[#1e1e36] rounded-lg overflow-hidden border-2 border-[#3d3d5c]">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {(status === 'selected' || status === 'done') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-xs font-bold mb-1.5 block">Meeting Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sprint Planning Q1"
              disabled={status === 'done'}
              className="neo-input w-full px-4 py-2.5 text-sm placeholder:text-slate-600 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-bold mb-1.5 block">Departments (เลือกทั้งหมดที่เกี่ยวข้อง)</label>
            <div className="flex flex-wrap gap-1.5">
              {departments.map(d => {
                const isSelected = selectedDepts.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      if (selectedDepts.length === 1 && isSelected) return;
                      setSelectedDepts(prev =>
                        isSelected ? prev.filter(x => x !== d) : [...prev, d]
                      );
                    }}
                    disabled={status === 'done'}
                    className={`neo-btn text-xs font-bold px-3 py-1.5 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500 text-white'
                        : 'bg-[#25253e] text-slate-400 hover:text-white'
                    } disabled:opacity-50`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {status === 'selected' && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={processFile}
          disabled={!canProcess}
          className="neo-btn w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3 text-base disabled:from-slate-700 disabled:to-slate-700"
        >
          <Sparkles className="w-5 h-5" />
          Transcribe with {provider?.name}
        </motion.button>
      )}

      <AnimatePresence>
        {status === 'done' && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="neo-card p-5">
              <h3 className="text-pink-300 font-black mb-3 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" /> Transcript
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto font-medium">
                {transcript}
              </p>
            </div>

            {summary && (
              <div className="neo-card p-5 border-l-[3px] border-l-emerald-400">
                <h3 className="text-emerald-300 font-black mb-2 flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4" /> Summary
                </h3>
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {summary}
                </div>
              </div>
            )}

            {actionItems.length > 0 && (
              <div className="neo-card p-5 border-l-[3px] border-l-amber-400">
                <h3 className="text-amber-300 font-black mb-2 flex items-center gap-2 text-sm">
                  <ListChecks className="w-4 h-4" /> Action Items
                </h3>
                <ul className="space-y-1.5">
                  {actionItems.map((item, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2 font-medium">
                      <span className="text-amber-400 mt-0.5 shrink-0">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="neo-card p-4 bg-emerald-500/10 border-l-[3px] border-l-emerald-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold">Saved to Meeting History!</span>
                </div>
                <button
                  onClick={reset}
                  className="neo-btn px-4 py-2 bg-[#25253e] text-sm font-bold text-slate-300 hover:text-white"
                >
                  Upload another file
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
