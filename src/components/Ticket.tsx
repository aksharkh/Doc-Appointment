import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, User, CheckCircle2, CalendarPlus } from 'lucide-react';
import type { BookingData } from '../stores/useBookingStore';
import WhatsAppBotSimulation from './WhatsAppBotSimulation';

interface TicketProps {
  bookingId: string;
  data: BookingData;
}

export default function Ticket({ bookingId, data }: TicketProps) {
  const qrValue = JSON.stringify({ id: bookingId, name: data.name, time: `${data.date} at ${data.time}` });
  
  const [showBot, setShowBot] = useState(false);

  const handleWhatsApp = () => {
     setShowBot(true);
  };

  const handleGoogleCalendar = () => {
     // Simple Google Calendar link generator
     const text = encodeURIComponent(`Appointment with Dr. Smith`);
     const details = encodeURIComponent(`Booking ID: ${bookingId}\nPatient: ${data.name}\nReason: ${data.reason || 'Not specified'}`);
     const location = encodeURIComponent(`123 Health Ave, Suite 4`);
     
     // Note: for a pure frontend, converting "October 24, 2024 at 10:00 AM" to ISO exact format requires parsing. 
     // Here is a simplified dynamic link relying on user's timezone parsing or generic templates.
     window.open(`https://calendar.google.com/calendar/r/eventedit?text=${text}&details=${details}&location=${location}`, '_blank');
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut", type: "spring" }}
      className="max-w-md w-full mx-auto"
    >
      <div className="flex flex-col items-center justify-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <CheckCircle2 className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] mb-3" />
        </motion.div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">Booking Confirmed</h2>
        <p className="text-zinc-400 mt-1">Check your details below</p>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        
        <div className="relative flex flex-col glass-panel rounded-3xl overflow-hidden drop-shadow-2xl selection:bg-teal-500/30">
          
          <div className="p-8 pb-10 bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 relative">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">{data.token ? 'Queue Token' : 'Appointment ID'}</p>
                <p className={`font-mono font-semibold tracking-wider ${data.token ? 'text-emerald-400 text-2xl' : 'text-zinc-100'}`}>{data.token || bookingId}</p>
                {data.token && <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Ref: {bookingId.split('-')[1]}</p>}
              </div>
              <div className="bg-zinc-800/80 p-2 rounded-xl border border-zinc-700/50">
                <QRCodeSVG value={qrValue} size={64} fgColor="#000000" bgColor="#ffffff" className="rounded-lg p-1 bg-white" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-6">Dr. Smith's Clinic</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Patient Name</p>
                  <p className="text-zinc-100 font-medium">{data.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Date</p>
                  <p className="text-zinc-100 font-medium">{data.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Time Segment</p>
                  <p className="text-zinc-100 font-medium">{data.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400">{data.type === 'telehealth' ? 'Virtual Call' : 'Location'}</p>
                  <p className="text-zinc-100 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{data.type === 'telehealth' ? 'Link provided later' : '123 Health Ave, Suite 4'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Department</p>
                  <p className="text-zinc-100 font-medium">{data.specialty || 'General'}</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 w-8 h-8 rounded-full bg-zinc-950 border-r border-t border-white/5 blur-[0.5px]"></div>
            <div className="absolute -bottom-4 -right-4 w-8 h-8 rounded-full bg-zinc-950 border-l border-t border-white/5 blur-[0.5px]"></div>
          </div>

          <div className="relative flex justify-center w-full my-[-2px] z-10">
            <div className="w-[calc(100%-3rem)] border-t-[3px] border-dotted border-zinc-700/80"></div>
          </div>

          <div className="p-6 bg-zinc-900/90 relative flex flex-col gap-3 items-center">
             
             <div className="w-full flex gap-2 flex-col sm:flex-row">
                <button 
                  onClick={handleGoogleCalendar}
                  className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-white text-zinc-950 transition-colors rounded-xl font-bold flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                >
                   <CalendarPlus className="w-5 h-5" /> Validate
                </button>
                <button 
                  onClick={handleWhatsApp}
                  className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#128C7E] transition-colors rounded-xl font-bold text-zinc-950 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)] transform hover:-translate-y-0.5"
                >
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.711.927 2.89.927 3.181 0 5.765-2.586 5.766-5.766s-2.585-5.769-5.767-5.769zm3.22 8.049c-.177.498-.823.957-1.15.992-.328.035-.858.071-1.522-.16-.665-.231-1.637-.621-2.909-1.89-1.272-1.269-1.522-2.161-1.611-2.427-.089-.266-.107-.533-.018-.745.089-.213.248-.373.39-.515.142-.142.302-.195.426-.231.124-.035.249.035.337.142.124.16.426.745.48 1.011.053.266.018.444-.089.586-.107.142-.142.231-.231.337-.089.106-.178.231-.249.302-.089.089-.178.195-.089.337s.355.515.71.852c.355.337.816.638.976.71.16.071.302.053.408-.053s.284-.337.426-.515c.142-.178.302-.124.462-.071.16.053 1.011.48 1.189.568.178.089.284.142.337.231.053.089.053.302-.124.8zM12 2C6.477 2 2 6.477 2 12c0 1.838.497 3.558 1.353 5.031L2 22l5.127-1.325A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.25c-1.61 0-3.111-.429-4.409-1.171l-3.082.798.814-2.986A8.258 8.258 0 013.75 12c0-4.551 3.7-8.25 8.25-8.25s8.25 3.699 8.25 8.25-3.699 8.25-8.25 8.25z"/></svg>
                   WhatsApp
                </button>
             </div>
             
             <p className="text-xs text-zinc-500 mt-2">Please present this QR code at the reception desk.</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
         {showBot && <WhatsAppBotSimulation bookingId={bookingId} data={data} onClose={() => setShowBot(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
