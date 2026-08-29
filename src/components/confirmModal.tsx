import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative bg-brand-bg w-full max-w-sm rounded-sm shadow-2xl border border-brand-border overflow-hidden z-10"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-brand-stone/50 text-brand-charcoal'}`}>
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[13px] font-bold text-brand-charcoal uppercase tracking-widest leading-tight">
                    {title}
                  </h3>
                  <p className="mt-2 text-xs text-brand-textSec leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-brand-stone/20 p-4 border-t border-brand-border flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2 text-[11px] font-bold text-brand-charcoal hover:bg-brand-stone/50 rounded-sm transition-colors uppercase tracking-wider text-center"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`w-full sm:w-auto px-5 py-2 text-[11px] font-bold text-white rounded-sm transition-colors uppercase tracking-wider shadow-sm text-center ${
                  isDestructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-btn hover:bg-brand-charcoal'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
