import { useState, useEffect } from 'react';
import {
  BarChart3, FolderOpen, Target, Newspaper, ArrowUpRight, Clock,
  Sparkles, ChevronRight, Activity, GitBranch, Upload, Bug,
  CheckCircle2, Circle, AlertCircle
} from 'lucide-react';
import { loadMeetings } from '../store';
import { loadProjects, loadRoadmapItems, loadBriefings } from '../store';
import { Meeting, Project, RoadmapItem, BriefingItem } from '../types';

interface StatCard {
  label: string;
  value: number | string;
  icon: typeof BarChart3;
  color: string;
  sub: string;
}

export default function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [briefings, setBriefings] = useState<BriefingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      loadMeetings().then(setMeetings),
      loadProjects().then(setProjects).catch(() => {}),
      loadRoadmapItems().then(setRoadmap).catch(() => {}),
      loadBriefings().then(setBriefings).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const stats: StatCard[] = [
    { label: 'All Meetings', value: meetings.length, icon: FolderOpen, color: 'from-violet-500 to-purple-500', sub: `${meetings.filter(m => m.status === 'completed').length} completed` },
    { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, icon: GitBranch, color: 'from-emerald-500 to-teal-500', sub: `${projects.length} total` },
    { label: 'Roadmap Items', value: roadmap.filter(r => r.status !== 'cancelled').length, icon: Target, color: 'from-amber-500 to-orange-500', sub: `${roadmap.filter(r => r.status === 'in-progress').length} in progress` },
    { label: 'Briefings', value: briefings.length, icon: Newspaper, color: 'from-cyan-500 to-blue-500', sub: 'Latest: ' + (briefings[0]?.date.slice(0, 10) || 'N/A') },
  ];

  const recentMeetings = meetings.slice(0, 3);
  const activeProjects = projects.filter(p => p.status === 'active').slice(0, 4);
  const latestBriefings = briefings.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-amber-400" />
          Working Station
        </h1>
        <p className="text-slate-400 text-sm mt-1 font-medium">
          Overview · {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="neo-card p-4 relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.color}`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{s.label}</p>
                  <p className="text-3xl font-black text-white mt-1">{s.value}</p>
                  <p className="text-slate-500 text-xs mt-1">{s.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center border-2 border-[#3d3d5c]`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && <p className="text-slate-500 text-center py-8">Loading...</p>}

      {/* Jira Stats Widget */}
      <div className="neo-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Bug className="w-4 h-4 text-blue-400" /> Jira Overview
          </h2>
          <button onClick={() => onNavigate('jira')} className="text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1">
            Open Jira <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <JiraMiniStat label="Total Issues" value="60" icon={BarChart3} color="from-blue-500 to-blue-600" />
          <JiraMiniStat label="In Progress" value="18" icon={AlertCircle} color="from-amber-500 to-orange-500" />
          <JiraMiniStat label="Done This Sprint" value="12" icon={CheckCircle2} color="from-emerald-500 to-teal-500" />
          <JiraMiniStat label="Open Bugs" value="5" icon={Circle} color="from-red-500 to-rose-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Meetings */}
        <div className="neo-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" /> Recent Meetings
            </h2>
            <button onClick={() => onNavigate('history')} className="text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {recentMeetings.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">No meetings yet</p>
          ) : (
            <div className="space-y-2">
              {recentMeetings.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#25253e]/60 border border-[#3d3d5c]/50">
                  <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{m.title || 'Untitled Meeting'}</p>
                    <p className="text-[10px] text-slate-500">{m.date?.slice(0, 10)} · {m.department}</p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Projects */}
        <div className="neo-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Active Projects
            </h2>
            <button onClick={() => onNavigate('projects')} className="text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {activeProjects.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">No active projects</p>
          ) : (
            <div className="space-y-2">
              {activeProjects.map(p => (
                <div key={p.id} className="p-2 rounded-lg bg-[#25253e]/60 border border-[#3d3d5c]/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-white truncate">{p.name}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {p.progress}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Briefings */}
        <div className="neo-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-cyan-400" /> Latest Briefings
            </h2>
            <button onClick={() => onNavigate('briefing')} className="text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {latestBriefings.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">No briefings yet</p>
          ) : (
            <div className="space-y-2">
              {latestBriefings.map(b => (
                <div key={b.id} className="p-2 rounded-lg bg-[#25253e]/60 border border-[#3d3d5c]/50">
                  <p className="text-sm font-bold text-white truncate">{b.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                    <span className="uppercase">{b.category}</span>
                    <span>·</span>
                    <span>{b.source}</span>
                    <span>·</span>
                    <span>{b.date?.slice(0, 10)}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={() => onNavigate('upload')} className="neo-card-sm p-3 text-left hover:border-amber-400/40 transition-colors">
          <Upload className="w-5 h-5 text-amber-400 mb-1" />
          <p className="text-xs font-bold">Upload Audio</p>
          <p className="text-[10px] text-slate-500">Transcribe meeting</p>
        </button>
        <button onClick={() => onNavigate('projects')} className="neo-card-sm p-3 text-left hover:border-emerald-400/40 transition-colors">
          <GitBranch className="w-5 h-5 text-emerald-400 mb-1" />
          <p className="text-xs font-bold">New Project</p>
          <p className="text-[10px] text-slate-500">Track progress</p>
        </button>
        <button onClick={() => onNavigate('roadmap')} className="neo-card-sm p-3 text-left hover:border-amber-400/40 transition-colors">
          <Target className="w-5 h-5 text-orange-400 mb-1" />
          <p className="text-xs font-bold">View Roadmap</p>
          <p className="text-[10px] text-slate-500">Quarterly plan</p>
        </button>
        <button onClick={() => onNavigate('briefing')} className="neo-card-sm p-3 text-left hover:border-cyan-400/40 transition-colors">
          <Newspaper className="w-5 h-5 text-cyan-400 mb-1" />
          <p className="text-xs font-bold">Add Briefing</p>
          <p className="text-[10px] text-slate-500">News digest</p>
        </button>
      </div>
    </div>
  );
}

function JiraMiniStat({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="neo-card-sm p-3 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${color}`} />
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0 text-slate-300" />
        <span className="text-xs font-bold text-slate-400">{label}</span>
      </div>
      <p className="text-xl font-black text-white mt-1">{value}</p>
    </div>
  );
}


