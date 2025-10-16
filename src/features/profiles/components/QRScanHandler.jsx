// src/components/QRScanHandler.jsx
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function QRScanHandler({ targetUserId }) {
  useEffect(() => {
    const logScan = async () => {
      const ip = await fetch('https://api64.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);

      const userAgent = navigator.userAgent;

      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id || null;

      await supabase.from('qr_scans').insert({
        target_user_id: targetUserId,
        ip_address: ip,
        user_agent: userAgent,
        created_by: currentUserId,
      });

      if (targetUserId !== currentUserId) {
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          actor_id: currentUserId,
          type: 'qr_scan',
        });
      }
    };

    logScan();
  }, [targetUserId]);

  return null;
}
