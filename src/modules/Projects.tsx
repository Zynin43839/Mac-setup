import { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, Bug, RefreshCw } from 'lucide-react';
import { loadProjects, createProjectAPI, updateProjectAPI, deleteProjectAPI, getJiraConfig } from '../store';
import { Project, ProjectStatus } from '../types';

const statusColors: Record<ProjectStatus, string> = {
  planning: 'from-slate-500 to-slate-600',
  active: 'from-emerald-500 to-teal-500',
  paused: 'from-amber-500 to-yellow-500',
  completed: 'from-blue-500 to-cyan-500',
  cancelled: 'from-red-500 to-rose-500',
};
const statusLabels: Record<ProjectStatus, string> = {
  planning: 'Planning', active: 'Active', paused: 'Paused', completed: 'Completed', cancelled: 'Cancelled',
};
const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'];

const JIRA_PROJECTS_MOCK = [
  { key: 'LMS', name: 'Learning Management System', lead: 'Somchai W.', category: 'Product', totalIssues: 45, openIssues: 18, doneIssues: 27, version: 'v1.0' },
  { key: 'PORTAL', name: 'Employee Portal', lead: 'Ananya K.', category: 'Platform', totalIssues: 32, openIssues: 8, doneIssues: 24, version: 'v2.1' },
  { key: 'MOBILE', name: 'Mobile App', lead: 'Phattara J.', category: 'Product', totalIssues: 28, openIssues: 14, doneIssues: 14, version: 'v1.0' },
  { key: 'INFRA', name: 'Infrastructure', lead: 'Kittipong C.', category: 'Engineering', totalIssues: 18, openIssues: 3, doneIssues: 15, version: 'Sprint 4' },
];

export default function Projects() {
  const cfg = getJiraConfig();
  const isJiraConnected = !!(cfg.url && cfg.email && cfg.token);
  const [mode, setMode] = useState<'local' | 'jira'>(isJiraConnected ? 'jira' : 'local');

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  useEffect(() => {
    if (mode === 'local') {
      loadProjects().then(setProjects).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [mode]);

  const filtered = projects
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  async function handleSave(data: Partial<Project>) {
    if (editing) { setProjects(await updateProjectAPI(editing.id, data)); }
    else { setProjects(await createProjectAPI(data)); }
    setShowForm(false); setEditing(null);
  }
  async function handleDelete(id: string) { setProjects(await deleteProjectAPI(id)); }

  if (mode === 'jira') {
    const jiraProjects = JIRA_PROJECTS_MOCK;
    const filteredJira = jiraProjects.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) || p.key.toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="space-y-6">
        {/* Header + Mode Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Bug className="w-7 h-7 text-amber-400" /> Projects
            </h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Connected to Jira · {jiraProjects.length} projects
            </p>
          </div>
          <button onClick={() => setMode('local')}
            className="neo-btn-sm bg-[#25253e] text-slate-300 border-2 border-[#3d3d5c] font-bold flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Switch to Local
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#25253e] border-2 border-[#3d3d5c] text-sm text-white placeholder-slate-500 focus:border-amber-400/40 focus:outline-none" />
        </div>

        {/* Jira Project Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredJira.map(p => {
            const progress = p.totalIssues > 0 ? Math.round((p.doneIssues / p.totalIssues) * 100) : 0;
            return (
              <div key={p.key} className="neo-card p-4 hover:border-emerald-400/30 transition-all border-l-[3px] border-l-emerald-400">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      <span className="text-amber-400">{p.key}</span> — {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{p.lead} · {p.category}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {p.version}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 my-3">
                  <div className="text-center p-2 rounded-lg bg-[#25253e]/60">
                    <p className="text-lg font-black text-white">{p.totalIssues}</p>
                    <p className="text-[10px] text-slate-500">Total</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[#25253e]/60">
                    <p className="text-lg font-black text-amber-300">{p.openIssues}</p>
                    <p className="text-[10px] text-slate-500">Open</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[#25253e]/60">
                    <p className="text-lg font-black text-emerald-300">{p.doneIssues}</p>
                    <p className="text-[10px] text-slate-500">Done</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-400">{progress}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">{projects.length} projects · {projects.filter(p => p.status === 'active').length} active</p>
        </div>
        <div className="flex items-center gap-2">
          {isJiraConnected && (
            <button onClick={() => setMode('jira')}
              className="neo-btn-sm bg-emerald-600 text-white font-bold flex items-center gap-1.5">
              <Bug className="w-4 h-4" /> Jira View
            </button>
          )}
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="neo-btn-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      {!isJiraConnected && (
        <div className="neo-card-sm p-3 bg-amber-500/10 border-amber-400/30 border-l-[3px] border-l-amber-400 flex items-center gap-2 text-xs text-amber-200">
          <Bug className="w-4 h-4 shrink-0" />
          <span><strong>Connect Jira</strong> in Settings to see Jira projects here</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#25253e] border-2 border-[#3d3d5c] text-sm text-white placeholder-slate-500 focus:border-amber-400/40 focus:outline-none" />
        </div>
        {(['all', 'planning', 'active', 'paused', 'completed', 'cancelled'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all ${filter === s ? 'border-amber-400/60 bg-[#2a2a4a] text-amber-200' : 'border-[#3d3d5c] text-slate-400 hover:text-white'}`}>
            {s === 'all' ? 'All' : statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500 text-center py-12">Loading projects...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 neo-card">
          <p className="text-slate-500 text-lg font-bold">No projects found</p>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-3 text-amber-400 text-sm font-bold hover:text-amber-300">Create your first project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="neo-card p-4 hover:border-amber-400/30 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-3 h-3 mt-1 rounded-full bg-gradient-to-br ${statusColors[p.status]} shrink-0 border border-[#3d3d5c]`} />
                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{p.department} · {p.lead || 'Unassigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${p.priority === 'critical' ? 'bg-red-500/20 text-red-300 border-red-500/30' : p.priority === 'high' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : p.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>{p.priority}</span>
                  <button onClick={() => { setEditing(p); setShowForm(true); }} className="p-1 text-slate-500 hover:text-amber-400"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {p.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{p.description}</p>}
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-bold text-white">{p.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg bg-gradient-to-r ${statusColors[p.status]} text-white`}>{statusLabels[p.status]}</span>
              </div>
              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.tags.map((t, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#25253e] text-slate-400 border border-[#3d3d5c]">{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && <ProjectForm project={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}

function ProjectForm({ project, onSave, onCancel }: { project: Project | null; onSave: (d: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [department, setDepartment] = useState(project?.department || 'Engineering');
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'planning');
  const [priority, setPriority] = useState(project?.priority || 'medium');
  const [progress, setProgress] = useState(project?.progress || 0);
  const [lead, setLead] = useState(project?.lead || '');
  const [startDate, setStartDate] = useState(project?.startDate || '');
  const [targetDate, setTargetDate] = useState(project?.targetDate || '');
  const [tagsStr, setTagsStr] = useState((project?.tags || []).join(', '));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ name, description, department, status, priority, progress, lead, startDate, targetDate, tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="neo-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-4">{project ? 'Edit Project' : 'New Project'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Name" value={name} onChange={setName} required />
          <div><label className="text-xs font-bold text-slate-400 mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl bg-[#25253e] border-2 border-[#3d3d5c] text-sm text-white placeholder-slate-500 focus:border-amber-400/40 focus:outline-none resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Department" value={department} onChange={setDepartment} options={departments} />
            <Select label="Priority" value={priority} onChange={setPriority} options={['low', 'medium', 'high', 'critical']} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" value={status} onChange={setStatus} options={['planning', 'active', 'paused', 'completed', 'cancelled']} />
            <Input label="Progress (0-100)" type="number" value={String(progress)} onChange={(v: string) => setProgress(Number(v))} min={0} max={100} />
          </div>
          <Input label="Lead" value={lead} onChange={setLead} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" value={startDate} onChange={setStartDate} />
            <Input label="Target Date" type="date" value={targetDate} onChange={setTargetDate} />
          </div>
          <Input label="Tags (comma-separated)" value={tagsStr} onChange={setTagsStr} />
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 neo-btn-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold">{project ? 'Update' : 'Create'}</button>
            <button type="button" onClick={onCancel} className="flex-1 neo-btn-sm text-slate-400">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, ...props }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-400 mb-1 block">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} {...props}
        className="w-full px-3 py-2 rounded-xl bg-[#25253e] border-2 border-[#3d3d5c] text-sm text-white placeholder-slate-500 focus:border-amber-400/40 focus:outline-none" />
    </div>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-400 mb-1 block">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-[#25253e] border-2 border-[#3d3d5c] text-sm text-white focus:border-amber-400/40 focus:outline-none">
        {options.map((o: string) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
    </div>
  );
}
