import { useState, useMemo, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, Users, Activity, ExternalLink, Video, ChevronRight, ChevronLeft, BarChart3, PieChart } from 'lucide-react';
import { useBookingStore } from '../stores/useBookingStore';
import type { BookingStatus } from '../stores/useBookingStore';

export default function AdminDashboard() {
  const { bookings, adminBlockedSlots, settings, analyticsData, fetchAnalytics, toggleAdminBlockSlot, updateBookingStatus, updateTelehealthLink, updateBookingRoomAndToken } = useBookingStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'slots' | 'analytics'>('slots');
  const [telehealthInputs, setTelehealthInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, bookings]);
  
  // Arrived state inputs
  const [tokenInput, setTokenInput] = useState<Record<string, string>>({});
  const [roomInput, setRoomInput] = useState<Record<string, string>>({});

  const navigate = useNavigate();

  // Stats
  const { todayBookings, activePatients, activeSessions } = useMemo(() => {
     const todayStr = format(selectedDate, 'MMMM d, yyyy');
     return {
        todayBookings: bookings.filter(b => b.date === todayStr && ['confirmed', 'arrived', 'in_session'].includes(b.status)).length,
        activePatients: bookings.filter(b => b.date === todayStr && b.status === 'arrived').length,
        activeSessions: bookings.filter(b => b.date === todayStr && b.status === 'in_session').length,
     }
  }, [bookings, selectedDate]);

  const dateISO = format(selectedDate, 'yyyy-MM-dd');
  const dateFormatted = format(selectedDate, 'MMMM d, yyyy');
  const selectedDayBookings = bookings.filter(b => b.date === dateFormatted);
  const blockedForSelectedDay = adminBlockedSlots[dateISO] || [];
  
  const allTimes = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

  const getSlotState = (time: string) => {
     const booking = selectedDayBookings.find(b => b.time === time && !['cancelled', 'no_show'].includes(b.status));
     if (booking) return { type: 'booked', detail: booking };
     
     // Respect lunch block settings
     const isLunch = settings.lunchBlock && time === '01:00 PM';
     if (blockedForSelectedDay.includes(time) || isLunch) return { type: 'blocked', isLunch };
     
     return { type: 'available' };
  };
  
  const handleStatusChange = (id: string, status: BookingStatus) => {
     updateBookingStatus(id, status);
     if (status === 'in_session') {
         // Auto route to Encounter Dash
         navigate(`/admin/encounter/${id}`);
     }
  }
  
  const handleQueueDispatch = (id: string) => {
       // Auto-generate token based on sequential count for the selected day
       const statusCount = bookings.filter(b => b.date === dateFormatted && ['arrived', 'in_session', 'completed'].includes(b.status)).length;
       const autoToken = `T-${statusCount + 1}`;
       
       const t = tokenInput[id] || autoToken;
       const r = roomInput[id] || 'Room 1';
       updateBookingRoomAndToken(id, r, t);
       updateBookingStatus(id, 'arrived');
  }

  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
             <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)] mb-1">Clinic Command Center</h1>
             <p className="text-zinc-400">Live operational oversight and patient flow management.</p>
          </div>
          <div className="flex bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-1">
             <button onClick={() => setActiveTab('slots')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'slots' ? 'bg-zinc-800 text-[var(--text-main)]' : 'text-[var(--text-dim)] hover:text-zinc-300'}`}>Slot Manager</button>
             <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-zinc-800 text-[var(--text-main)]' : 'text-[var(--text-dim)] hover:text-zinc-300'}`}>Analytics</button>
          </div>
       </div>

       {/* Realtime Metrics */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-emerald-500">
             <div>
                <p className="text-[var(--text-dim)] font-medium text-sm">Scheduled Today</p>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-4xl font-bold text-[var(--text-main)]">{todayBookings}</p>
                   {todayBookings > 4 ? <span className="text-[10px] bg-red-500/20 text-red-500 font-bold px-2 py-0.5 rounded uppercase">High load</span> : null}
                </div>
             </div>
             <Calendar className="w-8 h-8 opacity-20 text-emerald-400" />
          </div>
          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-yellow-500">
             <div>
                <p className="text-[var(--text-dim)] font-medium text-sm">Waiting Room (Arrived)</p>
                <p className="text-4xl font-bold text-[var(--text-main)] mt-1">{activePatients}</p>
             </div>
             <Users className="w-8 h-8 opacity-20 text-yellow-400" />
          </div>
          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-blue-500">
             <div>
                <p className="text-[var(--text-dim)] font-medium text-sm">In Session</p>
                <p className="text-4xl font-bold text-[var(--text-main)] mt-1">{activeSessions}</p>
             </div>
             <Activity className="w-8 h-8 opacity-20 text-blue-400" />
          </div>
       </div>

       {activeTab === 'slots' && (
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
             <div className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border-main)] px-4 py-3 rounded-2xl">
                  <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                     <Clock className="w-5 h-5 text-emerald-400" /> Dispatch Board
                  </h2>
                  <div className="flex items-center gap-3">
                     <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-[var(--text-main)] transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                     </button>
                     <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">{dateFormatted}</span>
                     <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-[var(--text-main)] transition-colors">
                        <ChevronRight className="w-4 h-4" />
                     </button>
                  </div>
              </div>
             
             <div className="glass-panel rounded-2xl p-6">
                  <div className="space-y-4">
                     {allTimes.map(time => {
                        const state = getSlotState(time);
                        return (
                           <div key={time} className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)]/40 hover:bg-zinc-800/40 transition-colors group gap-4">
                              <div className="flex flex-col flex-1 min-w-0">
                                 <span className="font-bold text-zinc-200 text-lg">{time}</span>
                                 {state.type === 'booked' && (
                                    <div className="mt-1 flex flex-col gap-1">
                                       <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                                          {state.detail?.name}
                                          {state.detail?.status === 'completed' && <span className="text-[10px] bg-zinc-800 text-[var(--text-dim)] px-1.5 py-0.5 rounded tracking-widest uppercase">Finished</span>}
                                       </span>
                                       <span className="text-xs text-[var(--text-dim)] flex gap-2">
                                          <span>{state.detail?.type === 'telehealth' ? '💻 Telehealth' : '🏥 In-person'}</span>
                                          <span>&bull;</span>
                                          <span>{state.detail?.specialty}</span>
                                          <span>&bull;</span>
                                          <span className="truncate">{state.detail?.insurance || 'Self-pay'}</span>
                                       </span>
                                    </div>
                                 )}
                                 {state.type === 'available' && <span className="text-sm font-medium text-[var(--text-dim)] mt-1">Slot Available</span>}
                                 {state.type === 'blocked' && <span className="text-sm font-medium text-red-500/80 mt-1">{(state as any).isLunch ? 'Lunch Break (Closed)' : 'Blocked by Operations'}</span>}
                              </div>
                              
                              <div className="flex flex-col lg:items-end gap-2 w-full lg:w-max min-w-[300px]">
                                 {state.type === 'booked' && (
                                    <>
                                      {state.detail?.status === 'confirmed' && (
                                         <div className="flex items-center gap-2 w-full">
                                             <input type="text" placeholder="Token e.g. A-101" value={tokenInput[state.detail.id] || ''} onChange={e=>setTokenInput({...tokenInput, [state.detail!.id]: e.target.value})} className="flex-1 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg text-xs px-2 py-2 outline-none text-[var(--text-main)] focus:ring-1 focus:ring-emerald-500" />
                                             <input type="text" placeholder="Room" value={roomInput[state.detail.id] || ''} onChange={e=>setRoomInput({...roomInput, [state.detail!.id]: e.target.value})} className="flex-1 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg text-xs px-2 py-2 outline-none text-[var(--text-main)] focus:ring-1 focus:ring-emerald-500" />
                                             <button onClick={()=>handleQueueDispatch(state.detail!.id)} className="px-3 py-2 bg-emerald-500 text-emerald-950 font-bold text-xs rounded-lg hover:bg-emerald-400 whitespace-nowrap">Receive</button>
                                         </div>
                                      )}
                                      
                                      {state.detail?.status === 'arrived' && (
                                          <div className="flex flex-col items-end gap-2 w-full">
                                             <p className="text-xs font-bold text-yellow-400 border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 rounded w-max">AWAITING DR IN {state.detail.roomAssigned?.toUpperCase()}</p>
                                             <button onClick={()=>handleStatusChange(state.detail!.id, 'in_session')} className="w-full py-2 bg-blue-500 text-blue-950 font-bold text-sm rounded-lg hover:bg-blue-400 flex items-center justify-center gap-1 shadow-lg shadow-blue-500/20">
                                                Start Encounter <ChevronRight className="w-4 h-4" />
                                             </button>
                                          </div>
                                      )}
                                      
                                      {state.detail?.status === 'in_session' && (
                                          <div className="flex flex-col items-end gap-2 w-full">
                                             <p className="text-xs font-bold text-blue-400 border border-blue-500/20 bg-blue-500/10 px-3 py-1 rounded w-max">SESSION ACTIVE</p>
                                             <button onClick={()=>navigate(`/admin/encounter/${state.detail!.id}`)} className="w-full py-2 bg-zinc-800 text-[var(--text-main)] font-bold text-sm rounded-lg hover:bg-zinc-700 flex items-center justify-center gap-1">
                                                Resume Dashboard <ChevronRight className="w-4 h-4" />
                                             </button>
                                          </div>
                                      )}

                                      <div className="flex justify-end w-full">
                                          <button onClick={()=>handleStatusChange(state.detail!.id, 'no_show')} className="text-[10px] font-bold text-red-500/60 hover:text-red-400 uppercase tracking-widest mt-2 transition-colors">Mark No-show</button>
                                      </div>
                                      
                                      {state.detail?.type === 'telehealth' && state.detail?.status === 'confirmed' && (
                                         <div className="flex gap-2 w-full mt-2">
                                            <input 
                                              type="text" 
                                              placeholder="Meet/Zoom URL" 
                                              value={telehealthInputs[state.detail.id] ?? state.detail.telehealthLink ?? ''}
                                              onChange={(e) => setTelehealthInputs(prev => ({...prev, [state.detail!.id]: e.target.value}))}
                                              className="flex-1 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg text-xs px-2 py-1.5 outline-none text-blue-300" 
                                            />
                                            <button 
                                               onClick={() => updateTelehealthLink(state.detail!.id, telehealthInputs[state.detail!.id] || '')}
                                               className="px-2 bg-blue-500 hover:bg-blue-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors"
                                            >
                                               Save
                                            </button>
                                         </div>
                                      )}
                                      
                                      {state.detail?.telehealthLink && (
                                         <a href={state.detail.telehealthLink} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-end mt-1 font-medium">
                                           Join Call <ExternalLink className="w-3 h-3" />
                                         </a>
                                      )}
                                    </>
                                 )}
                                 {(state.type === 'available' || state.type === 'blocked') && (
                                    <div className="flex justify-end w-full">
                                        <button 
                                           onClick={() => toggleAdminBlockSlot(dateISO, time)}
                                           className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors border w-full lg:w-32 ${
                                              state.type === 'blocked' 
                                              ? 'bg-red-500/10 text-red-500 font-bold border-red-500/30 hover:bg-red-500/20' 
                                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-[var(--text-main)]'
                                           }`}
                                        >
                                           {state.type === 'blocked' ? 'Unblock' : 'Block Slot'}
                                        </button>
                                    </div>
                                 )}
                              </div>
                           </div>
                        )
                     })}
                  </div>
             </div>
          </div>
          
          <div className="space-y-4">
             <h2 className="text-lg font-bold text-[var(--text-main)] px-2">Telehealth Queue</h2>
             <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                 <AnimatePresence>
                   {selectedDayBookings.filter(b => b.type === 'telehealth' && !['completed', 'no_show', 'cancelled'].includes(b.status)).map(booking => (
                      <motion.div 
                         key={booking.id}
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         className="flex flex-col pb-4 border-b border-[var(--border-main)] last:border-0 last:pb-0"
                      >
                         <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-blue-300 flex items-center gap-2">
                              <Video className="w-4 h-4" /> {booking.time}
                            </span>
                         </div>
                         <span className="text-sm font-bold text-[var(--text-main)]">{booking.name}</span>
                         <span className="text-xs text-[var(--text-dim)]">{booking.specialty}</span>
                         {booking.telehealthLink ? (
                            <a href={booking.telehealthLink} className="mt-2 text-xs bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg w-max font-bold hover:bg-blue-500/30 transition-colors">Launch External Meeting</a>
                         ) : (
                            <span className="mt-2 text-[10px] text-yellow-500 font-bold uppercase tracking-widest border border-yellow-500/20 px-2 py-1 rounded w-max">Awaiting URL Add</span>
                         )}
                      </motion.div>
                   ))}
                 </AnimatePresence>
                 {selectedDayBookings.filter(b => b.type === 'telehealth' && !['completed', 'no_show', 'cancelled'].includes(b.status)).length === 0 && (
                    <p className="text-sm text-[var(--text-dim)] text-center py-4">No active telehealth appointments today.</p>
                 )}
             </div>
          </div>
       </div>
       )}

       {activeTab === 'analytics' && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-8 rounded-3xl min-h-[400px]">
                   <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2"><BarChart3 className="w-6 h-6 text-emerald-500" /> Patient Volume</h2>
                      <span className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Aggregate View</span>
                   </div>
                   <div className="space-y-10">
                      <div>
                         <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6">Recent Daily Flow</h3>
                         <div className="h-48 flex items-end gap-3 border-b border-[var(--border-main)] pb-4 relative">
                            {/* Mock/Real data mapping */}
                            {Object.entries(analyticsData?.volumeByDay || {}).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()).slice(-7).map(([day, count], i) => {
                               const height = Math.min(((count as number) / 10) * 100, 100);
                               return (
                                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                                     <motion.div 
                                        initial={{ height: 0 }} animate={{ height: `${height}%` }}
                                        className="w-full bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-all rounded-t-xl relative overflow-hidden" 
                                      >
                                         <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-500 to-transparent h-full opacity-30" />
                                         <div className="absolute top-2 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] font-black text-[var(--text-main)] bg-[var(--bg-main)] px-1.5 py-0.5 rounded">{count as any}</span>
                                         </div>
                                      </motion.div>
                                      <span className="text-[9px] font-bold text-zinc-600 group-hover:text-zinc-400 truncate w-full text-center">{day.split(',')[0]}</span>
                                   </div>
                                )
                             })}
                             {(!analyticsData || !analyticsData.volumeByDay || Object.keys(analyticsData.volumeByDay).length === 0) && (
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest text-sm">No historical data found</div>
                             )}
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-8">
                           <div>
                              <h3 className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest mb-2">Monthly Peak</h3>
                              <p className="text-2xl font-black text-[var(--text-main)]">{analyticsData?.volumeByMonth ? Object.entries(analyticsData.volumeByMonth as Record<string, number>).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A' : '...'}</p>
                           </div>
                           <div>
                              <h3 className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest mb-2">Total Managed</h3>
                              <p className="text-2xl font-black text-emerald-400">{analyticsData?.totalBookings || '0'}</p>
                           </div>
                       </div>
                    </div>
                 </div>

                 <div className="glass-panel p-8 rounded-3xl min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                       <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2"><PieChart className="w-6 h-6 text-blue-500" /> Specialty Mix</h2>
                       <span className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Case Distribution</span>
                    </div>
                    
                    <div className="space-y-4">
                       {analyticsData?.specialtyDistribution && Object.entries(analyticsData.specialtyDistribution as Record<string, number>).map(([spec, count], i) => {
                          const percentage = Math.round((count / analyticsData.totalBookings) * 100);
                          return (
                             <div key={i} className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-sm">
                                   <span className="font-bold text-zinc-300">{spec}</span>
                                   <span className="font-mono text-[var(--text-dim)]">{count} cases ({percentage}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-[var(--bg-card)] rounded-full overflow-hidden">
                                   <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      className={`h-full rounded-full ${i % 2 === 0 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.3)]'}`}
                                   />
                                </div>
                             </div>
                          )
                       })}
                       {!analyticsData && <p className="text-zinc-600 italic text-center py-10">Waiting for data processing...</p>}
                    </div>
                 </div>
              </div>

              {/* Day, Month, Year breakdown list */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase mb-4">Daily Volume</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                       {analyticsData?.volumeByDay && Object.entries(analyticsData.volumeByDay as Record<string, number>).sort((a,b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([day, count], i) => (
                          <div key={i} className="flex justify-between text-sm py-1 border-b border-[var(--border-main)] last:border-0 text-zinc-300">
                             <span>{day}</span>
                             <span className="font-bold text-[var(--text-main)]">{count}</span>
                          </div>
                       ))}
                    </div>
                 </div>
                 <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase mb-4">Monthly Volume</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                       {analyticsData?.volumeByMonth && Object.entries(analyticsData.volumeByMonth as Record<string, number>).map(([month, count], i) => (
                          <div key={i} className="flex justify-between text-sm py-1 border-b border-[var(--border-main)] last:border-0 text-zinc-300">
                             <span>{month}</span>
                             <span className="font-bold text-[var(--text-main)]">{count}</span>
                          </div>
                       ))}
                    </div>
                 </div>
                 <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase mb-4">Yearly Volume</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                       {analyticsData?.volumeByYear && Object.entries(analyticsData.volumeByYear as Record<string, number>).map(([year, count], i) => (
                          <div key={i} className="flex justify-between text-sm py-1 border-b border-[var(--border-main)] last:border-0 text-zinc-300">
                             <span>{year}</span>
                             <span className="font-bold text-[var(--text-main)]">{count}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}
    </div>
  );
}
