// src/features/profiles/components/private/PrivateProfileGate.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * PrivateProfileGate
 *
 * Dynamically determines if the viewer can see the target’s profile content.
 * Works with vc.social_follow_requests and vc.actor_follows tables.
 */
export default function PrivateProfileGate({
  profile,          // { id, display_name, username, photo_url, private }
  viewerId,         // current user id (or null)
  followButton,     // <FollowButton userId={profile.id} />
  messageButton,    // <MessageButton toUserId={profile.id} />
  children,
}) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function checkAccess() {
      if (!profile?.id) return;
      if (viewerId && viewerId === profile.id) {
        // own profile
        if (alive) {
          setAllowed(true);
          setLoading(false);
        }
        return;
      }

      if (!profile.private) {
        if (alive) {
          setAllowed(true);
          setLoading(false);
        }
        return;
      }

      // 🧩 for private profiles, check accepted relationship between viewer & target
      try {
        // 1️⃣ resolve actors
        const [{ data: viewerActor }, { data: targetActor }] = await Promise.all([
          supabase.schema('vc').from('actors').select('id').eq('profile_id', viewerId).maybeSingle(),
          supabase.schema('vc').from('actors').select('id').eq('profile_id', profile.id).maybeSingle(),
        ]);
        if (!viewerActor?.id || !targetActor?.id) throw new Error('missing actor');

        // 2️⃣ check accepted request
        const { data: reqs, error } = await supabase
          .schema('vc')
          .from('social_follow_requests')
          .select('status')
          .or(
            `and(requester_actor_id.eq.${viewerActor.id},target_actor_id.eq.${targetActor.id}),and(requester_actor_id.eq.${targetActor.id},target_actor_id.eq.${viewerActor.id})`
          )
          .eq('status', 'accepted');

        if (error) throw error;
        if (alive) {
          setAllowed(reqs?.length > 0);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[PrivateProfileGate] access check failed', err);
        if (alive) {
          setAllowed(false);
          setLoading(false);
        }
      }
    }

    checkAccess();
    return () => { alive = false; };
  }, [profile?.id, profile?.private, viewerId]);

  if (loading) {
    return (
      <div className="px-4 sm:px-0">
        <div className="rounded-2xl bg-black/60 border border-neutral-800 p-6 text-center text-neutral-400">
          Checking access…
        </div>
      </div>
    );
  }

  if (allowed) return children;

  // 🚫 locked
  return (
    <div className="px-4 sm:px-0">
      <div className="rounded-2xl bg-black/60 border border-neutral-800 p-6 text-center">
        <p className="text-sm text-neutral-300">
          This account is <span className="font-medium">private</span>. Only approved friends or followers can
          see their content.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          {followButton}
          {messageButton}
        </div>
      </div>
    </div>
  );
}
