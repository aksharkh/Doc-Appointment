import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Phone, Video, MoreVertical, BadgeCheck, CheckCheck, SmilePlus, Paperclip, Mic } from 'lucide-react';
import type { BookingData } from '../stores/useBookingStore';

interface Props {
  bookingId: string;
  data: BookingData;
  onClose: () => void;
}

export default function WhatsAppBotSimulation({ bookingId, data, onClose }: Props) {
  const [messages, setMessages] = useState<{id: string, text: React.ReactNode, isBot: boolean, time: string, status?: 'sent'|'read'}[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    // Initial User Message
    const initialMsg = {
        id: '1', 
        text: 'System: Initiating secure hospital transmission...', 
        isBot: false, 
        time: now,
        status: 'read' as const
    };
    
    setMessages([initialMsg]);
    setIsTyping(true);

    const timer = setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
            id: '2',
            isBot: true,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            text: (
                <div className="space-y-2 text-[15px] leading-snug">
                    <p className="font-bold text-teal-800">🏥 DocBook Medical Center</p>
                    <p>Hello *${data.name}*,</p>
                    <p>Your medical appointment has been successfully confirmed. Please keep this ticket handy upon arrival.</p>
                    
                    <div className="bg-teal-50 border border-teal-100 p-3 rounded-xl mt-2 text-sm text-teal-900 shadow-sm">
                       <p className="font-bold uppercase tracking-widest text-[10px] text-teal-600 mb-1">Appointment Details</p>
                       <p>🗓 *Date:* ${data.date}</p>
                       <p>⏰ *Time:* ${data.time}</p>
                       <p>🩺 *Department:* ${data.specialty}</p>
                       <p>🎫 *Reference:* ${bookingId}</p>
                    </div>

                    <p className="text-xs text-[var(--text-dim)] italic mt-2">Reply with <span className="font-bold text-teal-600">CANCEL</span> or <span className="font-bold text-teal-600">RESCHEDULE</span> to modify this booking. If this is an emergency, dial 911 immediately.</p>
                </div>
            )
        }]);
    }, 1800);

    return () => clearTimeout(timer);
  }, [bookingId, data]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
       <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
       />

       <motion.div 
          initial={{ y: '100%', scale: 0.9 }} 
          animate={{ y: 0, scale: 1 }} 
          exit={{ y: '100%', opacity: 0 }} 
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-sm sm:max-w-md h-[85vh] sm:h-[750px] bg-[#EFEAE2] flex flex-col rounded-[2rem] overflow-hidden shadow-2xl border-4 border-zinc-900"
       >
          {/* WhatsApp Header area */}
          <div className="bg-[#00A884] text-[var(--text-main)] pt-6 pb-3 px-4 flex items-center justify-between shadow-md shrink-0 relative z-10">
              <div className="flex items-center gap-2">
                 <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors flex -ml-2">
                    <ChevronLeft className="w-6 h-6" />
                 </button>
                 <div className="relative">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 overflow-hidden shrink-0">
                       <img src="https://api.dicebear.com/7.x/shapes/svg?seed=hospital" alt="Hospital Avatar" className="w-8 h-8 opacity-80" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#00A884] rounded-full"></div>
                 </div>
                 <div className="ml-1 cursor-pointer">
                    <div className="flex items-center gap-1">
                        <h2 className="font-semibold text-base leading-tight">DocBook Hospital</h2>
                        <BadgeCheck className="w-4 h-4 text-[var(--text-main)] fill-emerald-500" />
                    </div>
                    <p className="text-[11px] text-[var(--text-main)]/80 leading-tight">Official Corporate Account</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <Video className="w-5 h-5 opacity-90 cursor-pointer" />
                 <Phone className="w-5 h-5 opacity-90 cursor-pointer" />
                 <MoreVertical className="w-5 h-5 opacity-90 cursor-pointer" />
              </div>
          </div>

          {/* Chat Background & Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-8 whatsapp-bg relative">
             {/* Authentic WhatsApp Pattern */}
             <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "var(--wa-bg)" }}></div>
             
             {/* Security Banner */}
             <div className="flex justify-center mb-6 relative z-10">
                <div className="bg-[#FFEECD] text-[#8C6D41] text-[11px] px-4 py-1.5 rounded-lg max-w-[90%] text-center shadow-sm">
                   <p>Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.</p>
                </div>
             </div>

             <div className="flex flex-col gap-3 relative z-10">
               <AnimatePresence>
                 {messages.map((msg) => (
                    <motion.div 
                        initial={{ opacity: 0, x: msg.isBot ? -10 : 10, y: 10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        key={msg.id} 
                        className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                    >
                       <div className={`relative max-w-[85%] rounded-[1rem] px-3 pt-2 pb-6 shadow-sm ${msg.isBot ? 'bg-white rounded-tl-none' : 'bg-[#D9FDD3] rounded-tr-none'}`}>
                          
                          {/* Chat tail SVG illusion */}
                          {msg.isBot && <div className="absolute top-0 -left-2 w-3 h-3 bg-white" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>}
                          {!msg.isBot && <div className="absolute top-0 -right-2 w-3 h-3 bg-[#D9FDD3]" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>}

                          <div className="text-[#111B21] break-words">
                             {msg.text}
                          </div>

                          <div className="absolute bottom-1 right-2 flex items-center gap-1">
                             <span className="text-[10px] text-[var(--text-dim)]">{msg.time}</span>
                             {!msg.isBot && <CheckCheck className={`w-3.5 h-3.5 ${msg.status === 'read' ? 'text-blue-500' : 'text-zinc-400'}`} />}
                          </div>
                       </div>
                    </motion.div>
                 ))}
                 
                 {isTyping && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex justify-start"
                    >
                       <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5 relative">
                          <div className="absolute top-0 -left-2 w-3 h-3 bg-white" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
                          <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"></span>
                          <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                          <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                       </div>
                    </motion.div>
                 )}
               </AnimatePresence>
             </div>
          </div>

          {/* Chat Footer */}
          <div className="bg-[#F0F2F5] p-2 flex items-end gap-2 shrink-0 z-10 bottom-0">
              <div className="flex-1 bg-white rounded-2xl min-h-[44px] flex items-center px-4 gap-4 shadow-sm pb-1">
                 <SmilePlus className="w-6 h-6 text-[var(--text-dim)] cursor-pointer" />
                 <input type="text" placeholder="Type a message" className="flex-1 bg-transparent py-3 focus:outline-none placeholder-zinc-500 text-[15px]" disabled />
                 <Paperclip className="w-6 h-6 text-[var(--text-dim)] cursor-pointer" />
              </div>
              <button className="w-11 h-11 bg-[#00A884] rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95">
                 <Mic className="w-5 h-5 text-[var(--text-main)]" />
              </button>
          </div>
       </motion.div>

       {/* Inline Styles for SVG Background Pattern */}
       <style>{`
         .whatsapp-bg {
             --wa-bg: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h10v10H10V10zM30 30h10v10H30V30z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E");
         }
       `}</style>
    </div>
  );
}
