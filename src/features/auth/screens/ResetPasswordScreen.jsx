import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setStatus('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://vibezcitizens.com/reset-confirm',
    });

    if (error) {
      setStatus('Error sending reset email. Please try again.');
    } else {
      setStatus('Check your email for the reset link.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <form
        onSubmit={handleReset}
        className="w-full max-w-sm bg-neutral-900 p-6 rounded-lg shadow-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-white">Reset Password</h1>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {status && <p className="text-sm text-purple-300">{status}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <p className="text-center text-sm text-neutral-400">
          <Link to="/login" className="text-purple-400 hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}
