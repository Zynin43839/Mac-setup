import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, FileCode, FolderTree, Terminal } from 'lucide-react';
import { architectureCode } from '../data/analysis';

const tabs = [
  { id: 'structure', label: 'Structure', icon: FolderTree },
  { id: 'providers', label: 'STT Providers', icon: FileCode },
  { id: 'setup', label: 'setup.bat', icon: Terminal },
  { id: 'backend', label: 'Express API', icon: FileCode },
];

export default function CodeViewer() {
  const [activeTab, setActiveTab] = useState('structure');
  const [copied, setCopied] = useState(false);

  const codeMap: Record<string, string> = {
    structure: architectureCode.projectStructure,
    providers: architectureCode.multiProviderBackend,
    setup: architectureCode.setupBat,
    backend: architectureCode.backendApi,
  };

  const code = codeMap[activeTab] || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">🏗️ Architecture & Code</h2>
        <p className="text-slate-400 text-sm">
          โครงสร้างโปรเจค, setup script, และ core backend API — พร้อมใช้งาน
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 neo-card-sm p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Code Block */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleCopy}
            className="neo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <pre className="neo-card p-5 overflow-x-auto text-sm leading-relaxed">
          <code className="text-slate-300 font-mono whitespace-pre">{code}</code>
        </pre>
      </motion.div>

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        {[
          { emoji: '🔐', title: 'Security', desc: 'เก็บ API key ใน .env file, อย่า hardcode' },
          { emoji: '📦', title: 'Portability', desc: 'Copy folder ทั้งหมด + run setup.bat บนเครื่องใหม่' },
          { emoji: '🔄', title: 'Hybrid STT', desc: 'Set OPENAI_API_KEY ใน .env เพื่อใช้ cloud, ไม่ set = ใช้ local' },
        ].map(tip => (
          <div key={tip.title} className="neo-card-sm p-3.5">
            <div className="text-lg mb-1">{tip.emoji}</div>
            <div className="text-white font-black text-sm">{tip.title}</div>
            <div className="text-slate-400 text-xs mt-1">{tip.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
