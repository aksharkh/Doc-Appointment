import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, BellRing, MonitorPlay } from 'lucide-react';
import { useBookingStore } from '../stores/useBookingStore';

export default function LiveDisplay() {
  const { getActiveQueue } = useBookingStore();
  const [timeStr, setTimeStr] = useState('');
  
  // Realtime Active Queue
  const queue = useMemo(() => getActiveQueue(), [getActiveQueue]);
  
  // We identify the "Now Serving" as the most recently updated "in_session" patients
  const inSession = queue.filter(b => b.status === 'in_session' && b.roomAssigned);
  const waiting = queue.filter(b => b.status === 'arrived' && b.token);
  
  useEffect(() => {
     const timer = setInterval(() => {
        setTimeStr(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
     }, 1000);
     return () => clearInterval(timer);
  }, []);

  // Mock audio ding whenever inSession changes (requires actual state tracking in real app)
  const [prevSessionLength, setPrevSessionLength] = useState(inSession.length);
  useEffect(() => {
     if(inSession.length > prevSessionLength) {
         // Play sound effect using Audio Context
         try {
             const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
             const oscillator = audioCtx.createOscillator();
             const gainNode = audioCtx.createGain();
             oscillator.type = 'sine';
             oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
             oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5); // Drop to A4
             gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
             gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
             oscillator.connect(gainNode);
             gainNode.connect(audioCtx.destination);
             oscillator.start();
             oscillator.stop(audioCtx.currentTime + 0.5);
         } catch(e) { /* ignore */ }
     }
     setPrevSessionLength(inSession.length);
  }, [inSession.length, prevSessionLength]);


  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex flex-col font-sans select-none">
       {/* TV Header */}
       <header className="h-24 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-10 shadow-lg relative z-20">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <MonitorPlay className="w-6 h-6 text-white" />
             </div>
             <div>
                <h1 className="text-3xl font-bold tracking-tight text-white leading-none">Global Health Center</h1>
                <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm mt-1">Live Clinical Queue</p>
             </div>
          </div>
          <div className="text-5xl font-black text-white font-mono flex items-center gap-4">
             {timeStr}
          </div>
       </header>

       <main className="flex-1 flex w-full relative">
          
          {/* NOW SERVING PANEL */}
          <section className="w-3/5 border-r border-zinc-800 bg-zinc-950 flex flex-col p-10 relative">
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />
             
             <div className="flex items-center gap-3 mb-10">
                <BellRing className="w-8 h-8 text-emerald-500 animate-pulse" />
                <h2 className="text-4xl font-bold text-zinc-300 uppercase tracking-widest">Now Serving</h2>
             </div>
             
             <div className="flex-1 flex flex-col gap-6 relative z-10">
                <AnimatePresence mode="popLayout">
                   {inSession.slice(0, 3).map((booking, idx) => (
                      <motion.div 
                         key={booking.id}
                         layout
                         initial={{ opacity: 0, x: -50, scale: 0.9 }}
                         animate={{ opacity: 1, x: 0, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.9, x: 50 }}
                         transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                         className={`rounded-3xl border flex items-center p-8 shadow-2xl overflow-hidden relative group
                            ${idx === 0 ? 'bg-gradient-to-r from-emerald-900/60 to-zinc-900 border-emerald-500/50 scale-100' : 'bg-zinc-900/80 border-white/5 opacity-80 scale-95'}
                         `}
                      >
                         {idx === 0 && <div className="absolute inset-0 bg-emerald-500/5 pulse-bg pointer-events-none" />}
                         {idx === 0 && <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.8)]" />}
                         
                         <div className="flex-1">
                            <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] mb-2 text-lg">Token Number</p>
                            <p className={`font-black font-mono tracking-tight ${idx === 0 ? 'text-8xl text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'text-6xl text-white'}`}>
                               {booking.token || 'N/A'}
                            </p>
                         </div>
                         
                         <div className="w-px h-32 bg-zinc-800 mx-8 hidden sm:block"></div>
                         
                         <div className="flex-1 flex flex-col items-end sm:items-start">
                            <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] mb-2 text-lg">Proceed To</p>
                            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl px-8 py-4 shadow-inner">
                               <p className={`font-black uppercase tracking-wider ${idx === 0 ? 'text-6xl text-white' : 'text-4xl text-zinc-300'}`}>
                                  {booking.roomAssigned}
                               </p>
                            </div>
                         </div>
                      </motion.div>
                   ))}
                </AnimatePresence>
                
                {inSession.length === 0 && (
                   <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                      <Volume2 className="w-24 h-24 text-zinc-600 mb-6" />
                      <p className="text-3xl font-bold text-zinc-500">Awaiting calling physician...</p>
                   </div>
                )}
             </div>
          </section>

          {/* NEXT IN LINE PANEL */}
          <section className="w-2/5 flex flex-col p-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900 to-black z-10 border-l border-zinc-800 shadow-[-20px_0_30px_rgba(0,0,0,0.5)]">
             <div className="flex items-center gap-3 mb-10">
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                <h2 className="text-3xl font-bold text-zinc-400 uppercase tracking-widest">Please Wait</h2>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                   {waiting.slice(0, 5).map((booking, idx) => (
                      <motion.div 
                         key={booking.id}
                         layout
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex justify-between items-center"
                      >
                         <div className="flex items-center gap-6">
                            <span className="text-2xl font-bold text-zinc-600 w-8">{idx + 1}.</span>
                            <div>
                               <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-1">Token</p>
                               <p className="text-4xl font-black text-white font-mono">{booking.token}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-1 border border-zinc-800 px-3 py-1 rounded-full w-max ml-auto">EST</p>
                            <p className="text-xl font-bold text-blue-400 mt-2">~{15 * (idx + 1)} mins</p>
                         </div>
                      </motion.div>
                   ))}
                </AnimatePresence>
                {waiting.length === 0 && (
                   <div className="p-10 border-2 border-dashed border-zinc-800 rounded-3xl text-center">
                      <p className="text-xl font-bold text-zinc-600">Waiting Room Clear</p>
                   </div>
                )}
             </div>
             
             {waiting.length > 5 && (
                <div className="mt-6 text-center text-zinc-500 font-bold uppercase tracking-widest">
                   + {waiting.length - 5} MORE TOKENS IN QUEUE
                </div>
             )}
          </section>
       </main>
    </div>
  );
}
