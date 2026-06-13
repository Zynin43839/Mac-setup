import { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2 } from 'lucide-react';
import { loadProjects, createProjectAPI, updateProjectAPI, deleteProjectAPI } from '../store';
import { Project, ProjectStatus } from '../types';

const statusColors: Record<ProjectStatus, string> = {
  planning: 'from-slate-500 to-slate-600',
  active: 'from-emerald-500 to-teal-500',
  paused: 'from-amber-500 to-yellow-500',
  completed: 'from-blue-500 to-cyan-500',
  cancelled: 'from-red-500 to-rose-500',
};

const statusLabels: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  useEffect(() => { loadProjects().then(setProjects).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = projects
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  async function handleSave(data: Partial<Project>) {
    if (editing) {
      const updated = await updateProjectAPI(editing.id, data);
      setProjects(updated);
    } else {
      const created = await createProjectAPI(data);
      setProjects(created);
    }
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    const updated = await deleteProjectAPI(id);
    setProjects(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">{projects.length} projects · {projects.filter(p => p.status === 'active').length} active</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="neo-btn-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#25253e] border-2 border-[#3d3d5c] text-sm text-white placeholder-slate-500 focus:border-amber-400/40 focus:outline-none"
          />
        </div>
        {(['all', 'planning', 'active', 'paused', 'completed', 'cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all ${
              filter === s ? 'border-amber-400/60 bg-[#2a2a4a] text-amber-200' : 'border-[#3d3d5c] text-slate-400 hover:text-white'
            }`}
          >
            {s === 'all' ? 'All' : statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Project Cards */}
      {loading ? (
        <p className="text-slate-500 text-center py-12">Loading projects...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 neo-card">
          <p className="text-slate-500 text-lg font-bold">No projects found</p>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-3 text-amber-400 text-sm font-bold hover:text-amber-300">
            Create your first project
          </button>
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
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    p.priority === 'critical' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                    p.priority === 'high' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                    p.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  }`}>{p.priority}</span>
                  <button onClick={() => { setEditing(p); setShowForm(true); }} className="p-1 text-slate-500 hover:text-amber-400">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1 text-slate-500 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {p.description && (
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{p.description}</p>
              )}
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
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg bg-gradient-to-r ${statusColors[p.status]} text-white`}>
                  {statusLabels[p.status]}
                </span>
              </div>
              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.tags.map((t, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#25253e] text-slate-400 border border-[#3d3d5c]">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ProjectForm
          project={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
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
    onSave({
      name, description, department, status, priority, progress, lead, startDate, targetDate,
      tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="neo-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-4">{project ? 'Edit Project' : 'New Project'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Name" value={name} onChange={setName} required />
          <div>
            <label className="text-xs font-bold text-slate-400 mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl bg-[#25253e] border-2 border-[#3d3d5c] text-sm text-white placeholder-slate-500 focus:border-amber-400/40 focus:outline-none resize-none" />
          </div>
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
            <button type="submit" className="flex-1 neo-btn-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold">
              {project ? 'Update' : 'Create'}
            </button>
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
