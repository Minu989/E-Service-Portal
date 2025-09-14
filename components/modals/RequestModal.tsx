import React from 'react';
import { ServiceRequest, RequestStatus, Urgency } from '@/shared/types';
import { CloseIcon } from '@/components/common/icons';
import { useAppContext } from '@/contexts/AppContext';

interface RequestModalProps {
  request: ServiceRequest;
  onClose: () => void;
}

const UrgencyBadge: React.FC<{ urgency: Urgency }> = ({ urgency }) => {
  const urgencyStyles: Record<Urgency, string> = {
    [Urgency.EMERGENCY]: 'bg-red-100 text-red-800 border-red-300',
    [Urgency.HIGH]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [Urgency.NORMAL]: 'bg-blue-100 text-blue-800 border-blue-300',
  };
  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${urgencyStyles[urgency]}`}>
      {urgency}
    </span>
  );
};

const RequestModal: React.FC<RequestModalProps> = ({ request, onClose }) => {
  const { handleUpdateStatus } = useAppContext();

  const handleDecline = () => {
    handleUpdateStatus(request.id, RequestStatus.DECLINED);
    onClose();
  };

  const handleAccept = () => {
    handleUpdateStatus(request.id, RequestStatus.ACCEPTED);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="request-modal-title">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col animate-scale-in">
        <header className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 id="request-modal-title" className="text-2xl font-bold text-gray-800">Job Details: {request.id}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <CloseIcon className="w-6 h-6 text-gray-600" />
          </button>
        </header>
        
        <main className="p-6 flex-grow overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center">
              <img src={request.customerAvatar} alt={request.customerName} className="w-16 h-16 rounded-full" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{request.customerName}</h3>
                <p className="text-gray-500">{request.location}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Service Category</h4>
              <p className="text-gray-600">{request.serviceCategory}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Scheduled Time</h4>
              <p className="text-gray-600">{new Date(request.dateTime).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Urgency</h4>
              <UrgencyBadge urgency={request.urgency} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Description</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{request.description}</p>
            </div>
            {request.photo && (
              <div>
                  <h4 className="font-semibold text-gray-700">Attached Photo</h4>
                  <img src={request.photo} alt="Issue provided by customer" className="mt-2 rounded-lg border border-gray-200 max-h-48 w-auto" />
              </div>
            )}
          </div>
        </main>

        <footer className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex justify-end space-x-3">
          {request.status === RequestStatus.PENDING ? (
            <>
              <button 
                onClick={handleDecline} 
                className="px-6 py-2.5 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 active:scale-95 transition-all">
                Decline
              </button>
              <button 
                onClick={handleAccept} 
                className="px-6 py-2.5 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-95 transition-all">
                Accept Job
              </button>
            </>
          ) : (
              <button onClick={onClose} className="px-6 py-2.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all">
                Close
              </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default RequestModal;
