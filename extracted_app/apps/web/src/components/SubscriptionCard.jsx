import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Shield, Users, CalendarDays, Clock, Trophy, Award, ArrowUpCircle } from 'lucide-react';
import { useReferralMetrics } from '@/hooks/useReferralMetrics';
import { useNavigate } from 'react-router-dom';

const SubscriptionCard = ({ userId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState(null);
  const { metrics, loading: metricsLoading } = useReferralMetrics(userId);

  useEffect(() => {
    if (!userId) return;

    const fetchSubscriptionData = async () => {
      try {
        setLoading(true);
        const userPlans = await pb.collection('user_plans').getList(1, 1, {
          filter: `user_id="${userId}"`,
          sort: '-created',
          expand: 'plan_id',
          $autoCancel: false
        });

        let user;
        try {
          user = await pb.collection('users').getOne(userId, { expand: 'plan_id', $autoCancel: false });
        } catch(e) {
          user = pb.authStore.model || { created: new Date().toISOString() };
        }
        
        let expiryDate = null;
        let planName = 'Free Plan'; 
        
        if (userPlans.items.length > 0) {
          const userPlan = userPlans.items[0];
          if (userPlan.expand?.plan_id) {
            planName = userPlan.expand.plan_id.name;
          }
          expiryDate = userPlan.expiry_date;
        } else if (user?.plan_id) {
          if (user.expand?.plan_id) {
            planName = user.expand.plan_id.name;
            const durationMatch = user.expand.plan_id.description?.match(/Duration:\s*(\d+)/i);
            const days = durationMatch ? parseInt(durationMatch[1], 10) : 30;
            const createdDate = new Date(user.created || new Date());
            createdDate.setDate(createdDate.getDate() + days);
            expiryDate = createdDate.toISOString();
          }
        }

        setPlanData({
          name: planName,
          expiryDate: expiryDate,
          isActive: expiryDate ? new Date(expiryDate) > new Date() : true
        });

      } catch (error) {
        console.error('Error fetching subscription data:', error);
        setPlanData({
          name: 'Free Plan',
          expiryDate: null,
          isActive: true
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [userId]);

  if (loading || metricsLoading) {
    return (
      <div className="h-28 bg-card border border-border rounded-xl p-4 shadow-sm animate-pulse flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-3 bg-muted rounded w-1/4"></div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="h-full bg-muted rounded flex-1 md:w-20"></div>
          <div className="h-full bg-muted rounded flex-1 md:w-20"></div>
          <div className="h-full bg-muted rounded flex-1 md:w-20"></div>
        </div>
      </div>
    );
  }

  if (!planData) return null;

  let daysLeft = 0;
  let formattedDate = 'Lifetime';
  if (planData.expiryDate) {
    const diff = new Date(planData.expiryDate) - new Date();
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    formattedDate = new Date(planData.expiryDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between gap-5 items-start md:items-center">
      {/* Plan Info */}
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2">
            <span className="p-2 bg-primary/10 rounded-lg text-primary">
              <Shield className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-black text-foreground tracking-tight">
              {planData.name}
            </h3>
            {!planData.isActive ? (
               <span className="ml-2 px-2.5 py-1 bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest rounded-md">Expired</span>
            ) : (
              <span className="ml-2 px-2.5 py-1 bg-[#10b981]/10 text-[#10b981] text-[10px] font-bold uppercase tracking-widest rounded-md">Active</span>
            )}
          </div>
          
          <button 
            onClick={() => navigate('/subscription-plans')}
            className="md:hidden flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
          >
            Upgrade <ArrowUpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span>Valid until: <strong className="text-foreground">{formattedDate}</strong></span>
          </div>
          {planData.expiryDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Status: {daysLeft > 0 ? <strong className="text-foreground">{daysLeft} days left</strong> : <strong className="text-destructive">Expired</strong>}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action / Stats */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center w-full md:w-auto gap-4">
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-muted/30 p-3 rounded-xl border border-border text-center min-w-[80px]">
            <p className="text-xl font-black text-foreground leading-none tracking-tight flex items-center justify-center gap-1.5">
              <Users className="w-4 h-4 text-muted-foreground" /> {metrics.registered}
            </p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1.5">Registered</p>
          </div>
          <div className="flex-1 md:flex-none bg-muted/30 p-3 rounded-xl border border-border text-center min-w-[80px]">
            <p className="text-xl font-black text-foreground leading-none tracking-tight flex items-center justify-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" /> {metrics.upgraded}
            </p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1.5">Upgraded</p>
          </div>
          <div className="flex-1 md:flex-none bg-primary/5 p-3 rounded-xl border border-primary/20 text-center min-w-[80px]">
            <p className="text-xl font-black text-primary leading-none tracking-tight flex items-center justify-center gap-1.5">
              <Award className="w-4 h-4" /> +{metrics.earnedDays}
            </p>
            <p className="text-[10px] text-primary/80 font-bold uppercase tracking-widest mt-1.5">Days Earned</p>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/subscription-plans')}
          className="hidden md:flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm"
        >
          <ArrowUpCircle className="w-4 h-4" /> Upgrade
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCard;