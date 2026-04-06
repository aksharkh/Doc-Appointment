import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, Clock, FileText, X, Phone, Mail, Activity, AlertTriangle, Save } from 'lucide-react';
import { useBookingStore } from '../stores/useBookingStore';
import type { BookingData } from '../stores/useBookingStore';

export default function AdminPatients() {
  const { bookings, getPatientHistory, updatePatientProfile } = useBookingStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activePatient, setActivePatient] = useState<BookingData | null>(null);
  
  // Modal State
  const [activeTab, setActiveTab] = useState<'history'|'profile'|'vitals'>('history');
  const [editAllergies, setEditAllergies] = useState('');
  const [editConditions, setEditConditions] = useState('');

  // Group bookings by unique email to form a "patient"
  const uniquePatients = useMemo(() => {
    const map = new Map<string, BookingData>();
    bookings.forEach(b => {
      if (!map.has(b.email)) {
        map.set(b.email, b);
      }
    });
    return Array.from(map.values()).filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bookings, searchTerm]);

  const openPatientModal = (patient: BookingData) => {
     setActivePatient(patient);
     setEditAllergies(patient.allergies?.join(', ') || '');
     setEditConditions(patient.chronicConditions?.join(', ') || '');
     setActiveTab('history');
  };

  const handleSaveProfile = () => {
      if(!activePatient) return;
      const allergies = editAllergies.split(',').map(s=>s.trim()).filter(Boolean);
      const conditions = editConditions.split(',').map(s=>s.trim()).filter(Boolean);
      updatePatientProfile(activePatient.email, { allergies, chronicConditions: conditions });
      
      // Update local state to reflect instantly in modal
      setActivePatient({...activePatient, allergies, chronicConditions: conditions});
  }

  return (
    <div className="space-y-6 relative">
       {/* Header & Search */}
       <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
             <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Patient Directory</h1>
             <p className="text-zinc-400">Search and review patient medical histories and CRM data.</p>
          </div>
          <div className="relative w-full md:w-72">
             <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
             <input 
                type="text" 
                placeholder="Search name or email..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:ring-1 focus:border-emerald-500/50 outline-none"
             />
          </div>
       </div>

       {/* Patient Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uniquePatients.map((patient) => {
             const history = getPatientHistory(patient.email);
             return (
               <div 
                 key={patient.id} 
                 onClick={() => openPatientModal(patient)}
                 className="glass-panel p-5 rounded-2xl flex flex-col gap-4 cursor-pointer hover:bg-zinc-800/80 hover:border-emerald-500/20 transition-all group"
               >
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">
                        {patient.name.charAt(0)}
                     </div>
                     <div>
                        <h3 className="font-bold text-white group-hover:text-emerald-300 transition-colors">{patient.name}</h3>
                        <p className="text-xs text-zinc-500">{history.length} Visit{history.length > 1 ? 's' : ''} on record</p>
                     </div>
                  </div>
                  
                  <div className="space-y-2 mt-2 pt-4 border-t border-white/5 text-sm">
                     <div className="flex justify-between items-center text-zinc-400">
                        <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> Latest Specialty</span>
                        <span className="text-zinc-200">{patient.specialty}</span>
                     </div>
                     {patient.insurance && (
                        <div className="flex justify-between items-center text-zinc-400">
                           <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Insurance</span>
                           <span className="text-zinc-200 truncate max-w-[120px]">{patient.insurance}</span>
                        </div>
                     )}
                  </div>
               </div>
             )
          })}
          
          {uniquePatients.length === 0 && (
            <div className="col-span-full py-20 text-center text-zinc-500">
               No patients found matching '{searchTerm}'.
            </div>
          )}
       </div>

       {/* Comprehensive Patient Modal */}
       <AnimatePresence>
         {activePatient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
               {/* Backdrop */}
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 onClick={() => setActivePatient(null)}
                 className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
               />

               <motion.div 
                 initial={{ scale: 0.95, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.95, opacity: 0, y: 20 }}
                 className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
               >
                  {/* Modal Header */}
                  <div className="p-6 border-b border-white/5 flex items-start justify-between bg-zinc-900/50 shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                           {activePatient.name.charAt(0)}
                        </div>
                        <div>
                           <h2 className="text-2xl font-bold text-white">{activePatient.name}</h2>
                           <div className="flex gap-4 text-xs font-medium text-zinc-400 mt-1">
                              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {activePatient.email}</span>
                              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {activePatient.phone}</span>
                           </div>
                        </div>
                     </div>
                     <button onClick={() => setActivePatient(null)} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors">
                        <X className="w-5 h-5 text-zinc-400" />
                     </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-white/5 bg-zinc-950/50 shrink-0 px-6 gap-6">
                     <button onClick={()=>setActiveTab('history')} className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab==='history' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>Historical Visits</button>
                     <button onClick={()=>setActiveTab('profile')} className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab==='profile' ? 'border-amber-500 text-amber-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><AlertTriangle className="w-4 h-4" /> Clinical CRM</button>
                     <button onClick={()=>setActiveTab('vitals')} className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab==='vitals' ? 'border-red-500 text-red-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><Activity className="w-4 h-4" /> Vitals Tracking</button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto min-h-[300px]">
                     
                     {activeTab === 'history' && (
                        <div className="space-y-6">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-zinc-950/50 border border-white/5 p-4 rounded-xl">
                                 <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Insurance Provider</p>
                                 <p className="text-white font-medium">{activePatient.insurance || 'Uninsured / Self-pay'}</p>
                              </div>
                              <div className="bg-zinc-950/50 border border-white/5 p-4 rounded-xl">
                                 <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Patient Status</p>
                                 <p className="text-emerald-400 font-medium">{activePatient.isNewPatient ? 'Newly Onboarded' : 'Recurring Patient'}</p>
                              </div>
                           </div>

                           <div>
                              <h3 className="text-lg font-bold text-white mb-4">Historical Visits Log</h3>
                              <div className="space-y-3">
                                 {getPatientHistory(activePatient.email).map((visit, i) => (
                                    <div key={i} className="flex flex-col gap-2 p-4 bg-zinc-800/30 border border-white/5 rounded-xl text-sm relative group">
                                       <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                             <Clock className="w-4 h-4 text-blue-400" />
                                             <span className="font-bold text-zinc-200">{visit.date} at {visit.time}</span>
                                          </div>
                                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider
                                             ${visit.status === 'completed' ? 'bg-zinc-700 text-zinc-300' : 
                                               visit.status === 'no_show' ? 'bg-red-500/20 text-red-500' : 
                                               visit.status === 'in_session' ? 'bg-blue-500/20 text-blue-400' :
                                               'bg-emerald-500/20 text-emerald-400'
                                             }
                                          `}>
                                             {visit.status.replace('_', ' ')}
                                          </span>
                                       </div>
                                       <div className="pl-6 border-l-2 border-zinc-800 ml-[7px] py-1 space-y-1">
                                          <p className="text-zinc-400"><strong className="text-zinc-300 font-medium">Type:</strong> {visit.type === 'telehealth' ? '💻 Telehealth' : '🏥 In-person'} ({visit.specialty})</p>
                                          <p className="text-zinc-400"><strong className="text-zinc-300 font-medium">Reason:</strong> {visit.reason || 'Routine'}</p>
                                          <p className="text-zinc-400"><strong className="text-zinc-300 font-medium">Physician:</strong> {visit.doctorAssigned || 'Triage Assigned'}</p>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'profile' && (
                        <div className="space-y-6">
                           <div>
                              <h3 className="text-lg font-bold text-white mb-2">Update Clinical Base Map</h3>
                              <p className="text-zinc-400 text-sm mb-6">Modify these parameters to sync the patient's global records for cross-referencing in any encounter.</p>
                           </div>

                           <div className="space-y-2">
                              <label className="text-sm font-bold text-zinc-400 pl-1 uppercase tracking-widest flex items-center gap-2">
                                 <AlertTriangle className="w-4 h-4 text-red-500" /> Documented Allergies
                              </label>
                              <textarea 
                                 rows={2}
                                 className="w-full bg-zinc-950/50 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-medium"
                                 placeholder="e.g. Penicillin, Peanuts (Comma separated)"
                                 value={editAllergies}
                                 onChange={e => setEditAllergies(e.target.value)}
                              />
                           </div>

                           <div className="space-y-2">
                              <label className="text-sm font-bold text-zinc-400 pl-1 uppercase tracking-widest flex items-center gap-2">
                                 <Activity className="w-4 h-4 text-amber-500" /> Chronic Conditions
                              </label>
                              <textarea 
                                 rows={2}
                                 className="w-full bg-zinc-950/50 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-medium"
                                 placeholder="e.g. Hypertension, Type 2 Diabetes (Comma separated)"
                                 value={editConditions}
                                 onChange={e => setEditConditions(e.target.value)}
                              />
                           </div>

                           <button 
                              onClick={handleSaveProfile}
                              className="w-full px-6 py-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-colors mt-4 flex justify-center items-center gap-2"
                           >
                              <Save className="w-5 h-5" /> Save CRM Profile
                           </button>
                        </div>
                     )}

                     {activeTab === 'vitals' && (
                        <div className="space-y-6">
                           <div>
                              <h3 className="text-lg font-bold text-white mb-1">Vitals Tracking Log</h3>
                              <p className="text-zinc-400 text-sm mb-6">A historical view of physical vitals retrieved from past clinic encounters.</p>
                           </div>
                           
                           <div className="space-y-3">
                              {getPatientHistory(activePatient.email)
                                 .filter(v => v.vitals && Object.values(v.vitals).some(val => val !== ''))
                                 .map((visit, i) => (
                                    <div key={i} className="bg-zinc-950 border border-white/5 rounded-xl p-4">
                                       <div className="text-sm font-bold text-zinc-500 mb-3 uppercase tracking-widest border-b border-white/5 pb-2">
                                          {visit.date}
                                       </div>
                                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                          {visit.vitals?.bp && (
                                             <div>
                                                <p className="text-xs text-zinc-500 font-medium">BP</p>
                                                <p className="text-red-400 font-mono font-bold text-lg">{visit.vitals.bp}</p>
                                             </div>
                                          )}
                                          {visit.vitals?.hr && (
                                             <div>
                                                <p className="text-xs text-zinc-500 font-medium">HR</p>
                                                <p className="text-amber-400 font-mono font-bold text-lg">{visit.vitals.hr} <span className="text-xs text-zinc-600">bpm</span></p>
                                             </div>
                                          )}
                                          {visit.vitals?.temp && (
                                             <div>
                                                <p className="text-xs text-zinc-500 font-medium">Temp</p>
                                                <p className="text-blue-400 font-mono font-bold text-lg">{visit.vitals.temp}</p>
                                             </div>
                                          )}
                                          {visit.vitals?.weight && (
                                             <div>
                                                <p className="text-xs text-zinc-500 font-medium">Weight</p>
                                                <p className="text-emerald-400 font-mono font-bold text-lg">{visit.vitals.weight}</p>
                                             </div>
                                          )}
                                       </div>
                                    </div>
                              ))}
                              {getPatientHistory(activePatient.email).filter(v => v.vitals).length === 0 && (
                                 <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                                    <Activity className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-zinc-500 font-medium">No vitals documented for this patient.</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     )}

                  </div>
               </motion.div>
            </div>
         )}
       </AnimatePresence>
    </div>
  );
}
