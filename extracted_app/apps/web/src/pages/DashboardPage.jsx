import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import AppScaffold from '@/components/m3/AppScaffold';
import { Users, Share2, CheckCircle2, XCircle, Clock, XOctagon, DollarSign, BarChart3, TrendingUp, Plus, FileText } from 'lucide-react';
import { getDurationFilteredData } from '@/lib/quotationUtils';
import { formatINR } from '@/lib/currencyUtils';
import Footer from '@/components/Footer';
import { useFirstTimeUser } from '@/hooks/useFirstTimeUser';
import OnboardingIntro from '@/components/onboarding/OnboardingIntro';
import GuidedQuotationFlow from '@/components/onboarding/GuidedQuotationFlow';
import OnboardingSuccess from '@/components/onboarding/OnboardingSuccess';
import AppButton from '@/components/m3/AppButton';
import SubscriptionCard from '@/components/SubscriptionCard';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

const QUOTES = ['Every moment is a chance to capture magic', 'Your lens, your story, your art', 'Creating memories, one frame at a time', 'Where passion meets pixels'];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [duration, setDuration] = useState('This Month');
  const [allQuotations, setAllQuotations] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState('');
  
  const {
    isFirstTime,
    loading: onboardingLoading,
    markOnboardingComplete
  } = useFirstTimeUser();
  
  const [onboardingStep, setOnboardingStep] = useState('none');
  const [createdQuotation, setCreatedQuotation] = useState(null);
  const [showFirstQuotationPrompt, setShowFirstQuotationPrompt] = useState(false);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!loading && !onboardingLoading && currentUser) {
      if (allQuotations.length === 0 && !currentUser.onboarding_completed) {
        setShowFirstQuotationPrompt(true);
      } else {
        setShowFirstQuotationPrompt(false);
      }
    }
  }, [currentUser, onboardingLoading, loading, allQuotations]);

  const fetchDashboardData = async () => {
    try {
      const [customers, quotations, referred] = await Promise.all([
        pb.collection('customers').getFullList({ $autoCancel: false }),
        pb.collection('quotations').getFullList({ sort: '-created', $autoCancel: false }),
        pb.collection('users').getFullList(200, { filter: 'referredBy="' + currentUser.id + '"', $autoCancel: false }).catch(() => [])
      ]);
      setAllCustomers(customers);
      setAllQuotations(quotations);
      setRegisteredUsersCount(referred?.length || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartFirstQuotation = async () => {
    setShowFirstQuotationPrompt(false);
    navigate('/quotations/create');
  };

  const handleOnboardingStart = () => {
    setOnboardingStep('flow');
  };

  const handleOnboardingSkip = async () => {
    await markOnboardingComplete();
    setOnboardingStep('none');
  };

  const handleOnboardingSuccess = async quotation => {
    setCreatedQuotation(quotation);
    setOnboardingStep('success');
    await markOnboardingComplete();
    fetchDashboardData();
  };

  const handleOnboardingDone = () => {
    setOnboardingStep('none');
  };

  const handleCreateQuotationClick = async () => {
    navigate('/quotations/create');
  };

  if (loading || onboardingLoading) {
    return (
      <AppScaffold>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppScaffold>
    );
  }

  const filteredQuotations = getDurationFilteredData(allQuotations, duration);
  const filteredCustomers = getDurationFilteredData(allCustomers, duration);

  const statusCounts = {
    accepted: filteredQuotations.filter(q => q.status === 'accepted').length,
    rejected: filteredQuotations.filter(q => q.status === 'rejected').length,
    pending: filteredQuotations.filter(q => ['draft', 'sent', 'pending'].includes(q.status)).length,
    cancelled: filteredQuotations.filter(q => q.status === 'cancelled').length
  };

  const totalRevenue = filteredQuotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
  const averageQuotationValue = filteredQuotations.length > 0 ? totalRevenue / filteredQuotations.length : 0;
  const pendingQuotationsCount = filteredQuotations.filter(q => ['draft', 'sent'].includes(q.status)).length;
  const conversionRate = filteredQuotations.length > 0 ? (statusCounts.accepted / filteredQuotations.length * 100).toFixed(1) : 0;
  const userName = pb.authStore.model?.full_name || pb.authStore.model?.name || 'Photographer';

  return (
    <>
      <Helmet>
        <title>Dashboard - Pixora</title>
      </Helmet>

      {onboardingStep === 'intro' && <OnboardingIntro onStart={handleOnboardingStart} onSkip={handleOnboardingSkip} />}
      {onboardingStep === 'flow' && <GuidedQuotationFlow onSuccess={handleOnboardingSuccess} onCancel={handleOnboardingSkip} />}
      {onboardingStep === 'success' && createdQuotation && <OnboardingSuccess quotation={createdQuotation} onDone={handleOnboardingDone} />}

      <Dialog open={showFirstQuotationPrompt} onOpenChange={(open) => !open && setShowFirstQuotationPrompt(false)}>
        <DialogContent className="max-w-sm bg-card rounded-3xl p-6 border-border text-center">
          <DialogTitle className="sr-only">Create First Quotation</DialogTitle>
          <DialogDescription className="sr-only">Start creating your first quotation.</DialogDescription>
          
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-primary" />
          </div>
          
          <h2 className="text-2xl font-extrabold text-foreground mb-2">Create your first quotation</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Start impressing your clients with professional, beautiful quotations in minutes.
          </p>
          
          <Button 
            onClick={handleStartFirstQuotation}
            className="w-full h-12 rounded-xl font-bold text-base"
          >
            Start Now
          </Button>
        </DialogContent>
      </Dialog>

      <AppScaffold>
        <div className="flex flex-col min-h-full relative z-10 pb-6 space-y-6">
          <div className="flex flex-col gap-1">
            <p className="text-[14px] text-muted-foreground">Welcome back</p>
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">Hi {userName}</h1>
            <p className="text-[12px] italic text-muted-foreground mt-1">{quote}</p>
          </div>

          <AppButton onClick={handleCreateQuotationClick} icon={Plus} className="w-full">
            Create Quotation
          </AppButton>

          <SubscriptionCard userId={pb.authStore.model?.id} />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-border">
            <h2 className="text-[18px] font-semibold text-foreground">Analytics</h2>
            
            <div className="flex items-center gap-1 bg-card p-1 rounded-[12px] overflow-x-auto self-start md:self-auto border border-border">
              {['This Month', 'Last Month', 'This Year'].map(opt => (
                <button 
                  key={opt} 
                  onClick={() => setDuration(opt)} 
                  className={`px-4 py-2 rounded-[8px] text-[12px] font-semibold transition-all whitespace-nowrap ${duration === opt ? 'bg-secondary text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="card-base">
            <h3 className="text-[16px] font-semibold text-foreground mb-4">Quotations Status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-secondary/50 p-4 rounded-[12px] border border-border">
                <div className="flex items-center gap-2 text-[#10b981] mb-2">
                  <div className="bg-[#10b981] rounded-full p-1"><CheckCircle2 className="w-4 h-4 text-white" /></div>
                  <span className="text-[12px] font-bold uppercase tracking-wider">Accepted</span>
                </div>
                <span className="text-[20px] font-bold text-foreground tabular-nums">{statusCounts.accepted}</span>
              </div>
              <div className="bg-secondary/50 p-4 rounded-[12px] border border-border">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <div className="bg-destructive rounded-full p-1"><XCircle className="w-4 h-4 text-white" /></div>
                  <span className="text-[12px] font-bold uppercase tracking-wider">Rejected</span>
                </div>
                <span className="text-[20px] font-bold text-foreground tabular-nums">{statusCounts.rejected}</span>
              </div>
              <div className="bg-secondary/50 p-4 rounded-[12px] border border-border">
                <div className="flex items-center gap-2 text-[#3b82f6] mb-2">
                  <div className="bg-[#3b82f6] rounded-full p-1"><Clock className="w-4 h-4 text-white" /></div>
                  <span className="text-[12px] font-bold uppercase tracking-wider">Sent</span>
                </div>
                <span className="text-[20px] font-bold text-foreground tabular-nums">{statusCounts.pending}</span>
              </div>
              <div className="bg-secondary/50 p-4 rounded-[12px] border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <div className="bg-muted-foreground rounded-full p-1"><XOctagon className="w-4 h-4 text-white" /></div>
                  <span className="text-[12px] font-bold uppercase tracking-wider">Drafted</span>
                </div>
                <span className="text-[20px] font-bold text-foreground tabular-nums">{statusCounts.cancelled}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="report-card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[14px] font-semibold text-muted-foreground">Total Quotation Shared Value</h3>
                <div className="p-2 bg-primary/10 rounded-[12px]">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
              <span className="text-[22px] font-bold text-primary tabular-nums tracking-tight">
                {formatINR(totalRevenue)}
              </span>
            </div>

            <div className="report-card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[14px] font-semibold text-muted-foreground">Quotation Accepted Rate</h3>
                <div className="p-2 bg-[#10b981]/10 rounded-[12px]">
                  <TrendingUp className="w-5 h-5 text-[#10b981]" />
                </div>
              </div>
              <span className="text-[22px] font-bold text-[#10b981] tabular-nums tracking-tight">
                {conversionRate}%
              </span>
            </div>

            <div className="report-card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[14px] font-semibold text-muted-foreground">Avg. Quotation Value</h3>
                <div className="p-2 bg-secondary rounded-[12px]">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
              <span className="text-[22px] font-bold text-foreground tabular-nums tracking-tight">
                {formatINR(averageQuotationValue)}
              </span>
            </div>

            <div className="report-card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[14px] font-semibold text-muted-foreground">Pending Quotations</h3>
                <div className="p-2 bg-[#3b82f6]/10 rounded-[12px]">
                  <Clock className="w-5 h-5 text-[#3b82f6]" />
                </div>
              </div>
              <span className="text-[22px] font-bold text-[#3b82f6] tabular-nums tracking-tight">
                {pendingQuotationsCount}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="report-card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[16px] font-semibold text-foreground">Quotations Shared</h3>
                <div className="p-2 bg-primary/10 rounded-[12px]">
                  <Share2 className="w-5 h-5 text-primary" />
                </div>
              </div>
              <span className="text-[22px] font-bold text-foreground tabular-nums">{filteredQuotations.length}</span>
            </div>

            <div className="report-card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[16px] font-semibold text-foreground">Customers Created</h3>
                <div className="p-2 bg-[#3b82f6]/10 rounded-[12px]">
                  <Users className="w-5 h-5 text-[#3b82f6]" />
                </div>
              </div>
              <span className="text-[22px] font-bold text-foreground tabular-nums">{filteredCustomers.length}</span>
            </div>

            <div className="report-card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[16px] font-semibold text-foreground">Total Registered Users</h3>
                <div className="p-2 bg-[#10b981]/10 rounded-[12px]">
                  <Users className="w-5 h-5 text-[#10b981]" />
                </div>
              </div>
              <span className="text-[22px] font-bold text-foreground tabular-nums">{registeredUsersCount}</span>
            </div>
          </div>
          
          <Footer />
        </div>
      </AppScaffold>
    </>
  );
};
export default DashboardPage;