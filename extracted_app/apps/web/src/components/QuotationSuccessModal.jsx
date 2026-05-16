import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MessageCircle, Download, ExternalLink, Share2, Info, X, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { generateWhatsAppURL } from '@/lib/quotationUtils';
import { toast } from 'sonner';

export default function QuotationSuccessModal({ open, onOpenChange, onClose, quotation, onWhatsApp, onDownload, onView }) {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleStep1Done = () => {
    setStep(2);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    onOpenChange(false);
    setTimeout(() => setStep(1), 300);
  };

  const handleWhatsAppShare = async () => {
    if (onWhatsApp) {
      onWhatsApp();
    } else {
      try {
        const phone = quotation?.expand?.customer?.phone || quotation?.phone;
        if (!phone) {
          toast.error('No phone number available for this customer');
          return;
        }
        const url = await generateWhatsAppURL(pb, quotation, phone);
        window.open(url, '_blank');
      } catch (err) {
        toast.error('Failed to prepare WhatsApp message');
      }
    }
    handleStep1Done();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if(!val) handleClose();
    }}>
      <DialogContent className="max-w-md bg-card rounded-3xl p-6 border-border gap-0" aria-describedby="quotation-success-description">
        <DialogTitle className="sr-only">Quotation Shared Successfully</DialogTitle>
        <DialogDescription id="quotation-success-description" className="sr-only">
          Choose an action to share your quotation or refer friends.
        </DialogDescription>
        
        {step === 1 ? (
          <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-300 relative">
            <button 
              onClick={handleClose}
              className="absolute -right-2 -top-2 p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors z-10"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 bg-[#10b981]/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-[#10b981]" />
            </div>
            
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Quotation Ready! 🎉</h2>
            <p className="text-sm text-muted-foreground mb-6">Your quotation has been successfully generated and is ready to be shared with your client.</p>
            
            <div className="w-full space-y-3">
              <button 
                onClick={handleWhatsAppShare} 
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5" /> Share on WhatsApp
              </button>
              <button 
                onClick={() => { onDownload(); handleStep1Done(); }} 
                className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-bold py-3.5 rounded-xl border border-border transition-all active:scale-[0.98]"
              >
                <Download className="w-5 h-5" /> Download PDF
              </button>
              <button 
                onClick={() => { onView(); handleStep1Done(); }} 
                className="w-full flex items-center justify-center gap-2 bg-background hover:bg-muted text-foreground font-bold py-3.5 rounded-xl border border-border transition-all shadow-sm active:scale-[0.98]"
              >
                <ExternalLink className="w-5 h-5" /> View Quotation
              </button>
              <button 
                onClick={handleStep1Done} 
                className="w-full mt-2 text-primary font-semibold py-2 hover:underline"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center animate-in slide-in-from-right-4 duration-300 relative">
            <button 
              onClick={handleClose}
              className="absolute -right-2 -top-2 p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors z-10"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Share2 className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-xl font-bold text-foreground mb-3">Share & Earn Rewards 💸</h2>
            <p className="text-sm text-muted-foreground mb-6">
              If you love the app, share with your photographer friends and earn extra days as rewards
            </p>
            
            <div className="w-full space-y-3">
              <button 
                onClick={() => {
                  const link = `${window.location.origin}/signup?ref=${quotation?.user_id}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent('Hey, I use Pixora to send professional quotations easily. Try it here: ' + link)}`, '_blank');
                  handleClose();
                }} 
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                <Share2 className="w-5 h-5" /> Share to Earn
              </button>
              <button 
                onClick={() => {
                  handleClose();
                  navigate('/invite-earn');
                }} 
                className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-bold py-3.5 rounded-xl border border-border transition-all active:scale-[0.98]"
              >
                <Info className="w-5 h-5" /> More Details
              </button>
              <button 
                onClick={() => {
                  handleClose();
                  navigate('/quotations');
                }} 
                className="w-full mt-2 text-muted-foreground font-semibold py-2 hover:text-foreground"
              >
                Later
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}