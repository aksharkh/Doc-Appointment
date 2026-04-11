import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, CheckCheck, Clock, ArrowLeft, LogOut, Printer, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../stores/useBookingStore';
import ThemeToggle from '../components/ThemeToggle';
import type { BookingData, Prescription } from '../stores/useBookingStore';

export default function PharmacyPortal() {
  const { bookings, updateRxStatus, fetchAllBookings } = useBookingStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchAllBookings();
    const interval = setInterval(fetchAllBookings, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [fetchAllBookings]);
  
  const getRxList = (status: 'pending' | 'packed' | 'dispensed') => {
      let list: { booking: BookingData, rx: Prescription, index: number }[] = [];
      bookings.forEach(b => {
         b.prescriptions?.forEach((p, idx) => {
             if(p.status === status) list.push({ booking: b, rx: p, index: idx });
         });
      });
      return list;
  };
  
  const pendingQueue = getRxList('pending');
  const packedQueue = getRxList('packed');

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans p-4 sm:p-8 transition-colors duration-300">
       {/* Branding & Header */}
       <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between md:items-center gap-6 mb-12">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/')} className="p-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl hover:bg-zinc-800 transition-colors text-[var(--text-dim)] hover:text-[var(--text-main)]">
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                   <Pill className="w-8 h-8 text-emerald-500" />
                   Clinic <span className="text-emerald-500">Pharmacy</span>
                </h1>
                <p className="text-[var(--text-dim)] font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Live fulfillment Hub & bull; Nurse Station</p>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             <ThemeToggle />
             <div className="px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl flex items-center gap-4">
                <div className="flex flex-col -space-y-1">
                   <span className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">Active Orders</span>
                   <span className="text-2xl font-black text-[var(--text-main)]">{pendingQueue.length}</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col -space-y-1">
                   <span className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">Ready</span>
                   <span className="text-2xl font-black text-emerald-400">{packedQueue.length}</span>
                </div>
             </div>
             <button onClick={() => navigate('/')} className="p-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-red-400 hover:bg-red-500/10 transition-colors" title="Logout">
                <LogOut className="w-6 h-6" />
             </button>
          </div>
       </header>

       <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ACTION QUEUE: PENDING PREP */}
          <section className="lg:col-span-2 space-y-6">
             <div className="flex items-center justify-between mb-2 px-2">
                <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                   <Clock className="w-5 h-5 text-amber-500" /> 
                   Pending Fulfillment
                </h2>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Auto-refreshes every 10s</span>
             </div>

             {/* Mock Inventory Alerts */}
             {pendingQueue.length > 3 && pendingQueue.some(q => q.rx.name.includes('Amoxicillin') || q.rx.name.includes('Metformin')) && (
                 <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-4">
                     <AlertCircle className="w-6 h-6 text-red-500 mt-1 shrink-0" />
                     <div>
                         <h3 className="text-red-500 font-bold">Inventory Alert: Low Stock</h3>
                         <p className="text-red-400 text-sm">High volume of antibiotic / diabetic scripts detected today. Ensure the pyxis and secondary storage are stocked.</p>
                     </div>
                 </motion.div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                   {pendingQueue.map((item) => (
                      <motion.div 
                         key={`${item.booking.id}-${item.index}`}
                         layout
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-6 shadow-2xl flex flex-col justify-between group hover:border-amber-500/30 transition-colors"
                      >
                         <div>
                            <div className="flex justify-between items-start mb-4">
                               <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                                  <Pill className="w-5 h-5" />
                               </div>
                               <span className="text-[10px] font-black bg-[var(--bg-main)] px-2 py-1 rounded border border-[var(--border-main)] text-[var(--text-dim)]">ID: {item.booking.id.slice(-6).toUpperCase()}</span>
                            </div>
                            <h3 className="text-2xl font-black text-[var(--text-main)] mb-1">{item.rx.name}</h3>
                            <p className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">SIG: {item.rx.instructions}</p>
                            
                            <div className="space-y-4 pt-4 border-t border-[var(--border-main)]">
                               <div className="flex justify-between items-center text-sm">
                                  <span className="text-[var(--text-dim)] font-medium">Patient</span>
                                  <span className="text-[var(--text-main)] font-bold">{item.booking.name}</span>
                               </div>
                               <div className="flex justify-between items-center text-sm">
                                  <span className="text-[var(--text-dim)] font-medium">Room Assigned</span>
                                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md font-black">{item.booking.roomAssigned || 'NOT ASSIGNED'}</span>
                               </div>
                            </div>
                         </div>

                         <div className="mt-8 flex gap-2">
                            <button 
                               onClick={() => { alert(`Printing Standard Rx Label for ${item.rx.name} -\nPatient: ${item.booking.name}\nSig: ${item.rx.instructions}`); }}
                               className="px-4 py-4 bg-[var(--bg-main)] border border-[var(--border-main)] hover:border-emerald-500/50 text-[var(--text-main)] rounded-2xl transition-all shadow-sm active:scale-95"
                               title="Print Rx Label"
                            >
                               <Printer className="w-5 h-5" />
                            </button>
                            <button 
                               onClick={() => updateRxStatus(item.booking.id, item.index, 'packed')}
                               className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black tracking-widest uppercase rounded-2xl transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] active:scale-95"
                            >
                               Mark Prepared
                            </button>
                         </div>
                      </motion.div>
                   ))}
                </AnimatePresence>
             </div>

             {pendingQueue.length === 0 && (
                <div className="bg-[var(--bg-card)]/50 border border-dashed border-[var(--border-main)] rounded-3xl py-20 flex flex-col items-center justify-center opacity-30">
                   <Pill className="w-16 h-16 mb-4 text-[var(--text-dim)]" />
                   <p className="text-xl font-bold uppercase tracking-widest">No pending orders</p>
                </div>
             )}
          </section>

          {/* READY FOR PICKUP */}
          <aside className="space-y-6">
             <div className="flex items-center gap-2 mb-2 px-2">
                <CheckCheck className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-[var(--text-main)] uppercase tracking-tight">Recent Ready</h2>
             </div>

             <div className="space-y-3">
                <AnimatePresence>
                   {packedQueue.slice(0, 10).map((item) => (
                      <motion.div 
                         key={`${item.booking.id}-${item.index}`}
                         layout
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         className="bg-[var(--bg-card)] border-l-4 border-emerald-500 p-4 rounded-xl flex justify-between items-center group"
                      >
                         <div className="overflow-hidden">
                            <p className="text-lg font-bold text-zinc-300 truncate">{item.rx.name}</p>
                            <p className="text-xs text-[var(--text-dim)] font-bold uppercase tracking-widest truncate">{item.booking.name}</p>
                         </div>
                         <button 
                            onClick={() => updateRxStatus(item.booking.id, item.index, 'dispensed')}
                            className="p-2 text-zinc-600 hover:text-[var(--text-main)] transition-colors opacity-0 group-hover:opacity-100"
                         >
                            <LogOut className="w-5 h-5" />
                         </button>
                      </motion.div>
                   ))}
                </AnimatePresence>
                {packedQueue.length === 0 && (
                   <p className="text-center py-10 text-zinc-600 font-bold uppercase tracking-widest text-xs">No items ready for pickup</p>
                )}
             </div>
          </aside>
       </main>
    </div>
  );
}
