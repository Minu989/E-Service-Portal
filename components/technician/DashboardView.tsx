import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
// import { ServiceRequest, Urgency, RequestStatus } from '../../types';
import { ServiceRequest, Urgency, RequestStatus } from '@/shared/types';
import RequestModal from '../modals/RequestModal';
import { DocumentPlusIcon, WrenchScrewdriverIcon, CheckBadgeIcon, ReceiptPercentIcon, StarIcon } from '../common/icons';
import { useAppContext } from '../../contexts/AppContext';

const RatingDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex justify-center items-center space-x-1">
    {[...Array(5)].map((_, i) => (
      <StarIcon key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-slate-300'}`} />
    ))}
  </div>
);
const UrgencyBadge: React.FC<{ urgency: Urgency, classNames?: string }> = ({ urgency, classNames }) => {
  const urgencyStyles: { [key: string]: string } = {
    [Urgency.EMERGENCY]: 'bg-red-100 text-red-800 border-red-200',
    [Urgency.HIGH]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [Urgency.NORMAL]: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${urgencyStyles[urgency]} ${classNames}`}>
      {urgency}
    </span>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; delay?: number }> = ({ title, value, icon, color, delay = 0 }) => (
  <div
    className="bg-white p-6 rounded-2xl shadow-sm flex items-center animate-fade-in-up border border-slate-200/80"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-5 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-500 font-medium">{title}</p>
      <p className="text-4xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const RequestCard: React.FC<{
  request: ServiceRequest;
  onSelect: (request: ServiceRequest) => void;
  onOpenInvoiceModal: (request: ServiceRequest) => void;
  onOpenRatingModal: (request: ServiceRequest) => void;
  delay?: number;
}> = ({ request, onSelect, onOpenInvoiceModal, onOpenRatingModal, delay = 0 }) => {
  const { handleUpdateStatus } = useAppContext();
  const urgencyBorderColor: Record<Urgency, string> = {
    [Urgency.EMERGENCY]: 'border-l-red-500',
    [Urgency.HIGH]: 'border-l-yellow-500',
    [Urgency.NORMAL]: 'border-l-blue-500',
  }

  // --- REPLACE THE ENTIRE renderActions FUNCTION WITH THIS ---// INSIDE the RequestCard component in DashboardView.tsx

const renderActions = () => {
    // Handle Pending jobs first
    if (request.status === RequestStatus.PENDING) {
        return (
            <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                    <button onClick={() => handleUpdateStatus(request.id, RequestStatus.ACCEPTED)} className="px-3.5 py-1.5 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 active:scale-95 transition-all">Accept</button>
                    <button onClick={() => handleUpdateStatus(request.id, RequestStatus.DECLINED)} className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 active:scale-95 transition-all">Decline</button>
                </div>
                <button onClick={() => onSelect(request)} className="px-3.5 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 active:scale-95 transition-all">
                    Details
                </button>
            </div>
        );
    }

    // Handle Completed jobs
    if (request.status === RequestStatus.COMPLETED) {
        // If a customer has rated the job, this is the final state. Show the rating.
        if (request.customerRating) {
            return (
                <div className="text-sm text-slate-600 text-center">
                    <p className="font-semibold mb-1">Customer Rated:</p>
                    <RatingDisplay rating={request.customerRating.stars} />
                </div>
            );
        }
        // If not rated yet, show the next logical action based on payment status.
        if (request.paymentStatus === 'none') {
            return <button onClick={() => onOpenInvoiceModal(request)} className="w-full flex items-center justify-center px-3.5 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all"><ReceiptPercentIcon className="w-4 h-4 mr-2"/> Create Invoice</button>;
        }
        if (request.paymentStatus === 'pending') {
            return <div className="text-sm font-semibold text-yellow-800 text-center">Awaiting Customer Payment...</div>;
        }
        /*if (request.paymentStatus === 'paid' && !request.technicianRating) {
            return <button onClick={() => onOpenRatingModal(request)} className="w-full flex items-center justify-center px-3.5 py-1.5 text-sm font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600 active:scale-95 transition-all"><StarIcon className="w-4 h-4 mr-2"/> Rate Customer</button>;
        }*/
    }

    // Fallback for all other statuses (e.g., ACCEPTED, DECLINED, or a completed job where the tech has also rated)
    const statusText: { [key: string]: string } = {
        [RequestStatus.ACCEPTED]: 'Job Accepted',
        [RequestStatus.COMPLETED]: 'Job Closed', // This now correctly shows for a job the tech has rated
        [RequestStatus.DECLINED]: 'Job Declined'
    };

    return (
        <div className="flex items-center justify-between">
            <div className={`text-sm font-medium px-3 py-1 rounded-full
                ${request.status === RequestStatus.ACCEPTED && 'bg-yellow-100 text-yellow-800'}
                ${(request.status === RequestStatus.COMPLETED || request.customerRating) && 'bg-green-100 text-green-800'}
                ${request.status === RequestStatus.DECLINED && 'bg-red-100 text-red-800'}
            `}>
                {statusText[request.status] || request.status}
            </div>
            <button onClick={() => onSelect(request)} className="px-3.5 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 active:scale-95 transition-all">
                View Details
            </button>
        </div>
    );
}
  // -----------------------------------------------------------------

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col animate-fade-in-up border-l-4 ${urgencyBorderColor[request.urgency]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <img src={request.customerAvatar} alt={request.customerName} className="w-11 h-11 rounded-full mr-3 border" />
            <div>
              <p className="font-bold text-slate-800 text-md">{request.customerName}</p>
              <p className="text-sm text-slate-500 font-medium">{request.serviceCategory}</p>
            </div>
          </div>
          <UrgencyBadge urgency={request.urgency} />
        </div>
        <p className="text-slate-600 text-sm line-clamp-2 cursor-pointer" onClick={() => onSelect(request)}>{request.description}</p>
      </div>

      <div className="px-5 py-4 bg-slate-50/70 rounded-b-xl border-t border-slate-100">
        {renderActions()}
      </div>
    </div>
  )
};

interface DashboardViewProps {
  onOpenInvoiceModal: (request: ServiceRequest) => void;
  onOpenRatingModal: (request: ServiceRequest) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onOpenInvoiceModal, onOpenRatingModal }) => {
  const { requests } = useAppContext();
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>(RequestStatus.PENDING);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  const filteredRequests = useMemo(() => {
    return requests
      .filter(r => statusFilter === 'all' || r.status === statusFilter)
      .filter(r => urgencyFilter === 'all' || r.urgency === urgencyFilter)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [requests, statusFilter, urgencyFilter]);

  const stats = useMemo(() => ({
    new: requests.filter(r => r.status === RequestStatus.PENDING).length,
    accepted: requests.filter(r => r.status === RequestStatus.ACCEPTED).length,
    completed: requests.filter(r => r.status === RequestStatus.COMPLETED && r.paymentStatus === 'paid').length,
    all: requests.length
  }), [requests]);

  const UrgencyFilterButton: React.FC<{ value: Urgency | 'all'; label: string }> = ({ value, label }) => (
    <button
      onClick={(e) => { e.stopPropagation(); setUrgencyFilter(value); }}
      className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${urgencyFilter === value ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100'
        }`}
    >
      {label}
    </button>
  );

  const StatusFilterButton: React.FC<{ value: RequestStatus | 'all'; label: string; count: number }> = ({ value, label, count }) => (
    <button
      onClick={() => setStatusFilter(value)}
      className="px-3 py-2 text-sm font-medium rounded-md transition-colors relative text-slate-500 hover:text-slate-800"
    >
      <span className={`${statusFilter === value ? 'text-indigo-600 font-semibold' : ''}`}>{label}</span>
      <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${statusFilter === value ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{count}</span>
      {statusFilter === value && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" layoutId="underline" />}
    </button>
  );

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="New Requests" value={stats.new} color="bg-blue-100 text-blue-600" icon={<DocumentPlusIcon className="w-6 h-6" />} delay={0} />
        <StatCard title="Jobs Accepted" value={stats.accepted} color="bg-yellow-100 text-yellow-700" icon={<WrenchScrewdriverIcon className="w-6 h-6" />} delay={100} />
        <StatCard title="Jobs Completed" value={stats.completed} color="bg-green-100 text-green-600" icon={<CheckBadgeIcon className="w-6 h-6" />} delay={200} />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-2 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center space-x-2 border border-slate-200 rounded-lg p-1">
            <StatusFilterButton value={RequestStatus.PENDING} label="Pending" count={stats.new} />
            <StatusFilterButton value={RequestStatus.ACCEPTED} label="Accepted" count={stats.accepted} />
            <StatusFilterButton value={RequestStatus.COMPLETED} label="Completed" count={stats.completed} />
            <StatusFilterButton value={'all'} label="All" count={stats.all} />
          </div>
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-full border border-slate-200">
            <UrgencyFilterButton value="all" label="All" />
            <UrgencyFilterButton value={Urgency.EMERGENCY} label="Emergency" />
            <UrgencyFilterButton value={Urgency.HIGH} label="High" />
            <UrgencyFilterButton value={Urgency.NORMAL} label="Normal" />
          </div>
        </div>

        {filteredRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredRequests.map((request, index) => (
              <RequestCard
                key={request.id}
                request={request}
                onSelect={setSelectedRequest}
                onOpenInvoiceModal={onOpenInvoiceModal}
                onOpenRatingModal={onOpenRatingModal}
                delay={index * 60}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in">
            <h4 className="text-lg font-semibold text-slate-700">No Requests Found</h4>
            <p className="text-slate-500 mt-2">There are no service requests that match your current filters.</p>
          </div>
        )}
      </div>

      {selectedRequest && (
        <RequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
};

export default DashboardView;