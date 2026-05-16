import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { ChevronRight, Check, MessageCircle, Download, ExternalLink } from 'lucide-react';
import { formatINR } from '@/lib/currencyUtils.js';
import { formatPhoneNumber, generateWhatsAppURL, formatWhatsAppMessage, calculateQuotationTotal } from '@/lib/quotationUtils.js';
import { generateQuotationPDF } from '@/lib/pdfGenerator.js';
import Step3SelectPackageReview from '@/components/m3/Step3SelectPackageReview.jsx';

const GuidedQuotationFlow = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [showDateError, setShowDateError] = useState(false);
  const [createdQuotation, setCreatedQuotation] = useState(null);
  const [settings, setSettings] = useState(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    countryCode: '91',
    customerPhone: '',
    customerAddress: '',
    eventDate: '',
    eventName: '',
    location: ''
  });

  const [quotationData, setQuotationData] = useState({
    selectedPackage_universal: '',
    selectedTermId: '',
    termsAndConditions: '',
    lineItems: {
      baseAmount: 0,
      groups: [],
      discount: { type: 'fixed', value: 0 },
      adjustment: { heading: 'Adjustment', value: 0 }
    }
  });

  useEffect(() => {
    const fetchPackagesAndSettings = async () => {
      try {
        const [userPkgs, universalPkgs, uniItems, userItems, settingsRes] = await Promise.all([
          pb.collection('packages').getList(1, 50, {
            filter: `user_id="${pb.authStore.model.id}"`,
            $autoCancel: false
          }),
          pb.collection('universal_packages').getList(1, 50, {
            $autoCancel: false
          }),
          pb.collection('universal_items').getFullList({
            $autoCancel: false
          }),
          pb.collection('items').getFullList({
            $autoCancel: false
          }).catch(() => []),
          pb.collection('settings').getFullList({ $autoCancel: false })
        ]);
        
        if (settingsRes.length > 0) {
          setSettings(settingsRes[0]);
        }

        const formattedUniversal = universalPkgs.items.map(p => ({ ...p, isUniversal: true }));
        setPackages([...userPkgs.items, ...formattedUniversal]);
        setAllItems([...userItems, ...uniItems]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchPackagesAndSettings();
  }, []);

  useEffect(() => {
    if (step === 3) {
      setQuotationData(prev => ({
        ...prev,
        customerName: formData.customerName,
        countryCode: formData.countryCode,
        customerPhone: formData.customerPhone,
        eventName: formData.eventName,
        location: formData.location,
        eventDays: [{ name: formData.eventName, date: formData.eventDate }]
      }));
    }
  }, [step, formData]);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.customerName) {
        toast.error('Please enter customer name');
        return;
      }
      if (!formData.customerPhone || !/^\d{10}$/.test(formData.customerPhone)) {
        toast.error('Please enter a valid 10-digit mobile number');
        return;
      }
      if (!formData.countryCode) {
        toast.error('Please enter a valid country code');
        return;
      }
    }
    if (step === 2) {
      if (!formData.eventDate) {
        setShowDateError(true);
        return;
      }
      if (!formData.eventName) {
        toast.error('Please enter event name');
        return;
      }
    }
    
    setShowDateError(false);
    setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step === 1) onCancel();
    else setStep(s => s - 1);
  };

  // Accepts payload directly from Step3SelectPackageReview to maintain consistency with normal flow
  const handleCreate = async (status, action, step3Payload) => {
    setLoading(true);
    try {
      const fullPhone = `+${formData.countryCode.replace('+', '')}${formData.customerPhone}`;
      
      let customerId;
      try {
        const existingCustomer = await pb.collection('customers').getFirstListItem(
          `phone="${fullPhone}" && user_id="${pb.authStore.model.id}"`, 
          { $autoCancel: false }
        );
        customerId = existingCustomer.id;
      } catch (err) {
        const newCustomer = await pb.collection('customers').create({
          name: formData.customerName,
          phone: fullPhone,
          address: formData.customerAddress,
          user_id: pb.authStore.model.id
        }, { $autoCancel: false });
        customerId = newCustomer.id;
      }

      const quotationNumber = `QT-${Date.now().toString().slice(-6)}`;
      
      const finalPayload = {
        ...step3Payload,
        quotationNumber,
        customer: customerId,
        status: 'draft',
        user_id: pb.authStore.model.id
      };

      const quotation = await pb.collection('quotations').create(finalPayload, { $autoCancel: false });

      const expandedQuotation = await pb.collection('quotations').getOne(quotation.id, {
        expand: 'customer,selectedPackage,selectedPackage_universal',
        $autoCancel: false
      });

      setCreatedQuotation(expandedQuotation);
      setStep(4); 
      toast.success('Quotation created successfully!');
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast.error('Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!createdQuotation) return;
    const customerPhone = createdQuotation.expand?.customer?.phone;
    if (!customerPhone) {
      toast.error('Customer phone number not found');
      return;
    }

    const formattedPhone = formatPhoneNumber(customerPhone);
    const link = `${window.location.origin}/q/${createdQuotation.short_id || createdQuotation.id}`;
    
    const msgData = {
      CustomerName: createdQuotation.expand?.customer?.name,
      EventName: createdQuotation.eventName,
      EventDate: createdQuotation.eventDays?.length > 0 ? createdQuotation.eventDays[0].date : '',
      QuotationNumber: createdQuotation.quotationNumber,
      TotalAmount: createdQuotation.totalAmount,
      QuotationLink: link
    };
    
    const template = settings?.whatsappMessageTemplate || '';
    const text = formatWhatsAppMessage(template, msgData);
    const waUrl = generateWhatsAppURL(formattedPhone, text);
    window.open(waUrl, '_blank');
  };

  const handleDownloadPDF = () => {
    if (!createdQuotation) return;
    try {
      const customer = createdQuotation.expand?.customer;
      const doc = generateQuotationPDF(createdQuotation, customer, settings);
      doc.save(`Quotation_${createdQuotation.quotationNumber}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4 flex flex-col animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
        
        {step < 4 && (
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {step > i ? <Check className="w-4 h-4" /> : i}
                </div>
                {i < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full ${step > i ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold text-foreground">Customer Details</h3>
            <p className="text-[18px] text-muted-foreground mb-2">Enter the details of your customer.</p>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name *</label>
              <input 
                type="text" 
                value={formData.customerName}
                onChange={e => setFormData({...formData, customerName: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. John Doe"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="w-[80px]">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Code *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">+</span>
                  <input 
                    type="text" 
                    maxLength={3}
                    value={formData.countryCode}
                    onChange={e => setFormData({...formData, countryCode: e.target.value.replace(/\D/g, '')})}
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-2 py-3 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="91"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Mobile Number *</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={formData.customerPhone}
                  onChange={e => setFormData({...formData, customerPhone: e.target.value.replace(/\D/g, '')})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Address (Optional)</label>
              <input 
                type="text" 
                value={formData.customerAddress}
                onChange={e => setFormData({...formData, customerAddress: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="City, State"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold text-foreground">Event Details</h3>
            <p className="text-[18px] text-muted-foreground mb-2">Enter the event information.</p>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Event Name *</label>
              <input 
                type="text" 
                value={formData.eventName}
                onChange={e => setFormData({...formData, eventName: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. Sarah & John's Wedding"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Event Date *</label>
              <input 
                type="date" 
                value={formData.eventDate}
                onChange={e => {
                  setFormData({...formData, eventDate: e.target.value});
                  setShowDateError(false);
                }}
                className={`w-full border rounded-xl px-4 py-3 text-foreground focus:ring-1 outline-none ${showDateError ? 'border-destructive focus:border-destructive focus:ring-destructive' : 'border-gray-200 focus:border-primary focus:ring-primary'}`}
              />
              {showDateError && (
                <p className="text-sm text-destructive mt-1">Event date is required to proceed.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Location (Optional)</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. New Delhi"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <Step3SelectPackageReview
              data={quotationData}
              updateData={(newData) => setQuotationData({ ...quotationData, ...newData })}
              onBack={handleBack}
              onSave={handleCreate}
              packages={packages}
              allItems={allItems}
              customers={[]}
              loading={loading}
            />
          </div>
        )}

        {step === 4 && createdQuotation && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground mb-2">Quotation Created!</h3>
              <p className="text-[18px] text-muted-foreground">Your quotation has been saved successfully.</p>
            </div>

            <div className="w-full bg-muted/30 rounded-xl p-4 border border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Customer</span>
                <span className="text-sm font-bold text-foreground">{createdQuotation.expand?.customer?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Event</span>
                <span className="text-sm font-bold text-foreground">{createdQuotation.eventName}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-sm font-bold text-foreground">Total Amount</span>
                <span className="text-lg font-bold text-primary">{formatINR(createdQuotation.totalAmount)}</span>
              </div>
            </div>

            <div className="w-full space-y-3 mt-4">
              <button 
                onClick={handleWhatsAppShare}
                className="w-full py-4 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[18px]"
              >
                <MessageCircle className="w-5 h-5" /> Share on WhatsApp
              </button>
              
              <button 
                onClick={handleDownloadPDF}
                className="w-full py-4 rounded-xl font-bold text-foreground bg-muted hover:bg-muted/80 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[18px]"
              >
                <Download className="w-5 h-5" /> Download PDF
              </button>

              <button 
                onClick={() => {
                  onSuccess(createdQuotation);
                }}
                className="w-full py-4 rounded-xl font-bold text-primary hover:bg-primary/5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[18px]"
              >
                <ExternalLink className="w-5 h-5" /> View Quotation
              </button>
            </div>
          </div>
        )}

        {step < 4 && step !== 3 && (
          <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
            <button 
              onClick={handleBack}
              className="flex-1 py-4 rounded-xl font-bold text-muted-foreground bg-muted hover:bg-muted/80 transition-all active:scale-[0.98] text-[18px]"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button 
              onClick={handleNext}
              disabled={loading}
              className="flex-1 py-4 rounded-xl font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-[18px]"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default GuidedQuotationFlow;