import React, { useState, useMemo } from 'react';
import { ServiceRequest, Urgency } from '@/shared/types';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, CameraIcon, XCircleIcon } from '@/components/common/icons';

// --- Reusable Sub-components ---

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
              {selectedDate && (
                <div className="mt-4 animate-fade-in">
                  <h4 className="font-semibold text-slate-700 mb-2">Available Slots for {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map(slot => {
                      // --- NEW LOGIC STARTS HERE ---
                      const now = new Date();
                      // Check if the currently selected calendar day is today
                      const isToday = selectedDate?.toDateString() === now.toDateString();
                      // Get the current hour in 24-hour format (e.g., 2 PM is 14)
                      const currentHour = now.getHours();

                      // Get the end hour of the time slot (e.g., for "09:00 - 11:00", this will be 11)
                      const slotEndHour = parseInt(slot.split(' - ')[1].split(':')[0], 10);

                      // A slot is in the past if it's today AND its end hour is less than or equal to the current hour
                      const isSlotInPast = isToday && slotEndHour <= currentHour;
                      // --- NEW LOGIC ENDS HERE ---

                      return (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          // Disable the button if the slot is in the past
                          disabled={isSlotInPast}
                          className={`p-2 rounded-lg text-sm font-medium border-2 transition-all
          ${isSlotInPast
                              // Apply disabled styles
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : selectedTime === slot
                                // Apply selected styles
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                // Apply default, clickable styles
                                : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-500'
                            }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
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
