import { generateWhatsAppURL, formatWhatsAppMessage } from './quotationUtils';

export const getQuotationShareLink = (quotationId) => {
  return `${window.location.origin}/q/${quotationId}`;
};

export const generateOnboardingWhatsAppMessage = (quotation, template = null) => {
  const defaultTemplate = "Hello {CustomerName}!\nHere is your quotation from Pixora for {TotalAmount}.\nYou can view and accept it here: {QuotationLink}";

  const link = getQuotationShareLink(quotation?.short_id || quotation?.id);

  return formatWhatsAppMessage(template || defaultTemplate, {
    CustomerName: quotation?.customer_name || quotation?.expand?.customer?.name || 'Customer',
    EventName: quotation?.eventName || 'event',
    EventDate: quotation?.eventDate ? new Date(quotation.eventDate).toLocaleDateString() : '',
    QuotationNumber: quotation?.quotationNumber || '',
    TotalAmount: quotation?.totalAmount || 0,
    QuotationLink: link
  });
};

export const openWhatsAppShare = (phoneNumber, message) => {
  if (!phoneNumber) return;
  const waUrl = generateWhatsAppURL(phoneNumber, message);
  window.open(waUrl, '_blank');
};