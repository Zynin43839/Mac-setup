import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Clock, Calendar, Building2, ChevronDown, FileText, Sparkles, ListChecks, Search, Target, AlertCircle, FolderOpen } from 'lucide-react';
import { Meeting, Department } from '../types';
import { deleteMeeting } from '../store';

interface Props {
  meetings: Meeting[];
  onUpdate: (meetings: Meeting[]) => void;
}

const departments: (Department)[] = ['All', 'Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];

const deptColors: Record<string, string> = {
  Engineering: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
  Marketing: 'bg-pink-500/20 text-pink-300 border-pink-400/40',
  Sales: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  HR: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
  Finance: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  Operations: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
};

const sectionConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  '📌': { icon: FileText, color: 'text-sky-300', bg: 'bg-sky-500/5', border: 'border-sky-400/20' },
  '📊': { icon: Target, color: 'text-amber-300', bg: 'bg-amber-500/5', border: 'border-amber-400/20' },
  '✅': { icon: ListChecks, color: 'text-emerald-300', bg: 'bg-emerald-500/5', border: 'border-emerald-400/20' },
  '💡': { icon: AlertCircle, color: 'text-yellow-300', bg: 'bg-yellow-500/5', border: 'border-yellow-400/20' },
};

function SummaryRenderer({ text }: { text: string }) {
  const sections = useMemo(() => {
    const lines = text.split('\n');
    const result: { title: string; bullets: string[]; emoji: string }[] = [];
    let current: { title: string; bullets: string[]; emoji: string } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      const emoji = Object.keys(sectionConfig).find(e => trimmed.startsWith(e));
      if (emoji) {
        if (current) result.push(current);
        current = { title: trimmed.replace(emoji, '').trim(), bullets: [], emoji };
        continue;
      }
      if (trimmed.startsWith('•') && current) {
        current.bullets.push(trimmed.slice(1).trim());
        continue;
      }
    }
    if (current) result.push(current);
    return result;
  }, [text]);

  if (sections.length === 0) {
    return <p className="text-slate-300 text-sm leading-relaxed font-medium">{text}</p>;
  }

  return (
    <div className="space-y-3">
      {sections.map((section, i) => {
        const cfg = sectionConfig[section.emoji];
        const Icon = cfg?.icon || Sparkles;
        return (
          <div key={i} className={`${cfg?.bg || 'bg-[#1e1e36]'} border-2 ${cfg?.border || 'border-[#3d3d5c]'} rounded-xl p-3`}>
            <h5 className={`${cfg?.color || 'text-slate-300'} text-xs font-black mb-2 flex items-center gap-1.5`}>
              {section.emoji} {section.title}
            </h5>
            {section.bullets.length > 0 ? (
              <ul className="space-y-1">
                {section.bullets.map((bullet, j) => (
                  <li key={j} className="text-slate-300 text-sm flex items-start gap-2 font-medium">
                    <span className="text-slate-500 mt-1 shrink-0">•</span>
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm italic font-medium">No items</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MeetingHistory({ meetings, onUpdate }: Props) {
  const [filter, setFilter] = useState<Department>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = meetings.filter(m => {
    const depts = m.departments?.length ? m.departments : (m.department ? [m.department] : []);
    const matchesDept = filter === 'All' || depts.includes(filter);
    const matchesSearch = !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.transcript.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`ต้องการลบ "${title}" หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }
    const updated = await deleteMeeting(id);
    onUpdate(updated);
    if (expandedId === id) setExpandedId(null);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const formatDuration = (s: number) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
          <FolderOpen className="w-6 h-6 inline text-violet-400 mr-2" />
          Meeting History
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} recorded
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings..."
            className="neo-input w-full pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-600"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {departments.map(d => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`neo-btn text-xs font-bold px-3 py-2 ${
                filter === d
                  ? 'bg-pink-500 text-white'
                  : 'bg-[#25253e] text-slate-400 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="text-slate-500 text-xs font-bold">
        {filtered.length} meeting{filtered.length !== 1 ? 's' : ''} found
      </div>

      {filtered.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-300 font-bold">No meetings found.</p>
          <p className="text-slate-500 text-sm mt-1 font-medium">Record a meeting to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((meeting, i) => (
              <motion.div
                key={meeting.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: i * 0.05 }}
                className="neo-card overflow-hidden"
              >
                <div className="flex items-center justify-between p-4">
                  <button
                    onClick={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <motion.div
                      animate={{ rotate: expandedId === meeting.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </motion.div>
                    <div className="min-w-0">
                      <div className="text-white font-bold text-sm truncate">{meeting.title}</div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(meeting.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(meeting.duration)}
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {(meeting.departments?.length ? meeting.departments : [meeting.department]).map(d => (
                      <span key={d} className={`neo-badge ${deptColors[d] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                        {d}
                      </span>
                    ))}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(meeting.id, meeting.title); }}
                      className="p-1.5 rounded-md text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      title="Delete meeting"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === meeting.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3 border-t-2 border-[#3d3d5c] pt-3">
                        <div className="neo-card-sm p-4">
                          <h4 className="text-pink-300 text-xs font-black mb-2 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Transcript
                          </h4>
                          <p className="text-slate-300 text-sm leading-relaxed max-h-40 overflow-y-auto font-medium">
                            {meeting.transcript}
                          </p>
                        </div>

                        <div className="rounded-lg overflow-hidden">
                          <h4 className="text-emerald-300 text-xs font-black mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Summary / Report
                          </h4>
                          <SummaryRenderer text={meeting.summary} />
                        </div>

                        {meeting.actionItems.length > 0 && (
                          <div className="neo-card-sm p-4 border-l-[3px] border-l-amber-400">
                            <h4 className="text-amber-300 text-xs font-black mb-2 flex items-center gap-1.5">
                              <ListChecks className="w-3.5 h-3.5" /> Action Items
                            </h4>
                            <ul className="space-y-1.5">
                              {meeting.actionItems.map((item, j) => (
                                <li key={j} className="text-slate-300 text-sm flex items-start gap-2 font-medium">
                                  <span className="text-amber-400 mt-0.5 shrink-0">▸</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
