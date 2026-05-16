import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { formatINR } from '@/lib/currencyUtils';
import { generateQuotationPDF } from '@/lib/pdfGenerator';
import { Calendar, User, Phone, MapPin, Download, Check, X, AlertCircle, ArrowRight, FileText, MessageCircle, Mail, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { generateWhatsAppURL } from '@/lib/quotationUtils';
import { motion } from 'framer-motion';

const QuotationLinkPage = () => {
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
      console.error("Error fetching quotation:", err);
      if (err.status === 404 || err.status === 403) {
        setError('Quotation not found. The link may have expired or you might not have permission to view it.');
      } else {
        setError('An unexpected error occurred while loading the document. Please try again later.');
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
        toast.success('Quotation accepted! The photographer will contact you soon.');
      } else if (newStatus === 'rejected') {
        toast.success('Quotation rejected. Thank you for considering.');
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error('Failed to update status. Please try contacting the photographer directly.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      const customer = quotation.expand?.customer || { name: quotation.customer_name || 'Customer', phone: quotation.phone || '' };
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
      const url = await generateWhatsAppURL(pb, quotation, phone);
      newWindow.location.href = url;
    } catch(err) {
      newWindow.close();
      toast.error('Failed to prepare WhatsApp message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col gap-4 items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Retrieving document...</p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-muted/20 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card p-10 rounded-3xl shadow-xl border border-border max-w-lg w-full text-center"
        >
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3 tracking-tight">Link Unavailable</h2>
          <p className="text-sm font-medium text-muted-foreground mb-8 leading-relaxed px-4">{error}</p>
          <Link to="/" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]">
            Go to Homepage <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
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
  const clientName = quotation.customer_name || quotation.expand?.customer?.name || 'Valued Client';
  const clientPhone = quotation.phone || quotation.expand?.customer?.phone || '';

  return (
    <div className="min-h-[100dvh] bg-background pb-20 font-sans selection:bg-primary/20">
      <Helmet>
        <title>Quotation #{quotation.quotationNumber} - {businessName}</title>
      </Helmet>

      <header className="bg-card border-b border-border pt-5 pb-5 px-4 shadow-sm relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 flex items-center gap-4 text-left">
          
          {photographer?.avatar ? (
            <img src={pb.files.getUrl(photographer, photographer.avatar)} alt={businessName} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-sm border border-border flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl sm:text-2xl flex-shrink-0">
              {businessName.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight truncate leading-tight mb-1">{businessName}</h1>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm font-bold text-muted-foreground">
              {photographer?.phone && (
                <div className="flex items-center gap-1.5 shrink-0"><Phone className="w-3.5 h-3.5" /> {photographer.phone}</div>
              )}
              {photographer?.email && (
                <div className="flex items-center gap-1.5 shrink-0"><Mail className="w-3.5 h-3.5" /> <span className="truncate max-w-[120px] sm:max-w-xs">{photographer.email}</span></div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex flex-wrap justify-center sm:justify-start gap-3">
          <button 
            onClick={() => handleStatusUpdate('rejected')} 
            disabled={isActionDisabled || isUpdating}
            className="flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
          >
            <X className="w-4 h-4" /> <span className="text-xs uppercase tracking-wider">Decline</span>
          </button>
          <button 
            onClick={() => handleStatusUpdate('accepted')} 
            disabled={isActionDisabled || isUpdating}
            className="flex items-center justify-center gap-1.5 bg-[#e6f4ea] text-[#1e8e3e] border border-[#ceead6] hover:bg-[#ceead6] px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
          >
            <Check className="w-4 h-4" /> <span className="text-xs uppercase tracking-wider">Accept</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-[0.98] shadow-sm"
          >
            <Download className="w-4 h-4" /> <span className="text-xs uppercase tracking-wider">PDF</span>
          </button>
          <button 
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-1.5 bg-[#25D366] text-white hover:bg-[#20bd5a] px-4 py-2.5 rounded-xl font-bold transition-all active:scale-[0.98] shadow-sm"
          >
            <MessageCircle className="w-4 h-4" /> <span className="text-xs uppercase tracking-wider">WhatsApp</span>
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 mt-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border space-y-8"
        >
          
          {quotation.status !== 'draft' && quotation.status !== 'sent' && quotation.status !== 'pending' && (
            <div className={`p-2.5 rounded-xl text-center font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-inner ${
              quotation.status === 'accepted' ? 'bg-[#e6f4ea] text-[#1e8e3e] border border-[#ceead6]' : 
              quotation.status === 'rejected' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-muted text-muted-foreground border border-border'
            }`}>
              {quotation.status === 'accepted' && <Check className="w-4 h-4" />}
              {quotation.status === 'rejected' && <X className="w-4 h-4" />}
              Quotation {quotation.status}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-muted/20 p-5 sm:p-6 rounded-2xl border border-border/50 relative">
              <div className="absolute top-5 right-5 bg-background border border-border px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
                REF: #{quotation.quotationNumber}
              </div>
              <h2 className="text-lg font-black text-foreground mb-4 tracking-tight">Event Details</h2>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Location</p>
                  <p className="text-sm font-black text-foreground">{quotation.location || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Schedule</p>
                  <div className="flex flex-col gap-1">
                    {quotation.eventDays && quotation.eventDays.length > 0 ? (
                      quotation.eventDays.map((d, i) => (
                        <span key={i} className="text-sm font-black text-foreground">
                          {d.name}: {new Date(d.date).toLocaleDateString()}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm font-black text-foreground">{new Date(quotation.eventDate).toLocaleDateString() || 'Not specified'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-primary/5 p-5 sm:p-6 rounded-2xl border border-primary/10">
              <h3 className="text-lg font-black text-foreground mb-4 tracking-tight">Prepared For</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-black text-foreground truncate">{clientName}</p>
                  {clientPhone && <p className="text-sm font-bold text-foreground/80 truncate mt-0.5">{clientPhone}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-lg font-black text-foreground mb-4 tracking-tight">Investment Summary</h3>
            <div className="space-y-4">
              {groups.map((group, gIndex) => (
                <div key={gIndex} className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="bg-muted/40 px-4 py-2 border-b border-border">
                    <h4 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{group.groupTitle}</h4>
                  </div>
                  <div className="divide-y divide-border">
                    {group.items?.map((item, iIndex) => (
                      <div key={iIndex} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10">
                        <div className="flex-1">
                          <p className="text-sm font-black text-foreground leading-tight">{item.itemName}</p>
                          {item.description && <p className="text-xs font-medium text-muted-foreground mt-1 leading-snug">{item.description}</p>}
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                          <span className="text-base font-black text-foreground">{formatINR(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-full sm:w-[320px] space-y-3 bg-muted/10 p-5 rounded-2xl border border-border">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-bold">Base Amount</span>
                  <span className="font-black text-foreground">{formatINR(baseAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-bold">Add-ons</span>
                  <span className="font-black text-foreground">{formatINR(subtotal)}</span>
                </div>
                {discountAmt > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-bold">Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'Fixed'})</span>
                    <span className="font-black text-destructive">-{formatINR(discountAmt)}</span>
                  </div>
                )}
                {adjustmentAmt !== 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-bold">{adjustmentObj.heading || 'Adjustment'}</span>
                    <span className="font-black text-foreground">{formatINR(adjustmentAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-border">
                  <span className="text-sm font-black text-foreground uppercase tracking-widest">Total</span>
                  <span className="text-xl font-black text-primary">{formatINR(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {quotation.termsAndConditions && (
            <div className="pt-6 border-t border-border">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Terms & Conditions
              </h3>
              <div className="bg-muted/10 p-5 rounded-xl border border-border">
                <p className="text-xs font-medium text-foreground/90 whitespace-pre-wrap leading-relaxed">{quotation.termsAndConditions}</p>
              </div>
            </div>
          )}
        </motion.div>
      </main>
      
      <footer className="mt-10 text-center pb-8">
        <div className="inline-flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
          <Briefcase className="w-3.5 h-3.5" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Powered by Pixora Studio</p>
        </div>
      </footer>
    </div>
  );
};

export default QuotationLinkPage;