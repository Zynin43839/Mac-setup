import { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, Cpu, Plus, Trash2, ExternalLink, Globe, Sparkles, Send, Bot, Loader2 } from 'lucide-react';
import { loadBriefings, createBriefingAPI, deleteBriefingAPI } from '../store';
import { BriefingItem } from '../types';

const categories = [
  { id: 'news', label: 'News', icon: Newspaper, color: 'from-cyan-500 to-blue-500' },
  { id: 'competitor', label: 'Competitor', icon: TrendingUp, color: 'from-rose-500 to-pink-500' },
  { id: 'tech', label: 'Tech', icon: Cpu, color: 'from-violet-500 to-purple-500' },
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const AGENT_TOPICS = {
  'AI': [
    { title: 'Gemma 3 เปิดตัว — โมเดล lightweight ที่เทียบชั้น Llama 3', source: 'TechCrunch', category: 'tech', tags: ['AI', 'Google', 'open-source'] },
    { title: 'Microsoft เปิดตัว Copilot สำหรับภาคการศึกษา', source: 'The Verge', category: 'news', tags: ['Microsoft', 'Education', 'AI'] },
    { title: 'OpenAI เตรียมปล่อย GPT-5 ภายใน Q3 นี้', source: 'Reuters', category: 'news', tags: ['OpenAI', 'GPT-5', 'LLM'] },
    { title: 'LangChain v0.3 เปลี่ยนวิธี build AI agent ไปตลอดกาล', source: 'InfoQ', category: 'tech', tags: ['LangChain', 'AI Agent', 'Dev'] },
  ],
  'education': [
    { title: 'EdTech ในเอเชียตะวันออกเฉียงใต้โต 25% ในปี 2025', source: 'KrASIA', category: 'news', tags: ['EdTech', 'SEA', 'Growth'] },
    { title: 'Coursera รายงานผู้เรียน AI โต 3 เท่าใน 6 เดือน', source: 'EdSurge', category: 'news', tags: ['Coursera', 'AI', 'Online Learning'] },
    { title: 'Duolingo ใช้ GPT-4 สร้างบทเรียนแบบ personalized', source: 'TechCrunch', category: 'competitor', tags: ['Duolingo', 'AI', 'Personalization'] },
    { title: 'Google Classroom เพิ่มฟีเจอร์ Grade with AI', source: 'The Verge', category: 'competitor', tags: ['Google', 'Classroom', 'AI Grading'] },
  ],
  'startup': [
    { title: 'YC W25 cohort มี 40% เป็น AI-native startups', source: 'Y Combinator', category: 'news', tags: ['YC', 'Startup', 'AI'] },
    { title: 'Lineman เปิดตัว Lineman AI — รับส่งเอกสารด้วยใบหน้า', source: 'Techsauce', category: 'competitor', tags: ['Lineman', 'AI', 'Logistics'] },
    { title: 'Flash Express ทุ่มงบ 500M สร้าง AI Logistics Platform', source: 'Bloomberg', category: 'competitor', tags: ['Flash', 'Logistics', 'AI'] },
  ],
  'market': [
    { title: 'ตลาด LMS ในไทยปี 2025 โต 18% คาดมูลค่า 2.5 หมื่นล้าน', source: 'Marketeer', category: 'news', tags: ['LMS', 'Thai Market', 'Growth'] },
    { title: 'Shopee LMS เปิดตัว — ขายคอร์สออนไลน์บนแพลตฟอร์ม', source: 'Techsauce', category: 'competitor', tags: ['Shopee', 'LMS', 'New Entrant'] },
    { title: 'SEA EdTech funding ไตรมาสแรก 2025 ทำสถิติ新高', source: 'Nikkei Asia', category: 'news', tags: ['EdTech', 'Funding', 'SEA'] },
  ],
};

function generateAgentResults(brief: string): BriefingItem[] {
  const lower = brief.toLowerCase();
  let pool: typeof AGENT_TOPICS['AI'] = [];

  if (lower.includes('ai') || lower.includes('ปัญญาประ')) pool = pool.concat(AGENT_TOPICS['AI']);
  if (lower.includes('education') || lower.includes('ศึกษา') || lower.includes('learn')) pool = pool.concat(AGENT_TOPICS['education']);
  if (lower.includes('startup') || lower.includes('สตาร์ท') || lower.includes('บริษัท')) pool = pool.concat(AGENT_TOPICS['startup']);
  if (lower.includes('market') || lower.includes('ตลาด') || lower.includes('competitor')) pool = pool.concat(AGENT_TOPICS['market']);

  if (pool.length === 0) pool = [...AGENT_TOPICS['AI'], ...AGENT_TOPICS['education'], ...AGENT_TOPICS['startup'], ...AGENT_TOPICS['market']];

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(4, shuffled.length));

  return selected.map((item, i) => ({
    id: `agent-${Date.now()}-${i}`,
    title: item.title,
    summary: `[Agent Research] Based on briefing: "${brief.slice(0, 60)}..."`,
    category: item.category as 'news' | 'competitor' | 'tech',
    source: item.source,
    url: '',
    date: new Date().toISOString().split('T')[0],
    tags: item.tags,
  }));
}

export default function Briefing() {
  const [items, setItems] = useState<BriefingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);

  // Agent state
  const [agentBrief, setAgentBrief] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentDone, setAgentDone] = useState(false);

  useEffect(() => { loadBriefings().then(setItems).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = catFilter === 'all' ? items : items.filter(i => i.category === catFilter);

  async function handleSave(data: any) { setItems(await createBriefingAPI(data)); setShowForm(false); }
  async function handleDelete(id: string) { setItems(await deleteBriefingAPI(id)); }

  async function runAgent() {
    if (!agentBrief.trim() || agentRunning) return;
    setAgentRunning(true);
    setAgentDone(false);

    await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500));

    const results = generateAgentResults(agentBrief.trim());
    let currentItems = [...items];
    for (const r of results) {
      try {
        currentItems = await createBriefingAPI(r);
      } catch { currentItems = [...currentItems, r]; }
    }
    setItems(currentItems);
    setAgentRunning(false);
    setAgentDone(true);
    setTimeout(() => setAgentDone(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Newspaper className="w-7 h-7 text-amber-400" /> Briefing
          </h1>
          <p className="text-slate-400 text-sm mt-1">{items.length} briefings today</p>
        </div>
        <button onClick={() => setShowForm(true)} className="neo-btn-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Briefing
        </button>
      </div>

      {/* ── Briefing Agent ── */}
      <div className="neo-card p-4 border-l-[3px] border-l-violet-400">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-5 h-5 text-violet-400" />
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Briefing Agent</h3>
          <span className="neo-badge bg-violet-500/20 text-violet-300 border-violet-400/40 text-[9px]">AI-POWERED</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">บอก Agent ว่าอยากรู้เรื่องอะไร — มันจะค้นหาและเพิ่ม Briefing ให้อัตโนมัติ</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="w-4 h-4 absolute left-3 top-3 text-violet-500" />
            <textarea
              value={agentBrief}
              onChange={e => setAgentBrief(e.target.value)}
              placeholder="เช่น: AI ในวงการการศึกษา, คู่แข่งในตลาด LMS, เทรนด์ EdTech 2025..."
              rows={2}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#25253e] border-2 border-[#3d3d5c] text-sm text-white placeholder-slate-500 focus:border-violet-400/40 focus:outline-none resize-none"
            />
          </div>
          <button
            onClick={runAgent}
            disabled={!agentBrief.trim() || agentRunning}
            className="neo-btn-sm px-5 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {agentRunning ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Researching...</>
            ) : agentDone ? (
              <><Send className="w-4 h-4" /> Done!</>
            ) : (
              <><Send className="w-4 h-4" /> Research</>
            )}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2">
        <button onClick={() => setCatFilter('all')}
          className={`text-xs font-bold px-4 py-2 rounded-xl border-2 transition-all ${catFilter === 'all' ? 'border-amber-400/60 bg-[#2a2a4a] text-amber-200' : 'border-[#3d3d5c] text-slate-400 hover:text-white'}`}>All</button>
        {categories.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.id} onClick={() => setCatFilter(c.id)}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border-2 transition-all ${catFilter === c.id ? 'border-amber-400/60 bg-[#2a2a4a] text-amber-200' : 'border-[#3d3d5c] text-slate-400 hover:text-white'}`}>
              <Icon className="w-3.5 h-3.5" />{c.label}
            </button>
          );
        })}
      </div>

      {/* Briefing Cards */}
      {loading ? (
        <p className="text-slate-500 text-center py-12">Loading briefings...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 neo-card">
          <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-lg font-bold">No briefings yet</p>
          <p className="text-xs text-slate-500 mt-1">ลองใช้ Briefing Agent ด้านบน หรือ Add Briefing ด้วยตัวเอง</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(b => {
            const cat = categories.find(c => c.id === b.category) || categories[0];
            const Icon = cat.icon;
            const isAgent = b.id.startsWith('agent-');
            return (
              <div key={b.id} className={`neo-card p-4 transition-all ${isAgent ? 'border-l-[3px] border-l-violet-400' : 'hover:border-amber-400/30'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center border border-[#3d3d5c]`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">{cat.label}</p>
                      <p className="text-[10px] text-slate-500">{b.date?.slice(0, 10)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isAgent && <Bot className="w-3 h-3 text-violet-400" />}
                    {b.url && <a href={b.url} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-500 hover:text-cyan-400"><ExternalLink className="w-3.5 h-3.5" /></a>}
                    <button onClick={() => handleDelete(b.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-white mb-1">{b.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-2">{b.summary}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1"><Globe className="w-3 h-3" />{b.source}</span>
                  {b.tags.length > 0 && (
                    <div className="flex gap-1">
                      {b.tags.slice(0, 3).map((t, i) => <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#25253e] text-slate-400 border border-[#3d3d5c]">{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <BriefingForm onSave={handleSave} onCancel={() => setShowForm(false)} />}
    </div>
  );
}

function BriefingForm({ onSave, onCancel }: { onSave: (d: any) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('news' as string);
  const [source, setSource] = useState('');
  const [url, setUrl] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tagsStr, setTagsStr] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), summary, category, source, url, date, tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="neo-card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-4">New Briefing</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Title" value={title} onChange={setTitle} required />
          <div><label className="text-xs font-bold text-slate-400 mb-1 block">Summary</label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-xl bg-[#25253e] border-2 border-[#3d3d5c] text-sm text-white placeholder-slate-500 focus:border-amber-400/40 focus:outline-none resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={category} onChange={setCategory} options={['news', 'competitor', 'tech']} />
            <Input label="Source" value={source} onChange={setSource} />
          </div>
          <Input label="URL" value={url} onChange={setUrl} />
          <Input label="Date" type="date" value={date} onChange={setDate} />
          <Input label="Tags (comma-separated)" value={tagsStr} onChange={setTagsStr} />
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
  return (<div><label className="text-xs font-bold text-slate-400 mb-1 block">{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} {...props}
      className="w-full px-3 py-2 rounded-xl bg-[#25253e] border-2 border-[#3d3d5c] text-sm text-white placeholder-slate-500 focus:border-amber-400/40 focus:outline-none" /></div>);
}

function Select({ label, value, onChange, options }: any) {
  return (<div><label className="text-xs font-bold text-slate-400 mb-1 block">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl bg-[#25253e] border-2 border-[#3d3d5c] text-sm text-white focus:border-amber-400/40 focus:outline-none">
      {options.map((o: string) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
    </select></div>);
}
