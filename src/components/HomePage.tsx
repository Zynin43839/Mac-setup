import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Upload, Mic, FileText } from 'lucide-react';

interface Props {
  onGetStarted: () => void;
}

function CatMochi() {
  return (
    <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-48 md:h-48">
      <defs>
        <linearGradient id="mochiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8e0e0" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="140" rx="48" ry="42" fill="#2a2a4a" />

      <path d="M 145 155 Q 170 140 168 115 Q 166 100 158 105" stroke="#2a2a4a" strokeWidth="8" fill="none" strokeLinecap="round" />

      <polygon points="65,48 52,10 85,38" fill="#2a2a4a" />
      <polygon points="67,45 57,18 81,39" fill="#f59e0b" />

      <polygon points="135,48 148,10 115,38" fill="#2a2a4a" />
      <polygon points="133,45 143,18 119,39" fill="#f59e0b" />

      <circle cx="100" cy="82" r="44" fill="#2a2a4a" />

      <ellipse cx="82" cy="78" rx="6" ry="8" fill="#1a1a2e" />
      <ellipse cx="118" cy="78" rx="6" ry="8" fill="#1a1a2e" />
      <circle cx="84" cy="74" r="2.5" fill="white" />
      <circle cx="116" cy="74" r="2.5" fill="white" />
      <circle cx="80" cy="80" r="1.2" fill="white" opacity="0.6" />
      <circle cx="120" cy="80" r="1.2" fill="white" opacity="0.6" />

      <ellipse cx="68" cy="90" rx="7" ry="4" fill="#fb923c" opacity="0.35" />
      <ellipse cx="132" cy="90" rx="7" ry="4" fill="#fb923c" opacity="0.35" />

      <ellipse cx="100" cy="88" rx="3" ry="2" fill="#f59e0b" />

      <path d="M 95 93 Q 100 98 105 93" stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round" />

      <line x1="50" y1="82" x2="72" y2="86" stroke="#3d3d5c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="90" x2="72" y2="90" stroke="#3d3d5c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="128" y1="86" x2="150" y2="82" stroke="#3d3d5c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="128" y1="90" x2="150" y2="90" stroke="#3d3d5c" strokeWidth="1.5" strokeLinecap="round" />

      <ellipse cx="74" cy="116" rx="11" ry="8" fill="#2a2a4a" transform="rotate(-15, 74, 116)" />
      <ellipse cx="126" cy="116" rx="11" ry="8" fill="#2a2a4a" transform="rotate(15, 126, 116)" />

      <circle cx="100" cy="110" r="17" fill="url(#mochiGrad)" />
      <circle cx="94" cy="105" r="4" fill="#f5f0f0" opacity="0.8" />
      <circle cx="107" cy="104" r="3" fill="#f5f0f0" opacity="0.6" />
      <circle cx="100" cy="116" r="3" fill="#d5d0d0" opacity="0.4" />

      <path d="M 95 94 Q 100 90 105 94 Q 102 97 100 97 Q 98 97 95 94" fill="#1a1a2e" />
    </svg>
  );
}

const messages = [
  { text: 'ทุกการประชุมคือโอกาส', sub: 'คุณทำได้ดีที่สุดแล้ว เหมียว!' },
  { text: 'เปลี่ยนทุกคำพูด', sub: 'ให้เป็นบันทึกที่มีค่า' },
  { text: 'สู้ ๆ นะ', sub: 'แมวน้อยเป็นกำลังใจให้' },
  { text: 'ไม่ต้องเก่งที่สุด', sub: 'แค่กล้าที่จะเริ่มก็พอ' },
  { text: 'ทุกก้าวเล็ก ๆ', sub: 'พาไปถึงเป้าหมายใหญ่' },
  { text: 'วันนี้ต้องเจ๋ง', sub: 'เหมียว ๆ เชียร์อยู่' },
  { text: 'เชื่อมั่นในตัวเอง', sub: 'คุณมีดีมากกว่าที่คิด' },
  { text: 'ทำวันนี้ให้ดีที่สุด', sub: 'เหมียวน้อยรอชมความสำเร็จ' },
  { text: ' Failure is just a stepping stone', sub: 'แมวเคยตกปลา ก็ยังลุกขึ้นใหม่' },
  { text: 'You got this!', sub: 'เหมียว ๆ เอาใจช่วย' },
  { text: 'ทุกครั้งที่ล้ม', sub: 'คือการเตรียมพร้อมที่จะลุก' },
  { text: 'อย่ากลัวที่จะลอง', sub: 'แมวน้อยก็เคยเดินเตาะแตะ' },
  { text: 'ความพยายามไม่เคยทรยศ', sub: 'สู้ ๆ เหมียวอยู่ข้างเธอ' },
  { text: 'Small wins matter', sub: 'สะสมทีละนิด ไปให้ถึงฝัน' },
  { text: 'เธอเก่งกว่าเมื่อวาน', sub: 'แค่นี้ก็ภูมิใจได้แล้ว' },
  { text: 'เหมียวขอให้ประชุมเสร็จไว ๆ', sub: 'แล้วไปกินมัจจะด้วยกันนะ' },
  { text: 'ไม่มีใคร perfect', sub: 'แต่ทุกคนมีดีในแบบของตัวเอง' },
  { text: 'เริ่มต้นใหม่ไม่ใช่เรื่องผิด', sub: 'แมวน้อยตกปลาหลายรอบกว่าจะจับได้' },
];

export default function HomePage({ onGetStarted }: Props) {
  const msg = useMemo(() => messages[Math.floor(Math.random() * messages.length)], []);

  return (
    <div className="space-y-10 pt-2">
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 180, delay: 0.15 }}
          className="flex justify-center"
        >
          <div className="relative">
            <CatMochi />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute -top-2 -right-2 text-2xl"
            >
              🍡
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            ยินดีต้อนรับสู่{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">
              Cat Meeting
            </span>
          </h1>
          <p className="text-slate-300 text-base md:text-lg font-medium max-w-lg mx-auto leading-relaxed">
            แมวน้อยกินมัจจะ เป็นกำลังใจให้ทุกการประชุมนะ
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <motion.div
            key={msg.text}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', damping: 15, stiffness: 150 }}
            className="neo-card-sm px-6 py-4 border-l-[3px] border-l-amber-400 max-w-sm"
          >
            <p className="text-white text-base font-bold">{msg.text}</p>
            <p className="text-amber-400/70 text-xs font-medium mt-1">{msg.sub}</p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <button
            onClick={onGetStarted}
            className="neo-btn inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-8 py-3.5 text-base shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,0.4)]"
          >
            <Sparkles className="w-5 h-5" />
            เริ่มต้นใช้งาน
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto"
      >
        {[
          { icon: Upload, label: 'อัปโหลดไฟล์เสียง', desc: 'MP3, WAV, M4A', color: 'border-l-amber-400' },
          { icon: Mic, label: 'AI ถอดเทป', desc: 'Whisper + Claude', color: 'border-l-cyan-400' },
          { icon: FileText, label: 'สรุปผลประชุม', desc: 'Action Items อัตโนมัติ', color: 'border-l-emerald-400' },
        ].map((feat, i) => (
          <div key={i} className={`neo-card p-4 text-center border-l-[3px] ${feat.color}`}>
            <feat.icon className="w-6 h-6 text-white mx-auto mb-1.5 opacity-70" />
            <h3 className="text-white font-bold text-xs mb-0.5">{feat.label}</h3>
            <p className="text-slate-500 text-[10px] font-medium">{feat.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
