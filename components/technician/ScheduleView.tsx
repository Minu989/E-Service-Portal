import React from 'react';
import { ServiceRequest, RequestStatus } from '@/shared/types';
import { CalendarIcon } from '@/components/common/icons';
import { useAppContext } from '@/contexts/AppContext';

const ScheduleView: React.FC = () => {
    const { requests } = useAppContext();
    const scheduledJobs = requests.filter((r: ServiceRequest) => r.status === RequestStatus.ACCEPTED || r.status === RequestStatus.IN_PROGRESS);

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 animate-fade-in-up">My Schedule</h2>
            <div className="bg-white p-6 rounded-xl shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center text-lg font-semibold text-gray-700 mb-4">
                    <CalendarIcon className="w-6 h-6 mr-3 text-blue-600" />
                    <span>Upcoming Jobs</span>
                </div>
                {scheduledJobs.length > 0 ? (
                    <ul className="space-y-4">
                        {scheduledJobs.sort((a: ServiceRequest, b: ServiceRequest) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()).map((job: ServiceRequest, index: number) => (
                            <li 
                                key={job.id} 
                                className="p-4 bg-blue-50 rounded-lg flex items-center justify-between hover:bg-blue-100 hover:shadow-md transition-all duration-300 animate-fade-in-up"
                                style={{ animationDelay: `${100 + index * 100}ms` }}
                            >
                                <div>
                                    <p className="font-bold text-blue-900">{job.serviceCategory} - {job.customerName}</p>
                                    <p className="text-sm text-blue-700">{job.location}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-blue-800">{new Date(job.dateTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                                    <p className="text-sm text-blue-600">{new Date(job.dateTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-12 animate-fade-in">
                        <CalendarIcon className="w-16 h-16 mx-auto text-gray-300" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-700">No Jobs Scheduled</h3>
                        <p className="mt-2 text-gray-500">Accept new jobs from the dashboard to see them here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScheduleView;
