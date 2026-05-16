import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useReferralMetrics } from '@/hooks/useReferralMetrics';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, Share2, Users, Gift, AlertCircle, ArrowLeft, Trophy, Award, Clock } from 'lucide-react';
import { toast } from 'sonner';

const InviteEarnPage = () => {
  const { currentUser, getReferralLink } = useAuth();
  const navigate = useNavigate();
  const { metrics, loading, referrals, refetch } = useReferralMetrics(currentUser?.id);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const referralCode = currentUser?.referralCode || 'PENDING';
  const referralLink = getReferralLink();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const message = `Hey, I use Pixora to create and send professional photography quotations. Try it here: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <>
      <Helmet>
        <title>Invite & Earn - Pixora Studio</title>
      </Helmet>

      <div className="min-h-screen bg-[#f9f9f9] pb-24 md:pb-12">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 animate-in fade-in duration-300 space-y-6">
          
          <button onClick={() => navigate('/settings')} className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Settings
          </button>

          {/* Hero Section */}
          <div className="bg-gradient-to-br from-primary to-primary-hover rounded-3xl p-6 sm:p-8 text-primary-foreground shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight">Invite & Earn Rewards</h2>
                <p className="text-primary-foreground/90 text-sm max-w-md mb-6 leading-relaxed">
                  Give your friends a head start and earn <strong className="text-white">30 days of premium access</strong> for every friend who subscribes to a paid plan.
                </p>
                <div className="bg-black/10 backdrop-blur-md border border-white/20 rounded-xl p-2 w-fit flex items-center justify-between gap-4">
                  <div className="pl-3 py-1">
                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-0.5">Your Code</p>
                    <span className="text-base font-black tracking-widest leading-none">{referralCode}</span>
                  </div>
                  <button onClick={handleCopyCode} className="bg-white text-primary p-2 rounded-lg transition-colors hover:bg-white/90 flex items-center justify-center" aria-label="Copy code">
                    {copiedCode ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex-shrink-0 w-full md:w-auto bg-white/10 p-5 rounded-2xl border border-white/20 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-white/80 mb-3 text-center">Share your link</p>
                <Button onClick={handleWhatsAppShare} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white border-none h-11 rounded-xl text-sm font-bold shadow-md active:scale-[0.98]">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share via WhatsApp
                </Button>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/80 truncate">
                    {referralLink}
                  </div>
                  <button onClick={handleCopyLink} className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-colors">
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Registered Users</p>
              <p className="text-3xl font-black text-foreground">{metrics.registered}</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Users who signed up using your link or code.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Upgraded Users</p>
              <p className="text-3xl font-black text-foreground">{metrics.upgraded}</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Referred users who purchased a paid plan.</p>
            </div>
            <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <Award className="w-32 h-32 text-primary" />
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative z-10">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1 relative z-10">Earned Days</p>
              <p className="text-3xl font-black text-primary relative z-10">+{metrics.earnedDays}</p>
              <p className="text-xs text-foreground/70 mt-2 relative z-10">Total premium days added to your subscription.</p>
            </div>
          </div>

          {/* Referrals List */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <h3 className="text-sm font-bold text-foreground">Referral History</h3>
              <button onClick={refetch} className="text-xs font-bold text-primary hover:underline">
                Refresh List
              </button>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Loading records...
              </div>
            ) : referrals.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-base text-foreground font-bold">No referrals yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs leading-relaxed">Share your link with photographer friends to start earning premium access!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {referrals.map(ref => {
                  const isCompleted = ref.status === 'completed';
                  const isPendingReward = isCompleted && !ref.reward_given;
                  const name = ref.expand?.referred_user_id?.name || ref.expand?.referred_user_id?.email || 'Invited User';
                  
                  return (
                    <div key={ref.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Joined {new Date(ref.created).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-start sm:self-auto">
                        {isCompleted && ref.reward_given && (
                          <span className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                            <Gift className="w-3.5 h-3.5" /> +30 Days
                          </span>
                        )}
                        
                        {isPendingReward ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Pending Reward
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#e6f4ea] text-[#1e8e3e] border border-[#ceead6]">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                            <AlertCircle className="w-3 h-3" /> Pending Plan
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default InviteEarnPage;