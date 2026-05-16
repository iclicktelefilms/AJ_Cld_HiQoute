import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import AppScaffold from '@/components/m3/AppScaffold';
import Step1BasicDetails from '@/components/m3/Step1BasicDetails';
import Step2EventDates from '@/components/m3/Step2EventDates';
import Step3SelectPackageReview from '@/components/m3/Step3SelectPackageReview';
import QuotationSuccessModal from '@/components/QuotationSuccessModal';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import { calculateQuotationTotal, generateShortQuotationId, generateQuotationNumber, generateWhatsAppURL } from '@/lib/quotationUtils';
import { getQuotationShareLink } from '@/lib/onboardingUtils';
import { generateQuotationPDF } from '@/lib/pdfGenerator';

const CreateQuotationPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState(null);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdQuotationDetails, setCreatedQuotationDetails] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    countryCode: '91',
    customerPhone: '',
    customerEmail: '',
    customer: null,
    eventName: '',
    location: '',
    eventDays: [],
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
    const fetchData = async () => {
      try {
        const currentUserId = pb.authStore.model?.id;
        if (!currentUserId) return;

        const [pkgs, items, custs, settingsRes] = await Promise.allSettled([
          pb.collection('packages').getFullList({
            filter: `user_id="${currentUserId}"`,
            $autoCancel: false
          }),
          pb.collection('items').getFullList({
            filter: `user_id="${currentUserId}"`,
            $autoCancel: false
          }),
          pb.collection('customers').getFullList({
            filter: `user_id="${currentUserId}"`,
            $autoCancel: false
          }),
          pb.collection('settings').getFullList({ $autoCancel: false })
        ]);

        if (pkgs.status === 'fulfilled') setPackages(pkgs.value);
        if (items.status === 'fulfilled') setAllItems(items.value);
        if (custs.status === 'fulfilled') setCustomers(custs.value);
        if (settingsRes.status === 'fulfilled' && settingsRes.value.length > 0) {
          setSettings(settingsRes.value[0]);
        }
      } catch (error) {
        console.error("Error fetching initial user data:", error);
      }
    };

    fetchData();
  }, []);

  const handleSave = async (status, action, payloadOverride = null) => {
    setLoading(true);
    try {
      const currentUserId = pb.authStore.model?.id;
      if (!currentUserId) {
        toast.error("User authentication error. Please log in again.");
        return;
      }

      let quotationPayload;

      // Auto-create customer if no customers exist and fields are provided
      if (customers.length === 0 && formData.customerName && formData.customerPhone) {
        try {
          const newCust = await pb.collection('customers').create({
            name: formData.customerName,
            phone: formData.customerPhone,
            user_id: currentUserId,
            is_deleted: false
          }, { $autoCancel: false });
          formData.customer = newCust.id;
        } catch (e) {
          console.error("Failed to auto-create customer:", e);
        }
      }

      if (payloadOverride) {
        quotationPayload = { ...payloadOverride };
        if (!quotationPayload.quotationNumber) {
          quotationPayload.quotationNumber = await generateQuotationNumber(pb);
        }
        if (!quotationPayload.short_id) {
          quotationPayload.short_id = generateShortQuotationId();
        }
      } else {
        const totalAmount = calculateQuotationTotal(formData.lineItems);
        const quotationNumber = await generateQuotationNumber(pb);
        const short_id = generateShortQuotationId();

        quotationPayload = {
          quotationNumber,
          customer_name: formData.customerName?.trim() || '',
          phone: formData.customerPhone?.trim() || '',
          email: formData.customerEmail?.trim() || '',
          eventName: formData.eventName?.trim() || formData.eventDays[0]?.name || 'Event',
          location: formData.location?.trim() || '',
          eventDate: new Date(formData.eventDays[0]?.date || new Date()).toISOString(),
          eventDays: formData.eventDays,
          lineItems: formData.lineItems,
          termsAndConditions: formData.termsAndConditions?.trim() || '',
          totalAmount: totalAmount,
          status: status,
          user_id: currentUserId,
          short_id: short_id
        };

        if (formData.customer && typeof formData.customer === 'string' && formData.customer.trim() !== '') {
          quotationPayload.customer = formData.customer;
        }
        
        if (formData.selectedPackage_universal && formData.selectedPackage_universal !== 'manual' && typeof formData.selectedPackage_universal === 'string' && formData.selectedPackage_universal.trim() !== '') {
          quotationPayload.selectedPackage_universal = formData.selectedPackage_universal;
        }
        
        if (pb.authStore.model?.plan_id) {
          quotationPayload.plan_id = pb.authStore.model.plan_id;
        }
      }

      const finalPayload = { ...quotationPayload };
      delete finalPayload.selectedPackage;
      
      if (!finalPayload.selectedPackage_universal || finalPayload.selectedPackage_universal === 'manual' || finalPayload.selectedPackage_universal.trim() === '') {
        delete finalPayload.selectedPackage_universal;
      }
      
      if (!finalPayload.customer || finalPayload.customer.trim() === '') {
        delete finalPayload.customer;
      }
      
      if (!finalPayload.plan_id || finalPayload.plan_id.trim() === '') {
        delete finalPayload.plan_id;
      }

      const createdQuotation = await pb.collection('quotations').create(finalPayload, { $autoCancel: false });
      
      toast.success('Quotation created successfully!');

      let expandedQuotation = createdQuotation;
      try {
        expandedQuotation = await pb.collection('quotations').getOne(createdQuotation.id, {
          expand: 'customer,user_id',
          $autoCancel: false
        });
      } catch (e) {}
      
      setCreatedQuotationDetails(expandedQuotation);
      setShowSuccessModal(true);

    } catch (error) {
      console.error("Error creating quotation:", error.response || error);
      
      if (error.response?.data) {
        const errorsList = Object.entries(error.response.data)
          .map(([field, errData]) => `${field}: ${errData.message}`)
          .join(' | ');
        
        toast.error(`Validation Failed: ${errorsList}`, { duration: 6000 });
      } else {
        toast.error('Failed to create quotation. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!createdQuotationDetails) return;
    const phone = createdQuotationDetails.expand?.customer?.phone || createdQuotationDetails.phone;
    if (!phone) {
      toast.error('No phone number available for this customer');
      return;
    }
    
    const url = await generateWhatsAppURL(pb, createdQuotationDetails, phone);
    window.open(url, '_blank');
  };

  const handleViewQuotation = () => {
    if (!createdQuotationDetails) return;
    const link = getQuotationShareLink(createdQuotationDetails.short_id || createdQuotationDetails.id);
    window.open(link, '_blank');
  };

  const handleDownloadPDF = () => {
    if (!createdQuotationDetails) return;
    try {
      const customer = createdQuotationDetails.expand?.customer || {};
      const doc = generateQuotationPDF(createdQuotationDetails, customer, settings);
      doc.save(`Quotation_${createdQuotationDetails.quotationNumber}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Quotation - Pixora Studio</title>
      </Helmet>

      {createdQuotationDetails && (
        <QuotationSuccessModal 
          open={showSuccessModal}
          onOpenChange={setShowSuccessModal}
          onClose={() => navigate('/quotations')}
          quotation={createdQuotationDetails}
          onWhatsApp={handleShareWhatsApp}
          onDownload={handleDownloadPDF}
          onView={handleViewQuotation}
        />
      )}

      <AppScaffold title="Create Quotation" showBackButton onBack={() => step > 1 ? setStep(step - 1) : navigate('/quotations')}>
        <div className="max-w-2xl mx-auto pb-24 px-2">
          <div className="flex items-center justify-between mb-8 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors shadow-sm ${step >= i ? 'bg-primary text-primary-foreground ring-4 ring-primary/10' : 'bg-muted text-muted-foreground border border-border'}`}>
                  {i}
                </div>
                {i < 3 && (
                  <div className={`flex-1 h-1.5 mx-2 rounded-full transition-colors ${step > i ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-sm">
            {step === 1 && (
              customers.length === 0 ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Client Details</h2>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-foreground">Customer Name *</label>
                      <input 
                        type="text" 
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" 
                        value={formData.customerName} 
                        onChange={e => setFormData(prev => ({...prev, customerName: e.target.value}))} 
                        placeholder="Enter client's full name" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-foreground">Phone Number *</label>
                      <input 
                        type="tel" 
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" 
                        value={formData.customerPhone} 
                        onChange={e => setFormData(prev => ({...prev, customerPhone: e.target.value}))} 
                        placeholder="Enter 10-digit mobile number" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 mt-8 border-t border-border">
                     <button 
                       onClick={() => {
                         if (!formData.customerName || !formData.customerPhone) {
                           toast.error('Please fill in both name and phone number');
                           return;
                         }
                         setStep(2);
                       }} 
                       className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
                     >
                       Next Step
                     </button>
                  </div>
                </div>
              ) : (
                <Step1BasicDetails
                  data={formData}
                  updateData={(newData) => setFormData(prev => ({ ...prev, ...newData }))}
                  onNext={() => setStep(2)}
                  onCancel={() => navigate('/quotations')}
                />
              )
            )}

            {step === 2 && (
              <Step2EventDates
                data={formData}
                updateData={(newData) => setFormData(prev => ({ ...prev, ...newData }))}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <Step3SelectPackageReview
                data={formData}
                updateData={(newData) => setFormData(prev => ({ ...prev, ...newData }))}
                onBack={() => setStep(2)}
                onSave={handleSave}
                packages={packages}
                allItems={allItems}
                customers={customers}
                loading={loading}
              />
            )}
          </div>
        </div>
      </AppScaffold>
    </>
  );
};

export default CreateQuotationPage;