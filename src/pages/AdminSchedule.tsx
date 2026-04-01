import { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Video, Stethoscope } from 'lucide-react';
import { useBookingStore } from '../stores/useBookingStore';

export default function AdminSchedule() {
  const { bookings } = useBookingStore();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));

  const allTimes = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
             <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Weekly Master Schedule</h1>
             <p className="text-zinc-400">7-day continuous clinic load overview.</p>
          </div>
          <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-xl p-1">
             <button onClick={prevWeek} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-zinc-300" /></button>
             <span className="text-sm font-bold text-white px-2">
                {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
             </span>
             <button onClick={nextWeek} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><ChevronRight className="w-5 h-5 text-zinc-300" /></button>
          </div>
       </div>

       <div className="glass-panel rounded-2xl overflow-hidden overflow-x-auto border border-white/10">
          <div className="min-w-[800px]">
             {/* Header Row */}
             <div className="grid grid-cols-8 border-b border-white/10 bg-zinc-950/80">
                <div className="p-4 flex items-center justify-center text-xs font-bold text-zinc-500 uppercase tracking-widest border-r border-white/5">
                   Time
                </div>
                {weekDays.map(day => (
                   <div key={day.toISOString()} className={`p-4 flex flex-col items-center justify-center border-r border-white/5 last:border-0 ${isSameDay(day, new Date()) ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-300'}`}>
                      <span className="text-xs font-bold uppercase tracking-wider">{format(day, 'EEE')}</span>
                      <span className="text-2xl font-black mt-1">{format(day, 'dd')}</span>
                   </div>
                ))}
             </div>

             {/* Time Rows */}
             <div className="divide-y divide-white/5">
                {allTimes.map(time => (
                   <div key={time} className="grid grid-cols-8 group hover:bg-white/[0.02] transition-colors">
                      <div className="p-4 flex items-center justify-center text-xs font-bold text-zinc-400 border-r border-white/5 bg-zinc-950/40">
                         {time}
                      </div>

                      {weekDays.map(day => {
                         const dateStr = format(day, 'MMMM d, yyyy');
                         const bookingsInSlot = bookings.filter(b => b.date === dateStr && b.time === time);
                         // Realistically, our system allows 1 patient per 1 hr block right now
                         const booking = bookingsInSlot[0];
                         
                         const isWeekendSlot = day.getDay() === 0 || day.getDay() === 6;

                         return (
                            <div key={day.toISOString() + time} className={`p-2 border-r border-white/5 last:border-0 relative h-24 ${isWeekendSlot ? 'bg-zinc-900/50' : ''}`}>
                               {isWeekendSlot && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                     <span className="text-zinc-800 font-bold -rotate-45 text-sm uppercase">Closed</span>
                                  </div>
                               )}
                               {!isWeekendSlot && booking && (
                                  <div className={`h-full w-full rounded-xl p-2 flex flex-col justify-between border ${
                                     booking.status === 'cancelled' || booking.status === 'no_show' ? 'bg-red-500/10 border-red-500/20 text-red-400 opacity-60' :
                                     booking.type === 'telehealth' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 
                                     'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                  }`}>
                                     <div className="flex items-center gap-1.5 mb-1 bg-zinc-950/40 w-max px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
                                       {booking.type === 'telehealth' ? <Video className="w-3 h-3" /> : <Stethoscope className="w-3 h-3" />}
                                       {booking.type === 'telehealth' ? 'Tele' : 'In-person'}
                                     </div>
                                     <p className="text-xs font-bold truncate">{booking.name}</p>
                                     <p className="text-[10px] opacity-70 truncate">{booking.specialty}</p>
                                  </div>
                               )}
                            </div>
                         )
                      })}
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
}
