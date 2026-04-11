import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, isWeekend, isToday } from 'date-fns';
import { useBookingStore } from '../stores/useBookingStore';
import type { BookingData, Slot, ConsultationType } from '../stores/useBookingStore';
import Ticket from './Ticket';
import { ChevronRight, Calendar as CalendarIcon, Clock, Loader2, ArrowLeft, Stethoscope, Video, Building, ShieldCheck } from 'lucide-react';

type Step = 'triage' | 'date' | 'slot' | 'details' | 'ticket';

const SPECIALTIES = ['General Practice', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology'];
const INSURANCES = ['Self-Pay (No Insurance)', 'BlueCross BlueShield', 'Aetna', 'Cigna', 'UnitedHealthcare', 'Medicare'];

export default function BookingFlow() {
  const [step, setStep] = useState<Step>('triage');
  const { addBooking, getSlotsForDate, settings, getActiveQueue, bookings } = useBookingStore();

  const [activeQueueData, setActiveQueueData] = useState<{ serving: BookingData | undefined, waiting: number }>({
    serving: undefined,
    waiting: 0
  });

  useEffect(() => {
    const updatePulse = async () => {
      try {
        const queue = await getActiveQueue();
        setActiveQueueData({
          serving: queue.find(b => b.status === 'in_session'),
          waiting: queue.filter(b => b.status === 'arrived').length
        });
      } catch (err) {
        // Fallback to local state if API fails
        const todayStr = format(new Date(), 'MMMM d, yyyy');
        const localQueue = bookings.filter(b => b.date === todayStr && ['arrived', 'in_session'].includes(b.status));
        setActiveQueueData({
          serving: localQueue.find(b => b.status === 'in_session'),
          waiting: localQueue.filter(b => b.status === 'arrived').length
        });
      }
    };

    updatePulse();
    const interval = setInterval(updatePulse, 30000); // Pulse every 30s
    return () => clearInterval(interval);
  }, [getActiveQueue, bookings]);

  const currentlyServing = activeQueueData.serving;
  const waitingCount = activeQueueData.waiting;

  // States
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState({ 
     type: 'in-person' as ConsultationType,
     specialty: '',
     isNewPatient: true,
     insurance: '',
     name: '', 
     phone: '', 
     email: '', 
     reason: '',
     location: '',
     bookingFor: 'self'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Generate valid days
  useEffect(() => {
    const dates: Date[] = [];
    let d = new Date();
    while (dates.length < 14) {
      if (!isWeekend(d)) dates.push(new Date(d));
      d = addDays(d, 1);
    }
    setAvailableDates(dates);
  }, []);

  const handleTriageSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if(formData.specialty) setStep('date');
  }

  const handleDateSelect = async (date: Date) => {
    if(settings.emergencyBlockAll) return; // Prevent selection if mocked
    setSelectedDate(date);
    setStep('slot');
    setLoadingSlots(true);
    
    setTimeout(() => {
       const data = getSlotsForDate(date);
       setSlots(data);
       setLoadingSlots(false);
    }, 600);
  };

  const handleSlotSelect = (slot: Slot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setStep('details');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) return;
    
    setIsSubmitting(true);
    try {
      const payload: Omit<BookingData, 'id' | 'status'> = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        reason: formData.reason,
        date: format(selectedDate, 'MMMM d, yyyy'),
        time: selectedSlot.time,
        specialty: formData.specialty,
        type: formData.type,
        insurance: formData.insurance,
        isNewPatient: formData.isNewPatient
      };
      
      const id = await addBooking(payload);
      setBookingId(id);
      setStep('ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 'date') setStep('triage');
    if (step === 'slot') setStep('date');
    if (step === 'details') setStep('slot');
  };

  if (settings.emergencyBlockAll && step !== 'ticket') {
     return (
        <div className="w-full max-w-2xl mx-auto px-4 py-20 text-center">
           <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <Stethoscope className="w-12 h-12 text-red-500" />
           </div>
           <h2 className="text-3xl font-bold text-[var(--text-main)] mb-4">Clinic Unavailable</h2>
           <p className="text-zinc-400">Due to an unforeseen medical emergency, the clinic has temporarily suspended all new appointments. Please check back later or call our emergency line at 911.</p>
        </div>
     )
  }

  return (
    <div className={`w-full mx-auto px-4 py-8 relative min-h-[600px] flex flex-col justify-center transition-all duration-300 ${step === 'details' ? 'max-w-5xl' : 'max-w-4xl'}`}>
      
      <AnimatePresence mode="wait">
        {step === 'triage' && (
           <motion.div initial={{opacity: 0, y:-10}} animate={{opacity: 1, y: 0}} exit={{opacity:0, y:-10}} className="mb-6 flex flex-col sm:flex-row items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 shadow-lg w-full">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <div className="relative flex h-3 w-3">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                 </div>
                 <span className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Live Clinic Pulse</span>
              </div>
              <div className="flex flex-1 w-full justify-between sm:justify-end gap-6 text-sm">
                 <div className="flex flex-col sm:items-end">
                    <span className="text-[var(--text-dim)] font-bold text-xs uppercase tracking-wider">Currently Serving</span>
                    <span className="text-[var(--text-main)] font-mono font-bold bg-zinc-800 px-2 mt-0.5 rounded border border-[var(--border-main)]">{currentlyServing?.token || 'Standby'}</span>
                 </div>
                 <div className="flex flex-col sm:items-end">
                    <span className="text-[var(--text-dim)] font-bold text-xs uppercase tracking-wider">Waiting Room</span>
                    <span className="text-[var(--text-main)] font-bold bg-zinc-800 px-2 mt-0.5 rounded border border-[var(--border-main)]">{waitingCount} Patient{waitingCount !== 1 ? 's' : ''}</span>
                 </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step !== 'ticket' && (
           <motion.div 
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             className="mb-8"
           >
            <div className="flex items-center gap-4 mb-2">
              {step !== 'triage' && (
                <button 
                  onClick={goBack}
                  className="p-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-colors border border-[var(--border-main)]"
                >
                  <ArrowLeft className="w-5 h-5 text-zinc-300" />
                </button>
              )}
              <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-500 bg-clip-text text-transparent tracking-tight">
                {step === 'triage' && "Medical Triage"}
                {step === 'date' && "Select a Date"}
                {step === 'slot' && "Choose Time"}
                {step === 'details' && "Patient Details"}
              </h1>
            </div>
            
            {/* Context breadcrumb */}
            {(formData.specialty || selectedDate || selectedSlot) && (
               <div className="flex flex-wrap items-center gap-2 mt-4 text-sm font-medium text-zinc-400 pl-2">
                  {formData.specialty && (
                     <span className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-[var(--border-main)] truncate max-w-[150px]">
                        <Building className="w-4 h-4 text-blue-400 flex-shrink-0" /> {formData.specialty}
                     </span>
                  )}
                  {selectedDate && (
                    <>
                      <ChevronRight className="w-4 h-4 opacity-30" />
                      <span className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-[var(--border-main)]">
                        <CalendarIcon className="w-4 h-4 text-emerald-400" />
                        {format(selectedDate, 'MMM d')}
                      </span>
                    </>
                  )}
                  {selectedSlot && step === 'details' && (
                     <>
                      <ChevronRight className="w-4 h-4 opacity-30" />
                      <span className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-[var(--border-main)]">
                        <Clock className="w-4 h-4 text-purple-400" />
                        {selectedSlot.time}
                      </span>
                     </>
                  )}
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: TRIAGE */}
          {step === 'triage' && (
             <motion.div
               key="triage"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="max-w-2xl"
             >
                <form onSubmit={handleTriageSubmit} className="glass-panel p-8 rounded-3xl space-y-8">
                   <div className="space-y-4">
                      <label className="text-sm font-bold text-zinc-300 pl-1 uppercase tracking-widest">Consultation Type</label>
                      <div className="grid grid-cols-2 gap-4">
                         <button type="button" onClick={() => setFormData({...formData, type: 'in-person'})} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${formData.type === 'in-person' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-dim)] hover:text-zinc-300 hover:bg-zinc-800'}`}>
                            <Stethoscope className="w-8 h-8" />
                            <span className="font-bold">In-Person Clinic</span>
                         </button>
                         <button type="button" onClick={() => setFormData({...formData, type: 'telehealth'})} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${formData.type === 'telehealth' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-dim)] hover:text-zinc-300 hover:bg-zinc-800'}`}>
                            <Video className="w-8 h-8" />
                            <span className="font-bold">Telehealth Video</span>
                         </button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-sm font-bold text-zinc-300 pl-1 uppercase tracking-widest">Select Specialty</label>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                         {SPECIALTIES.map(spec => (
                            <button 
                               key={spec} type="button" 
                               onClick={() => setFormData({...formData, specialty: spec})}
                               className={`p-3 rounded-xl border text-sm font-bold transition-colors ${formData.specialty === spec ? 'bg-zinc-100 text-zinc-950 border-white' : 'bg-[var(--bg-card)] border-[var(--border-main)] text-zinc-400 hover:bg-zinc-800'}`}
                            >
                               {spec}
                            </button>
                         ))}
                      </div>
                   </div>

                   <button type="submit" disabled={!formData.specialty} className="w-full py-4 text-emerald-950 font-bold text-lg bg-emerald-400 rounded-xl hover:bg-emerald-300 transition-colors disabled:opacity-50 disabled:bg-zinc-700 disabled:text-[var(--text-dim)] flex items-center justify-center gap-2">
                       Continue to Scheduling <ChevronRight className="w-5 h-5" />
                   </button>
                </form>
             </motion.div>
          )}

          {/* STEP 2: DATE */}
          {step === 'date' && (
            <motion.div 
              key="date"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {availableDates.map((date, idx) => {
                 const daySlots = getSlotsForDate(date);
                 const availableCount = daySlots.filter(s => s.available).length;
                 
                 return (
                    <motion.button
                      key={idx}
                      disabled={availableCount === 0}
                      whileHover={availableCount > 0 ? { scale: 1.02, y: -2 } : {}}
                      whileTap={availableCount > 0 ? { scale: 0.98 } : {}}
                      onClick={() => handleDateSelect(date)}
                      className={`relative flex flex-col items-center justify-center p-6 glass-panel rounded-2xl transition-all group overflow-hidden ${availableCount === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-500/30 hover:shadow-[0_0_25px_rgba(52,211,153,0.1)]'}`}
                    >
                      {availableCount === 0 && (
                         <div className="absolute inset-0 bg-red-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                            <span className="text-red-400 font-bold tracking-widest text-sm bg-[var(--bg-main)]/90 px-4 py-1 rounded-full border border-red-500/30 mb-2">FULL</span>
                            <button onClick={(e) => { e.stopPropagation(); alert("Added to waitlist! We will notify you if a slot opens up."); }} className="text-[10px] text-[var(--text-main)] bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full z-20 font-bold shadow-lg transition-colors border border-zinc-600">Join Waitlist</button>
                         </div>
                      )}
                      
                      <span className="text-[var(--text-dim)] font-medium text-sm mb-2 group-hover:text-emerald-400 transition-colors">
                        {format(date, 'EEEE')}
                      </span>
                      <span className="text-4xl font-black text-zinc-200 group-hover:text-[var(--text-main)] transition-colors">
                        {format(date, 'dd')}
                      </span>
                      <span className="text-[var(--text-dim)] text-xs mt-1 font-medium group-hover:text-zinc-400 transition-colors">
                        {format(date, 'MMM')}
                      </span>
                      {isToday(date) && (
                        <div className="mt-3 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 rounded-sm">
                          Today
                        </div>
                      )}
                      {availableCount > 0 && availableCount <= 3 && (
                         <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" title="Few slots left" />
                      )}
                      {availableCount > 3 && (
                         <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" title="High availability" />
                      )}
                    </motion.button>
                 );
              })}
            </motion.div>
          )}

          {/* STEP 3: SLOT */}
          {step === 'slot' && (
            <motion.div 
              key="slot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {loadingSlots ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  <p className="text-zinc-400 animate-pulse font-medium">Checking {formData.specialty} schedules...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {slots.map((slot, idx) => (
                    <motion.button
                      key={idx}
                      disabled={!slot.available}
                      whileHover={slot.available ? { scale: 1.03 } : {}}
                      whileTap={slot.available ? { scale: 0.97 } : {}}
                      onClick={() => handleSlotSelect(slot)}
                      className={`relative overflow-hidden p-6 rounded-2xl text-left transition-all border
                        ${slot.available 
                          ? 'glass-panel hover:border-emerald-500/40 hover:bg-zinc-800/80 cursor-pointer group' 
                          : 'bg-[var(--bg-card)]/40 border-[var(--border-main)] opacity-50 cursor-not-allowed'}
                      `}
                    >
                      <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${slot.available ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-500/50'}`}></div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className={`w-5 h-5 ${slot.available ? 'text-zinc-100 group-hover:text-emerald-400' : 'text-zinc-600'} transition-colors`} />
                        <span className={`text-xl font-bold tracking-tight ${slot.available ? 'text-[var(--text-main)]' : 'text-zinc-600'}`}>
                          {slot.time.split(' ')[0]}
                        </span>
                        <span className={`text-sm font-medium ${slot.available ? 'text-emerald-400/80' : 'text-zinc-700'}`}>
                          {slot.time.split(' ')[1]}
                        </span>
                      </div>
                      <p className={`text-sm font-medium ${slot.available ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-700'}`}>
                        {slot.available ? 'Available' : (slot.blockedByAdmin ? 'Operations Blocked' : 'Booked')}
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: PATIENT DETAILS */}
          {step === 'details' && (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
               <form onSubmit={handleBookingSubmit} className="space-y-6 w-full max-w-2xl mx-auto">
                <div className="glass-panel p-8 rounded-3xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    
                    {/* Patient Type */}
                    <div className="md:col-span-2 flex items-center justify-between p-4 bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl">
                       <span className="text-sm font-bold text-zinc-300">Are you a new patient?</span>
                       <div className="flex gap-2">
                          <button type="button" onClick={() => setFormData({...formData, isNewPatient: true})} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${formData.isNewPatient ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-[var(--text-main)]'}`}>Yes, I am new</button>
                          <button type="button" onClick={() => setFormData({...formData, isNewPatient: false})} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${!formData.isNewPatient ? 'bg-blue-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-[var(--text-main)]'}`}>No, returning</button>
                       </div>
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between p-4 bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl">
                       <span className="text-sm font-bold text-zinc-300">Who is this appointment for?</span>
                       <div className="flex gap-2">
                          <button type="button" onClick={() => setFormData({...formData, bookingFor: 'self'})} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${formData.bookingFor === 'self' ? 'bg-purple-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-[var(--text-main)]'}`}>Myself</button>
                          <button type="button" onClick={() => setFormData({...formData, bookingFor: 'dependent'})} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${formData.bookingFor === 'dependent' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-[var(--text-main)]'}`}>Dependent</button>
                       </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400 pl-1">Full Legal Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400 pl-1">Phone Number</label>
                      <input 
                        required
                        type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400 pl-1">Email Address</label>
                      <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400 pl-1">Insurance Provider (Optional)</label>
                      <select 
                        value={formData.insurance}
                        onChange={e => setFormData({...formData, insurance: e.target.value})}
                        className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium appearance-none"
                      >
                         <option value="" disabled>Select Provider</option>
                         {INSURANCES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-zinc-400 pl-1">Reason for Visit & Symptoms</label>
                      <textarea 
                        required
                        rows={2}
                        value={formData.reason}
                        onChange={e => setFormData({...formData, reason: e.target.value})}
                        className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none font-medium"
                        placeholder="Please describe your primary symptoms and duration..."
                      />
                    </div>
                  </div>

                  <div className="pt-4 relative z-10 border-t border-[var(--border-main)]">
                     <div className="flex items-start gap-3 mb-6 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                        <ShieldCheck className="w-6 h-6 text-blue-400 flex-shrink-0" />
                        <p className="text-xs text-blue-200/70">Your health information is secure and encrypted. By concluding this booking, you agree to our clinic's No-Show policy which may incur a $25 fee if not cancelled within 24 hours.</p>
                     </div>
                     <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full relative group overflow-hidden rounded-xl bg-zinc-100 text-zinc-950 font-bold text-lg py-4 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-70 disabled:hover:scale-100"
                     >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-300 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Securely Registering...
                            </>
                          ) : (
                            <>Confirm Medical Appointment <ChevronRight className="w-5 h-5" /></>
                          )}
                        </span>
                     </button>
                  </div>
                </div>
              </form>

               {/* Live Ticket Preview Sidebar */}
               <div className="hidden lg:block sticky top-24 pl-4 border-l border-[var(--border-main)]">
                  <div className="flex items-center gap-2 mb-4 justify-center text-[var(--text-dim)] font-bold text-sm uppercase tracking-widest">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                     Live Ticket Preview
                  </div>
                  <div className="scale-90 origin-top opacity-80 pointer-events-none">
                     <Ticket 
                        bookingId="TKT-PREV" 
                        data={{
                          ...formData,
                          id: 'PREV',
                          date: selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'No Date',
                          time: selectedSlot ? selectedSlot.time : 'No Time',
                          status: 'confirmed',
                          isNewPatient: formData.isNewPatient
                        }} 
                     />
                  </div>
               </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: TICKET */}
          {step === 'ticket' && bookingId && selectedDate && selectedSlot && (
            <motion.div key="ticket" className="w-full flex justify-center py-4">
              <Ticket 
                bookingId={bookingId} 
                data={{
                  id: bookingId,
                  name: formData.name,
                  phone: formData.phone,
                  email: formData.email,
                  specialty: formData.specialty,
                  type: formData.type,
                  isNewPatient: formData.isNewPatient,
                  date: format(selectedDate, 'MMM d, yyyy'),
                  time: selectedSlot.time,
                  status: 'confirmed'
                }} 
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
