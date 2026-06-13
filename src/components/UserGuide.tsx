import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Upload, Bot, Settings, FolderOpen, 
  ChevronDown, Play, CheckCircle2, AlertCircle,
  Mic, FileAudio, Key, Cpu, Download,
  MousePointer, ArrowRight, Zap, HelpCircle
} from 'lucide-react';

interface Step {
  title: string;
  description: string;
  icon: React.ElementType;
  details?: string[];
  tip?: string;
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  steps: Step[];
}

const sections: Section[] = [
  {
    id: 'quickstart',
    title: '🚀 เริ่มต้นใช้งาน (Quick Start)',
    icon: Zap,
    steps: [
      {
        title: 'Step 1: ติดตั้งและเปิดแอป',
        description: 'รัน setup.bat เพื่อติดตั้ง จากนั้นเปิดด้วย run_app.vbs',
        icon: Play,
        details: [
          'Double-click setup.bat (รันครั้งแรกครั้งเดียว)',
          'รอให้ติดตั้ง dependencies เสร็จ',
          'Double-click run_app.vbs เพื่อเปิดแอป',
          'Browser จะเปิดขึ้นมาอัตโนมัติ',
        ],
        tip: 'ถ้า Antivirus block .vbs ให้ใช้ start_app.bat แทน',
      },
      {
        title: 'Step 2: Upload ไฟล์เสียง',
        description: 'ลากไฟล์เสียงการประชุมมาวาง หรือคลิกเพื่อเลือกไฟล์',
        icon: Upload,
        details: [
          'รองรับ: MP3, WAV, M4A, WebM, OGG, FLAC',
          'ขนาดไฟล์สูงสุด: 100MB (Local) หรือ 25MB (OpenAI)',
          'ตั้งชื่อ Meeting และเลือก Department',
          'กด "Transcribe" เพื่อแปลงเสียงเป็นข้อความ',
        ],
      },
      {
        title: 'Step 3: ใช้ AI วิเคราะห์',
        description: 'ไปที่ AI Assistant แล้วเลือก Meeting ที่ต้องการวิเคราะห์',
        icon: Bot,
        details: [
          'ใส่ Claude API Key (ได้จาก console.anthropic.com)',
          'เลือก Meeting จาก dropdown',
          'ใช้ Quick Actions หรือพิมพ์คำถามเอง',
          'AI จะวิเคราะห์และตอบเป็นภาษาไทย',
        ],
        tip: 'Claude API มี free tier $5 สำหรับเริ่มต้น',
      },
    ],
  },
  {
    id: 'upload',
    title: '📁 การ Upload ไฟล์เสียง',
    icon: Upload,
    steps: [
      {
        title: 'รูปแบบไฟล์ที่รองรับ',
        description: 'แอปรองรับไฟล์เสียงหลายรูปแบบ',
        icon: FileAudio,
        details: [
          'MP3 — แนะนำ (ไฟล์เล็ก, quality ดี)',
          'WAV — Lossless (ไฟล์ใหญ่กว่า)',
          'M4A — จาก iPhone/Mac',
          'WebM — จาก browser recording',
          'OGG, FLAC — รูปแบบอื่นๆ',
        ],
      },
      {
        title: 'วิธี Upload',
        description: 'มี 2 วิธีในการ upload ไฟล์',
        icon: MousePointer,
        details: [
          '1. Drag & Drop: ลากไฟล์มาวางในกรอบ',
          '2. Click: คลิกที่กรอบแล้วเลือกไฟล์',
          'ระบบจะแสดงชื่อไฟล์และขนาด',
          'ตั้งชื่อ Meeting และเลือก Department',
        ],
      },
      {
        title: 'การ Transcribe',
        description: 'แปลงเสียงเป็นข้อความด้วย Whisper',
        icon: Mic,
        details: [
          'กดปุ่ม "Transcribe with [Provider]"',
          'รอระบบประมวลผล (1-5 นาที ขึ้นกับความยาว)',
          'ระบบจะสร้าง Summary และ Action Items อัตโนมัติ',
          'ผลลัพธ์จะถูกบันทึกใน Meeting History',
        ],
        tip: 'ไฟล์ยาว 1 ชม. ใช้เวลาประมาณ 2-5 นาที',
      },
    ],
  },
  {
    id: 'ai',
    title: '🤖 การใช้ AI Assistant',
    icon: Bot,
    steps: [
      {
        title: 'ตั้งค่า API Key',
        description: 'ต้องมี Claude API Key เพื่อใช้งาน AI',
        icon: Key,
        details: [
          '1. ไปที่ console.anthropic.com',
          '2. สมัครสมาชิก/เข้าสู่ระบบ',
          '3. ไปที่ API Keys แล้วสร้าง key ใหม่',
          '4. Copy key (เริ่มด้วย sk-ant-)',
          '5. วางใน AI Assistant หรือ Settings',
        ],
        tip: 'Key จะถูกเก็บใน browser (localStorage) ไม่ส่งไปไหน',
      },
      {
        title: 'เลือก Meeting',
        description: 'เลือก Meeting ที่ต้องการให้ AI วิเคราะห์',
        icon: FolderOpen,
        details: [
          'คลิก dropdown "Select a meeting to analyze"',
          'เลือก Meeting จากรายการ',
          'AI จะโหลด transcript ของ Meeting นั้น',
          'พร้อมตอบคำถามเกี่ยวกับเนื้อหา',
        ],
      },
      {
        title: 'Quick Actions',
        description: 'ปุ่มลัด 6 รายการสำหรับวิเคราะห์รูปแบบต่างๆ',
        icon: Zap,
        details: [
          '📄 Full Report — รายงานการประชุมแบบเต็มรูปแบบ',
          '✨ Executive Summary — สรุปสั้น ใจความสำคัญ',
          '✅ Action Items — รายการสิ่งที่ต้องทำ พร้อมผู้รับผิดชอบ',
          '👥 Department Tasks — แบ่งงานตามแผนก',
          '🎯 Key Decisions — การตัดสินใจที่สำคัญ',
          '⚠️ Risks & Blockers — ความเสี่ยงและอุปสรรค',
        ],
      },
      {
        title: 'ถามคำถามเพิ่มเติม',
        description: 'พิมพ์คำถามอะไรก็ได้เกี่ยวกับ Meeting',
        icon: HelpCircle,
        details: [
          '"มีใครพูดถึงเรื่อง budget บ้าง?"',
          '"Deadline ของ project นี้คือเมื่อไหร่?"',
          '"สรุปประเด็นที่ทีม Marketing ต้องทำ"',
          '"มีความเสี่ยงอะไรบ้างที่ถูกพูดถึง?"',
        ],
        tip: 'AI จำบทสนทนาได้ ถามต่อเนื่องได้เลย',
      },
    ],
  },
  {
    id: 'settings',
    title: '⚙️ การตั้งค่า',
    icon: Settings,
    steps: [
      {
        title: 'เลือก STT Provider',
        description: 'เลือกบริการแปลงเสียงเป็นข้อความ',
        icon: Cpu,
        details: [
          '🖥️ Local Whisper — ฟรี, ทำงานบนเครื่อง (default)',
          '🤖 OpenAI Whisper — แม่นยำสูง, $0.006/นาที',
          '🔵 Google STT — 60 นาทีฟรี/เดือน',
          '🟣 AssemblyAI — $50 credit ฟรี',
          '🟢 Deepgram — $200 credit ฟรี',
        ],
      },
      {
        title: 'Local Whisper Settings',
        description: 'ตั้งค่า Model และภาษาสำหรับ Local Whisper',
        icon: Download,
        details: [
          'Model Size: tiny/base/small/medium/large',
          'แนะนำ: base (สมดุล speed/accuracy)',
          'Language: Thai, English, Auto-detect',
          'Model จะ download อัตโนมัติครั้งแรก',
        ],
        tip: 'Model ใหญ่ = แม่นยำกว่า แต่ช้ากว่า',
      },
      {
        title: 'API Keys',
        description: 'ใส่ API Keys สำหรับบริการต่างๆ',
        icon: Key,
        details: [
          'Claude — สำหรับ AI Assistant (แนะนำ)',
          'OpenAI — สำหรับ Whisper API',
          'Google — สำหรับ Google STT',
          'AssemblyAI / Deepgram — ทางเลือกอื่น',
        ],
        tip: 'Keys เก็บใน browser เท่านั้น ไม่ส่งไป server',
      },
    ],
  },
  {
    id: 'history',
    title: '📂 Meeting History',
    icon: FolderOpen,
    steps: [
      {
        title: 'ดูรายการ Meeting',
        description: 'ดู Meeting ทั้งหมดที่เคย transcribe',
        icon: FolderOpen,
        details: [
          'เรียงตามวันที่ (ล่าสุดอยู่บนสุด)',
          'แสดง: ชื่อ, Department, วันที่, ความยาว',
          'Badge สีต่างกันตาม Department',
          'คลิกเพื่อดูรายละเอียด',
        ],
      },
      {
        title: 'ค้นหาและ Filter',
        description: 'ค้นหา Meeting ที่ต้องการ',
        icon: FolderOpen,
        details: [
          'Search: พิมพ์ชื่อหรือเนื้อหา transcript',
          'Filter: เลือก Department ที่ต้องการดู',
          'All: แสดงทุก Meeting',
          'ตัวเลขแสดงจำนวน Meeting ที่พบ',
        ],
      },
      {
        title: 'ดูรายละเอียด',
        description: 'คลิกที่ Meeting เพื่อดูข้อมูลเต็ม',
        icon: FileAudio,
        details: [
          '📝 Transcript — ข้อความเต็มจากการประชุม',
          '✨ Summary — สรุปใจความสำคัญ',
          '✅ Action Items — รายการสิ่งที่ต้องทำ',
          '🗑️ Delete — ลบ Meeting (มี confirm)',
        ],
      },
    ],
  },
  {
    id: 'scripts',
    title: '🖥️ การรันบนเครื่อง',
    icon: Play,
    steps: [
      {
        title: 'setup.bat',
        description: 'ติดตั้งระบบครั้งแรก (รันครั้งเดียว)',
        icon: Download,
        details: [
          'ตรวจสอบ Node.js + npm',
          'ติดตั้ง frontend dependencies (npm install)',
          'ติดตั้ง backend dependencies (npm install ใน backend/)',
        ],
        tip: 'ต้องติดตั้ง Node.js ก่อน (nodejs.org)',
      },
      {
        title: 'start_app.bat',
        description: 'เปิดแอป (แนะนำ)',
        icon: Play,
        details: [
          'Double-click เพื่อเปิด backend (:8080) และ frontend (:5174)',
          'backend ใช้ Express + SQLite',
          'frontend ใช้ Vite + React',
          'เปิด browser ไปที่ http://localhost:5174',
        ],
        tip: 'ถ้า Antivirus block .vbs ให้ใช้ start_app.bat แทน',
      },
      {
        title: 'stop_app.bat',
        description: 'ปิด backend + frontend',
        icon: AlertCircle,
        details: [
          'Kill process บน port 8080 (backend)',
          'Kill process บน port 5174 (frontend)',
          'ปิด Vite และ Node.js processes',
        ],
      },
    ],
  },
];

const faqs = [
  {
    q: 'ใช้งานฟรีได้ไหม?',
    a: 'ได้! ใช้ Local Whisper สำหรับ transcribe (ฟรี 100%) + Claude มี free credit $5 สำหรับ AI',
  },
  {
    q: 'ต้องเชื่อมต่อ Internet ไหม?',
    a: 'Local Whisper ไม่ต้อง แต่ AI Assistant ต้องใช้ Internet เพื่อเรียก Claude API',
  },
  {
    q: 'รองรับภาษาไทยไหม?',
    a: 'รองรับ! ทั้ง Whisper และ Claude รองรับภาษาไทยได้ดีมาก',
  },
  {
    q: 'ข้อมูลถูกส่งไป Cloud ไหม?',
    a: 'Local Whisper: ไม่ส่ง (ประมวลผลบนเครื่อง) | Cloud API: ส่งไฟล์เสียงไป server',
  },
  {
    q: 'ไฟล์เสียงยาวแค่ไหนได้?',
    a: 'Local: ไม่จำกัด | OpenAI: 25MB (~90 นาที MP3) | อื่นๆ: ไม่จำกัด',
  },
  {
    q: 'ใช้เวลา transcribe นานแค่ไหน?',
    a: 'ประมาณ 1-5 นาที สำหรับไฟล์ 1 ชม. (ขึ้นกับ provider และ hardware)',
  },
];

export default function UserGuide() {
  const [openSection, setOpenSection] = useState<string>('quickstart');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          คู่มือการใช้งาน
        </h2>
        <p className="text-slate-400 text-sm">
          เรียนรู้วิธีใช้งาน Meeting STT App — Upload เสียง, Transcribe, และวิเคราะห์ด้วย AI
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {sections.map(section => {
          const Icon = section.icon;
          const isActive = openSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setOpenSection(section.id)}
              className={`neo-btn p-3 text-center transition-all ${
                isActive
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-medium">{section.id === 'quickstart' ? 'เริ่มต้น' : section.title.split(' ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        {sections.map(section => (
          openSection === section.id && (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-black text-white">{section.title}</h3>
              
              <div className="space-y-3">
                {section.steps.map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <div
                      key={i}
                      className="neo-card p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                          <StepIcon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-black mb-1">{step.title}</h4>
                          <p className="text-slate-400 text-sm mb-3">{step.description}</p>
                          
                          {step.details && (
                            <ul className="space-y-1.5 mb-3">
                              {step.details.map((detail, j) => (
                                <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                                  <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {step.tip && (
                            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <span className="text-amber-300 text-xs">{step.tip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* FAQs */}
      <div className="pt-6 border-t border-slate-800">
        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          คำถามที่พบบ่อย (FAQ)
        </h3>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="neo-card-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/60 transition-colors"
              >
                <span className="text-white text-sm font-medium">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <p className="text-slate-400 text-sm">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Support */}
      <div className="neo-card bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-white font-black mb-1">พร้อมใช้งานแล้ว!</h4>
              <p className="text-slate-400 text-sm mb-3">
                หากมีคำถามเพิ่มเติม หรือพบปัญหา สามารถ:
              </p>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• ดู Settings เพื่อตรวจสอบ API Keys</li>
                <li>• ตรวจสอบ console log ของ backend/frontend terminal</li>
                <li>• ลอง restart ด้วย stop_app.bat แล้ว start_app.bat ใหม่</li>
              </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
