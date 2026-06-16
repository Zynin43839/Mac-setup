import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Upload, FolderOpen, GitBranch, Target, Newspaper,
  Bot, Settings, Menu, X, Sparkles, Bug
} from 'lucide-react';
import FileUploader from './components/FileUploader';
import MeetingHistory from './components/MeetingHistory';
import SettingsPanel from './components/SettingsPanel';
import AIAssistant from './components/AIAssistant';
import Dashboard from './modules/Dashboard';
import Projects from './modules/Projects';
import Roadmap from './modules/Roadmap';
import Briefing from './modules/Briefing';
import JiraDashboard from './modules/JiraDashboard';
import { Meeting, WorkingTab } from './types';
import { loadMeetings } from './store';

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { id: 'dashboard' as WorkingTab, label: 'Dashboard', icon: LayoutDashboard, color: 'border-l-amber-400' },
      { id: 'upload' as WorkingTab, label: 'Upload Audio', icon: Upload, color: 'border-l-pink-400' },
      { id: 'history' as WorkingTab, label: 'Meetings', icon: FolderOpen, color: 'border-l-violet-400' },
    ],
  },
  {
    label: 'Planning',
    items: [
      { id: 'projects' as WorkingTab, label: 'Projects', icon: GitBranch, color: 'border-l-emerald-400' },
      { id: 'roadmap' as WorkingTab, label: 'Roadmap', icon: Target, color: 'border-l-orange-400' },
      { id: 'briefing' as WorkingTab, label: 'Briefing', icon: Newspaper, color: 'border-l-cyan-400' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'assistant' as WorkingTab, label: 'AI Assistant', icon: Bot, color: 'border-l-cyan-400' },
      { id: 'jira' as WorkingTab, label: 'Jira', icon: Bug, color: 'border-l-blue-400' },
      { id: 'settings' as WorkingTab, label: 'Settings', icon: Settings, color: 'border-l-yellow-400' },
    ],
  },
];

const allTabs = navGroups.flatMap(g => g.items);

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkingTab>('dashboard');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadMeetings().then(setMeetings);
  }, []);

  const meetingCount = meetings.length;

  function handleNavigate(tab: string) {
    setActiveTab(tab as WorkingTab);
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-64 border-r-2 border-[#3d3d5c] bg-[#1e1e38]/80 shrink-0">
          {/* Brand */}
          <div className="p-4 border-b-2 border-[#3d3d5c]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-lg shadow-[3px_3px_0_0_rgba(0,0,0,0.3)] border-2 border-[#3d3d5c]">
                🐱
              </div>
              <div>
                <h1 className="text-white font-black text-sm leading-tight tracking-tight">Cat Meeting</h1>
                <p className="text-amber-300 text-[10px] font-semibold">Working Station</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
            {navGroups.map(group => (
              <div key={group.label}>
                <p className="text-amber-400/50 text-[9px] font-black uppercase tracking-widest px-3 mb-1.5">{group.label}</p>
                {group.items.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all border-l-4 ${
                        isActive
                          ? 'bg-[#2a2a4a] text-amber-200 border-l-amber-400 shadow-[2px_2px_0_0_rgba(251,191,36,0.2)]'
                          : 'border-l-transparent text-slate-400 hover:text-white hover:bg-[#2a2a4a]/50'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-amber-400' : ''}`} />
                      <span>{tab.label}</span>
                      {tab.id === 'history' && meetingCount > 0 && (
                        <span className="ml-auto bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-amber-500/30">
                          {meetingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t-2 border-[#3d3d5c]">
            <div className="p-2.5 rounded-lg bg-[#25253e]/50 border border-[#3d3d5c]/50">
              <p className="text-slate-400 text-[10px] leading-relaxed font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Local AI · Whisper STT · MCP Ready</span>
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
                className="w-64 h-full bg-[#1e1e38] p-4 space-y-4 border-r-2 border-[#3d3d5c] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="pb-3 mb-3 border-b-2 border-[#3d3d5c]">
                  <h2 className="text-white font-black tracking-tight text-sm">Navigation</h2>
                </div>
                {navGroups.map(group => (
                  <div key={group.label}>
                    <p className="text-amber-400/50 text-[9px] font-black uppercase tracking-widest mb-1">{group.label}</p>
                    {group.items.map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all border-l-4 ${
                            activeTab === tab.id
                              ? 'bg-[#2a2a4a] text-amber-200 border-l-amber-400'
                              : 'border-l-transparent text-slate-400 hover:text-white hover:bg-[#2a2a4a]/50'
                          }`}
                        >
                          <Icon className="w-4.5 h-4.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#1e1e38]/95 border-t-2 border-[#3d3d5c] px-1 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around">
            {allTabs.slice(0, 5).map(tab => {
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
                  <span className="text-[9px]">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
                {activeTab === 'upload' && <FileUploader onMeetingCreated={setMeetings} />}
                {activeTab === 'history' && <MeetingHistory meetings={meetings} onUpdate={setMeetings} />}
                {activeTab === 'projects' && <Projects />}
                {activeTab === 'roadmap' && <Roadmap />}
                {activeTab === 'briefing' && <Briefing />}
                {activeTab === 'jira' && <JiraDashboard />}
                {activeTab === 'assistant' && <AIAssistant />}
                {activeTab === 'settings' && <SettingsPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
