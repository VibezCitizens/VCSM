import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import VPortForm from './VPortForm';

export default function VPortCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');

  async function handleCreate(payload) {
    if (!user?.id) {
      navigate('/login', { replace: false, state: { from: '/vports/new' } });
      return;
    }
    setErr('');
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('vports')
        .insert({
          ...payload,
          created_by: user.id,
          claim_status: 'Unclaimed',
          verified: false,
        })
        .select('id')
        .single();
      if (error) throw error;

      // go to the new VPort
      navigate(`/vports/${data.id}`, { replace: true });
    } catch (e) {
      setErr(e.message || 'Failed to create VPort');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-center text-sm uppercase tracking-wider text-zinc-400 mb-6">Vibez Citizens</h1>
        <h2 className="text-xl font-semibold mb-4">Create VPort</h2>

        {err && (
          <div className="mb-3 rounded-lg border border-red-600/40 bg-red-600/10 text-red-300 px-3 py-2">
            {err}
          </div>
        )}

        <VPortForm
          initial={{ country: 'US' }}
          submitting={saving}
          onSubmit={handleCreate}
          onCancel={() => navigate(-1)} // ← this is the Cancel action
        />
      </div>
    </div>
  );
}
