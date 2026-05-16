import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatINR } from '@/lib/currencyUtils';
import { formatPhoneNumber, generateWhatsAppURL } from '@/lib/quotationUtils';
import { generateQuotationPDF } from '@/lib/pdfGenerator';
import { Calendar, User, Phone, MapPin, Package, ExternalLink, Download, MessageCircle, CheckCircle, XCircle, Edit2, Save, X, Send } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const ViewQuotationModal = ({ open, onOpenChange, quotation, onUpdate }) => {
  const [settings, setSettings] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (open) {
      pb.collection('settings').getFullList({ $autoCancel: false })
        .then(res => {
          if (res.length > 0) setSettings(res[0]);
        })
        .catch(console.error);
        
      if (quotation) {
        setEditData({
          eventName: quotation.eventName || '',
          location: quotation.location || '',
          termsAndConditions: quotation.termsAndConditions || '',
          adjustmentHeading: quotation.lineItems?.adjustment?.heading || 'Adjustment',
          adjustmentValue: quotation.lineItems?.adjustment?.value || 0,
          discountType: quotation.lineItems?.discount?.type || 'fixed',
          discountValue: quotation.lineItems?.discount?.value || 0,
        });
      }
      setIsEditing(false);
    }
  }, [open, quotation]);

  if (!quotation) return null;

  const handleStatusUpdate = async (newStatus) => {
    setIsPublishing(true);
    try {
      await pb.collection('quotations').update(quotation.id, { status: newStatus }, { $autoCancel: false });
      toast.success(`Quotation marked as ${newStatus}`);
      if (onUpdate) onUpdate();
      if (newStatus === 'accepted' || newStatus === 'rejected') {
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      let subtotal = 0;
      const lineItems = quotation.lineItems || {};
      const groups = Array.isArray(lineItems) ? lineItems : (lineItems.groups || []);
      
      groups.forEach(group => {
        if (group && Array.isArray(group.items)) {
          group.items.forEach(item => {
            if (item && typeof item.price === 'number' && typeof item.quantity === 'number') {
              subtotal += (item.price * item.quantity);
            }
          });
        }
      });

      const baseAmount = lineItems.baseAmount || 0;
      const totalBeforeDiscount = subtotal + baseAmount;
      
      let discountAmt = 0;
      const dVal = parseFloat(editData.discountValue) || 0;
      if (editData.discountType === 'percentage') {
        discountAmt = totalBeforeDiscount * (dVal / 100);
      } else {
        discountAmt = dVal;
      }
      
      const adjAmt = parseFloat(editData.adjustmentValue) || 0;
      const newTotal = totalBeforeDiscount - discountAmt + adjAmt;

      const updatedLineItems = {
        ...lineItems,
        discount: { type: editData.discountType, value: dVal },
        adjustment: { heading: editData.adjustmentHeading, value: adjAmt }
      };

      await pb.collection('quotations').update(quotation.id, {
        eventName: editData.eventName,
        location: editData.location,
        termsAndConditions: editData.termsAndConditions,
        lineItems: updatedLineItems,
        totalAmount: newTotal
      }, { $autoCancel: false });

      toast.success('Quotation updated successfully');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update quotation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhatsAppShare = async () => {
    const customerPhone = quotation.expand?.customer?.phone || quotation.phone;
    if (!customerPhone) {
      toast.error('Customer phone number not found');
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
      const waUrl = await generateWhatsAppURL(pb, quotation, formatPhoneNumber(customerPhone));
      
      const updateData = {
        shared_date: new Date().toISOString().split('T')[0]
      };
      
      if (quotation.status === 'draft') {
        updateData.status = 'sent';
      }
      
      await pb.collection('quotations').update(quotation.id, updateData, { $autoCancel: false });
      
      if (quotation.status === 'draft' && onUpdate) {
        onUpdate();
      }
      
      newWindow.location.href = waUrl;
    } catch (err) {
      console.error(err);
      newWindow.close();
      toast.error('Failed to prepare WhatsApp message');
    }
  };

  const handleViewQuotation = () => {
    const url = `${window.location.origin}/q/${quotation.short_id || quotation.id}`;
    window.open(url, '_blank');
  };

  const handleDownloadPDF = () => {
    try {
      const customer = quotation.expand?.customer || { name: 'Customer', phone: '' };
      const doc = generateQuotationPDF(quotation, customer, settings);
      doc.save(`Quotation_${quotation.quotationNumber}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const totalAmount = quotation.totalAmount || 0;
  const adjustment = quotation.lineItems?.adjustment?.value || 0;
  const adjustmentHeading = quotation.lineItems?.adjustment?.heading || 'Adjustment';
  const discount = quotation.lineItems?.discount || { type: 'fixed', value: 0 };
  
  let lineItems = [];
  if (quotation.lineItems) {
    if (Array.isArray(quotation.lineItems)) {
      lineItems = quotation.lineItems;
    } else if (quotation.lineItems.groups && Array.isArray(quotation.lineItems.groups)) {
      lineItems = quotation.lineItems.groups;
    }
  }
  
  let subtotal = 0;
  if (Array.isArray(lineItems)) {
    lineItems.forEach(group => {
      if (group && Array.isArray(group.items)) {
        group.items.forEach(item => {
          if (item && typeof item.price === 'number' && typeof item.quantity === 'number') {
            subtotal += (item.price * item.quantity);
          }
        });
      }
    });
  }
  
  const baseAmount = quotation.lineItems?.baseAmount || 0;

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-[#10b981] text-white';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'pending':
      case 'sent': return 'bg-[#3b82f6] text-white';
      case 'cancelled': return 'bg-[#6b7280] text-white';
      default: return 'bg-[#6b7280] text-white';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] max-w-[900px] max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 bg-card border border-border shadow-xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start pb-5 border-b border-border gap-4">
          <div className="flex-1 w-full pr-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Ref: {quotation.quotationNumber}</p>
            {isEditing ? (
              <input 
                type="text"
                value={editData?.eventName || ''}
                onChange={(e) => setEditData({...editData, eventName: e.target.value})}
                className="text-xl font-black text-foreground w-full border-b border-border focus:border-primary outline-none bg-muted/30 px-2 py-1 rounded"
                placeholder="Event Name"
              />
            ) : (
              <h2 className="text-xl font-black text-foreground tracking-tight">{quotation.eventName || quotation.location || 'Quotation Details'}</h2>
            )}
          </div>
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3">
            <div className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${getStatusColor(quotation.status)}`}>
              {quotation.status}
            </div>
            {!isEditing && quotation.status !== 'accepted' && quotation.status !== 'rejected' && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-xs text-primary font-bold flex items-center gap-1.5 hover:underline"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Details
              </button>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="py-5 border-b border-border">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Client & Event Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-5 rounded-2xl border border-border/50">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Customer Name</p>
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                {quotation.expand?.customer?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Phone Number</p>
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {quotation.expand?.customer?.phone || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Event Location</p>
              {isEditing ? (
                <input 
                  type="text"
                  value={editData?.location || ''}
                  onChange={(e) => setEditData({...editData, location: e.target.value})}
                  className="text-sm font-medium text-foreground w-full border border-border focus:border-primary outline-none bg-background px-3 py-2 rounded-lg"
                  placeholder="Location"
                />
              ) : (
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {quotation.location || 'Not specified'}
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Event Dates</p>
              <p className="text-sm font-bold text-foreground flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="flex flex-col gap-1">
                  {quotation.eventDays && quotation.eventDays.length > 0 
                    ? quotation.eventDays.map((d, i) => <span key={i}>{d.name}: {new Date(d.date).toLocaleDateString()}</span>)
                    : (quotation.eventDate ? new Date(quotation.eventDate).toLocaleDateString() : 'Not specified')}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="py-5 border-b border-border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Included Package & Items</h3>
            {isEditing && <span className="text-[10px] text-muted-foreground italic">Items cannot be edited here.</span>}
          </div>
          
          {quotation.expand?.selectedPackage && (
            <div className="mb-5 bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-center gap-3">
              <Package className="w-5 h-5 text-primary" />
              <div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Selected Package</p>
                <p className="text-sm font-black text-foreground">{quotation.expand.selectedPackage.packageName}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {Array.isArray(lineItems) && lineItems.length > 0 ? (
              lineItems.map((group, gIndex) => (
                <div key={gIndex} className="overflow-hidden border border-border rounded-xl bg-card">
                  <h4 className="text-[10px] font-bold text-foreground bg-muted/40 px-4 py-2 uppercase tracking-wider border-b border-border">
                    {group?.groupTitle || 'Items'}
                  </h4>
                  <div className="divide-y divide-border">
                    {Array.isArray(group?.items) && group.items.map((item, iIndex) => (
                      <div key={iIndex} className="flex justify-between items-start p-4 hover:bg-muted/10 transition-colors">
                        <div className="pr-4">
                          <p className="text-sm font-bold text-foreground leading-tight">{item?.itemName || 'Unknown Item'}</p>
                          {item?.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 bg-muted inline-block px-1.5 py-0.5 rounded">Qty: {item?.quantity || 0}</p>
                          <p className="text-sm font-black text-foreground">{formatINR((item?.price || 0) * (item?.quantity || 0))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-muted-foreground text-center py-4 bg-muted/20 rounded-xl">No items found in this quotation.</p>
            )}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="py-5 border-b border-border">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Pricing Summary</h3>
          <div className="w-full md:w-1/2 ml-auto space-y-3 bg-muted/10 p-5 rounded-xl border border-border">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted-foreground">Base Amount</span>
              <span className="text-sm font-bold text-foreground">{formatINR(baseAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted-foreground">Items Total</span>
              <span className="text-sm font-bold text-foreground">{formatINR(subtotal)}</span>
            </div>
            
            {isEditing ? (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Discount</label>
                  <div className="flex items-center gap-2">
                    <select 
                      value={editData.discountType}
                      onChange={(e) => setEditData({...editData, discountType: e.target.value})}
                      className="text-sm font-medium border border-border rounded-lg px-3 py-2 outline-none bg-background text-foreground flex-1"
                    >
                      <option value="fixed">Fixed Amount</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                    <input 
                      type="number"
                      value={editData.discountValue}
                      onChange={(e) => setEditData({...editData, discountValue: e.target.value})}
                      className="text-sm font-bold text-destructive text-right border border-border rounded-lg px-3 py-2 w-24 outline-none bg-background"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Adjustment</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      value={editData.adjustmentHeading}
                      onChange={(e) => setEditData({...editData, adjustmentHeading: e.target.value})}
                      className="text-sm font-medium border border-border rounded-lg px-3 py-2 outline-none flex-1 bg-background text-foreground"
                      placeholder="Heading"
                    />
                    <input 
                      type="number"
                      value={editData.adjustmentValue}
                      onChange={(e) => setEditData({...editData, adjustmentValue: e.target.value})}
                      className="text-sm font-bold text-foreground text-right border border-border rounded-lg px-3 py-2 w-24 outline-none bg-background"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {discount.value > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'Fixed'})</span>
                    <span className="text-sm font-bold text-destructive">
                      -{discount.type === 'percentage' ? 'Applied' : formatINR(discount.value)}
                    </span>
                  </div>
                )}
                {adjustment !== 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">{adjustmentHeading}</span>
                    <span className="text-sm font-bold text-foreground">{formatINR(adjustment)}</span>
                  </div>
                )}
              </>
            )}
            
            <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-border">
              <span className="text-sm font-black text-foreground uppercase tracking-widest">Total Amount</span>
              <span className="text-xl font-black text-primary">
                {isEditing ? 'Calculated on save' : formatINR(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="py-5">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Terms & Conditions</h3>
          {isEditing ? (
            <textarea 
              value={editData?.termsAndConditions || ''}
              onChange={(e) => setEditData({...editData, termsAndConditions: e.target.value})}
              className="w-full min-h-[120px] text-sm text-foreground border border-border rounded-xl p-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-background resize-y"
              placeholder="Enter terms and conditions..."
            />
          ) : (
            quotation.termsAndConditions && (
              <div className="bg-muted/20 p-5 rounded-xl border border-border">
                <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {quotation.termsAndConditions}
                </p>
              </div>
            )
          )}
        </div>

        {/* Actions */}
        <div className="pt-6 flex flex-col md:flex-row flex-wrap gap-3 justify-end bg-card sticky bottom-0 border-t border-border -mx-6 -mb-6 px-6 py-5">
          {isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(false)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-muted text-foreground text-sm font-bold border border-border hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm disabled:opacity-70"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              {quotation.status === 'draft' && (
                <button 
                  onClick={() => handleStatusUpdate('sent')}
                  disabled={isPublishing}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm disabled:opacity-70"
                >
                  <Send className="w-4 h-4" /> {isPublishing ? 'Publishing...' : 'Publish'}
                </button>
              )}

              <button 
                onClick={handleViewQuotation}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-bold border border-border hover:bg-muted/80 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Link
              </button>
              
              <button 
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-bold border border-border hover:bg-muted/80 transition-colors"
              >
                <Download className="w-4 h-4" /> PDF
              </button>

              <button 
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#20bd5a] transition-all active:scale-[0.98] shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-white" /> WhatsApp
              </button>

              {quotation.status !== 'accepted' && (
                <button 
                  onClick={() => handleStatusUpdate('accepted')}
                  disabled={isPublishing}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#e6f4ea] text-[#1e8e3e] text-sm font-bold hover:bg-[#ceead6] transition-all border border-[#ceead6] active:scale-[0.98]"
                >
                  <CheckCircle className="w-4 h-4" /> Accept
                </button>
              )}

              {quotation.status !== 'rejected' && (
                <button 
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={isPublishing}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-bold hover:bg-destructive/20 transition-all border border-destructive/20 active:scale-[0.98]"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              )}

              <button 
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-center px-5 py-2.5 rounded-xl bg-muted text-foreground text-sm font-bold border border-border hover:bg-muted/80 transition-colors md:ml-auto"
              >
                Close
              </button>
            </>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default ViewQuotationModal;