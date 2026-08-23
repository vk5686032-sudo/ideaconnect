import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import authApi from '../../api/auth.api';
import useAuthStore from '../../store/authSlice';

const VerifyEmail = () => {
  const { token } = useParams();
  const { user, updateUser } = useAuthStore();
  const [state, setState] = useState(token ? 'verifying' : 'no-token'); // verifying | success | error | no-token
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const verify = async () => {
      try {
        await authApi.verifyEmail(token);
        if (!cancelled) {
          setState('success');
          // Keep local auth state in sync if this browser is logged in
          if (user && !user.isVerified) {
            updateUser({ isVerified: true });
          }
        }
      } catch {
        if (!cancelled) {
          setState('error');
        }
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resend = async () => {
    if (!email.trim()) {
      toast.error('Enter your email address');
      return;
    }
    try {
      setIsSending(true);
      await authApi.resendVerification(email.trim());
      setResent(true);
      toast.success('Verification email sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="card text-center py-8">
        {state === 'verifying' && (
          <>
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Verifying your email...</h2>
            <p className="text-gray-600 text-sm">This will only take a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Email Verified!</h2>
            <p className="text-gray-600 text-sm mb-6">
              Your email address has been confirmed. You now have full access to IdeaConnect.
            </p>
            <Link to="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2">
              Go to Dashboard
            </Link>
          </>
        )}

        {(state === 'error' || state === 'no-token') && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {state === 'error' ? 'Verification Failed' : 'Verify Your Email'}
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              {state === 'error'
                ? 'This verification link is invalid or has expired. Links are valid for 24 hours.'
                : 'Enter your email address and we\'ll send you a new verification link.'}
            </p>

            {!resent ? (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field min-w-0"
                />
                <button
                  onClick={resend}
                  disabled={isSending}
                  className="btn-primary flex items-center gap-1 flex-shrink-0 disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 mb-4">
                If an account exists for that email, a new verification link has been sent.
              </div>
            )}

            <div className="mt-6">
              <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700">
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
