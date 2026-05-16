import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import AppScaffold from '@/components/m3/AppScaffold';
import Step1BasicDetails from '@/components/m3/Step1BasicDetails';
import Step2EventDates from '@/components/m3/Step2EventDates';
import Step3SelectPackageReview from '@/components/m3/Step3SelectPackageReview';
import QuotationSuccessModal from '@/components/QuotationSuccessModal';
import { toast } from 'sonner';
import { calculateQuotationTotal, generateWhatsAppURL } from '@/lib/quotationUtils';
import { getQuotationShareLink } from '@/lib/onboardingUtils';
import { generateQuotationPDF } from '@/lib/pdfGenerator';

const EditQuotationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [updatedQuotationDetails, setUpdatedQuotationDetails] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
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
    },
    status: 'draft'
  });

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        const currentUserId = pb.authStore.model?.id;
        if (!currentUserId) return;

        const [pkgs, items, custs, quotation, settingsRes] = await Promise.all([
          pb.collection('packages').getFullList({
            filter: `user_id="${currentUserId}"`,
            $autoCancel: false
          }),
          pb.collection('items').getFullList({
            filter: `user_id="${currentUserId}"`,
            $autoCancel: false
          }).catch(() => []),
          pb.collection('customers').getFullList({
            filter: `user_id="${currentUserId}"`,
            $autoCancel: false
          }),
          pb.collection('quotations').getOne(id, { 
            expand: 'customer,user_id',
            $autoCancel: false 
          }),
          pb.collection('settings').getList(1, 1, { $autoCancel: false }).catch(() => ({ items: [] }))
        ]);

        setPackages(pkgs);
        setAllItems(items);
        setCustomers(custs);
        
        if (settingsRes.items.length > 0) {
          setSettings(settingsRes.items[0]);
        }

        let phone = quotation.phone || '';
        let code = '91';
        if (phone.startsWith('+91')) {
          phone = phone.substring(3);
        } else if (phone.startsWith('91') && phone.length === 12) {
          phone = phone.substring(2);
        }

        setFormData({
          id: quotation.id,
          customerName: quotation.customer_name || '',
          countryCode: code,
          customerPhone: phone,
          customerEmail: quotation.email || '',
          customer: quotation.customer || null,
          eventName: quotation.eventName || '',
          location: quotation.location || '',
          eventDays: quotation.eventDays || [],
          selectedPackage_universal: quotation.selectedPackage_universal || quotation.selectedPackage || '',
          selectedTermId: '',
          termsAndConditions: quotation.termsAndConditions || '',
          lineItems: quotation.lineItems || {
            baseAmount: 0,
            groups: [],
            discount: { type: 'fixed', value: 0 },
            adjustment: { heading: 'Adjustment', value: 0 }
          },
          status: quotation.status || 'draft'
        });

      } catch (error) {
        console.error("Error fetching quotation data:", error);
        toast.error("Failed to load quotation details.");
        navigate('/quotations');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleSave = async (status, action, payloadOverride = null) => {
    setLoading(true);
    try {
      const currentUserId = pb.authStore.model?.id;
      if (!currentUserId) {
        toast.error("User authentication error. Please log in again.");
        return;
      }

      let quotationPayload;

      if (payloadOverride) {
        quotationPayload = { ...payloadOverride };
      } else {
        const totalAmount = calculateQuotationTotal(formData.lineItems);

        quotationPayload = {
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
          status: formData.status,
          user_id: currentUserId,
        };

        if (formData.customer && typeof formData.customer === 'string' && formData.customer.trim() !== '') {
          quotationPayload.customer = formData.customer;
        }
        
        if (formData.selectedPackage_universal && formData.selectedPackage_universal !== 'manual' && typeof formData.selectedPackage_universal === 'string' && formData.selectedPackage_universal.trim() !== '') {
          quotationPayload.selectedPackage_universal = formData.selectedPackage_universal;
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

      await pb.collection('quotations').update(id, finalPayload, { $autoCancel: false });
      
      toast.success('Quotation updated successfully!');

      let expandedQuotation = { id };
      try {
        expandedQuotation = await pb.collection('quotations').getOne(id, {
          expand: 'customer,user_id',
          $autoCancel: false
        });
      } catch (e) {}
      
      setUpdatedQuotationDetails(expandedQuotation);
      setShowSuccessModal(true);

    } catch (error) {
      console.error("Error updating quotation:", error.response || error);
      
      if (error.response?.data) {
        const errorsList = Object.entries(error.response.data)
          .map(([field, errData]) => `${field}: ${errData.message}`)
          .join(' | ');
        
        toast.error(`Validation Failed: ${errorsList}`, { duration: 6000 });
      } else {
        toast.error('Failed to update quotation. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!updatedQuotationDetails) return;
    const phone = updatedQuotationDetails.expand?.customer?.phone || updatedQuotationDetails.phone;
    if (!phone) {
      toast.error('No phone number available for this customer');
      return;
    }
    
    const url = await generateWhatsAppURL(pb, updatedQuotationDetails, phone);
    window.open(url, '_blank');
  };

  const handleViewQuotation = () => {
    if (!updatedQuotationDetails) return;
    const link = getQuotationShareLink(updatedQuotationDetails.short_id || updatedQuotationDetails.id);
    window.open(link, '_blank');
  };

  const handleDownloadPDF = () => {
    if (!updatedQuotationDetails) return;
    try {
      const customer = updatedQuotationDetails.expand?.customer || {};
      const doc = generateQuotationPDF(updatedQuotationDetails, customer, settings);
      doc.save(`Quotation_${updatedQuotationDetails.quotationNumber}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  if (initialLoading) {
    return (
      <AppScaffold title="Edit Quotation" showBackButton onBack={() => navigate('/quotations')}>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground text-sm font-medium">Loading quotation details...</p>
          </div>
        </div>
      </AppScaffold>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit Quotation - Pixora Studio</title>
      </Helmet>

      {updatedQuotationDetails && (
        <QuotationSuccessModal 
          open={showSuccessModal}
          onOpenChange={setShowSuccessModal}
          onClose={() => navigate('/quotations')}
          quotation={updatedQuotationDetails}
          onWhatsApp={handleShareWhatsApp}
          onDownload={handleDownloadPDF}
          onView={handleViewQuotation}
        />
      )}

      <AppScaffold title="Edit Quotation" showBackButton onBack={() => step > 1 ? setStep(step - 1) : navigate('/quotations')}>
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

          <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
            {step === 1 && (
              <Step1BasicDetails
                data={formData}
                updateData={(newData) => setFormData(prev => ({ ...prev, ...newData }))}
                onNext={() => setStep(2)}
                onCancel={() => navigate('/quotations')}
              />
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

export default EditQuotationPage;