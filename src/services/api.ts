export interface Slot {
  time: string; // e.g. "10:00 AM"
  available: boolean;
}

export interface BookingData {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
}

export const generateSlotsForDate = async (date: Date): Promise<Slot[]> => {
  // Mock API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Monday to Friday check
  const day = date.getDay();
  if (day === 0 || day === 6) {
    return [];
  }

  // 10 AM to 5 PM = 7 slots (10, 11, 12, 1, 2, 3, 4)
  const slots: Slot[] = [
    { time: '10:00 AM', available: Math.random() > 0.3 },
    { time: '11:00 AM', available: Math.random() > 0.3 },
    { time: '12:00 PM', available: Math.random() > 0.3 },
    { time: '01:00 PM', available: Math.random() > 0.3 },
    { time: '02:00 PM', available: Math.random() > 0.3 },
    { time: '03:00 PM', available: Math.random() > 0.3 },
    { time: '04:00 PM', available: Math.random() > 0.3 },
  ];
  return slots;
};

export const submitBooking = async (data: BookingData): Promise<{success: boolean, id: string}> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Later we integrate Google Apps Script Web App here
  // fetch(VITE_GOOGLE_APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) })
  
  return {
    success: true,
    id: `BKG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  };
};
