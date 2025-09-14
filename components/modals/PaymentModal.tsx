import React, { useState } from 'react';
import { ServiceRequest } from '@/shared/types';
import { CloseIcon, CreditCardIcon, LockClosedIcon, SpinnerIcon, CheckBadgeIcon } from '@/components/common/icons';

interface PaymentModalProps {
  request: ServiceRequest;
  onClose: () => void;
  onSubmit: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ request, onClose, onSubmit }) => {
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success'>('idle');
  
  // Early return if there's no invoice data, preventing potential runtime errors.
  if (!request.invoice) {
    console.error("PaymentModal was opened without invoice data for request:", request.id);
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentState('processing');
    
    // Simulate an API call for payment processing.
    setTimeout(() => {
      onSubmit(); // Update the application state to reflect payment.
      setPaymentState('success');
      
      // Automatically close the modal after showing the success message.
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 2000);
  };

  const inputStyles = "w-full bg-slate-100 border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 text-slate-900";

  const renderContent = () => {
    switch (paymentState) {
        case 'processing':
            return (
                <div className="flex flex-col items-center justify-center h-64 text-slate-700">
                    <SpinnerIcon className="w-12 h-12 animate-spin" />
                    <p className="mt-4 text-lg font-semibold">Processing Payment...</p>
                    <p className="text-sm text-slate-500">Please do not close this window.</p>
                </div>
            );
        case 'success':
             return (
                <div className="flex flex-col items-center justify-center h-64 text-green-700">
                    <CheckBadgeIcon className="w-16 h-16" />
                    <p className="mt-4 text-xl font-bold">Payment Successful!</p>
                    <p className="text-sm text-slate-500">Your invoice has been paid.</p>
                </div>
            );
        case 'idle':
        default:
            return (
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                    <div className="p-6 flex-grow overflow-y-auto">
                        {/* Invoice Summary Section */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                            <h3 className="font-bold text-slate-800 mb-2">Invoice Summary for #{request.id}</h3>
                            <ul className="space-y-1 text-slate-700">
                            {request.invoice!.items.map((item, index) => (
                                <li key={index} className="flex justify-between">
                                    <span>{item.description}</span>
                                    <span className="font-medium">${item.cost.toFixed(2)}</span>
                                </li>
                            ))}
                            </ul>
                            <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between font-bold text-slate-900 text-lg">
                                <span>Total Amount</span>
                                <span>${request.invoice!.total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Payment Form Section */}
                        <div className="space-y-4">
                        <div>
                            <label htmlFor="cardNumber" className="block text-sm font-medium text-slate-700 mb-1">Card Number</label>
                            <div className="relative">
                                <CreditCardIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input type="text" id="cardNumber" placeholder="0000 0000 0000 0000" required className={`${inputStyles} pl-10`} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="expiryDate" className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                                <input type="text" id="expiryDate" placeholder="MM / YY" required className={inputStyles} />
                            </div>
                            <div>
                                <label htmlFor="cvc" className="block text-sm font-medium text-slate-700 mb-1">CVC</label>
                                <input type="text" id="cvc" placeholder="123" required className={inputStyles} />
                            </div>
                        </div>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
                        <button type="submit" className="w-full px-6 py-3.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center text-lg">
                            <LockClosedIcon className="w-5 h-5 mr-2" /> Pay ${request.invoice!.total.toFixed(2)}
                        </button>
                    </div>
                </form>
            );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg min-h-[400px] flex flex-col animate-scale-in">
        <header className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 id="payment-modal-title" className="text-2xl font-bold text-gray-800">Complete Payment</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors" disabled={paymentState !== 'idle'}>
            <CloseIcon className="w-6 h-6 text-gray-600" />
          </button>
        </header>
        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default PaymentModal;
