import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Upload, FolderOpen, Code2, Menu, X, AudioWaveform, Settings, Bot, BarChart3, BookOpen, Sparkles } from 'lucide-react';
import HomePage from './components/HomePage';
import FileUploader from './components/FileUploader';
import MeetingHistory from './components/MeetingHistory';
import SettingsPanel from './components/SettingsPanel';
import STTExplainer from './components/STTExplainer';
import CodeViewer from './components/CodeViewer';
import AnalysisPanel from './components/AnalysisPanel';
import AIAssistant from './components/AIAssistant';
import UserGuide from './components/UserGuide';
import { Meeting } from './types';
import { loadMeetings } from './store';

type TabId = 'home' | 'upload' | 'history' | 'assistant' | 'settings' | 'guide' | 'stt' | 'analysis' | 'code';

const tabs = [
  { id: 'home' as TabId, label: 'Home', icon: Home, shortLabel: 'Home', color: 'border-l-pink-400' },
  { id: 'upload' as TabId, label: 'Upload Audio', icon: Upload, shortLabel: 'Upload', color: 'border-l-pink-400' },
  { id: 'history' as TabId, label: 'Meeting History', icon: FolderOpen, shortLabel: 'History', color: 'border-l-violet-400' },
  { id: 'assistant' as TabId, label: 'AI Assistant', icon: Bot, shortLabel: 'AI', color: 'border-l-cyan-400' },
  { id: 'settings' as TabId, label: 'STT Settings', icon: Settings, shortLabel: 'Settings', color: 'border-l-yellow-400' },
  { id: 'guide' as TabId, label: 'User Guide', icon: BookOpen, shortLabel: 'Guide', color: 'border-l-emerald-400' },
  { id: 'stt' as TabId, label: 'How STT Works', icon: AudioWaveform, shortLabel: 'STT Info', color: 'border-l-orange-400' },
  { id: 'analysis' as TabId, label: 'Tech Analysis', icon: BarChart3, shortLabel: 'Analysis', color: 'border-l-rose-400' },
  { id: 'code' as TabId, label: 'Architecture', icon: Code2, shortLabel: 'Code', color: 'border-l-sky-400' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadMeetings().then(setMeetings);
  }, []);

  const meetingCount = meetings.length;

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-72 border-r-2 border-[#3d3d5c] bg-[#1e1e38]/80 shrink-0">
          <div className="p-5 border-b-2 border-[#3d3d5c]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl shadow-[3px_3px_0_0_rgba(0,0,0,0.3)] border-2 border-[#3d3d5c]">
                🐱
              </div>
              <div>
                <h1 className="text-white font-black text-base leading-tight tracking-tight">Cat Meeting</h1>
                <p className="text-amber-300 text-xs font-semibold">เหมียว ๆ ถอดเทปให้เอง</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="mb-2">
              <p className="text-amber-400/60 text-[10px] font-black uppercase tracking-widest px-3 mb-2">Main</p>
              {tabs.slice(0, 5).map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                      isActive
                        ? 'bg-[#2a2a4a] border-amber-400/60 text-amber-200 shadow-[3px_3px_0_0_rgba(251,191,36,0.25)]'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-[#2a2a4a]/60 hover:border-[#3d3d5c]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-400' : ''}`} />
                    <span>{tab.label}</span>
                    {tab.id === 'history' && meetingCount > 0 && (
                      <span className="ml-auto bg-amber-500/20 text-amber-300 text-xs font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                        {meetingCount}
                      </span>
                    )}
                    {tab.id === 'assistant' && (
                      <span className="ml-auto bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-cyan-500/30">
                        Claude
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t-2 border-[#3d3d5c]">
              <p className="text-cyan-400/60 text-[10px] font-black uppercase tracking-widest px-3 mb-2 mt-2">Docs</p>
              {tabs.slice(5).map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                      isActive
                        ? 'bg-[#2a2a4a] border-cyan-400/60 text-cyan-200 shadow-[3px_3px_0_0_rgba(34,211,238,0.25)]'
                        : 'border-transparent text-slate-500 hover:text-white hover:bg-[#2a2a4a]/60 hover:border-[#3d3d5c]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="p-4 border-t-2 border-[#3d3d5c]">
            <div className="neo-card-sm p-3">
              <p className="text-slate-300 text-xs leading-relaxed font-medium">
                <Sparkles className="w-3 h-3 inline text-amber-400 mr-1" />
                <strong className="text-amber-300">AI Assistant:</strong> ใช้ Claude วิเคราะห์ meeting
                <br />
                <span className="text-slate-500 text-[10px]">ใส่ API key ใน AI tab</span>
              </p>
            </div>
          </div>
        </aside>

        {/* ── Mobile Header ── */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b-2 border-[#3d3d5c] bg-[#1e1e38]/90 sticky top-0 z-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm border-2 border-[#3d3d5c] shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]">
              🐱
            </div>
            <span className="text-white font-black text-sm tracking-tight">Cat Meeting</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white neo-btn bg-[#25253e]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-[#1a1a2e]/90 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.nav
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-72 h-full bg-[#1e1e38] p-4 space-y-1 border-r-2 border-[#3d3d5c] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="pb-4 mb-4 border-b-2 border-[#3d3d5c]">
                  <h2 className="text-white font-black tracking-tight">Navigation</h2>
                </div>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                        activeTab === tab.id
                          ? 'bg-[#2a2a4a] border-amber-400/60 text-amber-200'
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-[#2a2a4a]/60'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#1e1e38]/95 border-t-2 border-[#3d3d5c] px-1 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around">
            {tabs.slice(1, 5).map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-0.5 py-2 px-2 text-[10px] font-bold transition-colors relative ${
                    isActive ? 'text-amber-300' : 'text-slate-500'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -top-px left-2 right-2 h-0.5 bg-amber-500 rounded-full"
                    />
                  )}
                  <Icon className="w-5 h-5" />
                  <span>{tab.shortLabel}</span>
                  {tab.id === 'history' && meetingCount > 0 && (
                    <span className="absolute -top-0.5 right-0 bg-amber-500 text-white text-[9px] w-4 h-4 rounded-md flex items-center justify-center font-bold border border-[#3d3d5c]">
                      {meetingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className={`mx-auto p-4 sm:p-6 lg:p-8 ${activeTab === 'assistant' ? 'max-w-4xl h-full' : 'max-w-4xl'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className={activeTab === 'assistant' ? 'h-full' : ''}
              >
                {activeTab === 'home' && (
                  <HomePage onGetStarted={() => setActiveTab('upload')} />
                )}
                {activeTab === 'upload' && (
                  <FileUploader onMeetingCreated={setMeetings} />
                )}
                {activeTab === 'history' && (
                  <MeetingHistory meetings={meetings} onUpdate={setMeetings} />
                )}
                {activeTab === 'assistant' && <AIAssistant />}
                {activeTab === 'settings' && <SettingsPanel />}
                {activeTab === 'guide' && <UserGuide />}
                {activeTab === 'stt' && <STTExplainer />}
                {activeTab === 'analysis' && <AnalysisPanel />}
                {activeTab === 'code' && <CodeViewer />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
