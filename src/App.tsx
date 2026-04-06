import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import BookingFlow from './components/BookingFlow';
import AdminLayout from './layouts/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminPatients from './pages/AdminPatients';
import AdminSchedule from './pages/AdminSchedule';
import AdminSettings from './pages/AdminSettings';
import PatientDashboard from './pages/PatientDashboard';
import AdminEncounter from './pages/AdminEncounter';
import AdminPharmacy from './pages/AdminPharmacy';
import LiveDisplay from './pages/LiveDisplay';
import { useBookingStore } from './stores/useBookingStore';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useBookingStore(state => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
};

// Emergency Block Banner
const EmergencyBanner = () => {
   const { emergencyBlockAll } = useBookingStore(state => state.settings);
   if (!emergencyBlockAll) return null;
   return (
      <div className="w-full bg-red-500 text-white flex items-center justify-center p-3 text-sm font-bold z-50 fixed top-0 left-0 right-0 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse gap-2">
         <AlertTriangle className="w-5 h-5" />
         CLINIC IS CURRENTLY IN EMERGENCY LOCKDOWN. NO NEW APPOINTMENTS.
      </div>
   );
}

// Wait Delay Banner 
const DelayBanner = () => {
   const { delayIndicator } = useBookingStore(state => state.settings);
   if (delayIndicator === 'On Time') return null;
   return (
      <div className="w-full bg-yellow-500 text-yellow-950 flex items-center justify-center p-2 text-xs font-bold z-40 fixed top-0 left-0 right-0">
         Notice: The clinic is currently running {delayIndicator} behind schedule.
      </div>
   );
}

// Client Landing Page Layout
const ClientPage = () => {
  const { emergencyBlockAll, delayIndicator } = useBookingStore(state => state.settings);
  
  return (
  <div className={`min-h-screen relative overflow-hidden flex flex-col items-center pt-${emergencyBlockAll ? '12' : (delayIndicator !== 'On Time' ? '8' : '0')}`}>
    <div className="fixed inset-0 z-0 bg-zinc-950">
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[150px] rounded-full pointer-events-none transition-colors duration-1000 ${emergencyBlockAll ? 'bg-red-700/20' : 'bg-emerald-700/20'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[150px] rounded-full pointer-events-none transition-colors duration-1000 ${emergencyBlockAll ? 'bg-orange-800/20' : 'bg-teal-800/20'}`} />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
    </div>

    <main className="relative z-10 w-full flex-grow flex flex-col">
      <nav className="w-full h-20 border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-zinc-950 font-black text-xl shadow-[0_0_20px_rgba(52,211,153,0.3)]">
            D
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">DocBook.</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-4"
        >
           <Link to="/patient/dashboard" className="text-sm font-bold text-white bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
             Patient Portal
           </Link>
           <Link to="/admin" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center">
             Staff Entry
           </Link>
        </motion.div>
      </nav>

      <div className="flex-grow flex items-center justify-center py-12 px-4">
         <BookingFlow />
      </div>
    </main>
    
    <footer className="relative z-10 w-full py-6 border-t border-white/5 text-center text-zinc-600 text-sm font-medium">
      &copy; {new Date().getFullYear()} DocBook. Premium patient experience.
    </footer>
  </div>
)};

function App() {
  const fetchAllBookings = useBookingStore(state => state.fetchAllBookings);

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  return (
    <Router>
      <EmergencyBanner />
      <DelayBanner />
      
      <AnimatePresence mode="wait">
        <Routes>
          {/* Client Application & TV */}
          <Route path="/" element={<ClientPage />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/display" element={<LiveDisplay />} />
          
          {/* Admin Application */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route path="/admin/*" element={
             <ProtectedRoute>
                <AdminLayout>
                   <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="patients" element={<AdminPatients />} />
                      <Route path="schedule" element={<AdminSchedule />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="pharmacy" element={<AdminPharmacy />} />
                      <Route path="encounter/:id" element={<AdminEncounter />} />
                   </Routes>
                </AdminLayout>
             </ProtectedRoute>
          } />
        </Routes>
      </AnimatePresence>
    </Router>
  )
}

export default App;
