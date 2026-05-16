import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export const useReferralMetrics = (userId) => {
  const [metrics, setMetrics] = useState({ registered: 0, upgraded: 0, earnedDays: 0 });
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);

  const fetchMetrics = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const records = await pb.collection('users').getFullList({
        filter: `referredBy="${userId}"`,
        sort: '-created',
        expand: 'plan_id',
        $autoCancel: false
      });
      
      const registered = records.length;
      const validUpgraded = records.filter(u => {
        const plan = u.expand?.plan_id;
        return plan && !plan.name.toLowerCase().includes('trial') && plan.price > 0;
      });
      const upgraded = validUpgraded.length;
      
      const earnedDays = (registered * 30) + (upgraded * 30);

      setReferrals(records);
      setMetrics({ registered, upgraded, earnedDays });
    } catch(e) {
      console.error('Failed to fetch referral metrics:', e);
      setMetrics({ registered: 0, upgraded: 0, earnedDays: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    let isSubscribed = true;
    if (userId) {
      pb.collection('users').subscribe('*', function (e) {
        if (isSubscribed && (e.record.referredBy === userId || e.record.id === userId)) {
          fetchMetrics();
        }
      }).catch(err => console.warn('Realtime subscription failed:', err));
    }
    
    return () => {
      isSubscribed = false;
      pb.collection('users').unsubscribe('*').catch(() => {});
    }
  }, [userId]);

  return { metrics, loading, referrals, refetch: fetchMetrics };
};