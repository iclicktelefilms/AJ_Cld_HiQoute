import React from 'react';
import { CheckCircle2, MessageCircle, FileText } from 'lucide-react';
import { generateOnboardingWhatsAppMessage, openWhatsAppShare } from '@/lib/onboardingUtils';
import { formatINR } from '@/lib/currencyUtils';
import { useNavigate } from 'react-router-dom';

const OnboardingSuccess = ({ quotation, onDone }) => {
  const navigate = useNavigate();

  const handleShare = () => {
    const phone = quotation?.expand?.customer?.phone;
    const message = generateOnboardingWhatsAppMessage(quotation);
    openWhatsAppShare(phone, message);
  };

  const handleView = () => {
    onDone();
    navigate('/quotations');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 mx-4 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        
        <div className="w-20 h-20 bg-[#10b981]/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-[#10b981]" />
        </div>
        
        <h2 className="text-2xl font-bold text-black mb-2">
          Your quotation is ready! 🎉
        </h2>
        
        <p className="text-[#6b7280] mb-6">
          Share it with your client on WhatsApp
        </p>

        <div className="w-full bg-[#f9f9f9] border border-[#f3f4f6] rounded-xl p-4 mb-8 text-left">
          <div className="text-sm text-[#6b7280] mb-1">Customer</div>
          <div className="font-bold text-black mb-3">{quotation?.expand?.customer?.name || 'Customer'}</div>
          
          <div className="text-sm text-[#6b7280] mb-1">Amount</div>
          <div className="font-bold text-[#ff3131]">{formatINR(quotation?.totalAmount || 0)}</div>
        </div>
        
        <div className="w-full flex flex-col gap-3">
          <button 
            onClick={handleShare}
            className="w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl hover:bg-[#20bd5a] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" /> Share on WhatsApp
          </button>
          
          <button 
            onClick={handleView}
            className="w-full bg-[#f3f4f6] text-black font-bold py-3.5 rounded-xl hover:bg-[#e5e7eb] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" /> View Quotation
          </button>

          <button 
            onClick={onDone}
            className="w-full text-[#6b7280] font-medium py-2 mt-2 hover:text-black transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default OnboardingSuccess;