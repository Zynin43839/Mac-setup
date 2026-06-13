import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { analysisData } from '../data/analysis';

export default function AnalysisPanel() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">📋 Requirement Analysis</h2>
        <p className="text-slate-400 text-sm">
          วิเคราะห์ข้อดี/ข้อเสียของแต่ละ technology choice — คลิกเพื่อดูรายละเอียด
        </p>
      </div>

      {analysisData.map((item, i) => (
        <motion.div
          key={item.category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="neo-card overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div className="text-left">
                <div className="text-white font-black text-base">{item.category}</div>
                <div className="text-slate-400 text-sm">{item.tech}</div>
              </div>
            </div>
            <motion.div
              animate={{ rotate: openIndex === i ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-4">
                  {/* Pros */}
                  <div>
                    <h4 className="text-emerald-400 font-black mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                      <CheckCircle2 className="w-4 h-4" /> ข้อดี (Pros)
                    </h4>
                    <ul className="space-y-1.5">
                      {item.pros.map((pro, j) => (
                        <li key={j} className="text-slate-300 text-sm flex items-start gap-2">
                          <span className="text-emerald-500 mt-1 shrink-0">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div>
                    <h4 className="text-red-400 font-black mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                      <XCircle className="w-4 h-4" /> ข้อเสีย (Cons)
                    </h4>
                    <ul className="space-y-1.5">
                      {item.cons.map((con, j) => (
                        <li key={j} className="text-slate-300 text-sm flex items-start gap-2">
                          <span className="text-red-500 mt-1 shrink-0">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendation */}
                  <div className="neo-card-sm p-4">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-amber-400 font-black text-sm">Recommendation</span>
                        <p className="text-slate-300 text-sm mt-1">{item.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
