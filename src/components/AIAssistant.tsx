import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, Loader2, FileText, AlertCircle, Key, 
  ChevronDown, MessageSquare, ClipboardList,
  Target, Users, Sparkles, CheckCircle2, RotateCcw
} from 'lucide-react';
import { Meeting, ChatMessage } from '../types';
import { loadMeetings, getClaudeKey, hasClaudeKey, setApiKey } from '../store';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `คุณคือเลขาประจำองค์กรที่เชี่ยวชาญในการวิเคราะห์การประชุม ชื่อว่า "Meeting AI"

⚠️ ข้อความที่ได้รับอาจมีความคลาดเคลื่อนจากการแปลงเสียง (Speech-to-text errors):
- คำบางคำอาจถูกแปลงผิดเพี้ยน โดยเฉพาะชื่อคน ศัพท์เทคนิค หรือภาษาไทยปนอังกฤษ
- ให้ใช้ CONTEXT โดยรวมในการเดาความหมายที่ถูกต้อง
- ถ้าคำไหนไม่ชัดเจน ให้เดาจากบริบทของประโยคและหัวข้อที่พูดถึง
- อย่าแก้ไขข้อความโดยไม่จำเป็น แต่ถ้าชัดเจนว่าผิด ให้แก้ให้ถูกต้องตามบริบท
- หากไม่แน่ใจจริงๆ ให้คงคำเดิมไว้และใส่ [?] กำกับ

หน้าที่ของคุณ:
1. วิเคราะห์ transcript การประชุมและสรุปเป็นรายงานที่มีโครงสร้าง
2. ระบุงานของแต่ละแผนกที่เกี่ยวข้อง
3. บอกจุดประสงค์และความหมายของการประชุม
4. ดึง action items และ deadlines ที่สำคัญ
5. ระบุผู้รับผิดชอบงานแต่ละอย่าง (ถ้ามี)
6. ตอบคำถามเกี่ยวกับเนื้อหาการประชุม

รูปแบบการตอบ:
- ใช้ภาษาไทยเป็นหลัก (ยกเว้นคำศัพท์เฉพาะทาง)
- ตอบกระชับ ชัดเจน ใช้ bullet points
- เน้นข้อมูลที่ actionable
- ใช้ section headers ด้วย emoji (ตาม template ด้านล่าง)

เมื่อได้รับ transcript ใหม่ ให้วิเคราะห์ในรูปแบบรายงานดังนี้:

📋 รายงานการประชุม / MEETING REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 จุดประสงค์ / OBJECTIVE:
(1-2 ประโยค อธิบายวัตถุประสงค์หลักของการประชุม)

📌 เนื้อหาสำคัญ / KEY DISCUSSION POINTS:
• หัวข้อที่ 1
• หัวข้อที่ 2
• หัวข้อที่ 3

✅ Action Items:
• [ผู้รับผิดชอบ] งานที่ต้องทำ — Deadline (ถ้ามี)
• [ผู้รับผิดชอบ] งานที่ต้องทำ — Deadline (ถ้ามี)

📊 การตัดสินใจ / DECISIONS MADE:
• การตัดสินใจที่ 1
• การตัดสินใจที่ 2

👥 แผนกที่เกี่ยวข้อง / DEPARTMENTS INVOLVED:
• แผนก X: หน้าที่/ความรับผิดชอบ
• แผนก Y: หน้าที่/ความรับผิดชอบ

📅 แผนงานต่อไป / NEXT STEPS:
• ขั้นตอนถัดไปที่ 1
• ขั้นตอนถัดไปที่ 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

interface QuickAction {
  label: string;
  prompt: string;
  icon: React.ElementType;
}

const quickActions: QuickAction[] = [
  { label: 'Full Report', prompt: 'ช่วย generate รายงานการประชุมแบบเต็มรูปแบบ (Full Meeting Report) ตาม template ที่กำหนดให้หน่อย', icon: FileText },
  { label: 'Executive Summary', prompt: 'สรุปแบบ Executive Summary สั้นๆ ใจความสำคัญของการประชุมนี้ ใน 3-4 ประโยค', icon: Sparkles },
  { label: 'Action Items', prompt: 'สรุป Action Items ทั้งหมดจากการประชุมนี้ พร้อมผู้รับผิดชอบและ deadline (ถ้ามี)', icon: ClipboardList },
  { label: 'Department Tasks', prompt: 'แต่ละแผนกที่เกี่ยวข้องต้องทำอะไรบ้างจากการประชุมนี้? ระบุให้ชัดเจน', icon: Users },
  { label: 'Key Decisions', prompt: 'การตัดสินใจที่สำคัญในการประชุมนี้มีอะไรบ้าง?', icon: Target },
  { label: 'Risks & Blockers', prompt: 'มีความเสี่ยงหรืออุปสรรคอะไรบ้างที่ถูกพูดถึงในการประชุมนี้?', icon: AlertCircle },
];

const sectionIcons: Record<string, { icon: string; color: string }> = {
  '📋': { icon: '📋', color: 'border-l-indigo-500 bg-indigo-500/5' },
  '🎯': { icon: '🎯', color: 'border-l-rose-500 bg-rose-500/5' },
  '📌': { icon: '📌', color: 'border-l-sky-500 bg-sky-500/5' },
  '✅': { icon: '✅', color: 'border-l-emerald-500 bg-emerald-500/5' },
  '📊': { icon: '📊', color: 'border-l-amber-500 bg-amber-500/5' },
  '👥': { icon: '👥', color: 'border-l-violet-500 bg-violet-500/5' },
  '📅': { icon: '📅', color: 'border-l-cyan-500 bg-cyan-500/5' },
  '⏰': { icon: '⏰', color: 'border-l-red-500 bg-red-500/5' },
  '⚠': { icon: '⚠', color: 'border-l-orange-500 bg-orange-500/5' },
  '💡': { icon: '💡', color: 'border-l-yellow-500 bg-yellow-500/5' },
};

function ReportRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inBulletList = false;
  let bulletItems: string[] = [];

  const flushBullets = (key: string) => {
    if (bulletItems.length > 0) {
      elements.push(
        <ul key={key} className="space-y-1 my-2">
          {bulletItems.map((item, i) => (
            <li key={i} className="text-slate-300 text-sm flex items-start gap-2 ml-2">
              <span className="text-slate-500 mt-1 shrink-0">•</span>
              <span className="leading-relaxed font-medium">{item}</span>
            </li>
          ))}
        </ul>
      );
      bulletItems = [];
    }
    inBulletList = false;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const sectionMatch = Object.keys(sectionIcons).find(e => trimmed.startsWith(e));
    const isSeparator = trimmed.startsWith('━━━') || trimmed.startsWith('═══');
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.match(/^\d+[.)]/);

    if (isSeparator) {
      flushBullets(`sep-${i}`);
      elements.push(
        <div key={`sep-${i}`} className="border-t-2 border-[#3d3d5c] my-3" />
      );
      return;
    }

    if (sectionMatch) {
      flushBullets(`section-${i}`);
      const cfg = sectionIcons[sectionMatch];
      const title = trimmed.slice(sectionMatch.length).trim();
      elements.push(
        <div key={`section-${i}`} className={`border-l-[3px] ${cfg.color} pl-3 my-3 -ml-3`}>
          <span className="text-sm font-black text-white leading-relaxed">
            {sectionMatch} {title}
          </span>
        </div>
      );
      return;
    }

    if (isBullet) {
      inBulletList = true;
      const text = trimmed.startsWith('•') ? trimmed.slice(1).trim()
        : trimmed.startsWith('- ') ? trimmed.slice(2)
        : trimmed.replace(/^\d+[.)]\s*/, '');
      bulletItems.push(text);
      return;
    }

    if (trimmed === '') {
      flushBullets(`empty-${i}`);
      return;
    }

    flushBullets(`text-${i}`);
    if (trimmed.startsWith('[meeting]') || trimmed.startsWith('[transcript]')) {
      return;
    }
    elements.push(
      <p key={`p-${i}`} className="text-slate-300 text-sm leading-relaxed py-0.5 font-medium">
        {trimmed}
      </p>
    );
  });

  flushBullets('final');

  return <div className="space-y-0.5">{elements}</div>;
}

export default function AIAssistant() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMeetingSelect, setShowMeetingSelect] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>();
  
  const [apiKey, setApiKeyState] = useState(getClaudeKey() || '');
  const [showKeyInput, setShowKeyInput] = useState(!hasClaudeKey());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const refreshMeetings = async () => {
    const loaded = await loadMeetings();
    setMeetings(loaded);
  };

  useEffect(() => {
    refreshMeetings();
    if (hasClaudeKey()) {
      setShowKeyInput(false);
      setApiKeyState(getClaudeKey() || '');
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveApiKey = () => {
    if (apiKey && apiKey.startsWith('sk-ant-')) {
      setApiKey('claude', apiKey);
      setShowKeyInput(false);
      setError('');
    } else {
      setError('Invalid API key format. Claude keys start with "sk-ant-"');
    }
  };

  const callClaudeAPI = async (userMessage: string): Promise<string> => {
    const key = getClaudeKey();
    if (!key) throw new Error('Claude API key not configured');

    const conversationMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    let systemPromptWithContext = SYSTEM_PROMPT;
    if (selectedMeeting) {
      systemPromptWithContext = `${SYSTEM_PROMPT}

═══════════════════════════════════════════
MEETING CONTEXT (Always refer to this data):
═══════════════════════════════════════════
Title: ${selectedMeeting.title}
Department: ${selectedMeeting.department}
Date: ${new Date(selectedMeeting.date).toLocaleDateString('th-TH')}
Duration: ${Math.floor(selectedMeeting.duration / 60)} minutes

TRANSCRIPT:
${selectedMeeting.transcript}
═══════════════════════════════════════════`;
    }

    conversationMessages.push({ role: 'user', content: userMessage });

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPromptWithContext,
        messages: conversationMessages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    if (!hasClaudeKey()) {
      setError('กรุณาใส่ Claude API key ก่อน');
      setShowKeyInput(true);
      return;
    }

    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = undefined;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      meetingId: selectedMeeting?.id,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const response = await callClaudeAPI(text);
      
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        meetingId: selectedMeeting?.id,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setRetryCount(0);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMessage);
      
      if (retryCount < 2 && (errorMessage.includes('rate limit') || errorMessage.includes('timeout'))) {
        const nextCount = retryCount + 1;
        setRetryCount(nextCount);
        setError(`${errorMessage} -- Retrying... (${nextCount}/3)`);
        retryTimer.current = setTimeout(() => {
          retryTimer.current = undefined;
          sendMessage(text);
        }, 2000);
        return;
      }
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingSelect(false);
    setMessages([]);
    setTimeout(() => {
      sendMessage('ช่วยวิเคราะห์การประชุมนี้ให้หน่อย');
    }, 100);
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedMeeting(null);
  };

    useEffect(() => {
    return () => {
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
    };
  }, []);

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-4 h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)] flex flex-col">
      <div className="shrink-0">
        <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2 tracking-tight">
          <Bot className="w-6 h-6 text-cyan-400" />
          AI Meeting Assistant
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          เลขา AI ที่ช่วยวิเคราะห์และตอบคำถามเกี่ยวกับการประชุม — Powered by{' '}
          <span className="text-cyan-300 font-bold">Claude</span>
        </p>
      </div>

      {showKeyInput && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="neo-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-4 h-4 text-amber-400" />
            <span className="text-white font-bold text-sm">Claude API Key Required</span>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="neo-input flex-1 px-4 py-2.5 text-sm font-mono placeholder:text-slate-600"
            />
            <button
              onClick={saveApiKey}
              className="neo-btn px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold"
            >
              Save
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-2 font-medium">
            Get your key from{' '}
            <a href="https://console.anthropic.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline font-bold">
              console.anthropic.com
            </a>
          </p>
        </motion.div>
      )}

      {error && (
        <div className="neo-card p-3 bg-red-500/10 border-red-400/40 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-300" />
            <span className="text-red-200 text-sm font-medium">{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-white font-bold">×</button>
          </div>
        </div>
      )}

      <div className="relative shrink-0">
        <button
          onClick={() => setShowMeetingSelect(!showMeetingSelect)}
          className="neo-btn w-full flex items-center justify-between px-4 py-3 bg-[#25253e] text-left"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-cyan-400" />
            {selectedMeeting ? (
              <div>
                <p className="text-white text-sm font-bold">{selectedMeeting.title}</p>
                <p className="text-slate-500 text-xs font-medium">{selectedMeeting.department} • {new Date(selectedMeeting.date).toLocaleDateString('th-TH')}</p>
              </div>
            ) : (
              <span className="text-slate-400 text-sm font-bold">Select a meeting to analyze...</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showMeetingSelect ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showMeetingSelect && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 neo-card z-20 max-h-64 overflow-y-auto p-1"
            >
              {meetings.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm font-bold">
                  No meetings found. Upload audio first.
                </div>
              ) : (
                meetings.map(meeting => (
                  <button
                    key={meeting.id}
                    onClick={() => selectMeeting(meeting)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a4a] transition-colors text-left border-b-2 border-[#3d3d5c] last:border-0 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center shrink-0 border-2 border-cyan-400/30">
                      <FileText className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{meeting.title}</p>
                      <p className="text-slate-500 text-xs font-medium">{meeting.department}</p>
                    </div>
                    <span className="text-slate-600 text-xs font-bold shrink-0">
                      {new Date(meeting.date).toLocaleDateString('th-TH')}
                    </span>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedMeeting && messages.length === 0 && !isLoading && (
        <div className="grid grid-cols-2 gap-2 shrink-0">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => sendMessage(action.prompt)}
                className="neo-btn flex items-center gap-2 px-3 py-2.5 bg-[#25253e] text-sm font-bold text-slate-300 hover:text-white"
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {messages.length === 0 && !selectedMeeting && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 border-2 border-cyan-400/30">
              <MessageSquare className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-white font-black mb-2 tracking-tight">Select a Meeting</h3>
            <p className="text-slate-500 text-sm max-w-xs font-medium">
              เลือก meeting จากด้านบนเพื่อเริ่มถาม AI เกี่ยวกับเนื้อหาการประชุม
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] ${message.role === 'user' ? 'order-1' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 border-2 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-400/60 shadow-[3px_3px_0_0_rgba(244,114,182,0.25)]'
                    : 'bg-[#25253e] border-[#3d3d5c] text-slate-200 shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]'
                }`}>
                  {message.role === 'assistant' ? (
                    <ReportRenderer content={message.content} />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{message.content}</p>
                  )}
                </div>
                <p className={`text-[10px] text-slate-600 mt-1 font-bold ${message.role === 'user' ? 'text-right' : ''}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center border-2 border-cyan-400/30">
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="neo-card-sm flex items-center gap-2 px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span className="text-slate-400 text-sm font-bold">กำลังคิด...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 space-y-2">
        {messages.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Clear chat
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedMeeting ? "ถามอะไรก็ได้เกี่ยวกับการประชุมนี้..." : "Select a meeting first..."}
            disabled={!selectedMeeting || isLoading}
            rows={1}
            className="neo-input flex-1 px-4 py-3 text-sm placeholder:text-slate-600 disabled:opacity-50 resize-none"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || !selectedMeeting || isLoading}
            className="neo-btn px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white disabled:from-slate-700 disabled:to-slate-700"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className={`flex items-center gap-1.5 ${hasClaudeKey() ? 'text-emerald-300' : 'text-amber-300'} font-bold`}>
            {hasClaudeKey() ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>Claude API connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                <span>API key required</span>
              </>
            )}
          </div>
          {hasClaudeKey() && (
            <button
              onClick={() => setShowKeyInput(true)}
              className="text-slate-500 hover:text-white font-bold transition-colors"
            >
              Change key
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
