import { create } from 'zustand';
import { format } from 'date-fns';

export type BookingStatus = 'confirmed' | 'arrived' | 'in_session' | 'completed' | 'no_show' | 'cancelled';
export type ConsultationType = 'in-person' | 'telehealth';
export type RxStatus = 'pending' | 'packed' | 'dispensed';

export interface Prescription {
  name: string;
  dosage: string;
  instructions: string;
  timing?: string;
  frequency?: string;
  comments?: string;
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
  token?: string;
  roomAssigned?: string;
  telehealthLink?: string;
  doctorAssigned?: string;
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

// ─── API base URL ────────────────────────────────────────────────────────────
const API_BASE = 'https://doc-b.onrender.com/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Store interface ──────────────────────────────────────────────────────────
interface BookingState {
  bookings: BookingData[];
  adminBlockedSlots: Record<string, string[]>;
  isAuthenticated: boolean;
  settings: ClinicSettings;
  isLoading: boolean;
  error: string | null;
  analyticsData: any | null;

  // Actions
  login: (password: string) => boolean;
  logout: () => void;
  fetchAllBookings: () => Promise<void>;
  addBooking: (booking: Omit<BookingData, 'id' | 'status'>) => Promise<string>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  updateBookingRoomAndToken: (id: string, room: string, token: string) => Promise<void>;
  updateTelehealthLink: (id: string, link: string) => Promise<void>;
  updateClinicalEncounter: (id: string, data: Partial<BookingData>) => Promise<void>;
  updateRxStatus: (bookingId: string, rxIndex: number, status: RxStatus) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  toggleAdminBlockSlot: (dateStringISO: string, timeString: string) => void;
  toggleLunchBlock: () => void;
  toggleEmergencyBlock: () => void;
  getSlotsForDate: (date: Date) => Slot[];
  getPatientHistory: (email: string) => Promise<BookingData[]>;
  getActiveQueue: () => Promise<BookingData[]>;
  updatePatientProfile: (email: string, profileData: { chronicConditions?: string[]; allergies?: string[] }) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  adminBlockedSlots: {},
  isAuthenticated: false,
  isLoading: false,
  error: null,
  analyticsData: null,
  settings: {
    lunchBlock: true,
    emergencyBlockAll: false,
    delayIndicator: 'On Time',
  },

  login: (password) => {
    if (password === 'admin123') {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => set({ isAuthenticated: false }),

  // ── Fetch all bookings from backend on load ──────────────────────────────
  fetchAllBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiFetch<BookingData[]>('/bookings');
      set({ bookings: data, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  // ── Create new booking ───────────────────────────────────────────────────
  addBooking: async (bookingData) => {
    set({ isLoading: true, error: null });
    try {
      const created = await apiFetch<BookingData>('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
      set((state) => ({ bookings: [...state.bookings, created], isLoading: false }));
      return created.id;
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      throw e;
    }
  },

  // ── Update status ────────────────────────────────────────────────────────
  updateBookingStatus: async (id, status) => {
    const updated = await apiFetch<BookingData>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
    }));
  },

  // ── Assign room & token ──────────────────────────────────────────────────
  updateBookingRoomAndToken: async (id, roomAssigned, token) => {
    const updated = await apiFetch<BookingData>(`/bookings/${id}/room`, {
      method: 'PATCH',
      body: JSON.stringify({ roomAssigned, token }),
    });
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
    }));
  },

  // ── Set telehealth link ──────────────────────────────────────────────────
  updateTelehealthLink: async (id, link) => {
    const updated = await apiFetch<BookingData>(`/bookings/${id}/telehealth`, {
      method: 'PATCH',
      body: JSON.stringify({ telehealthLink: link }),
    });
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
    }));
  },

  // ── Update clinical encounter (vitals, Rx, notes) ─────────────────────────
  updateClinicalEncounter: async (id, data) => {
    const updated = await apiFetch<BookingData>(`/bookings/${id}/clinical`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
    }));
  },

  // ── Update single Rx status (client-side optimistic, then sync) ───────────
  updateRxStatus: async (bookingId, rxIndex, status) => {
    // Optimistic update
    set((state) => ({
      bookings: state.bookings.map((b) => {
        if (b.id !== bookingId) return b;
        const updatedRx = [...(b.prescriptions || [])];
        if (updatedRx[rxIndex]) updatedRx[rxIndex] = { ...updatedRx[rxIndex], status };
        return { ...b, prescriptions: updatedRx };
      }),
    }));
    // Sync full Rx list to backend
    const booking = get().bookings.find((b) => b.id === bookingId);
    if (booking?.prescriptions) {
      await apiFetch<BookingData>(`/bookings/${bookingId}/clinical`, {
        method: 'PUT',
        body: JSON.stringify({ prescriptions: booking.prescriptions }),
      });
    }
  },

  // ── Cancel booking ───────────────────────────────────────────────────────
  cancelBooking: async (id) => {
    const updated = await apiFetch<BookingData>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    });
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? updated : b)),
    }));
  },

  // ── Get patient history from backend ─────────────────────────────────────
  getPatientHistory: async (email) => {
    const history = await apiFetch<BookingData[]>(`/bookings/history?email=${encodeURIComponent(email)}`);
    return history;
  },

  // ── Get live active queue from backend ───────────────────────────────────
  getActiveQueue: async () => {
    const queue = await apiFetch<BookingData[]>('/bookings/queue');
    return queue;
  },

  // ── Update patient profile ───────────────────────────────────────────────
  updatePatientProfile: async (email, profileData) => {
    await apiFetch<BookingData>(`/bookings/patient/${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.email.toLowerCase() === email.toLowerCase() ? { ...b, ...profileData } : b
      ),
    }));
  },

  fetchAnalytics: async () => {
    try {
      const data = await apiFetch<any>('/bookings/analytics');
      set({ analyticsData: data });
    } catch (e) {
      console.error("Failed to fetch analytics", e);
    }
  },

  // ── Admin slot blocking (local only, no backend) ─────────────────────────
  toggleAdminBlockSlot: (dateISO, time) => {
    set((state) => {
      const blocks = { ...state.adminBlockedSlots };
      if (!blocks[dateISO]) blocks[dateISO] = [];
      if (blocks[dateISO].includes(time)) {
        blocks[dateISO] = blocks[dateISO].filter((t) => t !== time);
      } else {
        blocks[dateISO] = [...blocks[dateISO], time];
      }
      return { adminBlockedSlots: blocks };
    });
  },

  toggleLunchBlock: () => {
    set((state) => ({
      settings: { ...state.settings, lunchBlock: !state.settings.lunchBlock },
    }));
  },

  toggleEmergencyBlock: () => {
    set((state) => ({
      settings: { ...state.settings, emergencyBlockAll: !state.settings.emergencyBlockAll },
    }));
  },

  // ── Slot availability (computed locally from cached bookings) ─────────────
  getSlotsForDate: (date: Date) => {
    const state = get();
    if (state.settings.emergencyBlockAll) return [];

    const day = date.getDay();
    if (day === 0 || day === 6) return []; // Sunday/Saturday closed

    const dateFormatted = format(date, 'MMMM d, yyyy');
    const dateISO = format(date, 'yyyy-MM-dd');
    const todayISO = format(new Date(), 'yyyy-MM-dd');
    const isTodayDate = todayISO === dateISO;

    const allTimes = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
    
    // Statuses that occupy a slot (Including completed/no_show to keep slot blocked)
    const occupiedStatuses = ['confirmed', 'arrived', 'in_session', 'completed'];
    const takenTimes = state.bookings
      .filter((b) => b.date === dateFormatted && occupiedStatuses.includes(b.status))
      .map((b) => b.time);

    const blockedManually = state.adminBlockedSlots[dateISO] || [];

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return allTimes.map((time) => {
      // 1. Check if it's in the past (only for Today)
      let isPast = false;
      if (isTodayDate) {
          const [hStr, mStr] = time.split(':');
          const [min, ampm] = mStr.split(' ');
          let hour = parseInt(hStr);
          if (ampm === 'PM' && hour !== 12) hour += 12;
          if (ampm === 'AM' && hour === 12) hour = 0;
          
          if (hour < currentHour || (hour === currentHour && parseInt(min) <= currentMinute)) {
              isPast = true;
          }
      }

      // 2. Check if it's the lunch block
      let isLunch = state.settings.lunchBlock && time === '01:00 PM';
      
      // 3. Final calculation
      const isTaken = takenTimes.includes(time);
      const isBlockedManually = blockedManually.includes(time);
      
      const available = !isTaken && !isBlockedManually && !isPast && !isLunch;

      return {
        time,
        available,
        blockedByAdmin: isBlockedManually || isLunch, // Show as specifically blocked by rules
      };
    });
  },
}));
