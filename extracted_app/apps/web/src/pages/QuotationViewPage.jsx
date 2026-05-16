import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { formatINR } from '@/lib/currencyUtils';
import { Calendar, Phone, MapPin, Package, Instagram, Download, Check, X, Mail, AlertCircle, ArrowLeft, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateQuotationPDF } from '@/lib/pdfGenerator';
import { formatPhoneNumber, generateWhatsAppURL } from '@/lib/quotationUtils';
import { motion } from 'framer-motion';

const QuotationViewPage = () => {
  const { shortId } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchQuotation();
  }, [shortId]);

  const fetchQuotation = async () => {
    try {
      const record = await pb.collection('quotations').getFirstListItem(`short_id="${shortId}" || id="${shortId}"`, {
        expand: 'customer,selectedPackage,user_id',
        $autoCancel: false
      });
      setQuotation(record);
    } catch (err) {
      if (err.status === 404 || err.status === 403) {
        setError('Quotation not found. If this is a public link, the database view rules may restrict public access.');
      } else {
        setError('An error occurred while loading the quotation.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this quotation as ${newStatus}?`)) return;
    
    setIsUpdating(true);
    try {
      await pb.collection('quotations').update(quotation.id, { status: newStatus }, { $autoCancel: false });
      setQuotation({ ...quotation, status: newStatus });
      
      if (newStatus === 'accepted') {
        toast.success('Quotation marked as accepted.');
      } else if (newStatus === 'rejected') {
        toast.success('Quotation marked as rejected.');
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      const customer = quotation.expand?.customer || { name: 'Customer', phone: '' };
      const doc = generateQuotationPDF(quotation, customer, null);
      doc.save(`Quotation_${quotation.quotationNumber}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleShareWhatsApp = async () => {
    const phone = quotation.expand?.customer?.phone || quotation.phone;
    if (!phone) {
      toast.error('No phone number available for this customer');
      return;
    }

    // Open window synchronously to avoid Safari popup blocker
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      toast.error('Pop-up blocked! Please allow pop-ups to share via WhatsApp.');
      return;
    }
    
    newWindow.document.write('<div style="font-family:sans-serif;padding:20px;text-align:center;">Preparing WhatsApp message...</div>');

    try {
      const waUrl = await generateWhatsAppURL(pb, quotation, formatPhoneNumber(phone));
      
      const updateData = {
        shared_date: new Date().toISOString().split('T')[0]
      };
      
      if (quotation.status === 'draft') {
        updateData.status = 'sent';
      }
      
      await pb.collection('quotations').update(quotation.id, updateData, { $autoCancel: false });
      
      if (quotation.status === 'draft') {
        setQuotation({ ...quotation, status: 'sent' });
      }
      
      newWindow.location.href = waUrl;
    } catch(err) {
      console.error(err);
      newWindow.close();
      toast.error('Failed to prepare WhatsApp message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-muted-foreground animate-pulse">Loading Document...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-muted/20 p-4">
        <div className="bg-card p-8 rounded-3xl shadow-lg border border-border max-w-md w-full text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3 tracking-tight">Access Denied</h2>
          <p className="text-sm font-medium text-muted-foreground mb-6 leading-relaxed">{error}</p>
          <Link to="/quotations" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalAmount = quotation.totalAmount || 0;
  const lineItems = quotation.lineItems || {};
  const groups = Array.isArray(lineItems) ? lineItems : (lineItems.groups || []);
  const baseAmount = parseFloat(lineItems.baseAmount) || 0;
  const discount = lineItems.discount || { type: 'fixed', value: 0 };
  let adjustmentObj = lineItems.adjustment || { value: 0, heading: 'Adjustment' };
  
  if (typeof adjustmentObj === 'number') {
    adjustmentObj = { value: adjustmentObj, heading: 'Adjustment' };
  }

  let subtotal = 0;
  groups.forEach(group => {
    if (group && Array.isArray(group.items)) {
      group.items.forEach(item => {
        if (item && typeof item.price === 'number' && typeof item.quantity === 'number') {
          subtotal += (item.price * item.quantity);
        }
      });
    }
  });

  const totalBeforeDiscount = subtotal + baseAmount;
  let discountAmt = 0;
  if (discount.type === 'percentage') {
    discountAmt = totalBeforeDiscount * ((parseFloat(discount.value) || 0) / 100);
  } else {
    discountAmt = parseFloat(discount.value) || 0;
  }
  
  const adjustmentAmt = parseFloat(adjustmentObj.value) || 0;

  const isActionDisabled = quotation.status === 'accepted' || quotation.status === 'rejected' || quotation.status === 'cancelled';
  
  const photographer = quotation.expand?.user_id;
  const businessName = photographer?.business_name || photographer?.name || 'Pixora Studio';

  return (
    <div className="min-h-[100dvh] bg-background pb-20 relative font-sans">
      <Helmet>
        <title>Quotation #{quotation.quotationNumber} - {businessName}</title>
      </Helmet>

      <header className="bg-card/95 backdrop-blur-md border-b border-border py-6 px-4 shadow-sm sticky top-0 z-40 transition-all">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{businessName}</h1>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm font-bold text-muted-foreground">
            {photographer?.phone && (
              <a href={`tel:${photographer.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Phone className="w-3.5 h-3.5" /> {photographer.phone}
              </a>
            )}
            {photographer?.email && (
              <a href={`mailto:${photographer.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Mail className="w-3.5 h-3.5" /> {photographer.email}
              </a>
            )}
            {photographer?.instagramProfile && (
              <a href={`https://instagram.com/${photographer.instagramProfile.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Instagram className="w-3.5 h-3.5" /> {photographer.instagramProfile}
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <button 
            onClick={() => handleStatusUpdate('rejected')} 
            disabled={isActionDisabled || isUpdating}
            className="flex flex-col items-center justify-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
          >
            <X className="w-5 h-5" /> <span className="text-[10px] sm:text-xs uppercase tracking-wider">Reject</span>
          </button>
          <button 
            onClick={() => handleStatusUpdate('accepted')} 
            disabled={isActionDisabled || isUpdating}
            className="flex flex-col items-center justify-center gap-2 bg-[#e6f4ea] text-[#1e8e3e] border border-[#ceead6] hover:bg-[#ceead6] py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
          >
            <Check className="w-5 h-5" /> <span className="text-[10px] sm:text-xs uppercase tracking-wider">Accept</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex flex-col items-center justify-center gap-2 bg-primary text-primary-foreground border border-transparent hover:bg-primary/90 py-3 rounded-xl font-bold transition-all shadow-md active:scale-[0.98]"
          >
            <Download className="w-5 h-5" /> <span className="text-[10px] sm:text-xs uppercase tracking-wider">PDF</span>
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 mt-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border space-y-10"
        >
          
          {quotation.status !== 'draft' && quotation.status !== 'sent' && quotation.status !== 'pending' && (
            <div className={`p-3 rounded-xl text-center font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 ${
              quotation.status === 'accepted' ? 'bg-[#e6f4ea] text-[#1e8e3e] border border-[#ceead6]' : 
              quotation.status === 'rejected' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-muted text-muted-foreground border border-border'
            }`}>
              {quotation.status === 'accepted' && <Check className="w-4 h-4" />}
              {quotation.status === 'rejected' && <X className="w-4 h-4" />}
              Quotation {quotation.status}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2 tracking-tight leading-tight">{quotation.eventName || 'Event Quotation'}</h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted inline-block px-2.5 py-1 rounded-md">REF: {quotation.quotationNumber}</p>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-muted/50 rounded-xl text-muted-foreground border border-border/50">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Event Location</p>
                    <p className="text-sm font-bold text-foreground">{quotation.location || 'Location to be decided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-muted/50 rounded-xl text-muted-foreground border border-border/50">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Event Schedule</p>
                    <div className="flex flex-col gap-1.5">
                      {quotation.eventDays && quotation.eventDays.length > 0 ? (
                        quotation.eventDays.map((d, i) => (
                          <span key={i} className="text-sm font-bold text-foreground flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                            {d.name}: {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm font-bold text-foreground">{new Date(quotation.eventDate).toLocaleDateString() || 'Date to be decided'}</span>
                      )}
                    </div>
                  </div>
                </div>
                {quotation.expand?.selectedPackage && (
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Selected Package</p>
                      <p className="text-sm font-black text-foreground">{quotation.expand.selectedPackage.packageName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/20 p-6 sm:p-8 rounded-3xl border border-border/50 h-fit">
              <h3 className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-4 border-b border-border pb-3">Client Information</h3>
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl shrink-0">
                    {quotation.expand?.customer?.name?.charAt(0) || 'C'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-black text-foreground truncate">{quotation.expand?.customer?.name || 'Unknown Client'}</p>
                    {quotation.expand?.customer?.phone && (
                      <p className="text-sm font-medium text-muted-foreground mt-0.5 truncate">{quotation.expand.customer.phone}</p>
                    )}
                  </div>
                </div>
                {quotation.expand?.customer?.address && (
                  <div className="flex items-start gap-3 pt-4 border-t border-border/50">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-muted-foreground leading-relaxed">{quotation.expand.customer.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/50">
            <h3 className="text-xl font-black text-foreground mb-6 tracking-tight">Investment Overview</h3>
            <div className="space-y-5">
              {groups.map((group, gIndex) => (
                <div key={gIndex} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="bg-muted/40 px-5 py-3 border-b border-border">
                    <h4 className="font-bold text-foreground text-[10px] uppercase tracking-widest">{group.groupTitle}</h4>
                  </div>
                  <div className="divide-y divide-border">
                    {group.items?.map((item, iIndex) => (
                      <div key={iIndex} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                        <div className="flex-1">
                          <p className="text-sm sm:text-base font-bold text-foreground leading-tight">{item.itemName}</p>
                          {item.description && <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.description}</p>}
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2.5 py-1 rounded-md">Qty: {item.quantity}</span>
                          <span className="text-base font-black text-foreground">{formatINR(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <div className="w-full sm:w-[360px] space-y-3 bg-muted/20 p-6 rounded-2xl border border-border">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-muted-foreground">Base Package</span>
                  <span className="text-foreground">{formatINR(baseAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-muted-foreground">Additional Items</span>
                  <span className="text-foreground">{formatINR(subtotal)}</span>
                </div>
                
                {discountAmt > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'Fixed'})</span>
                    <span className="font-bold text-destructive">
                      -{formatINR(discountAmt)}
                    </span>
                  </div>
                )}
                {adjustmentAmt !== 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{adjustmentObj.heading || 'Adjustment'}</span>
                    <span className="font-medium text-foreground">{formatINR(adjustmentAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-border">
                  <span className="text-sm font-black text-foreground uppercase tracking-widest">Final Total</span>
                  <span className="text-xl font-black text-primary">{formatINR(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {quotation.termsAndConditions && (
            <div className="pt-8 border-t border-border/50">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Terms & Conditions</h3>
              <div className="bg-muted/10 p-6 rounded-2xl border border-border">
                <p className="text-sm font-medium text-foreground/90 whitespace-pre-wrap leading-relaxed">{quotation.termsAndConditions}</p>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <footer className="mt-12 text-center pb-8">
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Powered by Pixora Studio</p>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <button 
        onClick={handleShareWhatsApp}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#20bd5a] px-4 py-4 md:px-6 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all active:scale-95"
        aria-label="Share on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden md:inline text-sm">Share via WhatsApp</span>
      </button>
    </div>
  );
};

export default QuotationViewPage;