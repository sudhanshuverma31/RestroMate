import React, { useState } from 'react';
import { Star, MessageSquare, Send, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

interface FeedbackModalProps {
  orderId: string;
  tableNumber: number;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ orderId, tableNumber, onClose }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/feedback/submit', {
        orderId,
        tableNumber,
        rating,
        comment
      });
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
      setTimeout(onClose, 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-sm overflow-hidden shadow-gold-lg border-brand-600/30">
        <div className="p-6 border-b dark:border-dark-border border-light-border flex items-center justify-between bg-dark-card">
          <h3 className="text-xl font-bold text-gold font-display">Rate Your Experience</h3>
          {!submitted && (
            <button onClick={onClose} className="p-2 hover:bg-brand-600/10 rounded-full transition-all text-brand-700">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-8">
          {submitted ? (
            <div className="text-center animate-slide-up">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/20">
                <Star size={32} fill="currentColor" />
              </div>
              <h4 className="text-lg font-bold text-gold mb-2">Feedback Received!</h4>
              <p className="text-xs text-brand-700 font-medium uppercase tracking-widest">We hope to see you again soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex flex-col items-center">
                <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-4">How was the food & service?</p>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`p-2 transition-all hover:scale-125 ${s <= rating ? 'text-brand-600' : 'text-brand-700'}`}
                    >
                      <Star size={32} fill={s <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Tell us more (Optional)</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 text-brand-700" size={18} />
                  <textarea
                    className="input pl-10 min-h-[100px] py-3 resize-none"
                    placeholder="The pasta was amazing!"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
              </div>

              <button
                disabled={isSubmitting}
                className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (
                  <>
                    Submit Feedback
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
