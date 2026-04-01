import { ShieldAlert, Settings2, Download } from 'lucide-react';
import { useBookingStore } from '../stores/useBookingStore';

export default function AdminSettings() {
  const { settings, toggleLunchBlock, toggleEmergencyBlock, bookings } = useBookingStore();

  const handleExportCSV = () => {
    // Basic CSV generator feature
    const headers = ['ID', 'Patient Name', 'Phone', 'Date', 'Time', 'Status', 'Specialty', 'Type'];
    const rows = bookings.map(b => [
      b.id, b.name, b.phone, b.date, b.time, b.status, b.specialty, b.type
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "patient_appointments.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-8">
       <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Clinic Settings</h1>
          <p className="text-zinc-400">Configure global platform toggles</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
             <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Settings2 className="w-5 h-5 text-zinc-400" />
                <h2 className="text-xl font-bold text-white">Scheduling Rules</h2>
             </div>
             
             <div className="flex items-center justify-between">
                <div>
                   <p className="font-bold text-zinc-200">Enforce Lunch Block</p>
                   <p className="text-xs text-zinc-500">Automatically blocks 1:00 PM for all dates globally.</p>
                </div>
                <button 
                  onClick={toggleLunchBlock}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.lunchBlock ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.lunchBlock ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
             </div>

             <div className="flex items-center justify-between">
                <div>
                   <p className="font-bold text-zinc-200">Current Wait Delay</p>
                   <p className="text-xs text-zinc-500">Updates the client portal with current wait times.</p>
                </div>
                <select className="bg-zinc-900 border border-white/10 rounded-lg text-white text-sm p-2 outline-none">
                   <option>On Time</option>
                   <option>15 mins delay</option>
                   <option>30 mins delay</option>
                   <option>1 hour delay</option>
                </select>
             </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 border-red-500/20 shadow-[0_4px_30px_rgba(239,68,68,0.05)]">
             <div className="flex items-center gap-3 border-b border-red-500/10 pb-4">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h2 className="text-xl font-bold text-red-50">Critical Actions</h2>
             </div>
             
             <div className="flex flex-col gap-3">
                <p className="font-bold text-red-200">Emergency Shutdown Protocol</p>
                <p className="text-xs text-red-300/60 max-w-sm">
                   Immediately blocks ALL available slots for future bookings. Existing bookings are preserved.
                </p>
                <button 
                  onClick={toggleEmergencyBlock}
                  className={`mt-2 py-3 px-4 rounded-xl font-bold transition-all text-sm w-max ${
                     settings.emergencyBlockAll 
                     ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                     : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  }`}
                >
                  {settings.emergencyBlockAll ? 'Deactivate Lockdown' : 'Trigger Emergency Lockdown'}
                </button>
             </div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 md:col-span-2">
             <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Download className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-blue-50">Data Extraction</h2>
             </div>
             
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <p className="font-bold text-zinc-200">Generate Audit CSV</p>
                   <p className="text-xs text-zinc-500 max-w-lg mt-1">
                      Download a full `.csv` dump of the entire booking database including patient details, specialty logic, and exact appointment statuses for external medical record keeping.
                   </p>
                </div>
                <button 
                  onClick={handleExportCSV}
                  className="py-2.5 px-6 rounded-xl font-bold bg-blue-500 hover:bg-blue-400 text-blue-950 transition-all text-sm whitespace-nowrap"
                >
                  Download CSV
                </button>
             </div>
          </div>
       </div>
    </div>
  );
}
