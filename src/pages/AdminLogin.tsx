import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Activity } from 'lucide-react';
import { useBookingStore } from '../stores/useBookingStore';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const login = useBookingStore(state => state.login);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate('/admin');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.3)] mb-6">
            <Activity className="w-8 h-8 text-zinc-950" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Staff Portal</h1>
          <p className="text-zinc-500 mt-2">Enter your designated PIN or password</p>
          <p className="text-emerald-500/50 text-xs mt-1">(Hint: Use "admin123")</p>
        </div>

        <form onSubmit={handleLogin} className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 pl-1">Access PIN</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-zinc-600" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`w-full bg-zinc-950/50 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-xl pl-12 pr-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-mono text-lg tracking-widest`}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-red-400 text-sm mt-2 pl-1 font-medium"
              >
                Incorrect credentials.
              </motion.p>
            )}
          </div>

          <button 
            type="submit"
            className="w-full relative group overflow-hidden rounded-xl bg-zinc-100 text-zinc-950 font-bold text-lg py-4 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-300 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
              Authenticate <ArrowRight className="w-5 h-5" />
            </span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
