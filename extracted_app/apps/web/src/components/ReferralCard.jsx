import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Gift } from 'lucide-react';
import { formatINR } from '@/lib/currencyUtils';
import { useReferralMetrics } from '@/hooks/useReferralMetrics';

const ReferralCard = () => {
  const { currentUser } = useAuth();
  const { metrics, loading } = useReferralMetrics(currentUser?.id);

  if (!currentUser) return null;

  // Assuming a fixed reward amount per completed referral, e.g., 500 INR
  const REWARD_PER_REFERRAL = 500;
  const earnings = metrics.registered * REWARD_PER_REFERRAL;

  return (
    <div className="report-card bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 opacity-5 transform translate-x-4 -translate-y-4">
        <Gift className="w-32 h-32 text-indigo-600" />
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-[14px] font-bold text-indigo-950">Share & Earn Rewards 💸</h3>
            <p className="text-xs text-indigo-700/80 mt-0.5">If you love the app, share with your photographer friends and earn extra days as rewards</p>
          </div>
          <div className="p-2 bg-indigo-100 rounded-[12px]">
            <Gift className="w-5 h-5 text-indigo-600" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-indigo-600/80 font-medium mb-1">Total Referrals</p>
            <p className="text-2xl font-bold text-indigo-950">
              {loading ? '-' : metrics.registered}
            </p>
          </div>
          <div>
            <p className="text-xs text-indigo-600/80 font-medium mb-1">Earnings</p>
            <p className="text-2xl font-bold text-indigo-950">
              {loading ? '-' : formatINR(earnings)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralCard;