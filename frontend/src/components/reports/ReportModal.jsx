import { useState } from 'react';
import { Flag, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import reportApi from '../../api/report.api';
import useAuthStore from '../../store/authSlice';

const REASONS = [
  { value: 'spam', label: 'Spam or scam', emoji: '📢' },
  { value: 'harassment', label: 'Harassment or bullying', emoji: '🚫' },
  { value: 'inappropriate', label: 'Inappropriate content', emoji: '🔞' },
  { value: 'misinformation', label: 'Misinformation', emoji: '❓' },
  { value: 'other', label: 'Something else', emoji: '📝' },
];

/**
 * Shared report dialog.
 * Usage: <ReportModal targetType="idea" targetId={id} targetLabel="..." onClose={() => ...} />
 */
const ReportModal = ({ targetType, targetId, targetLabel, onClose }) => {
  const { isAuthenticated } = useAuthStore();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
        <div className="bg-white rounded-xl max-w-md w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-gray-700 mb-4">Log in to report content.</p>
          <button onClick={onClose} className="btn-outline w-full">Close</button>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }
    try {
      setIsSubmitting(true);
      await reportApi.create({ targetType, targetId, reason, details: details.trim() || undefined });
      toast.success('Report submitted — our moderators will review it');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            Report {targetType}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {targetLabel && (
            <p className="text-sm text-gray-600">
              Reporting: <span className="font-medium">{targetLabel}</span>
            </p>
          )}

          <div className="space-y-2">
            {REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                  reason === r.value
                    ? 'border-primary-400 bg-primary-50 text-primary-800'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{r.emoji}</span> {r.label}
              </button>
            ))}
          </div>

          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Add details for the moderators (optional)"
            className="input-field text-sm"
          />

          <p className="text-xs text-gray-400">
            False reports may affect your reputation. Reports are reviewed by admins.
          </p>

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={isSubmitting || !reason}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
              Submit Report
            </button>
            <button onClick={onClose} className="btn-outline">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
