import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

const Toast = ({ show, message, onClose }) => {
  // Auto-hide after 3 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-[320px]"
        >
          <div className="glass-effect border border-emerald-500/30 bg-emerald-500/10 rounded-2xl p-4 flex items-center gap-3 shadow-2xl shadow-emerald-900/20 backdrop-blur-xl">
            <div className="bg-emerald-500 rounded-full p-1 shadow-lg shadow-emerald-500/40">
              <CheckCircle2 size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-white uppercase tracking-widest">Success</p>
              <p className="text-[10px] text-emerald-100/70 font-medium">{message}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-emerald-100/40 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;