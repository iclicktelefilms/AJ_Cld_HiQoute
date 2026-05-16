import React from 'react';
import { Helmet } from 'react-helmet';
import AppScaffold from '@/components/m3/AppScaffold';
import AppButton from '@/components/m3/AppButton';
import { Check } from 'lucide-react';

const PlansPage = () => {
  return (
    <>
      <Helmet>
        <title>Plans - Pixora</title>
      </Helmet>

      <AppScaffold title="Plans">
        <div className="max-w-2xl mx-auto w-full pb-12">
          <h2 className="text-[24px] font-bold text-black mb-6">Plans</h2>
          
          <div className="bg-white border border-[#e0e0e0] rounded-[16px] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-[16px] font-bold text-black">Pro Plan</h3>
                <p className="text-[12px] text-[#666666] mt-1">Everything you need to manage your photography business.</p>
              </div>
              <div className="text-right">
                <span className="text-[18px] font-bold text-[#ff3131]">₹999</span>
                <span className="text-[12px] text-[#666666]">/month</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {[
                'Unlimited Quotations',
                'Unlimited Customers',
                'Custom Packages & Items',
                'WhatsApp Integration',
                'PDF Downloads',
                'Priority Support'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#10b981]" />
                  </div>
                  <span className="text-[14px] text-black">{feature}</span>
                </div>
              ))}
            </div>

            <AppButton variant="tonal" className="w-full rounded-[8px] pointer-events-none opacity-80">
              Current Plan
            </AppButton>
          </div>
        </div>
      </AppScaffold>
    </>
  );
};

export default PlansPage;