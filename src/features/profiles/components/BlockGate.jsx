import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import supabase from '@/lib/supabaseClient';
import { useIdentity } from '@/state/identityContext'; 

export default function BlockGate({ children }) {
  // 1. Use the active identity (User or Vport)
  const { identity, isLoading } = useIdentity();
  
  const { username, id, slug } = useParams();
  const [allowed, setAllowed] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    // Handle loading state
    if (isLoading) {
      setAllowed(null);
      return;
    }

    // If not logged in or identity actor is missing (should be rare if logged in) → allow access
    if (!identity?.actorId) { 
      if (alive) setAllowed(true);
      return;
    }
    
    // The key identifier for the block check
    const activeActorId = identity.actorId;

    (async () => {
      try {
        const termUsername = (username || '').replace(/^@/, '');
        const termSlug = (slug || '').replace(/^@/, '');

        // 1) Resolve target (profile or vport)
        let targetProfileId = null;
        let targetVportId = null;

        // Search profiles table by username or ID
        if (termUsername || id) {
          const parts = [];
          if (termUsername) parts.push(`username.eq.${termUsername}`);
          if (id) parts.push(`id.eq.${id}`);

          if (parts.length) {
            const { data: profile, error: profErr } = await supabase
              .from('profiles')
              .select('id')
              .or(parts.join(','))
              .maybeSingle();
            if (!profErr && profile?.id) targetProfileId = profile.id;
          }
        }

        // Search vports table by slug or ID if profile wasn't found
        if (!targetProfileId && (termSlug || id)) {
          const parts = [];
          if (termSlug) parts.push(`slug.eq.${termSlug}`);
          if (id) parts.push(`id.eq.${id}`);

          if (parts.length) {
            const { data: vport, error: vErr } = await supabase
              .schema('vc')
              .from('vports')
              .select('id')
              .or(parts.join(','))
              .maybeSingle();
            if (!vErr && vport?.id) targetVportId = vport.id;
          }
        }
        
        // If target isn't found, allow access (will result in a 404 handled elsewhere)
        if (!targetProfileId && !targetVportId) {
          if (alive) setAllowed(true);
          return;
        }

        // 2) Resolve target actor ID
        const actorOr = [];
        if (targetProfileId) actorOr.push(`profile_id.eq.${targetProfileId}`);
        if (targetVportId) actorOr.push(`vport_id.eq.${targetVportId}`);

        const { data: tgtActor, error: tgtErr } = await supabase
          .schema('vc')
          .from('actors')
          .select('id')
          .or(actorOr.join(','))
          .maybeSingle();

        if (tgtErr || !tgtActor?.id) {
          if (alive) setAllowed(true);
          return;
        }
        const targetActorId = tgtActor.id;

        // 3) Use the currently active actor ID (User or Vport)
        const currentActorId = activeActorId;
        
        // 4) 2-way block check using the active actor
        const orExpr = `
          and(blocker_actor_id.eq.${currentActorId},blocked_actor_id.eq.${targetActorId}),
          and(blocker_actor_id.eq.${targetActorId},blocked_actor_id.eq.${currentActorId})
        `.replace(/\s+/g, '');

        const { data: blocks, error: blocksErr } = await supabase
          .schema('vc')
          .from('user_blocks')
          .select('blocker_actor_id,blocked_actor_id')
          .or(orExpr);

        if (blocksErr) {
          if (alive) setAllowed(true);
          return;
        }
        
        const isBlocked = (blocks?.length ?? 0) > 0;

        // 5) Apply result
        if (!alive) return;

        if (isBlocked) {
          setAllowed(false);
          // The block is active, redirect to home page
          navigate('/', { replace: true });
        } else {
          setAllowed(true);
        }
      } catch (err) {
        console.error('[BlockGate ERROR]', err);
        if (alive) setAllowed(true);
      }
    })();

    return () => { alive = false; };
  }, [
        identity?.actorId, // ⬅️ CORRECTED DEPENDENCY
        isLoading, 
        username, 
        id, 
        slug, 
        navigate
    ]);


  // Show nothing or a loading spinner while checking access
  if (allowed === false) return null;

  if (allowed === null) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh] bg-neutral-950 text-white">
        Checking access…
      </div>
    );
  }

  return children;
}