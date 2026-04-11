import { Sun, Moon } from 'lucide-react';
import { useBookingStore } from '../stores/useBookingStore';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useBookingStore();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleDarkMode}
      className={`p-2.5 rounded-xl transition-all border flex items-center gap-2 font-bold text-xs uppercase tracking-widest
        ${isDarkMode 
          ? 'bg-[var(--bg-card)] border-[var(--border-main)] text-zinc-400 hover:text-[var(--text-main)]' 
          : 'bg-white border-zinc-200 text-zinc-600 shadow-sm hover:bg-zinc-50'}
      `}
    >
      {isDarkMode ? (
        <>
          <Moon className="w-4 h-4 text-primary-400" />
          <span>Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Light</span>
        </>
      )}
    </motion.button>
  );
}
