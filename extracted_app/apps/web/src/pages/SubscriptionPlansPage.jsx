import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { formatINR } from '@/lib/currencyUtils';
import { Check, AlertCircle, RefreshCw, ArrowLeft, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const SubscriptionPlansPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const plansResult = await pb.collection('plans').getFullList({
        sort: 'price',
        $autoCancel: false
      });
      
      const activePlans = plansResult.filter(p => p.status === 'active' || !p.status);
      setPlans(activePlans);
      
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load subscription plans. Please try again.');
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubscribe = (plan) => {
    const isTrial = plan.name.toLowerCase().includes('trial') || plan.price === 0;
    if (isTrial) return; 

    if (!currentUser) {
      toast.error('Please log in to subscribe to a plan.');
      return;
    }

    const message = `Hi, I want to subscribe to the ${plan.name} plan for Pixora Studio. My email is ${currentUser.email}.`;
    const companyPhone = '918878387979';
    
    // We use window.location.href or a synchronous window open to avoid Safari popup blocking
    const waUrl = `https://wa.me/${companyPhone}?text=${encodeURIComponent(message)}`;
    window.location.href = waUrl;
  };

  const parseFeatures = (featuresString) => {
    if (!featuresString) return [];
    return featuresString.split(',').map(f => f.trim()).filter(f => f);
  };

  const extractDuration = (description) => {
    const match = description?.match(/Duration:\s*(\d+)\s*days/i);
    return match ? `${match[1]} Days` : 'Monthly';
  };

  const cleanDescription = (description) => {
    if (!description) return '';
    return description.replace(/Duration:\s*\d+\s*days/i, '').trim();
  };

  return (
    <>
      <Helmet>
        <title>Subscription Plans - Pixora Studio</title>
      </Helmet>

      <div className="min-h-screen bg-[#f9f9f9] dark:bg-[#0a0a0a] pb-24 md:pb-12">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 animate-in fade-in duration-300">
          
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">Choose Your Plan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Select the perfect plan to grow your photography business. Upgrade anytime as your needs expand.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground font-medium">Loading plans...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 text-center max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Oops! Something went wrong</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <button 
                onClick={fetchPlans}
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Try Again
              </button>
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-2">No Plans Available</h3>
              <p className="text-muted-foreground">There are currently no active subscription plans. Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
              {plans.map((plan, index) => {
                const features = parseFeatures(plan.features);
                const duration = extractDuration(plan.description);
                const description = cleanDescription(plan.description);
                const isRecommended = index === Math.floor(plans.length / 2);
                const isTrial = plan.name.toLowerCase().includes('trial') || plan.price === 0;

                return (
                  <div 
                    key={plan.id} 
                    className={`relative bg-card rounded-2xl p-6 sm:p-8 flex flex-col h-full transition-all duration-300 ${
                      isRecommended 
                        ? 'border-2 border-primary shadow-lg scale-100 lg:scale-105 z-10' 
                        : 'border border-border shadow-sm hover:shadow-md'
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-sm">
                        Recommended
                      </div>
                    )}
                    
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground min-h-[40px]">{description}</p>
                    </div>
                    
                    <div className="mb-6 pb-6 border-b border-border">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-foreground tracking-tight">{formatINR(plan.price)}</span>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mt-1">per {duration.toLowerCase()}</p>
                    </div>
                    
                    <div className="flex-grow mb-8">
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">What's included</h4>
                      <ul className="space-y-3">
                        {features.length > 0 ? (
                          features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                <Check className="w-3 h-3 text-primary" />
                              </div>
                              <span className="text-sm text-foreground/80 leading-snug">{feature}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-muted-foreground italic">Standard features included</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="mt-auto">
                      {isTrial ? (
                        <button 
                          className="w-full h-12 text-base font-bold rounded-xl opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                          disabled
                        >
                          Active
                        </button>
                      ) : (
                        <button 
                          className={`w-full flex items-center justify-center h-12 text-base font-bold rounded-xl transition-all active:scale-[0.98] ${!isRecommended ? 'border border-border hover:bg-[#25D366]/10 hover:text-[#20bd5a] hover:border-[#25D366]' : 'bg-[#25D366] hover:bg-[#20bd5a] text-white border-none'}`}
                          onClick={() => handleSubscribe(plan)}
                        >
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Subscribe via WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubscriptionPlansPage;