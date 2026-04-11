import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Calendar as CalendarIcon, Users, Settings, LogOut, Activity, Pill } from 'lucide-react';
import { useBookingStore } from '../stores/useBookingStore';
import ThemeToggle from '../components/ThemeToggle';
const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
  { icon: CalendarIcon, label: 'Schedule & Slots', path: '/admin/schedule' },
  { icon: Users, label: 'Patient Directory', path: '/admin/patients' },
  { icon: Settings, label: 'Clinic Settings', path: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const logout = useBookingStore(state => state.logout);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex text-[var(--text-main)] font-sans selection:bg-emerald-500/30">
      
      {/* Sidebar background effects */}
      <div className="fixed inset-y-0 left-0 w-64 bg-[var(--bg-card)] border-r border-[var(--border-main)] backdrop-blur-xl z-20 hidden md:flex flex-col">
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-[var(--border-main)]">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-zinc-950 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
               <Activity className="w-5 h-5" />
             </div>
             <span className="text-xl font-bold tracking-tight text-[var(--text-main)]">DocBoard.</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 mt-4">
          <p className="px-3 text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-4">Menu</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium relative overflow-hidden group ${
                  isActive ? 'text-zinc-50 bg-white/5' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-emerald-400 rounded-r-full"
                  />
                )}
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-emerald-400' : 'group-hover:text-zinc-300'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-[var(--border-main)] space-y-3">
           <ThemeToggle />
           <button 
             onClick={logout}
             className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:text-red-400 hover:bg-red-400/10 transition-colors font-bold border border-transparent hover:border-red-400/20"
           >
             <LogOut className="w-5 h-5" />
             Sign Out
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 relative min-h-screen">
         {/* Top Header Mobile (mock) */}
         <div className="md:hidden h-16 border-b border-[var(--border-main)] bg-[var(--bg-card)] flex items-center justify-between px-4">
            <span className="font-bold text-lg text-[var(--text-main)]">DocBoard.</span>
            <div className="flex items-center gap-2">
               <ThemeToggle />
               <button onClick={logout}><LogOut className="w-5 h-5 text-red-400" /></button>
            </div>
         </div>

         {/* Content Wrapper */}
         <main className="p-4 md:p-8 relative z-10 w-full max-w-7xl mx-auto">
           <motion.div
             key={location.pathname}
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.98 }}
             transition={{ duration: 0.4, ease: "easeOut" }}
           >
             {children}
           </motion.div>
         </main>
      </div>

    </div>
  )
}
