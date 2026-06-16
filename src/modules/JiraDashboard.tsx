import { useState, useMemo } from 'react';
import {
  Bug, BarChart3, Calendar, Users, Search,
  CheckCircle2, Circle, Clock, Target, AlertTriangle,
  Share2, Layers, UserCheck, Zap
} from 'lucide-react';
import { getJiraConfig } from '../store';

interface MockIssue {
  key: string; summary: string; status: string; statusCategory: string;
  assignee: string; priority: string; labels: string[];
  created: string; duedate: string; fixVersions: string[];
  storyPoints: number | null;
  project?: string;
}

const MOCK_PROJECTS = [
  { key: 'LMS', name: 'Learning Management System', lead: 'Somchai W.', category: 'Product', tech: 'React, Node, PostgreSQL' },
  { key: 'PORTAL', name: 'Employee Portal', lead: 'Ananya K.', category: 'Platform', tech: 'React, Node, PostgreSQL' },
  { key: 'MOBILE', name: 'Mobile App', lead: 'Phattara J.', category: 'Product', tech: 'React Native, GraphQL' },
  { key: 'INFRA', name: 'Infrastructure', lead: 'Kittipong C.', category: 'Engineering', tech: 'Terraform, AWS, Docker' },
];

const MOCK_STATUSES = ['To Do', 'In Progress', 'Review', 'Testing', 'Done'];
const MOCK_PRIORITIES = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];
const MOCK_ASSIGNEES = ['Somchai W.', 'Ananya K.', 'Phattara J.', 'Kittipong C.', 'Supaporn L.', 'Unassigned'];
const MOCK_VERSIONS = ['v1.0', 'v1.1', 'v2.0', 'Sprint 1', 'Sprint 2', 'Sprint 3'];

// Assignees mapped to projects they work on
const ASSIGNEE_PROJECTS: Record<string, string[]> = {
  'Somchai W.': ['LMS', 'PORTAL'],
  'Ananya K.': ['PORTAL', 'MOBILE'],
  'Phattara J.': ['MOBILE', 'LMS'],
  'Kittipong C.': ['INFRA', 'LMS', 'PORTAL'],
  'Supaporn L.': ['LMS', 'MOBILE'],
  'Unassigned': [],
};

// Shared components across projects
const SHARED_COMPONENTS = [
  { name: 'Authentication Service', projects: ['LMS', 'PORTAL', 'MOBILE'], icon: '🔐' },
  { name: 'Notification System', projects: ['LMS', 'PORTAL'], icon: '🔔' },
  { name: 'API Gateway', projects: ['LMS', 'PORTAL', 'MOBILE', 'INFRA'], icon: '🌐' },
  { name: 'File Storage Module', projects: ['LMS', 'PORTAL'], icon: '📁' },
];

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)]; }

const MOCK_FEATURES = [
  'Dashboard analytics', 'User management', 'Course builder', 'Assessment engine',
  'Certificate generation', 'Notification system', 'Payment gateway', 'Reporting module',
  'Content library', 'API integration', 'Mobile responsive', 'SSO implementation',
  'Gamification', 'Progress tracking', 'Discussion forum', 'Live streaming',
];

function generateMockIssues(project: string, count: number): MockIssue[] {
  return Array.from({ length: count }, (_, i) => {
    const status = pick(MOCK_STATUSES);
    const statusCategory = status === 'Done' ? 'Done' : status === 'To Do' ? 'To Do' : 'In Progress';
    return {
      key: `${project}-${100 + i}`,
      summary: pick(MOCK_FEATURES),
      status, statusCategory,
      assignee: pick(MOCK_ASSIGNEES),
      priority: pick(MOCK_PRIORITIES),
      labels: pick([['backend'], ['frontend'], ['bug'], ['enhancement'], ['ux']]),
      created: new Date(2025, 2, rand(1, 90)).toISOString(),
      duedate: rand(0, 1) ? new Date(2025, 5, rand(1, 30)).toISOString().split('T')[0] : '',
      fixVersions: rand(0, 1) ? [pick(MOCK_VERSIONS)] : [],
      storyPoints: rand(0, 1) ? rand(1, 13) : null,
      project,
    };
  });
}

function generateMockSprint() {
  const issues = generateMockIssues('LMS', rand(15, 25));
  const totalPoints = issues.reduce((s, i) => s + (i.storyPoints || 0), 0);
  const donePoints = issues.filter(i => i.statusCategory === 'Done').reduce((s, i) => s + (i.storyPoints || 0), 0);
  const byStatus: Record<string, number> = {};
  issues.forEach(i => { byStatus[i.status] = (byStatus[i.status] || 0) + 1; });
  return {
    sprint: { id: 1, name: 'Sprint 3 Q2 2025', goal: 'Deliver core LMS features and payment integration', startDate: '2025-05-05', endDate: '2025-05-19' },
    total: issues.length, totalPoints, donePoints, statusCounts: byStatus, issues,
  };
}

function generateMockStats() {
  const issues = generateMockIssues('LMS', 60);
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byAssignee: Record<string, number> = {};
  let totalPoints = 0;
  issues.forEach(i => {
    byStatus[i.status] = (byStatus[i.status] || 0) + 1;
    byPriority[i.priority] = (byPriority[i.priority] || 0) + 1;
    byAssignee[i.assignee] = (byAssignee[i.assignee] || 0) + 1;
    totalPoints += i.storyPoints || 0;
  });
  return { total: issues.length, totalPoints, byStatus, byPriority, byAssignee };
}

const STATUS_COLORS: Record<string, string> = {
  'To Do': '#64748b', 'In Progress': '#f59e0b', 'Review': '#8b5cf6',
  'Testing': '#06b6d4', 'Done': '#10b981',
};
const PRIORITY_COLORS: Record<string, string> = {
  Highest: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#3b82f6', Lowest: '#64748b',
};

function PieChart({ data, size = 160 }: { data: Record<string, number>; size?: number }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const radius = size / 2 - 10;
  const colors = ['#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#64748b', '#ef4444', '#f97316', '#3b82f6'];
  let cumulativeAngle = -90;
  const slices = entries.map(([label, value], i) => {
    const angle = (value / total) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    const endAngle = cumulativeAngle;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = radius * Math.cos(startRad);
    const y1 = radius * Math.sin(startRad);
    const x2 = radius * Math.cos(endRad);
    const y2 = radius * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    const color = colors[i % colors.length];
    return { label, value, path: `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`, color, percent: Math.round((value / total) * 100) };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`${-size/2} ${-size/2} ${size} ${size}`}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#1a1a2e" strokeWidth={2} />)}
      </svg>
      <div className="space-y-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-slate-400">{s.label}</span>
            <span className="text-white font-bold ml-auto">{s.value} ({s.percent}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, color = '#f59e0b', maxBars = 8 }: { data: Record<string, number>; color?: string; maxBars?: number }) {
  const entries = Object.entries(data).slice(0, maxBars);
  const maxValue = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="space-y-1.5">
      {entries.map(([label, value]) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-slate-400 truncate">{label}</span>
            <span className="text-white font-bold">{value}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(value / maxValue) * 100}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function JiraDashboard() {
  const [config] = useState(() => getJiraConfig());
  const [projects] = useState(() => MOCK_PROJECTS);
  const [activeProject, setActiveProject] = useState('LMS');
  const [stats, setStats] = useState(() => generateMockStats());
  const [sprint] = useState(() => generateMockSprint());
  const [issues, setIssues] = useState(() => generateMockIssues('LMS', 40));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Generate cross-project issues for deadline alerts
  const allProjectIssues = useMemo(() =>
    MOCK_PROJECTS.flatMap(p => generateMockIssues(p.key, rand(15, 30))),
  []);

  // Calculate deadline info
  const today = new Date(2025, 4, 15); // Mock today: May 15, 2025
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const upcomingDeadlines = allProjectIssues
    .filter(i => i.duedate && new Date(i.duedate) >= today && new Date(i.duedate) <= in7Days)
    .sort((a, b) => new Date(a.duedate).getTime() - new Date(b.duedate).getTime());

  const overdueItems = allProjectIssues
    .filter(i => i.duedate && new Date(i.duedate) < today && i.statusCategory !== 'Done')
    .sort((a, b) => new Date(a.duedate).getTime() - new Date(b.duedate).getTime());

  // Projects nearing their mock target date
  const projectDeadlines = [
    { key: 'LMS', name: 'Learning Management System', targetDate: '2025-05-30', progress: 65, lead: 'Somchai W.' },
    { key: 'PORTAL', name: 'Employee Portal', targetDate: '2025-05-20', progress: 80, lead: 'Ananya K.' },
    { key: 'MOBILE', name: 'Mobile App', targetDate: '2025-06-15', progress: 40, lead: 'Phattara J.' },
    { key: 'INFRA', name: 'Infrastructure', targetDate: '2025-05-10', progress: 90, lead: 'Kittipong C.' },
  ].map(p => ({
    ...p,
    daysLeft: Math.ceil((new Date(p.targetDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  }));

  // Shared assignee analysis
  const sharedAssigneeData = Object.entries(ASSIGNEE_PROJECTS)
    .filter(([, projs]) => projs.length > 1)
    .map(([name, projs]) => ({
      name,
      projects: projs,
      totalIssues: allProjectIssues.filter(i => i.assignee === name).length,
    }))
    .sort((a, b) => b.totalIssues - a.totalIssues);

  const filteredIssues = issues
    .filter(i => statusFilter === 'all' || i.status === statusFilter)
    .filter(i => i.key.toLowerCase().includes(search.toLowerCase()) || i.summary.toLowerCase().includes(search.toLowerCase()));

  const isConnected = !!(config.url && config.email && config.token);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Bug className="w-7 h-7 text-amber-400" /> Jira Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {isConnected ? `Connected to ${config.url}` : 'Mockup Data (no Jira configured)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={activeProject} onChange={e => { setActiveProject(e.target.value); setIssues(generateMockIssues(e.target.value, 40)); setStats(generateMockStats()); }}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#25253e] border-2 border-[#3d3d5c] text-white font-bold focus:border-amber-400/40 focus:outline-none">
            {projects.map(p => <option key={p.key} value={p.key}>{p.key} — {p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Issues" value={stats.total} icon={BarChart3} color="from-slate-500 to-slate-600" />
        <StatCard label="To Do" value={stats.byStatus['To Do'] || 0} icon={Circle} color="from-slate-400 to-slate-500" />
        <StatCard label="In Progress" value={(stats.byStatus['In Progress'] || 0) + (stats.byStatus['Review'] || 0) + (stats.byStatus['Testing'] || 0)} icon={Clock} color="from-amber-500 to-orange-500" />
        <StatCard label="Done" value={stats.byStatus['Done'] || 0} icon={CheckCircle2} color="from-emerald-500 to-teal-500" />
        <StatCard label="Story Points" value={stats.totalPoints} icon={Target} color="from-violet-500 to-purple-500" />
      </div>

      {/* Deadline Alerts */}
      <div className="neo-card p-4 border-l-[3px] border-l-red-400">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Deadline Alerts
          </h3>
          <span className="text-xs text-slate-500">Mock date: May 15, 2025</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Overdue Items */}
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-red-300">Overdue ({overdueItems.length})</span>
            </div>
            {overdueItems.length === 0 ? (
              <p className="text-xs text-slate-500">No overdue items</p>
            ) : (
              <div className="space-y-1">
                {overdueItems.slice(0, 4).map(i => (
                  <div key={i.key} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold">{i.key}</span>
                    <span className="text-red-300">{i.duedate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Deadlines (7 days) */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-400/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">Due within 7 days ({upcomingDeadlines.length})</span>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-500">No upcoming deadlines</p>
            ) : (
              <div className="space-y-1">
                {upcomingDeadlines.slice(0, 4).map(i => (
                  <div key={i.key} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold">{i.key}</span>
                    <span className="text-amber-300">{i.duedate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Deadlines */}
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-violet-300">Project Deadlines</span>
            </div>
            <div className="space-y-1.5">
              {projectDeadlines.sort((a, b) => a.daysLeft - b.daysLeft).map(p => (
                <div key={p.key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold">{p.key}</span>
                    <span className={`font-bold ${p.daysLeft <= 0 ? 'text-red-400' : p.daysLeft <= 7 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {p.daysLeft <= 0 ? 'OVERDUE' : `${p.daysLeft}d left`}
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-[#1a1a2e] mt-0.5 overflow-hidden">
                    <div className={`h-full rounded-full ${p.daysLeft <= 0 ? 'bg-red-500' : p.daysLeft <= 7 ? 'bg-amber-500' : 'bg-violet-500'}`}
                      style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="neo-card p-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" /> By Status
          </h3>
          <PieChart data={stats.byStatus} />
        </div>
        <div className="neo-card p-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" /> By Priority
          </h3>
          <BarChart data={stats.byPriority} color="#f59e0b" />
        </div>
        <div className="neo-card p-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" /> Assignee Workload
          </h3>
          <BarChart data={stats.byAssignee} color="#8b5cf6" />
        </div>
      </div>

      {/* Shared Resources */}
      <div className="neo-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" /> Shared Resources
          </h3>
          <span className="text-xs text-slate-500">Cross-project dependencies</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Shared Assignees */}
          <div className="p-3 rounded-lg bg-[#25253e]/60 border border-[#3d3d5c]/50">
            <h4 className="text-xs font-bold text-emerald-300 mb-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Shared Assignees
            </h4>
            <div className="space-y-2">
              {sharedAssigneeData.slice(0, 4).map(a => (
                <div key={a.name}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-white font-bold">{a.name}</span>
                    <span className="text-slate-400">{a.totalIssues} issues</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {a.projects.map(p => {
                      const color = p === 'LMS' ? 'text-amber-300' : p === 'PORTAL' ? 'text-cyan-300' : p === 'MOBILE' ? 'text-pink-300' : 'text-green-300';
                      return <span key={p} className={`text-[9px] font-bold px-1 py-0.5 rounded bg-[#1a1a2e] border border-[#3d3d5c] ${color}`}>{p}</span>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Components */}
          <div className="p-3 rounded-lg bg-[#25253e]/60 border border-[#3d3d5c]/50">
            <h4 className="text-xs font-bold text-cyan-300 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Shared Components
            </h4>
            <div className="space-y-2">
              {SHARED_COMPONENTS.map(c => (
                <div key={c.name}>
                  <div className="flex items-center gap-1.5 text-xs mb-0.5">
                    <span>{c.icon}</span>
                    <span className="text-white font-bold">{c.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.projects.map(p => {
                      const color = p === 'LMS' ? 'text-amber-300' : p === 'PORTAL' ? 'text-cyan-300' : p === 'MOBILE' ? 'text-pink-300' : 'text-green-300';
                      return <span key={p} className={`text-[9px] font-bold px-1 py-0.5 rounded bg-[#1a1a2e] border border-[#3d3d5c] ${color}`}>{p}</span>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack Overlap */}
          <div className="p-3 rounded-lg bg-[#25253e]/60 border border-[#3d3d5c]/50">
            <h4 className="text-xs font-bold text-purple-300 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Tech Stack Overlap
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-white font-bold">React/Node</span>
              </div>
              <p className="text-[10px] text-slate-400 ml-4">Shared by: <span className="text-amber-300">LMS</span>, <span className="text-cyan-300">PORTAL</span></p>

              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-pink-400 shrink-0" />
                <span className="text-white font-bold">React Native</span>
              </div>
              <p className="text-[10px] text-slate-400 ml-4">Shared by: <span className="text-pink-300">MOBILE</span> (sole)</p>

              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className="text-white font-bold">PostgreSQL</span>
              </div>
              <p className="text-[10px] text-slate-400 ml-4">Shared by: <span className="text-amber-300">LMS</span>, <span className="text-cyan-300">PORTAL</span></p>

              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <span className="text-white font-bold">Docker / AWS</span>
              </div>
              <p className="text-[10px] text-slate-400 ml-4">Shared by: <span className="text-green-300">INFRA</span> (all projects)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sprint View */}
      <div className="neo-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" /> Active Sprint
          </h3>
          <span className="text-xs font-bold text-slate-400">{sprint.sprint.name} · {sprint.sprint.startDate} → {sprint.sprint.endDate}</span>
        </div>
        {sprint.sprint.goal && (
          <p className="text-xs text-slate-400 mb-3 italic">Goal: {sprint.sprint.goal}</p>
        )}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Progress</span>
              <span className="text-white font-bold">{sprint.donePoints} / {sprint.totalPoints} pts ({sprint.totalPoints > 0 ? Math.round((sprint.donePoints / sprint.totalPoints) * 100) : 0}%)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#1a1a2e] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all" style={{ width: `${sprint.totalPoints > 0 ? (sprint.donePoints / sprint.totalPoints) * 100 : 0}%` }} />
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400">{sprint.total} issues</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {Object.entries(sprint.statusCounts).map(([status, count]) => (
            <div key={status} className="p-2 rounded-lg bg-[#25253e]/60 border border-[#3d3d5c]/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold" style={{ color: STATUS_COLORS[status] || '#64748b' }}>{status}</span>
                <span className="text-white font-bold text-xs">{count}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(count / sprint.total) * 100}%`, backgroundColor: STATUS_COLORS[status] || '#64748b' }} />
              </div>
              <div className="mt-1 space-y-0.5">
                {sprint.issues.filter(i => i.status === status).slice(0, 3).map(i => (
                  <p key={i.key} className="text-[10px] text-slate-400 truncate">{i.key}: {i.summary}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issues List */}
      <div className="neo-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Issues</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues..." className="w-44 pl-8 pr-3 py-1.5 rounded-lg bg-[#25253e] border-2 border-[#3d3d5c] text-xs text-white placeholder-slate-500 focus:border-amber-400/40 focus:outline-none" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg bg-[#25253e] border-2 border-[#3d3d5c] text-white focus:border-amber-400/40 focus:outline-none">
              <option value="all">All Status</option>
              {MOCK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-[#3d3d5c]">
                <th className="text-left py-2 px-2 font-bold">Key</th>
                <th className="text-left py-2 px-2 font-bold">Summary</th>
                <th className="text-left py-2 px-2 font-bold">Status</th>
                <th className="text-left py-2 px-2 font-bold">Priority</th>
                <th className="text-left py-2 px-2 font-bold">Assignee</th>
                <th className="text-left py-2 px-2 font-bold">Due</th>
                <th className="text-right py-2 px-2 font-bold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.slice(0, 20).map(i => (
                <tr key={i.key} className="border-b border-[#3d3d5c]/50 hover:bg-[#25253e]/40">
                  <td className="py-2 px-2 font-bold text-amber-400">{i.key}</td>
                  <td className="py-2 px-2 text-white truncate max-w-[200px]">{i.summary}</td>
                  <td className="py-2 px-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${STATUS_COLORS[i.status]}20`, color: STATUS_COLORS[i.status] }}>
                      {i.status}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span className="text-[10px] font-bold" style={{ color: PRIORITY_COLORS[i.priority] || '#64748b' }}>{i.priority}</span>
                  </td>
                  <td className="py-2 px-2 text-slate-400">{i.assignee}</td>
                  <td className="py-2 px-2 text-slate-500">{i.duedate || '—'}</td>
                  <td className="py-2 px-2 text-right text-white font-bold">{i.storyPoints || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredIssues.length > 20 && (
          <p className="text-center text-slate-500 text-xs mt-2">Showing 20 of {filteredIssues.length} issues</p>
        )}
      </div>

      {/* Timeline / Gantt */}
      <div className="neo-card p-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" /> Timeline by Fix Version
        </h3>
        <div className="space-y-3">
          {[
            { version: 'Sprint 1', date: 'May 5-19', issues: issues.filter(() => Math.random() > 0.7).slice(0, 4) },
            { version: 'Sprint 2', date: 'May 20 - Jun 2', issues: issues.filter(() => Math.random() > 0.7).slice(0, 3) },
            { version: 'Sprint 3', date: 'Jun 3-16', issues: issues.filter(() => Math.random() > 0.7).slice(0, 5) },
            { version: 'v1.0', date: 'Jun 30', issues: issues.filter(() => Math.random() > 0.7).slice(0, 3) },
          ].map(version => (
            <div key={version.version} className="relative pl-4 border-l-2 border-amber-500/30">
              <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-amber-400" />
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-bold text-white">{version.version}</span>
                <span className="text-[10px] text-slate-500">{version.date}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {version.issues.map(i => (
                  <span key={i.key} className="text-[10px] px-1.5 py-0.5 rounded bg-[#25253e] text-slate-300 border border-[#3d3d5c]">{i.key}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="neo-card p-3 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}
