import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Stethoscope, HeartPulse, Pill, BotMessageSquare, Save, CalendarPlus, CheckCircle2, ChevronRight, Activity, Beaker } from 'lucide-react';
import { useBookingStore } from '../stores/useBookingStore';
import type { BookingData, Prescription, RxStatus } from '../stores/useBookingStore';

const MOCK_AI_RESPONSES: Record<string, string[]> = {
  general: ['Consider ordering a CBC and metabolic panel.', 'Differential includes viral URI vs simple allergies based on recent history.', 'Review recent blood pressure trends.'],
  hypertension: ['Recommendation: ACE Inhibitor initiation.', 'Suggest lifestyle modification counseling.', 'Follow-up within 2 weeks strictly.'],
};

const COMMON_DRUGS = ['Amoxicillin 500mg', 'Lisinopril 10mg', 'Metformin 500mg', 'Ibuprofen 800mg', 'Omeprazole 20mg'];

export default function AdminEncounter() {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const { bookings, updateClinicalEncounter, updateBookingStatus, addBooking } = useBookingStore();
  
  const patientMatch = bookings.find(b => b.id === id);
  const [patient, setPatient] = useState<BookingData | null>(patientMatch || null);
  
  // Local active states
  const [activeTab, setActiveTab] = useState<'notes'|'vitals'|'rx'|'ai' | 'lab'>('notes');
  const [notes, setNotes] = useState(patient?.doctorNotes || '');
  const [vitals, setVitals] = useState(patient?.vitals || { bp: '', hr: '', temp: '', weight: '' });
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(patient?.prescriptions || []);
  const [drugsQuery, setDrugsQuery] = useState('');
  
  // AI Mock states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  if (!patient) return <div className="p-8 text-center text-red-500">Encounter not found or expired.</div>;

  const handleSaveVitals = () => {
    updateClinicalEncounter(patient.id, { vitals });
    // Simulate toast
  }

  const handleAddRx = (drug: string) => {
    const rx: Prescription = { name: drug, dosage: 'As directed', instructions: 'Take daily', status: 'pending' };
    const updated = [...prescriptions, rx];
    setPrescriptions(updated);
    updateClinicalEncounter(patient.id, { prescriptions: updated });
    setDrugsQuery('');
  }
  
  const handleRemoveRx = (index: number) => {
     const updated = [...prescriptions];
     updated.splice(index, 1);
     setPrescriptions(updated);
     updateClinicalEncounter(patient.id, { prescriptions: updated });
  }

  const runAiAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if(!aiPrompt) return;
    setIsAiThinking(true);
    setTimeout(() => {
       const key = aiPrompt.toLowerCase().includes('hyper') ? 'hypertension' : 'general';
       setAiAnalysis(MOCK_AI_RESPONSES[key]);
       setIsAiThinking(false);
       setAiPrompt('');
    }, 1500);
  }

  const handleSaveAndConclude = () => {
    // Save final notes
    updateClinicalEncounter(patient.id, { doctorNotes: notes });
    
    // Auto follow up logic trigger
    if (notes.toLowerCase().includes('follow up') || notes.toLowerCase().includes('hypertension')) {
       if(confirm('Clinical AI detected Follow-up needed. Recommend auto-scheduling for 2 weeks?')) {
          addBooking({
             name: patient.name,
             phone: patient.phone,
             email: patient.email,
             type: patient.type,
             specialty: patient.specialty,
             isNewPatient: false,
             date: 'Next Available (Waitlist)',
             time: 'TBD',
             reason: 'Automated Follow-Up Generation',
          });
       }
    }

    // Move state to complete
    updateBookingStatus(patient.id, 'completed');
    navigate('/admin');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-zinc-950 font-sans mt-[-1rem] mx-[-1rem]">
       {/* High Density Header */}
       <header className="bg-zinc-900 border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0 drop-shadow-lg z-20">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/admin')} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="h-10 w-px bg-white/10"></div>
             <div>
                <h1 className="text-2xl font-black text-white leading-none tracking-tight">{patient.name}</h1>
                <div className="flex items-center gap-2 mt-1.5 text-xs font-bold font-mono text-zinc-500 uppercase">
                   <span className="text-zinc-400">DOB: 1985-04-12</span> &bull; 
                   <span>ID: {patient.id}</span> &bull;
                   <span className={`${patient.type === 'telehealth' ? 'text-blue-400' : 'text-emerald-400'}`}>{patient.type === 'telehealth' ? 'VIRTUAL' : 'IN-CLINIC'}</span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Encounter Time</span>
                <span className="text-xl font-mono text-white">00:15:24</span>
             </div>
             <button onClick={handleSaveAndConclude} className="ml-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-lg transition-transform hover:scale-[1.02] shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center gap-2">
                Conclude Encounter <CheckCircle2 className="w-5 h-5" />
             </button>
          </div>
       </header>

       <div className="flex flex-1 overflow-hidden relative z-10">
          
          {/* Sidebar Tools Navigation */}
          <nav className="w-24 bg-zinc-900/50 border-r border-white/5 flex flex-col items-center py-6 gap-6 shrink-0 z-10">
             <button onClick={() => setActiveTab('notes')} className={`p-4 rounded-2xl transition-all ${activeTab==='notes' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`} title="Clinical Notes"><Stethoscope className="w-7 h-7" /></button>
             <button onClick={() => setActiveTab('vitals')} className={`p-4 rounded-2xl transition-all ${activeTab==='vitals' ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-zinc-500 hover:text-zinc-300'}`} title="Patient Vitals"><HeartPulse className="w-7 h-7" /></button>
             <button onClick={() => setActiveTab('rx')} className={`p-4 rounded-2xl transition-all ${activeTab==='rx' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-zinc-500 hover:text-zinc-300'}`} title="Rx & Pharmacy"><Pill className="w-7 h-7" /></button>
             <button onClick={() => setActiveTab('ai')} className={`p-4 rounded-2xl transition-all ${activeTab==='ai' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'text-zinc-500 hover:text-zinc-300'}`} title="AI Assistant"><BotMessageSquare className="w-7 h-7" /></button>
             <button onClick={() => setActiveTab('lab')} className={`p-4 rounded-2xl transition-all ${activeTab==='lab' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-zinc-500 hover:text-zinc-300'}`} title="Lab Orders"><Beaker className="w-7 h-7" /></button>
          </nav>

          {/* Main Workspace */}
          <main className="flex-1 overflow-y-auto p-8 relative">
             <div className="max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                   
                   {/* NOTES TAB */}
                   {activeTab === 'notes' && (
                      <motion.div key="notes" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
                         <div className="flex gap-4 mb-8">
                            <div className="flex-1 bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex flex-col gap-2">
                               <span className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2"><HeartPulse className="w-4 h-4" /> Allergies</span>
                               <span className="text-zinc-300 font-bold">{patient.allergies?.join(', ') || 'NKDA'}</span>
                            </div>
                            <div className="flex-1 bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 flex flex-col gap-2">
                               <span className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-2"><Activity className="w-4 h-4" /> Chronic Tags</span>
                               <span className="text-zinc-300 font-bold">{patient.chronicConditions?.join(', ') || 'None reported'}</span>
                            </div>
                         </div>
                         
                         <div>
                            <h2 className="text-xl font-bold text-white mb-4">Chief Complaint / Subjective</h2>
                            <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl text-zinc-400 font-medium">
                               {patient.reason || 'No specific complaint entered by front desk.'}
                            </div>
                         </div>
                         
                         <div>
                            <div className="flex items-center justify-between mb-4 mt-8">
                               <h2 className="text-xl font-bold text-white">Clinical Assessment & Plan (Private)</h2>
                               <button onClick={() => updateClinicalEncounter(patient.id, { doctorNotes: notes })} className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-md hover:bg-blue-500/20 transition-colors flex items-center gap-1"><Save className="w-3 h-3" /> Auto-saved</button>
                            </div>
                            <textarea 
                               className="w-full h-96 bg-zinc-900 border border-white/10 rounded-xl p-6 text-white text-lg leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-y"
                               placeholder="Start typing clinical observation notes here..."
                               value={notes}
                               onChange={e => setNotes(e.target.value)}
                            />
                         </div>
                      </motion.div>
                   )}

                   {/* VITALS TAB */}
                   {activeTab === 'vitals' && (
                      <motion.div key="vitals" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6 max-w-2xl">
                         <h2 className="text-2xl font-bold text-white mb-6">Patient Vitals Flowsheet</h2>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Blood Pressure (mmHg)</label>
                               <input type="text" value={vitals?.bp} onChange={e=>setVitals({...vitals, bp:e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-mono focus:ring-1 focus:ring-red-500 outline-none" placeholder="120/80" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Heart Rate (BPM)</label>
                               <input type="text" value={vitals?.hr} onChange={e=>setVitals({...vitals, hr:e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-mono focus:ring-1 focus:ring-red-500 outline-none" placeholder="72" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Temperature (°F)</label>
                               <input type="text" value={vitals?.temp} onChange={e=>setVitals({...vitals, temp:e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-mono focus:ring-1 focus:ring-red-500 outline-none" placeholder="98.6" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Weight</label>
                               <input type="text" value={vitals?.weight} onChange={e=>setVitals({...vitals, weight:e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-mono focus:ring-1 focus:ring-red-500 outline-none" placeholder="150 lbs" />
                            </div>
                         </div>
                         <button onClick={handleSaveVitals} className="mt-8 px-6 py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl transition-colors">Update Medical Record Tracking</button>
                      </motion.div>
                   )}

                   {/* RX PAD */}
                   {activeTab === 'rx' && (
                      <motion.div key="rx" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-8">
                         <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Digital Prescription Pad</h2>
                            <p className="text-zinc-400 mb-6 font-medium">Any medications prescribed here are instantly pushed to the internal Pharmacy Fulfillment queue for nurse prep.</p>
                            
                            <div className="bg-zinc-900 border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                               <div className="flex gap-4">
                                  <input 
                                     type="text" 
                                     value={drugsQuery}
                                     onChange={(e) => setDrugsQuery(e.target.value)}
                                     className="flex-1 bg-zinc-950 border border-blue-500/20 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                                     placeholder="Search for medication (e.g., Amoxicillin)..."
                                  />
                                  <button disabled={!drugsQuery} onClick={() => handleAddRx(drugsQuery)} className="px-6 py-3 bg-blue-500 text-blue-950 font-bold rounded-xl hover:bg-blue-400 disabled:opacity-50 transition-colors">Sign & Send</button>
                               </div>

                               <div className="mt-4 flex flex-wrap gap-2">
                                  {COMMON_DRUGS.map(d => (
                                     <button key={d} onClick={()=>setDrugsQuery(d)} className="px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 text-blue-200 text-xs font-bold rounded-full hover:bg-blue-500/20 transition-colors">
                                        + {d}
                                     </button>
                                  ))}
                               </div>
                            </div>
                         </div>

                         <div>
                            <h3 className="text-lg font-bold text-zinc-300 uppercase tracking-widest mb-4">Active Visit Prescriptions</h3>
                            <div className="space-y-3">
                               <AnimatePresence>
                                  {prescriptions.map((rx, idx) => (
                                     <motion.div key={idx} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, height:0}} className="flex items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-xl group relative overflow-hidden">
                                        {rx.status === 'pending' && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}
                                        {rx.status === 'packed' && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />}
                                        
                                        <div className="pl-4">
                                           <p className="text-xl font-bold text-white mb-1">{rx.name}</p>
                                           <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
                                              <span>Sig: {rx.instructions}</span> &bull; <span>Status: <span className={rx.status==='packed'?'text-emerald-400 font-bold':'text-amber-400 font-bold'}>{rx.status.toUpperCase()}</span></span>
                                           </div>
                                        </div>
                                        <button onClick={()=>handleRemoveRx(idx)} className="p-3 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold text-sm">Cancel Rx</button>
                                     </motion.div>
                                  ))}
                                  {prescriptions.length === 0 && <p className="text-zinc-600 font-medium py-4 text-sm italic">No active prescriptions drafted yet.</p>}
                               </AnimatePresence>
                            </div>
                         </div>
                      </motion.div>
                   )}

                   {/* AI ASSISTANT TAB */}
                   {activeTab === 'ai' && (
                      <motion.div key="ai" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="flex flex-col h-[600px] border border-purple-500/20 rounded-3xl overflow-hidden bg-zinc-900/30">
                         <div className="bg-purple-900/20 p-4 border-b border-purple-500/20 flex items-center gap-3">
                            <BotMessageSquare className="w-6 h-6 text-purple-400" />
                            <h2 className="font-bold text-purple-100">Clinical Decision Support AI</h2>
                         </div>
                         <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {aiAnalysis.length > 0 ? (
                               aiAnalysis.map((line, i) => (
                                  <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: i*0.2}} key={i} className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-50">
                                     <span className="font-bold text-purple-400 mr-2">&bull;</span> {line}
                                  </motion.div>
                               ))
                            ) : (
                               <div className="h-full flex flex-col items-center justify-center opacity-40">
                                  <BotMessageSquare className="w-16 h-16 text-purple-500 mb-4" />
                                  <p className="text-zinc-300 font-bold">Ask the assistant about differential diagnosis</p>
                                  <p className="text-sm text-zinc-500">All responses trace medical guidelines.</p>
                               </div>
                            )}
                            {isAiThinking && <p className="text-purple-400 animate-pulse font-bold text-center">AI is analyzing subjective parameters...</p>}
                         </div>
                         <form onSubmit={runAiAnalysis} className="p-4 bg-zinc-950 border-t border-purple-500/10 flex gap-4">
                            <input type="text" value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="e.g. Patient presents with elevated BP of 145/90 and headaches..." className="flex-1 bg-zinc-900 border border-purple-500/30 rounded-xl px-4 text-white focus:outline-none focus:ring-1 focus:ring-purple-500" />
                            <button disabled={isAiThinking||!aiPrompt} className="px-6 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-400 disabled:opacity-50">Ask AI</button>
                         </form>
                      </motion.div>
                   )}
                   
                   {/* LAB ORDER TAB */}
                   {activeTab === 'lab' && (
                      <motion.div key="lab" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6 max-w-2xl">
                         <h2 className="text-2xl font-bold text-white mb-2">Order Diagnostics & Labs</h2>
                         <p className="text-zinc-400 mb-6">Select requested tests to be added to patient checkout packet.</p>
                         
                         <div className="space-y-2">
                             {['Complete Blood Count (CBC)', 'Comprehensive Metabolic Panel (CMP)', 'Lipid Panel', 'Urinalysis', 'TSH (Thyroid)'].map(lab => (
                                <label key={lab} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-zinc-900 hover:bg-zinc-800 cursor-pointer transition-colors">
                                   <input type="checkbox" className="w-5 h-5 accent-amber-500 rounded border-zinc-700 bg-zinc-950" />
                                   <span className="text-white font-bold">{lab}</span>
                                </label>
                             ))}
                         </div>
                      </motion.div>
                   )}
                   
                </AnimatePresence>
             </div>
          </main>
       </div>
    </div>
  );
}
