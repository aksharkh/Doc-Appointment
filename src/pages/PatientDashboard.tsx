import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, ShieldCheck, Mail, Calendar, Clock, MapPin, XCircle } from 'lucide-react';
import { useBookingStore } from '../stores/useBookingStore';

export default function PatientDashboard() {
  const [email, setEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { getPatientHistory, cancelBooking } = useBookingStore();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().length > 3) setIsAuthenticated(true);
  };

  const history = getPatientHistory(email);

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
      
      <nav className="w-full h-20 flex items-center justify-between px-6 lg:px-12 z-10 border-b border-white/5">
         <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-zinc-950 font-black text-xl">D</div>
           <span className="text-xl font-bold tracking-tight text-white hidden sm:block">DocBook.</span>
         </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
           <div className="text-center mb-8">
             <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-2xl mx-auto flex items-center justify-center mb-6">
               <ShieldCheck className="w-8 h-8 text-blue-400" />
             </div>
             <h1 className="text-3xl font-bold text-white tracking-tight">Patient Portal</h1>
             <p className="text-zinc-500 mt-2">Enter your email to view your records</p>
           </div>

           <form onSubmit={handleLogin} className="glass-panel p-8 rounded-3xl space-y-6">
             <div className="space-y-2">
               <label className="text-sm font-medium text-zinc-400 pl-1">Email Address</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <Mail className="w-5 h-5 text-zinc-600" />
                 </div>
                 <input 
                   type="email" 
                   required
                   value={email}
                   onChange={e => setEmail(e.target.value)}
                   className="w-full bg-zinc-950/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-medium"
                   placeholder="you@email.com"
                 />
               </div>
             </div>
             <button type="submit" className="w-full bg-white text-zinc-950 font-bold text-lg py-4 rounded-xl transition-transform hover:scale-[1.02]">
               Access Records
             </button>
           </form>
         </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden text-white">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
      
      <nav className="w-full h-20 flex items-center justify-between px-6 lg:px-12 z-10 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md sticky top-0">
         <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-zinc-950 font-black text-xl">D</div>
           <span className="text-xl font-bold tracking-tight text-white hidden sm:block">DocBook.</span>
         </div>
         <button onClick={() => setIsAuthenticated(false)} className="text-sm text-zinc-400 hover:text-white transition-colors">Sign Out</button>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 z-10">
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold mb-1">Welcome back, {history[0]?.name || 'Patient'}</h1>
            <p className="text-zinc-400 mb-8">Review your past visits and manage upcoming appointments.</p>

            {history.length === 0 ? (
               <div className="glass-panel p-12 rounded-3xl text-center border-dashed border-white/20">
                  <HeartPulse className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-white mb-2">No records found</h2>
                  <p className="text-zinc-500 mb-6">You don't have any appointments linked to {email}.</p>
                  <button onClick={() => navigate('/')} className="px-6 py-3 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 transition-colors">Book new appointment</button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <AnimatePresence>
                  {history.map(visit => (
                     <motion.div key={visit.id} layout className="glass-panel p-6 rounded-3xl flex flex-col justify-between border border-white/5 relative overflow-hidden group">
                        {visit.status === 'cancelled' && <div className="absolute inset-0 bg-red-950/10 z-0"></div>}
                        <div className="relative z-10">
                           <div className="flex justify-between items-start mb-4">
                              <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md
                                 ${visit.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 
                                   visit.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                                   'bg-blue-500/20 text-blue-400'}
                              `}>
                                 {visit.status.replace('_', ' ')}
                              </span>
                              <span className="text-xs font-mono text-zinc-600">{visit.id}</span>
                           </div>

                           <h3 className="text-xl font-bold mb-1 text-white">{visit.specialty}</h3>
                           <p className="text-sm text-zinc-400 mb-4">{visit.reason}</p>

                           <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-zinc-300">
                                 <Calendar className="w-4 h-4 text-emerald-500" /> {visit.date}
                              </div>
                              <div className="flex items-center gap-2 text-zinc-300">
                                 <Clock className="w-4 h-4 text-blue-500" /> {visit.time}
                              </div>
                              <div className="flex items-center gap-2 text-zinc-300">
                                 <MapPin className="w-4 h-4 text-purple-500" /> {visit.type === 'telehealth' ? 'Virtual (Link in ticket)' : 'In-person clinic'}
                              </div>
                           </div>
                        </div>

                        {visit.status === 'confirmed' && (
                           <div className="mt-6 pt-4 border-t border-white/10 flex gap-2 relative z-10">
                              <button className="flex-1 py-2 text-xs font-bold bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/5">Details</button>
                              <button 
                                onClick={() => {
                                   if(confirm('Are you sure you want to cancel this appointment?')) cancelBooking(visit.id);
                                }}
                                className="px-3 py-2 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                              >
                                 <XCircle className="w-4 h-4" />
                              </button>
                           </div>
                        )}
                     </motion.div>
                  ))}
                 </AnimatePresence>
               </div>
            )}
         </motion.div>
      </main>
    </div>
  );
}
