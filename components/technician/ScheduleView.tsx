import React, { useState, useMemo, useEffect } from 'react';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, SpinnerIcon } from '@/components/common/icons';

// A helper function to format dates to "YYYY-MM-DD" for Firestore
const formatDateForFirestore = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const timeSlots = ['09:00 - 11:00', '11:00 - 13:00', '13:00 - 15:00', '15:00 - 17:00'];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ScheduleView: React.FC = () => {
    const { userProfile } = useAuth();
    const [displayDate, setDisplayDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // This hook fetches the technician's schedule for the selected date in real-time
    useEffect(() => {
        if (!userProfile || !selectedDate) return;

        setIsLoading(true);
        const formattedDate = formatDateForFirestore(selectedDate);
        // The document ID is a combination of the user's UID and the date
        const docId = `${userProfile.uid}_${formattedDate}`;
        const scheduleDocRef = doc(db, 'technicianSchedules', docId);

        const unsubscribe = onSnapshot(scheduleDocRef, (docSnap) => {
            if (docSnap.exists()) {
                // If a schedule document exists, get the unavailable slots
                setUnavailableSlots(docSnap.data().unavailableSlots || []);
            } else {
                // If no document exists, it means all slots are available
                setUnavailableSlots([]);
            }
            setIsLoading(false);
        });

        // Cleanup the listener when the component unmounts or selectedDate changes
        return () => unsubscribe();
    }, [selectedDate, userProfile]);

    // This function handles clicking a time slot to make it available/unavailable
    const handleToggleSlotAvailability = async (slot: string) => {
        if (!userProfile || !selectedDate) return;
        
        const formattedDate = formatDateForFirestore(selectedDate);
        const docId = `${userProfile.uid}_${formattedDate}`;
        const scheduleDocRef = doc(db, 'technicianSchedules', docId);

        const isCurrentlyUnavailable = unavailableSlots.includes(slot);

        try {
            // Using setDoc with { merge: true } is safe. It creates the document if it
            // doesn't exist, and just updates the field if it does.
            await setDoc(scheduleDocRef, {
                technicianUid: userProfile.uid,
                date: formattedDate,
                unavailableSlots: isCurrentlyUnavailable ? arrayRemove(slot) : arrayUnion(slot)
            }, { merge: true });
        } catch (error) {
            console.error("Error updating schedule:", error);
        }
    };

    // This memoized value calculates the days to display in the calendar grid
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

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 animate-fade-in">Manage Your Availability</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calendar Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" aria-label="Previous month" onClick={() => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-slate-200"><ChevronLeftIcon className="w-5 h-5"/></button>
                        <p className="font-semibold text-slate-700 text-lg">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(displayDate)}</p>
                        <button type="button" aria-label="Next month" onClick={() => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-slate-200"><ChevronRightIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {daysOfWeek.map(day => <div key={day} className="font-medium text-slate-500">{day}</div>)}
                        {calendarDays.map((day, index) => {
                           if (!day) return <div key={index} />;
                           const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                           const isToday = day.toDateString() === new Date().toDateString();
                           return (
                             <div key={index} className="flex justify-center items-center">
                               <button type="button" onClick={() => setSelectedDate(day)} className={`w-10 h-10 rounded-full transition-colors 
                                 ${isSelected ? 'bg-indigo-600 text-white font-bold' : ''}
                                 ${!isSelected && isToday ? 'ring-2 ring-indigo-400' : ''}
                                 ${!isSelected ? 'text-slate-700 hover:bg-indigo-100' : ''}
                               `}>{day.getDate()}</button>
                             </div>
                           );
                        })}
                    </div>
                </div>

                {/* Time Slots Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="font-bold text-slate-800 text-lg mb-4">Set Availability for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                    {isLoading ? (
                         <div className="flex justify-center items-center h-32">
                             <SpinnerIcon className="w-8 h-8 text-indigo-600 animate-spin" />
                         </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {timeSlots.map(slot => {
                                const isUnavailable = unavailableSlots.includes(slot);
                                return (
                                    <button
                                        type="button"
                                        key={slot}
                                        onClick={() => handleToggleSlotAvailability(slot)}
                                        className={`p-3 rounded-lg text-sm font-semibold border-2 transition-all duration-200 ${
                                            isUnavailable
                                                ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                                                : 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                                        }`}
                                    >
                                        <p>{slot}</p>
                                        <p className="font-normal">{isUnavailable ? 'Unavailable' : 'Available'}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleView;