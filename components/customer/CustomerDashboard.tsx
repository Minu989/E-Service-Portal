import React, { useMemo } from 'react';
import { ServiceRequest, RequestStatus, Urgency } from '@/shared/types';
import { PlusIcon, WrenchScrewdriverIcon, CalendarIcon, CreditCardIcon, StarIcon, CheckBadgeIcon, UserGroupIcon } from '@/components/common/icons';
import { useAppContext } from '@/contexts/AppContext';
// ... other imports ...

// --- NEW REUSABLE COMPONENT ---
const RatingDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-slate-300'}`} />
        ))}
    </div>
);
// --- Reusable Components ---

/**
 * A badge component that displays the status of a service request
 * with appropriate colors and text.
 */
const StatusBadge: React.FC<{ status: RequestStatus; paymentStatus: ServiceRequest['paymentStatus'] }> = ({ status, paymentStatus }) => {
    const badgeConfig = useMemo(() => {
        if (status === RequestStatus.COMPLETED) {
            switch (paymentStatus) {
                case 'pending':
                    return { text: 'Payment Due', style: 'bg-yellow-100 text-yellow-800' };
                case 'paid':
                    return { text: 'Paid & Completed', style: 'bg-green-100 text-green-800' };
                default:
                    return { text: 'Awaiting Invoice', style: 'bg-cyan-100 text-cyan-800' };
            }
        }

        const statusStyles: { [key in RequestStatus]?: { text: string, style: string } } = {
            [RequestStatus.PENDING]: { text: 'Pending', style: 'bg-slate-200 text-slate-800' },
            [RequestStatus.ACCEPTED]: { text: 'Accepted', style: 'bg-blue-100 text-blue-800' },
            [RequestStatus.IN_PROGRESS]: { text: 'In Progress', style: 'bg-blue-100 text-blue-800' },
            [RequestStatus.DECLINED]: { text: 'Declined', style: 'bg-red-100 text-red-800' },
        };

        return statusStyles[status] || { text: status, style: 'bg-slate-200 text-slate-800' };
    }, [status, paymentStatus]);

    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badgeConfig.style}`}>
            {badgeConfig.text}
        </span>
    );
};
const TechnicianInfo: React.FC<{
    name: string;
    avatar: string;
    skills: string[];
}> = ({ name, avatar, skills }) => (
    <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Your Technician</p>
        <div className="flex items-center">
            <img src={avatar} alt={name} className="w-10 h-10 rounded-full mr-3" />
            <div>
                <p className="font-bold text-slate-800">{name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                    {skills.map(skill => (
                        <span key={skill} className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    </div>
);
/**
 * A card component that displays the details of a single service request
 * and provides relevant actions for the customer.
 */
const RequestCard: React.FC<{
    request: ServiceRequest,
    onPay: (request: ServiceRequest) => void;
    onRate: (request: ServiceRequest) => void;
}> = ({ request, onPay, onRate }) => {
    const { handleUpdateStatus } = useAppContext();

    const urgencyBorderColor: Record<Urgency, string> = {
        [Urgency.EMERGENCY]: 'border-l-red-500',
        [Urgency.HIGH]: 'border-l-yellow-500',
        [Urgency.NORMAL]: 'border-l-blue-500',
    };

    const renderFooter = () => {
        if (request.status === RequestStatus.ACCEPTED || request.status === RequestStatus.IN_PROGRESS) {
            return (
                <button
                    onClick={() => handleUpdateStatus(request.id, RequestStatus.COMPLETED)}
                    className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all"
                >
                    <CheckBadgeIcon className="w-5 h-5 mr-2" /> Mark as Completed
                </button>
            );
        }

        if (request.status === RequestStatus.COMPLETED) {
            if (request.paymentStatus === 'pending') {
                return (
                    <button
                        onClick={() => onPay(request)}
                        className="w-full flex items-center justify-center bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-green-700 active:scale-95 transition-all"
                    >
                        <CreditCardIcon className="w-5 h-5 mr-2" /> Pay Invoice
                    </button>
                );
            }
             if (request.paymentStatus === 'paid' && request.customerRating) {
                return (
                    <div className="text-sm text-slate-600">
                        <p className="font-semibold mb-1">You Rated:</p>
                        <RatingDisplay rating={request.customerRating.stars} />
                    </div>
                );
            }
            if (request.paymentStatus === 'paid' && !request.customerRating) {
                return (
                    <button
                        onClick={() => onRate(request)}
                        className="w-full flex items-center justify-center bg-teal-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-teal-600 active:scale-95 transition-all"
                    >
                        <StarIcon className="w-5 h-5 mr-2" /> Rate Technician
                    </button>
                );
            }
        }

        return (
            <div className="text-sm text-slate-500 font-medium flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                {new Date(request.dateTime).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                })}
            </div>
        );
    };

    const showTechnicianDetails =
        request.technicianName &&
        (request.status === RequestStatus.ACCEPTED ||
            request.status === RequestStatus.IN_PROGRESS ||
            request.status === RequestStatus.COMPLETED);

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col animate-fade-in-up hover:shadow-md hover:-translate-y-0.5 transition-all border-l-4 ${urgencyBorderColor[request.urgency]}`}>
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-3">
                    <span className="text-md font-bold text-slate-800">{request.serviceCategory}</span>
                    <StatusBadge status={request.status} paymentStatus={request.paymentStatus} />
                </div>
                <p className="text-slate-600 text-sm mb-4 line-clamp-3">{request.description}</p>

                {/* --- NEW LOGIC TO RENDER THE TECHNICIAN INFO --- */}
                {showTechnicianDetails && (
                    <TechnicianInfo
                        name={request.technicianName!}
                        avatar={request.technicianAvatar!}
                        skills={request.technicianSkills!}
                    />
                )}
                {/* ----------------------------------------------- */}
            </div>
            <div className="p-4 bg-slate-50/70 border-t border-slate-100">
                {renderFooter()}
            </div>
        </div>
    );
};

/**
 * A component to display when there are no service requests.
 */
const EmptyState = () => (
    <div className="text-center py-24 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm animate-fade-in border border-slate-200/80">
        <WrenchScrewdriverIcon className="w-16 h-16 mx-auto text-slate-300" />
        <h4 className="mt-6 text-xl font-semibold text-slate-700">No Requests Yet</h4>
        <p className="text-slate-500 mt-2">Click "New Request" to get started and see your jobs here.</p>
    </div>
);

/**
 * A memoized list of request cards to prevent unnecessary re-renders.
 */
const MemoizedRequestList = React.memo(({ requests, onPay, onRate }: {
    requests: ServiceRequest[];
    onPay: (request: ServiceRequest) => void;
    onRate: (request: ServiceRequest) => void;
}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((request, index) => (
            <div style={{ animationDelay: `${index * 60}ms` }} key={request.id}>
                <RequestCard
                    request={request}
                    onPay={onPay}
                    onRate={onRate}
                />
            </div>
        ))}
    </div>
));


// --- Main View Component ---

interface MyRequestsViewProps {
    customerRequests: ServiceRequest[];
    onNewRequestClick: () => void;
    onPay: (request: ServiceRequest) => void;
    onRate: (request: ServiceRequest) => void;
}

const MyRequestsView: React.FC<MyRequestsViewProps> = ({ customerRequests, onNewRequestClick, onPay, onRate }) => {
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8 animate-fade-in">
                <h2 className="text-3xl font-bold text-slate-800">My Service Requests</h2>
                <button
                    onClick={onNewRequestClick}
                    className="flex items-center justify-center bg-indigo-600 text-white font-semibold py-3 px-5 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Request
                </button>
            </div>

            {customerRequests.length > 0 ? (
                <MemoizedRequestList requests={customerRequests} onPay={onPay} onRate={onRate} />
            ) : (
                <EmptyState />
            )}
        </div>
    );
};

export default MyRequestsView;
