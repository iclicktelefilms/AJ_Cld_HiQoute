import { formatINR } from './currencyUtils';

export const generateQuotationNumber = async (pb) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  
  try {
    const existingQuotations = await pb.collection('quotations').getList(1, 1, {
      filter: `quotationNumber ~ "QT-${dateStr}"`,
      sort: '-quotationNumber',
      $autoCancel: false
    });
    
    let sequence = 1;
    if (existingQuotations.items.length > 0) {
      const lastNumber = existingQuotations.items[0].quotationNumber;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    return `QT-${dateStr}-${sequence.toString().padStart(3, '0')}`;
  } catch (error) {
    return `QT-${dateStr}-001`;
  }
};

export const generateShortQuotationId = () => {
  return Math.random().toString(36).substring(2, 10);
};

export const calculateLineItemTotal = (item) => {
  const basePrice = item.price * item.quantity;
  return basePrice;
};

export const calculateQuotationTotal = (lineItemsData) => {
  let subtotal = 0;
  const groups = Array.isArray(lineItemsData) ? lineItemsData : (lineItemsData?.groups || []);
  const baseAmount = !Array.isArray(lineItemsData) ? (parseFloat(lineItemsData?.baseAmount) || 0) : 0;
  
  groups.forEach(group => {
    if (group.items && Array.isArray(group.items)) {
      group.items.forEach(item => {
        subtotal += calculateLineItemTotal(item);
      });
    }
  });

  let total = subtotal + baseAmount;

  if (!Array.isArray(lineItemsData) && lineItemsData?.discount) {
    const { type, value } = lineItemsData.discount;
    const discountVal = parseFloat(value) || 0;
    if (type === 'percentage') {
      total -= (total * discountVal) / 100;
    } else {
      total -= discountVal;
    }
  }

  if (!Array.isArray(lineItemsData) && lineItemsData?.adjustment) {
    let adjValue = 0;
    if (typeof lineItemsData.adjustment === 'object') {
      adjValue = parseFloat(lineItemsData.adjustment.value) || 0;
    } else {
      adjValue = parseFloat(lineItemsData.adjustment) || 0;
    }
    total += adjValue;
  }

  return total;
};

export const formatPhoneNumber = (phone, countryCode = '91') => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 10) {
    return `${countryCode}${cleaned}`;
  }
  return cleaned;
};

export const formatWhatsAppMessage = (template, data) => {
  if (!template) return '';
  return template
    .replace(/{CustomerName}/gi, data.CustomerName || '')
    .replace(/{EventName}/gi, data.EventName || '')
    .replace(/{EventDate}/gi, data.EventDate || '')
    .replace(/{QuotationNumber}/gi, data.QuotationNumber || '')
    .replace(/{TotalAmount}/gi, data.TotalAmount ? formatINR(data.TotalAmount) : '')
    .replace(/{QuotationLink}/gi, data.QuotationLink || '');
};

export const generateWhatsAppURL = async (pb, quotation, phoneNumber) => {
  try {
    const settingsRecords = await pb.collection('settings').getList(1, 1, { $autoCancel: false });
    const currentSettings = settingsRecords.items.length > 0 ? settingsRecords.items[0] : null;
    
    const defaultTemplate = "Hi {CustomerName},\n\nHere is your quotation ({QuotationNumber}) for the {EventName}.\nTotal Amount: {TotalAmount}\n\nYou can view and accept the detailed quotation here:\n{QuotationLink}\n\nLooking forward to working with you!";
    const template = currentSettings?.whatsappMessageTemplate || currentSettings?.whatsapp_message_template || defaultTemplate;
    
    const link = `${window.location.origin}/q/${quotation.short_id || quotation.id}`;
    
    const message = formatWhatsAppMessage(template, {
      CustomerName: quotation.customer_name || quotation.expand?.customer?.name || 'Customer',
      EventName: quotation.eventName || 'event',
      EventDate: quotation.eventDate ? new Date(quotation.eventDate).toLocaleDateString() : '',
      QuotationNumber: quotation.quotationNumber,
      TotalAmount: quotation.totalAmount,
      QuotationLink: link
    });
    
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  } catch (error) {
    console.error("Error generating WhatsApp URL:", error);
    return `https://wa.me/${phoneNumber}`;
  }
};

export const getNextDate = (lastDateStr) => {
  if (!lastDateStr) return new Date().toISOString().split('T')[0];
  const d = new Date(lastDateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const calculateEventDayName = (index) => {
  return `Day ${String(index + 1).padStart(2, '0')}`;
};

export const formatEventDates = (eventDays) => {
  if (!eventDays || eventDays.length === 0) return '';
  if (typeof eventDays[0] === 'string') return eventDays.join(', '); 
  return eventDays.map(d => `${d.name} (${new Date(d.date).toLocaleDateString()})`).join(', ');
};

export const getQuotationSummary = (quotation, customers, packages) => {
  const customer = customers.find(c => c.id === quotation.customer);
  const pkg = packages.find(p => p.id === quotation.selectedPackage);
  
  return {
    customerName: customer?.name || 'Unknown Customer',
    eventName: quotation.location || 'Unnamed Event',
    eventDates: formatEventDates(quotation.eventDays),
    location: quotation.location || '',
    packageName: pkg?.packageName || 'No Package Selected',
    totalAmount: calculateQuotationTotal(quotation.lineItems)
  };
};

export const getDurationFilteredData = (data, duration, referenceDateStr = '2026-04-05') => {
  if (!Array.isArray(data)) return [];
  
  const refDate = new Date(referenceDateStr);
  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth();

  return data.filter(item => {
    if (!item.created) return false;
    const itemDate = new Date(item.created);
    const itemYear = itemDate.getFullYear();
    const itemMonth = itemDate.getMonth();

    if (duration === 'This Month') {
      return itemYear === refYear && itemMonth === refMonth;
    } else if (duration === 'Last Month') {
      const lastMonth = refMonth === 0 ? 11 : refMonth - 1;
      const lastMonthYear = refMonth === 0 ? refYear - 1 : refYear;
      return itemYear === lastMonthYear && itemMonth === lastMonth;
    } else if (duration === 'This Year') {
      return itemYear === refYear;
    }
    return true;
  });
};