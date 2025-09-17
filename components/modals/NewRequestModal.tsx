import React, { useState, useMemo, useEffect } from 'react';
import { ServiceRequest, Urgency } from '@/shared/types';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, CameraIcon, XCircleIcon, SpinnerIcon } from '@/components/common/icons';

import { db } from '@/services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';


const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input id={id} {...props} className="w-full bg-white text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400" />
  </div>
);

const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <textarea id={id} {...props} className="w-full bg-white text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400" />
  </div>
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, id, children, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <select id={id} {...props} className="w-full bg-white text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400">
      {children}
    </select>
  </div>
);

// This new version is timezone-safe and will always return the correct local date.
const formatDateForFirestore = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// PASTE THIS FINAL, CORRECTED VERSION OF THE FUNCTION
async function getAvailableSlots(serviceCategory: string, date: Date): Promise<string[]> {
    const allPossibleSlots = ['09:00 - 11:00', '11:00 - 13:00', '13:00 - 15:00', '15:00 - 17:00'];
    
    // Timezone-safe date formatting
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    // 1. Find all technicians qualified for the job.
    const usersRef = collection(db, 'users');
    const techQuery = query(usersRef, where("skills", "array-contains", serviceCategory), where("role", "==", "technician"));
    const techSnapshot = await getDocs(techQuery);
    const qualifiedTechUids = techSnapshot.docs.map(doc => doc.id);

    if (qualifiedTechUids.length === 0) {
        return []; // No technicians have this skill
    }

    // This object will track which technicians are busy for each specific time slot.
    const busyTechniciansBySlot: { [slot: string]: Set<string> } = {
        [allPossibleSlots[0]]: new Set(),
        [allPossibleSlots[1]]: new Set(),
        [allPossibleSlots[2]]: new Set(),
        [allPossibleSlots[3]]: new Set(),
    };

    // A) Check jobs they have already accepted (using non-mutating date copies).
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const requestsRef = collection(db, 'requests');
    if (qualifiedTechUids.length > 0) {
        const acceptedJobsQuery = query(
            requestsRef,
            where("assignedTechnicianUid", "in", qualifiedTechUids),
            where("dateTime", ">=", startOfDay.toISOString()),
            where("dateTime", "<=", endOfDay.toISOString())
        );
        const jobsSnapshot = await getDocs(acceptedJobsQuery);
        jobsSnapshot.forEach(doc => {
            const request = doc.data() as ServiceRequest;
            const jobHour = new Date(request.dateTime).getHours();
            if (jobHour >= 9 && jobHour < 11) busyTechniciansBySlot[allPossibleSlots[0]].add(request.assignedTechnicianUid!);
            if (jobHour >= 11 && jobHour < 13) busyTechniciansBySlot[allPossibleSlots[1]].add(request.assignedTechnicianUid!);
            if (jobHour >= 13 && jobHour < 15) busyTechniciansBySlot[allPossibleSlots[2]].add(request.assignedTechnicianUid!);
            if (jobHour >= 15 && jobHour < 17) busyTechniciansBySlot[allPossibleSlots[3]].add(request.assignedTechnicianUid!);
        });
    }

    // B) Check their manually blocked-off schedules.
    if (qualifiedTechUids.length > 0) {
        const schedulesRef = collection(db, 'technicianSchedules');
        const scheduleQuery = query(schedulesRef, where("technicianUid", "in", qualifiedTechUids), where("date", "==", formattedDate));
        const scheduleSnapshot = await getDocs(scheduleQuery);
        scheduleSnapshot.forEach(doc => {
            const schedule = doc.data();
            if (schedule.unavailableSlots) {
                schedule.unavailableSlots.forEach((slot: string) => {
                    if (busyTechniciansBySlot[slot]) {
                        busyTechniciansBySlot[slot].add(schedule.technicianUid);
                    }
                });
            }
        });
    }

    // 3. A slot is available if at least one qualified technician is free.
    const finalAvailableSlots = allPossibleSlots.filter(slot => {
        const totalQualified = qualifiedTechUids.length;
        const totalBusy = busyTechniciansBySlot[slot].size;
        return totalQualified > totalBusy;
    });

    return finalAvailableSlots;
}
// --- Main Modal Component ---

interface NewRequestModalProps {
  onClose: () => void;
  onSubmit: (newRequest: Omit<ServiceRequest, 'id' | 'customerName' | 'customerAvatar' | 'status'>) => void;
}

const timeSlots = ['09:00 - 11:00', '11:00 - 13:00', '13:00 - 15:00', '15:00 - 17:00'];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const NewRequestModal: React.FC<NewRequestModalProps> = ({ onClose, onSubmit }) => {
  const [serviceCategory, setServiceCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState<Urgency>(Urgency.NORMAL);
  const [photo, setPhoto] = useState<string | null>(null);
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  // --- PASTE THE TWO NEW LINES HERE ---
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // --- This is the corrected version ---
  useEffect(() => {
    // Reset slots if the category or date is cleared
    if (!serviceCategory || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    setIsLoadingSlots(true);
    // Clear previously selected time when date or category changes
    setSelectedTime(null);

    getAvailableSlots(serviceCategory, selectedDate)
      .then(slots => {
        setAvailableSlots(slots);
      })
      .catch(error => {
        console.error("Error checking availability:", error);
        setAvailableSlots([]); // Ensure we show no slots on error
      })
      .finally(() => {
        setIsLoadingSlots(false);
      });
  }, [serviceCategory, selectedDate]); // This array tells React to re-run the effect ONLY when these two variables change

  const calendarDays = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = Array.from({ length: firstDayOfMonth }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [displayDate]);

  const handleDateSelect = (date: Date) => {
    if (date < new Date(new Date().toDateString())) return;
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceCategory || !description || !location || !selectedDate || !selectedTime) {
      alert('Please fill out all fields and select a date and time.');
      return;
    }
    const [startHour] = selectedTime.split(':');
    const finalDateTime = new Date(selectedDate);
    finalDateTime.setHours(parseInt(startHour, 10), 0, 0, 0);

    onSubmit({
      serviceCategory,
      description,
      location,
      urgency,
      dateTime: finalDateTime.toISOString(),
      paymentStatus: 'none',
      photo: photo || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="new-request-modal-title">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col animate-scale-in">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <header className="p-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
            <h2 id="new-request-modal-title" className="text-2xl font-bold text-slate-800">New Service Request</h2>
            <button type="button" aria-label="Close" onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
              <CloseIcon className="w-6 h-6 text-slate-600" />
            </button>
          </header>

          <main className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto flex-grow">
            <div className="space-y-5">
              <FormInput label="Service Category" id="service-category" type="text" value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} placeholder="e.g., Plumbing, Electrical" required />
              <FormInput label="Service Location" id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., 123 Maple St, Springfield" required />
              <FormSelect label="Urgency" id="urgency" value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
                <option>{Urgency.NORMAL}</option>
                <option>{Urgency.HIGH}</option>
                <option>{Urgency.EMERGENCY}</option>
              </FormSelect>
              <FormTextarea label="Description of Issue" id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Please describe the problem in detail." required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Photo (optional)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                  {!photo ? (
                    <div className="space-y-1 text-center">
                      <CameraIcon className="mx-auto h-12 w-12 text-slate-400" />
                      <div className="flex text-sm text-slate-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handlePhotoUpload} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={photo} alt="Preview" className="mx-auto h-24 w-auto rounded-lg" />
                      <button
                        type="button"
                        aria-label="Remove uploaded photo"
                        onClick={() => setPhoto(null)}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 text-slate-500 hover:text-red-600"
                      >
                        <XCircleIcon className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><CalendarIcon className="w-6 h-6 mr-2 text-indigo-600" /> Select Date & Time</h3>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <button type="button" aria-label="Previous month" onClick={() => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-slate-200"><ChevronLeftIcon className="w-5 h-5" /></button>
                  <p className="font-semibold text-slate-700">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(displayDate)}</p>
                  <button type="button" aria-label="Next month" onClick={() => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-slate-200"><ChevronRightIcon className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {daysOfWeek.map(day => <div key={day} className="font-medium text-slate-500">{day}</div>)}
                  {calendarDays.map((day, index) => {
                    if (!day) return <div key={index} />;
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                    const isPast = day < new Date(new Date().toDateString());
                    return (
                      <div key={index} className="flex justify-center items-center">
                        <button type="button" aria-label={`Select date ${day.getDate()}`} disabled={isPast} onClick={() => handleDateSelect(day)} className={`w-9 h-9 rounded-full transition-colors 
                             ${isPast ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-indigo-100'}
                             ${isSelected ? 'bg-indigo-600 text-white font-bold' : ''}
                             ${!isSelected && isToday ? 'bg-teal-400 text-white' : ''}
                             ${!isSelected && !isToday ? 'text-slate-700' : ''}
                           `}>{day.getDate()}</button>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* --- THIS IS THE UPDATED TIME SLOT SECTION --- */}
              {selectedDate && serviceCategory ? (
                <div className="mt-4 animate-fade-in">
                  <h4 className="font-semibold text-slate-700 mb-2">Available Slots for {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}:</h4>
                  {isLoadingSlots ? (
                    <div className="flex items-center justify-center h-24">
                      <SpinnerIcon className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map(slot => (
                        <button type="button" key={slot} onClick={() => setSelectedTime(slot)}
                          className={`p-2 rounded-lg text-sm font-medium border-2 transition-all ${selectedTime === slot ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-500'}`}
                        >{slot}</button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-slate-100 rounded-lg">
                      <p className="text-sm font-medium text-slate-600">Sorry, no technicians are available on this day. Please select another date or service.</p>
                    </div>
                  )}
                </div>
              ) : selectedDate && (
                <div className="mt-4 text-center p-4 bg-slate-100 rounded-lg">
                  <p className="text-sm font-medium text-slate-600">Please select a service category to see availability.</p>
                </div>
              )}
            </div>
          </main>

          <footer className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex justify-end space-x-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 active:scale-95 transition-all">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
              disabled={!serviceCategory || !description || !location || !selectedDate || !selectedTime}
            >
              Submit Request
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default NewRequestModal;
