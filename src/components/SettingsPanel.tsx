import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Key, Eye, EyeOff, Check, AlertCircle, HardDrive, Cpu, Info, Download } from 'lucide-react';
import { STTSettings, STTProvider, WhisperModel } from '../types';
import { loadSettings, saveSettings, hasValidKey, fetchModels, downloadModelFile, formatFileSize } from '../store';
import { providers, modelOptions, languageOptions } from '../data/providers';

interface Props {
  onSettingsChange?: (settings: STTSettings) => void;
}

export default function SettingsPanel({ onSettingsChange }: Props) {
  const [settings, setSettings] = useState<STTSettings>(loadSettings());
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [models, setModels] = useState<WhisperModel[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [modelError, setModelError] = useState('');

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    if (settings.provider === 'local') {
      fetchModels().then(setModels).catch(() => {});
    }
  }, [settings.provider]);

  const handleDownloadModel = async (name: string) => {
    setDownloading(name);
    setModelError('');
    try {
      await downloadModelFile(name);
      const updated = await fetchModels();
      setModels(updated);
    } catch (err) {
      setModelError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const handleSave = () => {
    saveSettings(settings);
    onSettingsChange?.(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateProvider = (provider: STTProvider) => {
    setSettings(s => ({ ...s, provider }));
  };

  const updateApiKey = (provider: string, value: string) => {
    setSettings(s => ({
      ...s,
      apiKeys: { ...s.apiKeys, [provider]: value }
    }));
  };

  const updateLocalModel = (model: STTSettings['localWhisper']['model']) => {
    setSettings(s => ({
      ...s,
      localWhisper: { ...s.localWhisper, model }
    }));
  };

  const updateLanguage = (language: string) => {
    setSettings(s => ({
      ...s,
      localWhisper: { ...s.localWhisper, language }
    }));
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(s => ({ ...s, [provider]: !s[provider] }));
  };

  const selectedProvider = providers.find(p => p.id === settings.provider);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
          <Settings className="w-6 h-6 inline text-yellow-400 mr-2" />
          STT Settings
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          เลือก provider และตั้งค่า API keys — <span className="text-emerald-300 font-bold">Local Whisper</span> เป็น default (ฟรี)
        </p>
      </div>

      {/* Provider Selection */}
      <div className="space-y-3">
        <h3 className="text-white font-black text-sm flex items-center gap-2">
          <Cpu className="w-4 h-4 text-yellow-400" />
          STT Provider
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {providers.map(provider => {
            const isSelected = settings.provider === provider.id;
            const hasKey = hasValidKey(provider.id);
            const canUse = !provider.requiresKey || hasKey;

            return (
              <motion.button
                key={provider.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => canUse && updateProvider(provider.id)}
                className={`neo-card p-4 text-left transition-all ${
                  isSelected
                    ? 'border-yellow-400/60 shadow-[3px_3px_0_0_rgba(250,204,21,0.25)]'
                    : canUse
                    ? 'hover:border-slate-500'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-yellow-400" />
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">{provider.name}</span>
                      {provider.id === 'local' && (
                        <span className="neo-badge bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 truncate font-medium">{provider.description}</p>
                    <p className="text-yellow-300 text-xs font-bold mt-1">{provider.pricing}</p>
                    
                    {provider.requiresKey && (
                      <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${hasKey ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {hasKey ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>API key configured</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            <span>Requires API key</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Provider Features */}
      {selectedProvider && (
        <motion.div
          key={selectedProvider.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="neo-card-sm p-4"
        >
          <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <span>{selectedProvider.icon}</span>
            {selectedProvider.name} Features
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedProvider.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-400 font-medium">
                <span className="text-yellow-400 mt-0.5">•</span>
                {feature}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Local Whisper Settings */}
      {settings.provider === 'local' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          <h3 className="text-white font-black text-sm flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            Local Whisper Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs font-bold mb-1.5 block">Model Size</label>
              <select
                value={settings.localWhisper.model}
                onChange={(e) => updateLocalModel(e.target.value as STTSettings['localWhisper']['model'])}
                className="neo-input w-full px-4 py-2.5 text-sm"
              >
                {modelOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-xs font-bold mb-1.5 block">Language</label>
              <select
                value={settings.localWhisper.language}
                onChange={(e) => updateLanguage(e.target.value)}
                className="neo-input w-full px-4 py-2.5 text-sm"
              >
                {languageOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Model Management */}
          <div className="border-t-2 border-[#3d3d5c] pt-4">
            <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              Model Management
            </h4>

            {modelError && (
              <div className="neo-card-sm p-2 mb-3 bg-red-500/10 border-red-400/30 text-red-200 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {modelError}
              </div>
            )}

            <div className="space-y-2">
              {modelOptions.map(opt => {
                const m = models.find(m => m.name === opt.value);
                const isDownloaded = m?.downloaded;
                const isDownloading = downloading === opt.value;
                return (
                  <div key={opt.value} className="flex items-center justify-between neo-card-sm px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-white text-sm font-bold">{opt.label}</span>
                      <span className="text-slate-500 text-xs ml-2 font-medium">{opt.description}</span>
                    </div>
                    {isDownloaded ? (
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3" /> Downloaded
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDownloadModel(opt.value)}
                        disabled={isDownloading}
                        className="neo-btn text-xs px-3 py-1 bg-cyan-500 text-white font-bold disabled:opacity-50 shrink-0"
                      >
                        {isDownloading ? 'Downloading...' : 'Download'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 neo-card-sm p-3 bg-emerald-500/10 border-emerald-400/30 border-l-[3px] border-l-emerald-400">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 font-medium">
                  <span className="font-bold text-emerald-300">Auto-download:</span> ถ้า model ที่เลือกยังไม่มี จะ download อัตโนมัติเมื่อกด Transcribe ครั้งแรก
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* API Keys Section */}
      <div className="space-y-4">
        <h3 className="text-white font-black text-sm flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          API Keys (Optional)
        </h3>

        <div className="space-y-3">
          {/* Claude API Key */}
          <div className="neo-card p-4 bg-violet-500/10 border-violet-400/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>🤖</span>
                <span className="text-white text-sm font-bold">Claude (AI Assistant)</span>
                <span className="neo-badge bg-violet-500/20 text-violet-300 border-violet-400/40">
                  RECOMMENDED
                </span>
              </div>
              <span className="text-slate-500 text-xs font-medium">For meeting analysis</span>
            </div>
            
            <div className="relative">
              <input
                type={showKeys['claude'] ? 'text' : 'password'}
                value={settings.apiKeys.claude || ''}
                onChange={(e) => updateApiKey('claude', e.target.value)}
                placeholder="sk-ant-api03-..."
                className="neo-input w-full pl-4 pr-12 py-2.5 text-sm font-mono placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('claude')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showKeys['claude'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500 font-medium">
              <a href="https://console.anthropic.com/api-keys" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 underline font-bold">
                Get key from console.anthropic.com →
              </a>
            </div>
          </div>

          {/* Other STT Providers */}
          {providers.filter(p => p.requiresKey).map(provider => (
            <div key={provider.id} className="neo-card-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{provider.icon}</span>
                  <span className="text-white text-sm font-bold">{provider.name}</span>
                </div>
                <span className="text-slate-500 text-xs font-medium">{provider.pricing}</span>
              </div>
              
              <div className="relative">
                <input
                  type={showKeys[provider.id] ? 'text' : 'password'}
                  value={settings.apiKeys[provider.id as keyof typeof settings.apiKeys] || ''}
                  onChange={(e) => updateApiKey(provider.id, e.target.value)}
                  placeholder={`Enter ${provider.name} API key...`}
                  className="neo-input w-full pl-4 pr-12 py-2.5 text-sm font-mono placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(provider.id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="mt-2 text-xs text-slate-500 font-medium">
                {provider.id === 'openai' && (
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 underline font-bold">
                    Get key from platform.openai.com →
                  </a>
                )}
                {provider.id === 'google' && (
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 underline font-bold">
                    Get key from Google Cloud Console →
                  </a>
                )}
                {provider.id === 'assemblyai' && (
                  <a href="https://www.assemblyai.com/app" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 underline font-bold">
                    Get key from assemblyai.com →
                  </a>
                )}
                {provider.id === 'deepgram' && (
                  <a href="https://console.deepgram.com/" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 underline font-bold">
                    Get key from console.deepgram.com →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summarization Settings */}
      <div className="space-y-4">
        <h3 className="text-white font-black text-sm">Summarization</h3>
        
        <div className="neo-card-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-bold">Auto-summarize transcripts</p>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                {settings.summarization.provider === 'local-ai'
                  ? `Using local AI (${settings.summarization.localAI.model})`
                  : 'Using local extractive summary (no AI)'}
              </p>
            </div>
            <button
              onClick={() => setSettings(s => ({
                ...s,
                summarization: { ...s.summarization, enabled: !s.summarization.enabled }
              }))}
              className={`relative w-12 h-7 rounded-full transition-colors border-2 border-[#3d3d5c] ${
                settings.summarization.enabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform border border-[#3d3d5c] ${
                  settings.summarization.enabled ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setSettings(s => ({
                ...s,
                summarization: { ...s.summarization, provider: 'local' }
              }))}
              className={`neo-btn text-xs font-bold px-3 py-1.5 ${
                settings.summarization.provider === 'local'
                  ? 'bg-amber-500 text-white'
                  : 'bg-[#25253e] text-slate-400 hover:text-white'
              }`}
            >
              Rule-based
            </button>
            <button
              onClick={() => setSettings(s => ({
                ...s,
                summarization: { ...s.summarization, provider: 'local-ai' }
              }))}
              className={`neo-btn text-xs font-bold px-3 py-1.5 ${
                settings.summarization.provider === 'local-ai'
                  ? 'bg-amber-500 text-white'
                  : 'bg-[#25253e] text-slate-400 hover:text-white'
              }`}
            >
              Local AI
            </button>
          </div>
        </div>

        {settings.summarization.provider === 'local-ai' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="neo-card-sm p-4 border-l-[3px] border-l-amber-400 space-y-4"
          >
            <h4 className="text-white font-bold text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              Local AI Configuration
            </h4>

            <div>
              <label className="text-slate-400 text-xs font-bold mb-1.5 block">Endpoint URL</label>
              <input
                type="text"
                value={settings.summarization.localAI.endpoint}
                onChange={(e) => setSettings(s => ({
                  ...s,
                  summarization: {
                    ...s.summarization,
                    localAI: { ...s.summarization.localAI, endpoint: e.target.value }
                  }
                }))}
                placeholder="http://localhost:11434"
                className="neo-input w-full px-4 py-2.5 text-sm font-mono placeholder:text-slate-600"
              />
              <p className="text-slate-600 text-[10px] mt-1 font-medium">
                Ollama, llama.cpp server, LM Studio, หรือ OpenAI-compatible API ใด ๆ
              </p>
            </div>

            <div>
              <label className="text-slate-400 text-xs font-bold mb-1.5 block">Model Name</label>
              <input
                type="text"
                value={settings.summarization.localAI.model}
                onChange={(e) => setSettings(s => ({
                  ...s,
                  summarization: {
                    ...s.summarization,
                    localAI: { ...s.summarization.localAI, model: e.target.value }
                  }
                }))}
                placeholder="gemma3:12b"
                className="neo-input w-full px-4 py-2.5 text-sm font-mono placeholder:text-slate-600"
              />
              <p className="text-slate-600 text-[10px] mt-1 font-medium">
                Default: gemma3:12b — 128K context + Vision แนะนำสำหรับ AI Secretary
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleSave}
        className={`neo-btn w-full flex items-center justify-center gap-2 py-3 text-base font-bold ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white'
        }`}
      >
        {saved ? (
          <>
            <Check className="w-5 h-5" />
            Settings Saved!
          </>
        ) : (
          'Save Settings'
        )}
      </motion.button>
    </div>
  );
}
