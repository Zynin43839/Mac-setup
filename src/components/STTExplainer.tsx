import { motion } from 'framer-motion';
import { Zap, Cloud, HardDrive, CheckCircle2, XCircle, ArrowRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { sttExplanation } from '../data/analysis';
import { envExampleContent, envLocalContent } from '../data/envExample';

const methodIcons: Record<string, React.ElementType> = {
  'File Upload (Audio-to-Text)': Cloud,
  'OpenAI Whisper API (Production - Cloud)': Cloud,
  'Local Whisper (Production - Offline)': HardDrive,
  'Streaming Whisper (Advanced)': Zap,
};

const realtimeBadge = (rt: boolean | string) => {
  if (rt === true) return { text: 'Realtime', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  if (rt === 'partial') return { text: 'Partial Realtime', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
  return { text: 'Batch (Not Realtime)', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
};

export default function STTExplainer() {
  const [copiedEnv, setCopiedEnv] = useState<string | null>(null);

  const copyEnv = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setCopiedEnv(type);
    setTimeout(() => setCopiedEnv(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">🎤 {sttExplanation.title}</h2>
        <p className="text-slate-400 text-sm">
          เปรียบเทียบ 4 วิธีการทำ Voice-to-Text พร้อมอธิบาย flow การทำงาน
        </p>
      </div>

      {/* Quick Answer */}
      <div className="neo-card-sm bg-indigo-500/10 p-5">
        <h3 className="text-indigo-300 font-bold mb-2">❓ Realtime ได้ไหม?</h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          <strong className="text-white">ตอบ:</strong> ได้ทั้ง Realtime และ Batch ขึ้นอยู่กับวิธีที่เลือก
        </p>
        <ul className="mt-2 text-sm text-slate-400 space-y-1">
          <li>• <strong className="text-emerald-400">Realtime:</strong> Web Speech API (demo), Streaming Whisper</li>
          <li>• <strong className="text-amber-400">Batch:</strong> Whisper API, Local Whisper (record ก่อน แล้วค่อย transcribe)</li>
        </ul>
      </div>

      {/* Methods Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sttExplanation.methods.map((method, i) => {
          const Icon = methodIcons[method.name] || Radio;
          const badge = realtimeBadge(method.realtime);

          return (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="neo-card overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-700/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-sm">{method.name}</h3>
                      <p className="text-slate-500 text-xs mt-0.5">{method.description}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-md text-xs font-medium border ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>
              </div>

              {/* Flow */}
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Flow</h4>
                  <div className="space-y-2">
                    {method.flow.map((step, j) => (
                      <div key={j} className="flex items-start gap-2 text-sm">
                        <span className="text-indigo-400 font-mono text-xs mt-0.5 shrink-0">{j + 1}.</span>
                        <span className="text-slate-300">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pros/Cons */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-emerald-400 text-xs font-black mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Pros
                    </h4>
                    <ul className="space-y-1">
                      {method.pros.map((p, j) => (
                        <li key={j} className="text-slate-400 text-xs flex items-start gap-1">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-red-400 text-xs font-black mb-1.5 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Cons
                    </h4>
                    <ul className="space-y-1">
                      {method.cons.map((c, j) => (
                        <li key={j} className="text-slate-400 text-xs flex items-start gap-1">
                          <span className="text-red-500 mt-0.5">•</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Current Demo Flow */}
      <div className="neo-card p-5">
        <h3 className="text-white font-black mb-4 flex items-center gap-2">
          <Radio className="w-5 h-5 text-indigo-400" />
          Prototype นี้ทำงานยังไง? (Web Speech API)
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { text: 'Click Record', icon: '🎙️' },
            { text: 'Browser requests mic', icon: '🔐' },
            { text: 'Audio streams to Google', icon: '📡' },
            { text: 'Text returns realtime', icon: '⚡' },
            { text: 'Display immediately', icon: '📝' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="w-4 h-4 text-slate-600" />}
              <span className="bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 flex items-center gap-1.5">
                <span>{step.icon}</span> {step.text}
              </span>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-3">
          ⏱️ Latency: ~200-500ms | 🌐 Requires: Chrome + Internet | 🎯 Accuracy: ~85-90%
        </p>
      </div>

      {/* .env Example */}
      <div className="space-y-4">
        <h3 className="text-white font-black flex items-center gap-2">
          📄 Environment Variables (.env)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Full .env */}
          <div className="neo-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 neo-card-sm border-b-0">
              <span className="text-slate-400 text-xs font-medium">.env.example (Full)</span>
              <button
                onClick={() => copyEnv(envExampleContent, 'full')}
                className="neo-btn flex items-center gap-1 px-2 py-1 text-xs"
              >
                {copiedEnv === 'full' ? (
                  <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy</>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs text-slate-400 overflow-x-auto max-h-64 overflow-y-auto">
              <code>{envExampleContent}</code>
            </pre>
          </div>

          {/* Local-only .env */}
          <div className="neo-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 neo-card-sm border-b-0">
              <span className="text-slate-400 text-xs font-medium">.env.local (Offline Mode)</span>
              <button
                onClick={() => copyEnv(envLocalContent, 'local')}
                className="neo-btn flex items-center gap-1 px-2 py-1 text-xs"
              >
                {copiedEnv === 'local' ? (
                  <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy</>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs text-slate-400 overflow-x-auto">
              <code>{envLocalContent}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="neo-card bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-6"
      >
        <h3 className="text-white font-black text-lg mb-3">🎯 สรุปแนะนำสำหรับ Production</h3>
        <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
          {sttExplanation.recommendation}
        </div>
      </motion.div>
    </div>
  );
}
