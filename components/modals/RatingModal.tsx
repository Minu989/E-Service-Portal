import React, { useState } from 'react';
import { Rating } from '@/shared/types';
import { CloseIcon, StarIcon, CheckIcon } from '@/components/common/icons';

interface RatingModalProps {
  title: string;
  onClose: () => void;
  onSubmit: (rating: Rating) => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ title, onClose, onSubmit }) => {
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) {
        // Using a more modern approach than alert for user feedback is recommended in a real app.
        alert('Please select a star rating.');
        return;
    }
    onSubmit({ stars, feedback });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="rating-modal-title">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in">
        <header className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 id="rating-modal-title" className="text-2xl font-bold text-gray-800">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <CloseIcon className="w-6 h-6 text-gray-600" />
          </button>
        </header>
        
        <main className="p-8 flex-grow overflow-y-auto space-y-6 text-center">
            <p className="text-slate-600">How was your experience? Your feedback helps us improve.</p>
            
            <div 
                className="flex justify-center space-x-2"
                onMouseLeave={() => setHoverStars(0)}
            >
                {[1, 2, 3, 4, 5].map(starValue => (
                    <button
                        type="button"
                        key={starValue}
                        aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                        onMouseEnter={() => setHoverStars(starValue)}
                        onClick={() => setStars(starValue)}
                    >
                        <StarIcon className={`w-10 h-10 transition-colors duration-200 ${
                            (hoverStars || stars) >= starValue ? 'text-yellow-400' : 'text-slate-300'
                        }`} />
                    </button>
                ))}
            </div>

            <div>
                 <label htmlFor="feedback" className="sr-only">Feedback</label>
                 <textarea
                    id="feedback"
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share more details about your experience (optional)"
                    className="w-full bg-slate-100 border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 text-slate-900"
                 />
            </div>
        </main>

        <footer className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
          <button type="submit" className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center text-lg disabled:bg-slate-400" disabled={stars === 0}>
            <CheckIcon className="w-5 h-5 mr-2" /> Submit Feedback
          </button>
        </footer>
      </form>
    </div>
  );
};

export default RatingModal;
