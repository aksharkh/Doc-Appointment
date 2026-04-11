import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Stethoscope, HeartPulse, Pill, BotMessageSquare, Save, CheckCircle2, Activity, Beaker, Clock, Loader2, FileText, MessageSquare, CalendarPlus, FileDown } from 'lucide-react';
import { useBookingStore } from '../stores/useBookingStore';
import type { BookingData, Prescription } from '../stores/useBookingStore';

const COMMON_DRUGS = ['Amoxicillin 500mg', 'Lisinopril 10mg', 'Metformin 500mg', 'Ibuprofen 800mg', 'Omeprazole 20mg'];

const RX_TEMPLATES = [
  { name: 'Standard Cold Pack', drugs: [ { name: 'Amoxicillin 500mg', instr: 'Take daily with water', timing: 'After Food', freq: 'Morning & Night' }, { name: 'Ibuprofen 400mg', instr: 'For fever/pain', timing: 'After Food', freq: 'As needed' } ] },
  { name: 'Hypertension Starter', drugs: [ { name: 'Lisinopril 10mg', instr: 'Take daily for BP', timing: 'Before Food', freq: 'Once daily' } ] }
];

export default function AdminEncounter() {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const { bookings, updateClinicalEncounter, updateBookingStatus, addBooking, getPatientHistory } = useBookingStore();
  
  const patientMatch = bookings.find(b => b.id === id);
  const [patient] = useState<BookingData | null>(patientMatch || null);
  
  // Local active states
  const [activeTab, setActiveTab] = useState<'notes'|'vitals'|'rx'|'ai'|'lab'|'history'|'chat'|'docs'>('notes');
  const [notes, setNotes] = useState(patient?.doctorNotes || '');
  const [vitals, setVitals] = useState(patient?.vitals || { bp: '', hr: '', temp: '', weight: '' });
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(patient?.prescriptions || []);
  const [labRequests, setLabRequests] = useState<string[]>(patient?.labRequests || []);
  const [drugsQuery, setDrugsQuery] = useState('');
  const [rxTiming, setRxTiming] = useState('Before Food');
  const [rxFrequency, setRxFrequency] = useState('Once daily');
  const [rxComments, setRxComments] = useState('');
  
  // AI Mock states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Chat & Followup
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{sender: string, text: string, time: string}[]>([
      { sender: 'System', text: 'Encounter started. Pharmacy is online.', time: new Date().toLocaleTimeString() }
  ]);
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [historyData, setHistoryData] = useState<BookingData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'history' && patient?.email) {
      const loadHistory = async () => {
        setLoadingHistory(true);
        try {
          const data = await getPatientHistory(patient.email);
          setHistoryData(data);
        } catch (err) {
          console.error("Failed to load history", err);
        } finally {
          setLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [activeTab, patient?.email, getPatientHistory]);

  const showToast = (msg: string) => {
     setToastMsg(msg);
     setTimeout(() => setToastMsg(null), 3000);
  };

  if (!patient) return <div className="p-8 text-center text-red-500">Encounter not found or expired.</div>;

  const handleSaveVitals = () => {
    updateClinicalEncounter(patient.id, { vitals });
    showToast('Vitals successfully recorded.');
  }

  const handleAddRx = (drug: string) => {
    const rx: Prescription = { 
       name: drug, 
       dosage: 'As directed', 
       instructions: 'Take daily', 
       timing: rxTiming,
       frequency: rxFrequency,
       comments: rxComments,
       status: 'pending' 
    };
    const updated = [...prescriptions, rx];
    setPrescriptions(updated);
    updateClinicalEncounter(patient.id, { prescriptions: updated });
    setDrugsQuery('');
    setRxComments('');
    showToast(`Prescription for ${drug} signed and sent to Pharmacy.`);
  }
  
  const handleRemoveRx = (index: number) => {
     const updated = [...prescriptions];
     updated.splice(index, 1);
     setPrescriptions(updated);
     updateClinicalEncounter(patient.id, { prescriptions: updated });
  }

  const handleApplyTemplate = (template: typeof RX_TEMPLATES[0]) => {
     const newRxs = template.drugs.map(d => ({
        name: d.name,
        dosage: 'As directed',
        instructions: d.instr,
        timing: d.timing,
        frequency: d.freq,
        status: 'pending' as const
     }));
     const updated = [...prescriptions, ...newRxs];
     setPrescriptions(updated);
     updateClinicalEncounter(patient.id, { prescriptions: updated });
     showToast(`${template.name} protocol signed and sent to Pharmacy.`);
  }

  const handleSendChat = (e: React.FormEvent) => {
      e.preventDefault();
      if(!chatInput) return;
      setChatMessages(prev => [...prev, { sender: 'You', text: chatInput, time: new Date().toLocaleTimeString() }]);
      setChatInput('');
      setTimeout(() => {
          setChatMessages(prev => [...prev, { sender: 'Pharmacy/Staff', text: 'Copy that. We are preparing it now.', time: new Date().toLocaleTimeString() }]);
      }, 2000);
  }

  const handlePrintMedCert = () => {
      showToast("Medical Certificate generated and saved to Patient Portal.");
      // In real-world, this triggers PDF generation
  }

  const runAiAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if(!aiPrompt) return;
    setIsAiThinking(true);
    setTimeout(() => {
       const p = (aiPrompt + " " + notes).toLowerCase();
       let responses: string[] = [];

       if (p.includes('headache') || p.includes('migraine')) {
           responses.push('Consider neurological exam to rule out secondary causes of headache.');
           responses.push('If migraine is suspected, consider prescribing a Triptan (e.g., Sumatriptan 50mg).');
       }
       if (p.includes('bp') || p.includes('blood pressure') || p.includes('140/') || p.includes('hypertension')) {
           responses.push('Elevated BP detected. Recommend confirming reading after 5 minutes of rest.');
           responses.push('Consider ACE Inhibitor or ARB initiation if sustained hypertension is confirmed.');
       }
       if (p.includes('cough') || p.includes('fever') || p.includes('throat')) {
           responses.push('Differential diagnosis: viral URI vs bacterial pharyngitis.');
           responses.push('Consider rapid strep test and advising symptomatic care.');
       }
       if (responses.length === 0) {
           responses = ['Consider ordering a CBC and metabolic panel.', 'Differential includes viral URI vs simple allergies based on recent history.', 'Review recent blood pressure trends.'];
       } else {
           responses.push('Follow-up recommended within 2 weeks if symptoms do not improve.');
       }

       setAiAnalysis(responses);
       setIsAiThinking(false);
       setAiPrompt('');
    }, 1500);
  }

  const handleToggleLab = (lab: string) => {
    const updated = labRequests.includes(lab)
      ? labRequests.filter(l => l !== lab)
      : [...labRequests, lab];
    setLabRequests(updated);
    updateClinicalEncounter(patient.id, { labRequests: updated });
    showToast(`${lab} added to diagnostics.`);
  };

  const handleSaveAndConclude = () => {
    // Save final notes
    updateClinicalEncounter(patient.id, { doctorNotes: notes });
    
    // Auto follow up logic trigger based on AI or Explicit toggle
    if (scheduleFollowUp || notes.toLowerCase().includes('follow up') || notes.toLowerCase().includes('hypertension')) {
       if(scheduleFollowUp || confirm('Clinical AI detected Follow-up needed. Recommend auto-scheduling for 2 weeks?')) {
          addBooking({
             name: patient.name,
             phone: patient.phone,
             email: patient.email,
             type: patient.type,
             specialty: patient.specialty,
             isNewPatient: false,
             date: 'Waitlist',
             time: 'TBD',
             reason: 'Automated Follow-Up Generation',
          });
          showToast("Follow-up appointment generated.");
       }
    }

    // Move state to complete
    updateBookingStatus(patient.id, 'completed');
    navigate('/admin');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-[var(--bg-main)] font-sans mt-[-1rem] mx-[-1rem] transition-colors duration-300">
       {/* High Density Header */}
       <header className="bg-[var(--bg-card)] border-b border-[var(--border-main)] px-6 py-4 flex items-center justify-between shrink-0 drop-shadow-lg z-20">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/admin')} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-[var(--text-main)] shrink-0">
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
             <div>
                <h1 className="text-2xl font-black text-[var(--text-main)] leading-none tracking-tight">{patient.name}</h1>
                <div className="flex items-center gap-2 mt-1.5 text-xs font-bold font-mono text-[var(--text-dim)] uppercase">
                   <span className="text-zinc-400">DOB: 1985-04-12</span> &bull; 
                   <span>ID: {patient.id}</span> &bull;
                   <span className={`${patient.type === 'telehealth' ? 'text-blue-400' : 'text-emerald-400'}`}>{patient.type === 'telehealth' ? 'VIRTUAL' : 'IN-CLINIC'}</span>
                </div>
             </div>
          </div>
           <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Encounter Time</span>
                <span className="text-xl font-mono text-[var(--text-main)]">{formatTime(elapsedSeconds)}</span>
             </div>
             <button onClick={handleSaveAndConclude} className="ml-4 px-4 sm:px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-lg transition-transform hover:scale-[1.02] shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center gap-2 text-sm sm:text-base">
                <span className="hidden sm:inline">Conclude Encounter</span> <CheckCircle2 className="w-5 h-5" />
             </button>
          </div>
       </header>

       <AnimatePresence>
         {toastMsg && (
            <motion.div 
               initial={{ y: 50, opacity: 0 }} 
               animate={{ y: 0, opacity: 1 }} 
               exit={{ y: 50, opacity: 0 }} 
               className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-zinc-800 text-[var(--text-main)] px-6 py-4 rounded-2xl shadow-2xl border border-[var(--border-main)] z-50 flex items-center gap-3 font-bold"
            >
               <CheckCircle2 className="w-6 h-6 text-emerald-400" /> {toastMsg}
            </motion.div>
         )}
       </AnimatePresence>

       <div className="flex flex-col sm:flex-row flex-1 overflow-hidden relative z-10 w-full">
          
          {/* Sidebar Tools Navigation */}
          <nav className="w-full sm:w-24 bg-[var(--bg-card)]/50 border-b sm:border-b-0 sm:border-r border-[var(--border-main)] flex sm:flex-col items-center p-4 sm:py-6 gap-2 sm:gap-6 shrink-0 z-10 overflow-x-auto sm:overflow-visible">
             <button onClick={() => setActiveTab('history')} className={`p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='history' ? 'bg-zinc-800 text-[var(--text-main)] shadow-lg' : 'text-[var(--text-dim)] hover:text-zinc-300'}`} title="Patient History"><Clock className="w-6 h-6 sm:w-7 sm:h-7" /></button>
             <button onClick={() => setActiveTab('notes')} className={`p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='notes' ? 'bg-zinc-800 text-[var(--text-main)] shadow-lg' : 'text-[var(--text-dim)] hover:text-zinc-300'}`} title="Clinical Notes"><Stethoscope className="w-6 h-6 sm:w-7 sm:h-7" /></button>
             <button onClick={() => setActiveTab('vitals')} className={`p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='vitals' ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-[var(--text-dim)] hover:text-zinc-300'}`} title="Patient Vitals"><HeartPulse className="w-6 h-6 sm:w-7 sm:h-7" /></button>
             <button onClick={() => setActiveTab('rx')} className={`p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='rx' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-[var(--text-dim)] hover:text-zinc-300'}`} title="Rx & Pharmacy"><Pill className="w-6 h-6 sm:w-7 sm:h-7" /></button>
             <button onClick={() => setActiveTab('ai')} className={`p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='ai' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'text-[var(--text-dim)] hover:text-zinc-300'}`} title="AI Assistant"><BotMessageSquare className="w-6 h-6 sm:w-7 sm:h-7" /></button>
             <button onClick={() => setActiveTab('lab')} className={`p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='lab' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-[var(--text-dim)] hover:text-zinc-300'}`} title="Lab Orders"><Beaker className="w-6 h-6 sm:w-7 sm:h-7" /></button>
             <button onClick={() => setActiveTab('docs')} className={`p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='docs' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-[var(--text-dim)] hover:text-zinc-300'}`} title="Medical Docs & Certs"><FileText className="w-6 h-6 sm:w-7 sm:h-7" /></button>
             <button onClick={() => setActiveTab('chat')} className={`p-4 rounded-2xl transition-all flex-shrink-0 ${activeTab==='chat' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.2)]' : 'text-[var(--text-dim)] hover:text-zinc-300'}`} title="Internal Clinic Chat"><MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" /></button>
          </nav>

          {/* Main Workspace */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative w-full">
             <div className="max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                   
                   {/* HISTORY TAB */}
                   {activeTab === 'history' && (
                      <motion.div key="history" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6 max-w-3xl">
                         <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Clinical History Directory</h2>
                         <p className="text-zinc-400 mb-6 font-medium">Review all previously established encounters and recorded interactions for this patient.</p>
                         
                         {loadingHistory ? (
                            <div className="flex flex-col items-center justify-center py-20">
                               <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-4" />
                               <p className="text-[var(--text-dim)] font-medium tracking-wide">Retrieving patient records...</p>
                            </div>
                         ) : (
                            <div className="space-y-4">
                               {/* Lab Trendline Area */}
                               {historyData.filter(h => h.vitals?.weight || h.vitals?.bp).length > 0 && (
                                  <div className="mb-6 p-4 bg-zinc-900/50 border border-[var(--border-main)] rounded-xl">
                                     <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity className="w-4 h-4"/> Vitals Trend-line</h3>
                                     <div className="flex gap-4 overflow-x-auto pb-2">
                                        {historyData.filter(h => h.vitals?.bp).slice(0, 5).map((h, i) => (
                                           <div key={i} className="min-w-[120px] bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-main)] text-center">
                                              <p className="text-[10px] text-[var(--text-dim)] font-bold">{h.date}</p>
                                              <p className="font-mono font-bold text-red-500 text-lg mt-1">{h.vitals?.bp}</p>
                                           </div>
                                        ))}
                                     </div>
                                  </div>
                               )}
                               
                               {historyData.map((visit, i) => (
                                  <div key={i} className="flex flex-col gap-2 p-5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-sm transition-all hover:bg-zinc-800/80 hover:border-zinc-700">
                                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                           <Clock className="w-5 h-5 text-blue-400" />
                                           <span className="font-bold text-zinc-200 text-base">{visit.date}</span>
                                        </div>
                                        <span className={`px-3 py-1 w-max rounded-md text-[10px] uppercase font-bold tracking-wider
                                           ${visit.status === 'completed' ? 'bg-zinc-700 text-zinc-300' : 
                                             visit.status === 'no_show' ? 'bg-red-500/20 text-red-500' : 
                                             visit.status === 'in_session' ? 'bg-blue-500/20 text-blue-400' :
                                             'bg-emerald-500/20 text-emerald-400'
                                           }
                                        `}>
                                           {visit.status.replace('_', ' ')}
                                        </span>
                                     </div>
                                     <div className="pl-8 py-2 space-y-2">
                                        {visit.doctorAssigned && <p className="text-zinc-400"><strong className="text-zinc-300 font-medium tracking-wide">Attending:</strong> {visit.doctorAssigned}</p>}
                                        <p className="text-zinc-400"><strong className="text-zinc-300 font-medium tracking-wide">Chief Complaint:</strong> {visit.reason || 'Routine'}</p>
                                        {visit.doctorNotes && (
                                           <div className="mt-2 bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-main)] text-zinc-300 italic">
                                              "{visit.doctorNotes}"
                                           </div>
                                        )}
                                        {visit.prescriptions && visit.prescriptions.length > 0 && (
                                           <div className="mt-3">
                                              <strong className="text-emerald-400 font-medium text-xs uppercase flex items-center gap-1"><Pill className="w-3 h-3" /> Medications Issued:</strong>
                                              <div className="flex gap-2 mt-2 flex-wrap">
                                                 {visit.prescriptions.map((rx, idx) => (
                                                    <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-1 flex items-center rounded-md font-medium text-xs">
                                                       {rx.name}
                                                    </span>
                                                 ))}
                                              </div>
                                           </div>
                                        )}
                                     </div>
                                  </div>
                               ))}
                               {historyData.length === 0 && (
                                  <p className="p-8 text-center text-[var(--text-dim)] italic bg-[var(--bg-card)] rounded-xl border border-dashed border-[var(--border-main)]">No historical clinical data mapped for this email identifier.</p>
                               )}
                            </div>
                         )}
                      </motion.div>
                   )}

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
                            <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">Chief Complaint / Subjective</h2>
                            <div className="bg-[var(--bg-card)] border border-[var(--border-main)] p-4 rounded-xl text-zinc-400 font-medium">
                               {patient.reason || 'No specific complaint entered by front desk.'}
                            </div>
                         </div>
                         
                         <div>
                            <div className="flex items-center justify-between mb-4 mt-8">
                               <h2 className="text-xl font-bold text-[var(--text-main)]">Clinical Assessment & Plan (Private)</h2>
                               <button onClick={() => { updateClinicalEncounter(patient.id, { doctorNotes: notes }); showToast('Clinical notes manually saved.'); }} className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-md hover:bg-blue-500/20 transition-colors flex items-center gap-1"><Save className="w-3 h-3" /> Auto-saved</button>
                            </div>
                            <textarea 
                               className="w-full h-96 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-6 text-[var(--text-main)] text-lg leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-y"
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
                         <h2 className="text-2xl font-bold text-[var(--text-main)] mb-6">Patient Vitals Flowsheet</h2>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Blood Pressure (mmHg)</label>
                               <input type="text" value={vitals?.bp} onChange={e=>setVitals({...vitals, bp:e.target.value})} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] text-xl font-mono focus:ring-1 focus:ring-red-500 outline-none" placeholder="120/80" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Heart Rate (BPM)</label>
                               <input type="text" value={vitals?.hr} onChange={e=>setVitals({...vitals, hr:e.target.value})} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] text-xl font-mono focus:ring-1 focus:ring-red-500 outline-none" placeholder="72" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Temperature (°F)</label>
                               <input type="text" value={vitals?.temp} onChange={e=>setVitals({...vitals, temp:e.target.value})} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] text-xl font-mono focus:ring-1 focus:ring-red-500 outline-none" placeholder="98.6" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Weight</label>
                               <input type="text" value={vitals?.weight} onChange={e=>setVitals({...vitals, weight:e.target.value})} className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] text-xl font-mono focus:ring-1 focus:ring-red-500 outline-none" placeholder="150 lbs" />
                            </div>
                         </div>
                         <button onClick={handleSaveVitals} className="mt-8 px-6 py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl transition-colors">Update Medical Record Tracking</button>
                      </motion.div>
                   )}

                   {/* RX PAD */}
                   {activeTab === 'rx' && (
                      <motion.div key="rx" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-8">
                         <div>
                            <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Digital Prescription Pad</h2>
                            <p className="text-zinc-400 mb-6 font-medium">Any medications prescribed here are instantly pushed to the internal Pharmacy Fulfillment queue for nurse prep.</p>
                            
                            <div className="bg-[var(--bg-card)] border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                               <div className="space-y-4">
                                  <div>
                                     <label className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-1">Medication Name</label>
                                     <input 
                                        type="text" 
                                        value={drugsQuery}
                                        onChange={(e) => setDrugsQuery(e.target.value)}
                                        className="w-full bg-[var(--bg-main)] border border-blue-500/20 rounded-xl px-4 py-3 text-[var(--text-main)] text-lg focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                                        placeholder="Search for medication (e.g., Amoxicillin)..."
                                     />
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                     {COMMON_DRUGS.map(d => (
                                        <button key={d} onClick={()=>setDrugsQuery(d)} className="px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 text-blue-500 text-xs font-bold rounded-full hover:bg-blue-500/20 transition-colors">
                                           + {d}
                                        </button>
                                     ))}
                                  </div>

                                  <div className="pt-4 border-t border-blue-500/20">
                                     <label className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest pl-1 mb-2 block">1-Click Rx Templates</label>
                                     <div className="flex flex-wrap gap-3">
                                        {RX_TEMPLATES.map(t => (
                                           <button key={t.name} onClick={() => handleApplyTemplate(t)} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-main)] border border-blue-500/30 text-[var(--text-main)] text-sm font-bold rounded-xl hover:border-blue-500 transition-colors">
                                              {t.name} <span className="text-xs text-blue-500 font-mono bg-blue-500/10 px-2 py-0.5 rounded-md">{t.drugs.length} Meds</span>
                                           </button>
                                        ))}
                                     </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-main)]">
                                     <div>
                                        <label className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest pl-1">Timing</label>
                                        <select value={rxTiming} onChange={e=>setRxTiming(e.target.value)} className="w-full mt-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 appearance-none">
                                            <option>Before Food</option>
                                            <option>After Food</option>
                                            <option>With Food</option>
                                            <option>Anytime</option>
                                        </select>
                                     </div>
                                     <div>
                                        <label className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest pl-1">Frequency</label>
                                        <select value={rxFrequency} onChange={e=>setRxFrequency(e.target.value)} className="w-full mt-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 appearance-none">
                                            <option>Morning & Night</option>
                                            <option>Once daily</option>
                                            <option>At bed time</option>
                                            <option>As needed</option>
                                        </select>
                                     </div>
                                     <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest pl-1">Clinical Comments / Instructions</label>
                                        <input type="text" value={rxComments} onChange={e=>setRxComments(e.target.value)} className="w-full mt-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Take with plenty of water" />
                                     </div>
                                  </div>

                                  <div className="pt-4 flex justify-end">
                                     <button disabled={!drugsQuery} onClick={() => handleAddRx(drugsQuery)} className="w-full sm:w-auto px-8 py-3 bg-blue-500 text-blue-950 font-bold rounded-xl hover:bg-blue-400 disabled:opacity-50 transition-colors">Sign & Send Rx</button>
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div>
                            <h3 className="text-lg font-bold text-zinc-300 uppercase tracking-widest mb-4">Active Visit Prescriptions</h3>
                            <div className="space-y-3">
                               <AnimatePresence>
                                  {prescriptions.map((rx, idx) => (
                                     <motion.div key={idx} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, height:0}} className="flex flex-col p-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl group relative overflow-hidden">
                                        {rx.status === 'pending' && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}
                                        {rx.status === 'packed' && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />}
                                        
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-start pl-4 gap-4">
                                           <div>
                                              <p className="text-xl font-bold text-[var(--text-main)] mb-1">{rx.name}</p>
                                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-400 font-medium">
                                                 <span>Sig: {rx.instructions}</span> &bull; 
                                                 {rx.timing && (<><span>{rx.timing}</span> &bull;</>)}
                                                 {rx.frequency && (<><span>{rx.frequency}</span> &bull;</>)}
                                                 <span>Status: <span className={rx.status==='packed'?'text-emerald-400 font-bold':'text-amber-400 font-bold'}>{rx.status.toUpperCase()}</span></span>
                                              </div>
                                              {rx.comments && <p className="text-sm text-blue-300 mt-2 bg-blue-500/10 p-2 rounded-lg italic border border-blue-500/20">"{rx.comments}"</p>}
                                           </div>
                                           <button onClick={()=>handleRemoveRx(idx)} className="p-3 bg-red-500/10 text-red-400 rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all font-bold text-sm shrink-0 w-full sm:w-auto">Cancel Rx</button>
                                        </div>
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
                      <motion.div key="ai" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="flex flex-col h-[600px] border border-purple-500/20 rounded-3xl overflow-hidden bg-[var(--bg-card)]/30">
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
                                  <p className="text-sm text-[var(--text-dim)]">All responses trace medical guidelines.</p>
                               </div>
                            )}
                            {isAiThinking && <p className="text-purple-400 animate-pulse font-bold text-center">AI is analyzing subjective parameters...</p>}
                         </div>
                         <form onSubmit={runAiAnalysis} className="p-4 bg-[var(--bg-main)] border-t border-purple-500/10 flex gap-4">
                            <input type="text" value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="e.g. Patient presents with elevated BP of 145/90 and headaches..." className="flex-1 bg-[var(--bg-card)] border border-purple-500/30 rounded-xl px-4 text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-purple-500" />
                            <button disabled={isAiThinking||!aiPrompt} className="px-6 py-3 bg-purple-500 text-[var(--text-main)] font-bold rounded-xl hover:bg-purple-400 disabled:opacity-50">Ask AI</button>
                         </form>
                      </motion.div>
                   )}
                   
                   {/* LAB ORDER TAB */}
                   {activeTab === 'lab' && (
                      <motion.div key="lab" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6 max-w-2xl">
                         <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Order Diagnostics & Labs</h2>
                         <p className="text-zinc-400 mb-6">Select requested tests to be added to patient checkout packet.</p>
                         
                         <div className="space-y-2">
                             {['Complete Blood Count (CBC)', 'Comprehensive Metabolic Panel (CMP)', 'Lipid Panel', 'Urinalysis', 'TSH (Thyroid)'].map(lab => (
                                <label key={lab} className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] hover:bg-zinc-800 cursor-pointer transition-colors">
                                   <input type="checkbox" checked={labRequests.includes(lab)} onChange={() => handleToggleLab(lab)} className="w-5 h-5 accent-amber-500 rounded border-zinc-700 bg-[var(--bg-main)]" />
                                   <span className="text-[var(--text-main)] font-bold">{lab}</span>
                                </label>
                             ))}
                         </div>
                      </motion.div>
                   )}
                   
                   {/* DOCS TAB */}
                   {activeTab === 'docs' && (
                      <motion.div key="docs" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6 max-w-2xl">
                         <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Medical Documents</h2>
                         <p className="text-zinc-400 mb-6">Generate official artifacts for patient portal download.</p>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={handlePrintMedCert} className="flex flex-col items-center justify-center gap-4 p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-emerald-500">
                               <FileDown className="w-12 h-12" />
                               <div className="text-center">
                                  <span className="block font-bold text-[var(--text-main)] text-lg mb-1">Medical Certificate</span>
                                  <span className="block text-xs uppercase tracking-widest text-[var(--text-dim)]">Standard Sick Leave</span>
                               </div>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-4 p-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl opacity-50 cursor-not-allowed">
                               <FileDown className="w-12 h-12 text-zinc-500" />
                               <div className="text-center">
                                  <span className="block font-bold text-[var(--text-main)] text-lg mb-1">Referral Letter</span>
                                  <span className="block text-xs uppercase tracking-widest text-[var(--text-dim)]">Specialist Handover</span>
                               </div>
                            </button>
                         </div>
                      </motion.div>
                   )}

                   {/* CHAT TAB */}
                   {activeTab === 'chat' && (
                      <motion.div key="chat" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="flex flex-col h-[600px] border border-teal-500/20 rounded-3xl overflow-hidden bg-[var(--bg-card)]/30">
                         <div className="bg-teal-900/20 p-4 border-b border-teal-500/20 flex items-center gap-3">
                            <MessageSquare className="w-6 h-6 text-teal-400" />
                            <h2 className="font-bold text-teal-100">Clinic Internal Chat</h2>
                         </div>
                         <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {chatMessages.map((msg, idx) => (
                               <div key={idx} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                                  <span className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-widest mb-1 mx-1">{msg.sender} &bull; {msg.time}</span>
                                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.sender === 'You' ? 'bg-teal-500 text-teal-950 font-medium rounded-tr-sm' : 'bg-zinc-800 text-zinc-200 border border-[var(--border-main)] rounded-tl-sm'}`}>
                                     {msg.text}
                                  </div>
                               </div>
                            ))}
                         </div>
                         <form onSubmit={handleSendChat} className="p-4 bg-[var(--bg-main)] border-t border-teal-500/10 flex gap-4">
                            <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Message front desk or pharmacy..." className="flex-1 bg-[var(--bg-card)] border border-teal-500/30 rounded-xl px-4 text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-teal-500" />
                            <button disabled={!chatInput} className="px-6 py-3 bg-teal-500 text-teal-950 font-bold rounded-xl hover:bg-teal-400 disabled:opacity-50">Send</button>
                         </form>
                      </motion.div>
                   )}
                   
                </AnimatePresence>
             </div>
          </main>
       </div>
    </div>
  );
}
