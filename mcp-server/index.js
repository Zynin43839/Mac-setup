// ─── MCP Server — Meeting Agent ─────────────────────────────
// Protocol: JSON-RPC 2.0 over stdio (MCP spec)
// Connect ANY AI agent that supports MCP (Claude, Cursor, etc.)
// ─────────────────────────────────────────────────────────────

import { createInterface } from 'readline';

// ── Config ──
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const MCP_SERVER_INFO = {
  name: 'cat-meeting-mcp',
  version: '1.0.0',
};

// ── Tool Definitions ──
const TOOLS = [
  {
    name: 'list_meetings',
    description: 'List meetings with optional filters. Returns summary list.',
    inputSchema: {
      type: 'object',
      properties: {
        department: { type: 'string', description: 'Filter by department (Engineering, Marketing, Sales, HR, Finance, Operations)' },
        search: { type: 'string', description: 'Full-text search in title/transcript/summary' },
        limit: { type: 'number', description: 'Max results (default 50)', default: 50 },
      },
    },
  },
  {
    name: 'get_meeting',
    description: 'Get full meeting details including transcript, summary, action items.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Meeting ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_meeting',
    description: 'Manually create a meeting record.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Meeting title' },
        transcript: { type: 'string', description: 'Full transcript text' },
        summary: { type: 'string', description: 'Meeting summary' },
        actionItems: { type: 'array', items: { type: 'string' }, description: 'Action items list' },
        departments: { type: 'array', items: { type: 'string' }, description: 'Departments involved' },
        date: { type: 'string', description: 'ISO date string' },
        duration: { type: 'number', description: 'Duration in seconds' },
      },
      required: ['title'],
    },
  },
  {
    name: 'summarize_transcript',
    description: 'Send raw transcript text to Local AI for summarization. Returns structured summary + action items.',
    inputSchema: {
      type: 'object',
      properties: {
        transcript: { type: 'string', description: 'Full transcript text to summarize' },
        endpoint: { type: 'string', description: 'Ollama/OpenAI-compatible endpoint', default: 'http://localhost:11434' },
        model: { type: 'string', description: 'Model name', default: 'gemma3:12b' },
      },
      required: ['transcript'],
    },
  },
  {
    name: 'search_meetings',
    description: 'Full-text search across meeting titles, transcripts, and summaries.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results', default: 20 },
      },
      required: ['query'],
    },
  },
  {
    name: 'delete_meeting',
    description: 'Delete a meeting by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Meeting ID to delete' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_departments',
    description: 'List all available departments.',
    inputSchema: { type: 'object', properties: {} },
  },
  // ── Projects ──
  {
    name: 'list_projects',
    description: 'List projects with optional status/department filters.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['planning', 'active', 'paused', 'completed', 'cancelled'], description: 'Filter by status' },
        department: { type: 'string', description: 'Filter by department' },
      },
    },
  },
  {
    name: 'get_project',
    description: 'Get full project details by ID.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Project ID' } },
      required: ['id'],
    },
  },
  {
    name: 'create_project',
    description: 'Create a new project.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Description' },
        department: { type: 'string', description: 'Department' },
        status: { type: 'string', enum: ['planning', 'active', 'paused', 'completed', 'cancelled'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        progress: { type: 'number', description: 'Progress 0-100' },
        lead: { type: 'string', description: 'Project lead' },
        startDate: { type: 'string', description: 'Start date' },
        targetDate: { type: 'string', description: 'Target date' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['name', 'department'],
    },
  },
  {
    name: 'update_project',
    description: 'Update project status, progress, or fields.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Project ID' },
        status: { type: 'string', enum: ['planning', 'active', 'paused', 'completed', 'cancelled'] },
        progress: { type: 'number', description: 'Progress 0-100' },
        name: { type: 'string' },
        priority: { type: 'string' },
        lead: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_project',
    description: 'Delete a project by ID.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Project ID' } },
      required: ['id'],
    },
  },
  // ── Roadmap ──
  {
    name: 'list_roadmap',
    description: 'List roadmap items with optional filters.',
    inputSchema: {
      type: 'object',
      properties: {
        department: { type: 'string' },
        quarter: { type: 'string' },
        year: { type: 'number' },
        status: { type: 'string', enum: ['planned', 'in-progress', 'completed', 'cancelled'] },
      },
    },
  },
  {
    name: 'add_roadmap_item',
    description: 'Add a new roadmap item.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        module: { type: 'string' },
        quarter: { type: 'string' },
        year: { type: 'number' },
        department: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      },
      required: ['title', 'quarter'],
    },
  },
  {
    name: 'update_roadmap_item',
    description: 'Update a roadmap item status or details.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string', enum: ['planned', 'in-progress', 'completed', 'cancelled'] },
        title: { type: 'string' },
        priority: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_roadmap_item',
    description: 'Delete a roadmap item.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  // ── Briefing ──
  {
    name: 'list_briefings',
    description: 'List briefing items with optional category filter.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['news', 'competitor', 'tech', 'all'] },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'add_briefing',
    description: 'Add a briefing item.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        category: { type: 'string', enum: ['news', 'competitor', 'tech'] },
        source: { type: 'string' },
        url: { type: 'string' },
        date: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'category'],
    },
  },
  {
    name: 'delete_briefing',
    description: 'Delete a briefing item.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
];

// ── Resource Definitions ──
const RESOURCES = [
  {
    uri: 'meetings://list',
    name: 'All Meetings',
    description: 'List of all meetings in the database',
    mimeType: 'application/json',
  },
  {
    uri: 'projects://list',
    name: 'All Projects',
    description: 'List of all projects',
    mimeType: 'application/json',
  },
  {
    uri: 'roadmap://list',
    name: 'Roadmap Items',
    description: 'List of all roadmap items',
    mimeType: 'application/json',
  },
  {
    uri: 'briefings://list',
    name: 'All Briefings',
    description: 'List of all briefing items',
    mimeType: 'application/json',
  },
  {
    uri: 'meetings://departments',
    name: 'Departments',
    description: 'List of all departments',
    mimeType: 'application/json',
  },
  {
    uriPattern: 'meetings://{id}',
    name: 'Single Meeting',
    description: 'Full detail of a specific meeting by ID',
    mimeType: 'application/json',
  },
];

// ── Prompt Definitions ──
const PROMPTS = [
  {
    name: 'summarize-meeting',
    description: 'Summarize a meeting transcript and extract action items',
    arguments: [
      { name: 'transcript', description: 'The meeting transcript text', required: true },
      { name: 'language', description: 'Language for summary (th/en)', required: false },
    ],
  },
  {
    name: 'daily-brief',
    description: 'Briefing template: recent meetings, action items, and project status',
    arguments: [
      { name: 'department', description: 'Filter by department', required: false },
    ],
  },
  {
    name: 'project-status',
    description: 'Get project status overview — what was done, in progress, and next',
    arguments: [
      { name: 'module', description: 'Filter by module/project name', required: false },
    ],
  },
];

// ── Backend API helpers ──

async function apiGet(path) {
  const url = `${BACKEND_URL}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function apiPost(path, body) {
  const url = `${BACKEND_URL}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

async function apiDelete(path) {
  const url = `${BACKEND_URL}${path}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

// ── Tool Handlers ──

async function handleToolsCall(name, args) {
  switch (name) {
    case 'list_meetings': {
      const meetings = await apiGet('/api/meetings');
      let filtered = meetings;

      if (args?.department && args.department !== 'All') {
        filtered = filtered.filter(m =>
          m.departments?.includes(args.department) || m.department === args.department
        );
      }

      if (args?.search) {
        const q = args.search.toLowerCase();
        filtered = filtered.filter(m =>
          m.title?.toLowerCase().includes(q) ||
          m.transcript?.toLowerCase().includes(q) ||
          m.summary?.toLowerCase().includes(q)
        );
      }

      if (args?.limit) filtered = filtered.slice(0, args.limit);

      const result = filtered.map(m => ({
        id: m.id,
        title: m.title,
        date: m.date,
        departments: m.departments || [m.department].filter(Boolean),
        duration: m.duration,
        summary: m.summary?.slice(0, 200),
        actionItemCount: m.actionItems?.length || 0,
      }));

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    case 'get_meeting': {
      if (!args?.id) throw new Error('Meeting ID required');
      const meeting = await apiGet(`/api/meetings/${args.id}`);

      return {
        content: [{ type: 'text', text: JSON.stringify(meeting, null, 2) }],
      };
    }

    case 'create_meeting': {
      if (!args?.title) throw new Error('Title required');

      const meeting = {
        id: `mtg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: args.title,
        transcript: args.transcript || '',
        summary: args.summary || '',
        actionItems: args.actionItems || [],
        departments: args.departments || [],
        department: args.departments?.[0] || '',
        date: args.date || new Date().toISOString(),
        duration: args.duration || 0,
        status: 'completed',
        provider: 'local',
      };

      const result = await apiPost('/api/meetings', meeting);

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    case 'summarize_transcript': {
      if (!args?.transcript) throw new Error('Transcript required');

      const result = await apiPost('/api/local-ai/summarize', {
        transcript: args.transcript,
        endpoint: args.endpoint || 'http://localhost:11434',
        model: args.model || 'gemma3:12b',
      });

      return {
        content: [
          { type: 'text', text: result.report || result.summary },
          { type: 'text', text: `\n\nSUMMARY: ${result.summary}` },
          { type: 'text', text: `\nACTION_ITEMS: ${(result.actionItems || []).join(' | ')}` },
        ],
      };
    }

    case 'search_meetings': {
      if (!args?.query) throw new Error('Query required');
      const meetings = await apiGet('/api/meetings');
      const q = args.query.toLowerCase();

      const found = meetings.filter(m =>
        m.title?.toLowerCase().includes(q) ||
        m.transcript?.toLowerCase().includes(q) ||
        m.summary?.toLowerCase().includes(q) ||
        m.actionItems?.some(a => a.toLowerCase().includes(q))
      );

      const result = (args.limit ? found.slice(0, args.limit) : found).map(m => ({
        id: m.id,
        title: m.title,
        date: m.date,
        departments: m.departments || [m.department].filter(Boolean),
        summary: m.summary?.slice(0, 200),
      }));

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    case 'delete_meeting': {
      if (!args?.id) throw new Error('Meeting ID required');
      await apiDelete(`/api/meetings/${args.id}`);
      return {
        content: [{ type: 'text', text: `Meeting ${args.id} deleted` }],
      };
    }

    case 'list_departments': {
      const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
      return {
        content: [{ type: 'text', text: JSON.stringify(departments) }],
      };
    }

    // ── Projects ──
    case 'list_projects': {
      const projects = await apiGet('/api/projects');
      let pf = projects;
      if (args?.status) pf = pf.filter(p => p.status === args.status);
      if (args?.department) pf = pf.filter(p => p.department === args.department);
      return { content: [{ type: 'text', text: JSON.stringify(pf, null, 2) }] };
    }

    case 'get_project': {
      return { content: [{ type: 'text', text: JSON.stringify(await apiGet(`/api/projects/${args.id}`), null, 2) }] };
    }

    case 'create_project': {
      const p = await apiPost('/api/projects', args);
      return { content: [{ type: 'text', text: JSON.stringify(p, null, 2) }] };
    }

    case 'update_project': {
      const { id, ...updates } = args;
      const up = await apiGet(`/api/projects/${id}`);
      const merged = { ...up, ...updates };
      const result = await apiPost(`/api/projects/${id}`, merged);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    case 'delete_project': {
      await apiDelete(`/api/projects/${args.id}`);
      return { content: [{ type: 'text', text: `Project ${args.id} deleted` }] };
    }

    // ── Roadmap ──
    case 'list_roadmap': {
      const roadmap = await apiGet('/api/roadmap');
      let rf = roadmap;
      if (args?.department) rf = rf.filter(r => r.department === args.department);
      if (args?.quarter) rf = rf.filter(r => r.quarter === args.quarter);
      if (args?.year) rf = rf.filter(r => r.year === args.year);
      if (args?.status) rf = rf.filter(r => r.status === args.status);
      return { content: [{ type: 'text', text: JSON.stringify(rf, null, 2) }] };
    }

    case 'add_roadmap_item': {
      const ri = await apiPost('/api/roadmap', args);
      return { content: [{ type: 'text', text: JSON.stringify(ri, null, 2) }] };
    }

    case 'update_roadmap_item': {
      const { id: rid, ...rupdates } = args;
      const rItem = await apiGet(`/api/roadmap/${rid}`);
      const rMerged = { ...rItem, ...rupdates };
      const rResult = await apiPost(`/api/roadmap/${rid}`, rMerged);
      return { content: [{ type: 'text', text: JSON.stringify(rResult, null, 2) }] };
    }

    case 'delete_roadmap_item': {
      await apiDelete(`/api/roadmap/${args.id}`);
      return { content: [{ type: 'text', text: `Roadmap item ${args.id} deleted` }] };
    }

    // ── Briefing ──
    case 'list_briefings': {
      const briefings = await apiGet('/api/briefings');
      let bf = briefings;
      if (args?.category && args.category !== 'all') bf = bf.filter(b => b.category === args.category);
      if (args?.limit) bf = bf.slice(0, args.limit);
      return { content: [{ type: 'text', text: JSON.stringify(bf, null, 2) }] };
    }

    case 'add_briefing': {
      const br = await apiPost('/api/briefings', args);
      return { content: [{ type: 'text', text: JSON.stringify(br, null, 2) }] };
    }

    case 'delete_briefing': {
      await apiDelete(`/api/briefings/${args.id}`);
      return { content: [{ type: 'text', text: `Briefing ${args.id} deleted` }] };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── Resource Handlers ──

async function handleResourcesRead(uri) {
  if (uri === 'meetings://list') {
    const meetings = await apiGet('/api/meetings');
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(meetings, null, 2),
      }],
    };
  }

  if (uri === 'meetings://departments') {
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']),
      }],
    };
  }

  if (uri === 'projects://list') {
    const projects = await apiGet('/api/projects');
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(projects, null, 2) }],
    };
  }

  if (uri === 'roadmap://list') {
    const roadmap = await apiGet('/api/roadmap');
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(roadmap, null, 2) }],
    };
  }

  if (uri === 'briefings://list') {
    const briefings = await apiGet('/api/briefings');
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(briefings, null, 2) }],
    };
  }

  const idMatch = uri.match(/^meetings:\/\/(.+)$/);
  if (idMatch) {
    const meetingId = idMatch[1];
    const meeting = await apiGet(`/api/meetings/${meetingId}`);
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(meeting, null, 2),
      }],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
}

// ── Prompt Handlers ──

async function handlePromptsGet(name, args) {
  switch (name) {
    case 'summarize-meeting': {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please summarize this meeting transcript and extract action items:\n\n${args?.transcript || ''}`,
            },
          },
        ],
        description: `Summarize meeting${args?.language ? ` in ${args.language}` : ''}`,
      };
    }

    case 'daily-brief': {
      const deptFilter = args?.department ? ` for ${args.department}` : '';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a daily briefing${deptFilter} with:
1. Recent meetings and their key decisions
2. Pending action items
3. Project status overview

Use the list_meetings and search_meetings tools to gather data first.`,
            },
          },
        ],
        description: `Daily briefing${deptFilter}`,
      };
    }

    case 'project-status': {
      const moduleFilter = args?.module ? ` related to ${args.module}` : '';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Provide a project status overview${moduleFilter}:
- What has been completed (look for meetings with "done", "complete", "launch" keywords)
- What is in progress
- What is planned next
- Key decisions and action items

Search through meeting transcripts and summaries to gather information.`,
            },
          },
        ],
        description: `Project status${moduleFilter}`,
      };
    }

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}

// ── MCP Protocol Implementation ──

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

async function handleMessage(msg) {
  if (!msg || !msg.id || !msg.method) return;

  const response = { jsonrpc: '2.0', id: msg.id };

  try {
    switch (msg.method) {
      // ── Lifecycle ──
      case 'initialize': {
        response.result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
          serverInfo: MCP_SERVER_INFO,
        };
        break;
      }

      case 'notifications/initialized': {
        response.result = null;
        break;
      }

      // ── Tools ──
      case 'tools/list': {
        response.result = { tools: TOOLS };
        break;
      }

      case 'tools/call': {
        const result = await handleToolsCall(msg.params.name, msg.params.arguments);
        response.result = result;
        break;
      }

      // ── Resources ──
      case 'resources/list': {
        response.result = { resources: RESOURCES };
        break;
      }

      case 'resources/read': {
        const result = await handleResourcesRead(msg.params.uri);
        response.result = result;
        break;
      }

      // ── Prompts ──
      case 'prompts/list': {
        response.result = { prompts: PROMPTS };
        break;
      }

      case 'prompts/get': {
        const result = await handlePromptsGet(msg.params.name, msg.params.arguments);
        response.result = result;
        break;
      }

      default:
        response.error = { code: -32601, message: `Method not found: ${msg.method}` };
    }
  } catch (err) {
    response.error = {
      code: -32603,
      message: err.message || 'Internal error',
    };
  }

  if (response.result !== null || response.error) {
    process.stdout.write(JSON.stringify(response) + '\n');
  }
}

// ── Main ──

let buffer = '';
rl.on('line', (line) => {
  buffer += line;
  try {
    const msg = JSON.parse(buffer);
    buffer = '';
    handleMessage(msg);
  } catch {
    // Incomplete JSON — wait for more data
  }
});

rl.on('close', () => {
  process.exit(0);
});

// Signal ready
process.stderr.write('[mcp-server] Cat Meeting MCP Server started\n');
process.stderr.write(`[mcp-server] Backend: ${BACKEND_URL}\n`);
process.stderr.write(`[mcp-server] Tools: ${TOOLS.map(t => t.name).join(', ')}\n`);
