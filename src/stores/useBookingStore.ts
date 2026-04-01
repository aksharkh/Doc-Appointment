import { create } from 'zustand';
import { format } from 'date-fns';

export type BookingStatus = 'confirmed' | 'arrived' | 'in_session' | 'completed' | 'no_show' | 'cancelled';
export type ConsultationType = 'in-person' | 'telehealth';
export type RxStatus = 'pending' | 'packed' | 'dispensed';

export interface Prescription {
  name: string;
  dosage: string;
  instructions: string;
  status: RxStatus;
}

export interface Vitals {
  bp: string;
  hr: string;
  temp: string;
  weight: string;
}

export interface BookingData {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: ConsultationType; 
  specialty: string;
  insurance?: string;
  isNewPatient: boolean;
  date: string;
  time: string;
  reason?: string;
  status: BookingStatus;
  
  // Phase 4 Operational Data
  token?: string; // e.g. "A-101"
  roomAssigned?: string; // e.g. "Room 2"
  telehealthLink?: string;
  doctorAssigned?: string;
  
  // Clinical Encounter Data
  chronicConditions?: string[];
  allergies?: string[];
  vitals?: Vitals;
  prescriptions?: Prescription[];
  doctorNotes?: string;
  labRequests?: string[];
  followUpGenerated?: boolean;
}

export interface Slot {
  time: string;
  available: boolean;
  blockedByAdmin?: boolean;
}

export interface ClinicSettings {
  lunchBlock: boolean; 
  emergencyBlockAll: boolean;
  delayIndicator: string; 
}

interface BookingState {
  bookings: BookingData[];
  adminBlockedSlots: Record<string, string[]>; 
  isAuthenticated: boolean;
  settings: ClinicSettings;
  
  // Actions
  login: (password: string) => boolean;
  logout: () => void;
  addBooking: (booking: Omit<BookingData, 'id' | 'status'>) => Promise<string>;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  updateBookingRoomAndToken: (id: string, room: string, token: string) => void;
  updateTelehealthLink: (id: string, link: string) => void;
  updateClinicalEncounter: (id: string, data: Partial<BookingData>) => void;
  updateRxStatus: (bookingId: string, rxIndex: number, status: RxStatus) => void;
  cancelBooking: (id: string) => void;
  toggleAdminBlockSlot: (dateStringISO: string, timeString: string) => void;
  toggleLunchBlock: () => void;
  toggleEmergencyBlock: () => void;
  getSlotsForDate: (date: Date) => Slot[];
  getPatientHistory: (email: string) => BookingData[];
  getActiveQueue: () => BookingData[];
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [
     { 
        id: 'BKG-MOCK1', 
        name: 'Alice Smith', 
        phone: '555-0101', 
        email: 'alice@example.com', 
        type: 'in-person',
        specialty: 'Cardiology',
        insurance: 'BlueCross',
        isNewPatient: false,
        date: format(new Date(), 'MMMM d, yyyy'), 
        time: '10:00 AM', 
        status: 'arrived', 
        reason: 'Palpitations follow-up',
        doctorAssigned: 'Dr. Evans',
        token: 'A-101',
        roomAssigned: 'Room 1',
        chronicConditions: ['Hypertension'],
        allergies: ['Penicillin'],
        vitals: { bp: '135/85', hr: '88', temp: '98.6', weight: '160 lbs' }
     },
     { 
        id: 'BKG-MOCK2', 
        name: 'Bob Johnson', 
        phone: '555-0102', 
        email: 'bob@example.com', 
        type: 'in-person',
        specialty: 'General Practice',
        isNewPatient: true,
        date: format(new Date(), 'MMMM d, yyyy'), 
        time: '11:00 AM', 
        status: 'confirmed',
        reason: 'Flu symptoms',
        token: 'B-205'
     },
     { 
        id: 'BKG-MOCK3', 
        name: 'Sarah Connor', 
        phone: '555-0103', 
        email: 'sarah@example.com', 
        type: 'telehealth',
        specialty: 'Neurology',
        isNewPatient: false,
        date: format(new Date(), 'MMMM d, yyyy'), 
        time: '02:00 PM', 
        status: 'in_session',
        reason: 'Migraines',
        telehealthLink: 'https://zoom.us/mock-link',
        prescriptions: [
           { name: 'Sumatriptan', dosage: '50mg', instructions: 'Take 1 pill at onset of migraine', status: 'pending' }
        ]
     },
  ],
  adminBlockedSlots: {},
  isAuthenticated: false,
  settings: {
     lunchBlock: true,
     emergencyBlockAll: false,
     delayIndicator: 'On Time'
  },

  login: (password) => {
     if (password === 'admin123') {
        set({ isAuthenticated: true });
        return true;
     }
     return false;
  },

  logout: () => set({ isAuthenticated: false }),

  addBooking: async (bookingData) => {
     await new Promise(res => setTimeout(res, 1200)); 
     
     // Look up if patient has chronic conditions from history
     const history = get().bookings.filter(b => b.email === bookingData.email);
     const pastPatient = history.find(b => b.chronicConditions || b.allergies);
     
     const newBooking: BookingData = {
        ...bookingData,
        id: `BKG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'confirmed',
        chronicConditions: pastPatient?.chronicConditions,
        allergies: pastPatient?.allergies,
     };
     set((state) => ({ bookings: [...state.bookings, newBooking] }));
     return newBooking.id;
  },

  updateBookingStatus: (id, status) => {
     set(state => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, status } : b)
     }));
  },
  
  updateBookingRoomAndToken: (id, roomAssigned, token) => {
     set(state => ({
         bookings: state.bookings.map(b => b.id === id ? { ...b, roomAssigned, token } : b)
     }));
  },

  updateTelehealthLink: (id, link) => {
     set(state => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, telehealthLink: link } : b)
     }));
  },
  
  updateClinicalEncounter: (id, data) => {
     set(state => ({
         bookings: state.bookings.map(b => b.id === id ? { ...b, ...data } : b)
     }));
  },
  
  updateRxStatus: (bookingId, rxIndex, status) => {
     set(state => ({
         bookings: state.bookings.map(b => {
             if (b.id !== bookingId) return b;
             const updatedRx = [...(b.prescriptions || [])];
             if (updatedRx[rxIndex]) {
                 updatedRx[rxIndex].status = status;
             }
             return { ...b, prescriptions: updatedRx };
         })
     }));
  },

  cancelBooking: (id) => {
     set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b)
     }));
  },

  toggleAdminBlockSlot: (dateISO, time) => {
     set((state) => {
        const blocks = { ...state.adminBlockedSlots };
        if (!blocks[dateISO]) blocks[dateISO] = [];
        
        if (blocks[dateISO].includes(time)) {
           blocks[dateISO] = blocks[dateISO].filter(t => t !== time);
        } else {
           blocks[dateISO] = [...blocks[dateISO], time];
        }
        return { adminBlockedSlots: blocks };
     });
  },

  toggleLunchBlock: () => {
     set(state => ({ settings: { ...state.settings, lunchBlock: !state.settings.lunchBlock } }));
  },

  toggleEmergencyBlock: () => {
     set(state => ({ settings: { ...state.settings, emergencyBlockAll: !state.settings.emergencyBlockAll } }));
  },

  getPatientHistory: (email) => {
     return get().bookings.filter(b => b.email.toLowerCase() === email.toLowerCase());
  },
  
  getActiveQueue: () => {
      const todayStr = format(new Date(), 'MMMM d, yyyy');
      return get().bookings.filter(b => b.date === todayStr && ['arrived', 'in_session'].includes(b.status));
  },

  getSlotsForDate: (date: Date) => {
     const state = get();
     if (state.settings.emergencyBlockAll) return []; 

     const day = date.getDay();
     if (day === 0 || day === 6) return []; 

     const dateFormatted = format(date, 'MMMM d, yyyy'); 
     const dateISO = format(date, 'yyyy-MM-dd'); 
     
     const allTimes = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
     
     const activeStatuses = ['confirmed', 'arrived', 'in_session'];
     const takenBookings = state.bookings
        .filter(b => b.date === dateFormatted && activeStatuses.includes(b.status))
        .map(b => b.time);
     
     const blocked = state.adminBlockedSlots[dateISO] || [];

     return allTimes.map(time => {
        let isBlockedAdmin = blocked.includes(time);
        if (state.settings.lunchBlock && time === '01:00 PM') {
           isBlockedAdmin = true; 
        }

        const isTaken = takenBookings.includes(time);

        return {
           time,
           available: !isTaken && !isBlockedAdmin,
           blockedByAdmin: isBlockedAdmin
        };
     });
  }
}));
