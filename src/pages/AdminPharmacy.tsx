import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, CheckCheck, Clock } from 'lucide-react';
import { useBookingStore } from '../stores/useBookingStore';
import type { BookingData, Prescription } from '../stores/useBookingStore';

export default function AdminPharmacy() {
  const { bookings, updateRxStatus, fetchAllBookings } = useBookingStore();
  
  // Refresh on load
  useEffect(() => {
    fetchAllBookings();
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
    <div className="space-y-8 flex flex-col h-full">
       <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 shrink-0">
          <div>
             <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Pharmacy Fulfillment Queue</h1>
             <p className="text-zinc-400">Live Rx orders pushed directly from active clinical encounters.</p>
          </div>
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl">
             <Pill className="w-5 h-5 text-red-500" />
             <div className="flex flex-col -space-y-1">
                <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Pending</span>
                <span className="text-xl font-black text-red-400">{pendingQueue.length}</span>
             </div>
          </div>
       </div>

       <div className="flex-1 min-h-[500px] grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ACTION QUEUE: PENDING PREP */}
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col shadow-2xl relative overflow-hidden">
             
             <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-white tracking-widest uppercase">Action Required</h2>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <AnimatePresence>
                   {pendingQueue.map((item) => (
                      <motion.div 
                         key={`${item.booking.id}-${item.index}`}
                         layout
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 1.05, height: 0, padding: 0 }}
                         className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
                      >
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <p className="text-2xl font-black text-white">{item.rx.name}</p>
                               <p className="text-amber-400 font-bold uppercase tracking-widest text-xs mt-1">Sig: {item.rx.instructions}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest leading-none">Patient ID</p>
                               <p className="text-lg font-mono text-zinc-300 font-black">{item.booking.id.split('-')[1]}</p>
                            </div>
                         </div>
                         
                         <div className="flex justify-between items-center mt-6 pt-4 border-t border-amber-500/20">
                            <span className="text-sm font-bold text-zinc-300">{item.booking.name} &bull; Room: {item.booking.roomAssigned || 'TBD'}</span>
                            <button 
                               onClick={() => updateRxStatus(item.booking.id, item.index, 'packed')}
                               className="px-6 py-2 bg-amber-500 text-amber-950 font-black tracking-widest uppercase rounded-xl hover:bg-amber-400 transition-transform hover:scale-105 active:scale-95"
                            >
                               Mark Packed
                            </button>
                         </div>
                      </motion.div>
                   ))}
                </AnimatePresence>
                {pendingQueue.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-12">
                      <CheckCheck className="w-20 h-20 text-emerald-500 mb-4" />
                      <p className="text-2xl font-bold text-white mb-2">Queue Empty</p>
                      <p className="text-zinc-400 font-bold max-w-sm">All prescribed medications have been prepared. Waiting for next encounter order.</p>
                   </div>
                )}
             </div>
          </div>

          {/* READY FOR PICKUP QUEUE */}
          <div className="bg-zinc-950/50 border border-white/5 rounded-3xl p-6 flex flex-col shadow-inner">
             
             <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <CheckCheck className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-bold text-white tracking-widest uppercase opacity-50">Ready at Checkout</h2>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                <AnimatePresence>
                   {packedQueue.map((item) => (
                      <motion.div 
                         key={`${item.booking.id}-${item.index}`}
                         layout
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         className="bg-zinc-900 border-l-4 border-emerald-500 rounded-xl p-4 flex justify-between items-center opacity-80"
                      >
                         <div>
                            <p className="text-lg font-bold text-zinc-300 line-through decoration-emerald-500/50 opacity-50">{item.rx.name}</p>
                            <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1">Patient: {item.booking.name}</p>
                         </div>
                         <button 
                            onClick={() => updateRxStatus(item.booking.id, item.index, 'dispensed')}
                            className="text-xs font-bold text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-lg hover:text-white transition-colors border border-white/5"
                         >
                            Clear (Dispensed)
                         </button>
                      </motion.div>
                   ))}
                </AnimatePresence>
                {packedQueue.length === 0 && (
                   <div className="py-20 text-center opacity-20">
                      <p className="text-zinc-400 font-bold uppercase tracking-widest">No packed medications waiting.</p>
                   </div>
                )}
             </div>
          </div>

       </div>
    </div>
  );
}
