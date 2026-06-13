import { useState, useEffect } from 'react';
import { Plus, Target, Filter, Trash2, Circle, CheckCircle2, Clock } from 'lucide-react';
import { loadRoadmapItems, createRoadmapItemAPI, updateRoadmapItemAPI, deleteRoadmapItemAPI } from '../store';
import { RoadmapItem } from '../types';

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'];
const modules = ['Dashboard', 'Meetings', 'Projects', 'Roadmap', 'Briefing', 'Assistant', 'Settings', 'API'];

const statusIcons: Record<string, typeof Circle> = {
  planned: Circle,
  'in-progress': Clock,
  completed: CheckCircle2,
  cancelled: Circle,
};

const statusColors: Record<string, string> = {
  planned: 'text-slate-500',
  'in-progress': 'text-amber-400',
  completed: 'text-emerald-400',
  cancelled: 'text-red-400',
};

export default function Roadmap() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const currentYear = 2026;

  useEffect(() => { loadRoadmapItems().then(setItems).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = deptFilter === 'all' ? items : items.filter(i => i.department === deptFilter);
  const years = [...new Set(items.map(i => i.year))].sort((a, b) => b - a);
  const activeYears = years.length > 0 ? years : [currentYear];

  async   function handleSave(data: any) {
    const updated = await createRoadmapItemAPI(data);
    setItems(updated);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    const updated = await deleteRoadmapItemAPI(id);
    setItems(updated);
  }

  async function toggleStatus(item: RoadmapItem) {
    const next: Record<string, string> = { planned: 'in-progress', 'in-progress': 'completed', completed: 'planned', cancelled: 'planned' };
    const updated = await updateRoadmapItemAPI(item.id, { status: next[item.status] || 'planned' });
    setItems(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Target className="w-7 h-7 text-amber-400" /> Roadmap
          </h1>
          <p className="text-slate-400 text-sm mt-1">{items.length} features · {items.filter(i => i.status === 'in-progress').length} in progress</p>
        </div>
        <button onClick={() => setShowForm(true)} className="neo-btn-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        {['all', ...departments].map(d => (
          <button
            key={d} onClick={() => setDeptFilter(d)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all ${
              deptFilter === d ? 'border-amber-400/60 bg-[#2a2a4a] text-amber-200' : 'border-[#3d3d5c] text-slate-400 hover:text-white'
            }`}
          >
            {d === 'all' ? 'All' : d}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500 text-center py-12">Loading roadmap...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 neo-card">
          <Target className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-lg font-bold">No roadmap items</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-amber-400 text-sm font-bold hover:text-amber-300">Add your first feature</button>
        </div>
      ) : (
        activeYears.map(year => (
          <div key={year} className="space-y-4">
            <h2 className="text-xl font-black text-slate-300">{year}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {quarters.map(q => {
                const qItems = filtered.filter(i => i.quarter === q && i.year === year);
                return (
                  <div key={q} className="neo-card p-3">
                    <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      {q}
                      <span className="text-slate-500 font-normal ml-auto">{qItems.length}</span>
                    </h3>
                    {qItems.length === 0 ? (
                      <p className="text-slate-600 text-xs py-4 text-center">No items</p>
                    ) : (
                      <div className="space-y-2">
                        {qItems.map(item => {
                          const Icon = statusIcons[item.status] || Circle;
                          const sc = statusColors[item.status] || 'text-slate-500';
                          return (
                            <div key={item.id} className="p-2 rounded-lg bg-[#25253e]/60 border border-[#3d3d5c]/50 group">
                              <div className="flex items-start gap-2">
                                <button onClick={() => toggleStatus(item)} className="mt-0.5">
                                  <Icon className={`w-4 h-4 ${sc}`} />
                                </button>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-white truncate">{item.title}</p>
                                  <p className="text-[10px] text-slate-500">{item.module} · {item.department}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className={`text-[9px] font-bold px-1 py-0.25 rounded border ${
                                      item.priority === 'critical' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                      item.priority === 'high' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                                      item.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                      'bg-slate-500/20 text-slate-300 border-slate-500/30'
                                    }`}>{item.priority}</span>
                                    <span className={`text-[9px] font-bold px-1 py-0.25 rounded border border-[#3d3d5c] ${
                                      item.status === 'completed' ? 'text-emerald-400' :
                                      item.status === 'in-progress' ? 'text-amber-400' : 'text-slate-500'
                                    }`}>{item.status}</span>
                                  </div>
                                </div>
                                <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {showForm && (
        <RoadmapForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      )}
    </div>
  );
}

function RoadmapForm({ onSave, onCancel }: { onSave: (d: any) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [module, setModule] = useState('Dashboard');
  const [quarter, setQuarter] = useState('Q2');
  const [year, setYear] = useState(2026);
  const [department, setDepartment] = useState('Engineering');
  const [priority, setPriority] = useState('medium');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description, module, quarter, year, department, priority, status: 'planned' });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="neo-card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-4">New Roadmap Item</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Title" value={title} onChange={setTitle} required />
          <Input label="Description" value={description} onChange={setDescription} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Module" value={module} onChange={setModule} options={modules} />
            <Select label="Department" value={department} onChange={setDepartment} options={departments} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Quarter" value={quarter} onChange={setQuarter} options={quarters} />
            <Input label="Year" type="number" value={String(year)} onChange={(v: string) => setYear(Number(v))} />
            <Select label="Priority" value={priority} onChange={setPriority} options={['low', 'medium', 'high', 'critical']} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 neo-btn-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold">Add</button>
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
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
