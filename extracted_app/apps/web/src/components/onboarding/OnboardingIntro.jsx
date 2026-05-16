import React from 'react';
import { Sparkles } from 'lucide-react';
const OnboardingIntro = ({
  onStart,
  onSkip
}) => {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 mx-4 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-[#ff3131]/10 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-[#ff3131]" />
        </div>
        
        <h2 className="text-2xl font-bold text-black mb-3">
          Create your First Quotation in just 60 seconds
        </h2>
        
        <p className="text-[#6b7280] mb-8">
          Get started in just 3 simple steps. We'll guide you through creating your first professional quotation.
        </p>
        
        <div className="w-full flex flex-col gap-3">
          <button onClick={onStart} className="w-full bg-[#ff3131] text-white font-bold py-3.5 rounded-xl hover:bg-[#e62c2c] transition-all active:scale-[0.98]">
            Start Now
          </button>
          
          <button onClick={onSkip} className="w-full text-[#6b7280] font-medium py-3.5 rounded-xl hover:bg-[#f3f4f6] transition-all active:scale-[0.98]">
            Skip for now
          </button>
        </div>
      </div>
    </div>;
};
export default OnboardingIntro;