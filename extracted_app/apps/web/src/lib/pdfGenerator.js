import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatINR } from './currencyUtils';

const safeFormatINR = (amount) => formatINR(amount).replace('₹', 'Rs. ');

export const generateQuotationPDF = (quotation, customer, settings) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const colors = {
    primary: [33, 37, 41],
    secondary: [100, 100, 100],
    accent: [0, 0, 0],
    border: [230, 230, 230],
    bgLight: [200, 200, 200], // Darkened group background color
    white: [255, 255, 255]
  };
  
  const photographer = quotation.expand?.user_id;
  const businessName = photographer?.business_name || settings?.companyName || photographer?.name || 'Photography Studio';
  const photographerName = photographer?.name || photographer?.full_name || '';
  const phone = photographer?.phone || settings?.companyPhone || '';
  const email = photographer?.email || '';
  const address = photographer?.location || '';
  const instagramProfile = photographer?.instagramProfile || '';
  
  let y = 20;

  // --- Header Area ---
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...colors.primary);
  doc.text(businessName.toUpperCase(), 15, y);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...colors.secondary);
  doc.text('QUOTATION', 195, y, { align: 'right' });
  
  y += 6;

  if (photographerName && photographerName.toLowerCase() !== businessName.toLowerCase()) {
    doc.setFontSize(11);
    doc.setTextColor(...colors.primary);
    doc.text(photographerName, 15, y);
    y += 5;
  }

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...colors.secondary);
  
  let contactDetails1 = [];
  if (phone) contactDetails1.push(phone);
  if (email) contactDetails1.push(email);
  
  if (contactDetails1.length > 0) {
    doc.text(contactDetails1.join(' • '), 15, y);
    y += 5;
  }

  if (address) {
    doc.text(address, 15, y);
    y += 5;
  }
  
  if (instagramProfile) {
    const formattedIg = instagramProfile.startsWith('@') ? instagramProfile : `@${instagramProfile}`;
    const igUrl = `https://instagram.com/${formattedIg.replace('@', '')}`;
    doc.setTextColor(59, 130, 246); // Blue link color
    doc.textWithLink(`IG: ${formattedIg}`, 15, y, { url: igUrl });
    doc.setTextColor(...colors.secondary);
    y += 5;
  }
  
  y += 4;

  // --- Divider ---
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  y += 8;

  // --- Details Box ---
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(15, y, 180, 24, 3, 3, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(...colors.secondary);
  doc.text('PREPARED FOR:', 20, y + 6);
  doc.text('EVENT DETAILS:', 105, y + 6);
  
  doc.setTextColor(...colors.primary);
  doc.setFont(undefined, 'bold');
  const clientName = customer?.name || quotation.customer_name || 'Valued Client';
  doc.text(clientName, 20, y + 12);
  
  const eventName = quotation.eventName || 'Photography Event';
  doc.text(eventName, 105, y + 12);

  doc.setFont(undefined, 'normal');
  doc.setTextColor(...colors.secondary);
  if (customer?.phone || quotation.phone) { 
    doc.text(customer?.phone || quotation.phone, 20, y + 18); 
  }
  
  let eventDatesStr = '';
  if (quotation.eventDays && quotation.eventDays.length > 0) {
    eventDatesStr = quotation.eventDays.map(d => new Date(d.date).toLocaleDateString()).join(', ');
  } else if (quotation.eventDate) {
    eventDatesStr = new Date(quotation.eventDate).toLocaleDateString();
  }
  if (eventDatesStr) {
    doc.text(eventDatesStr, 105, y + 18);
  }
  
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...colors.primary);
  doc.text(`Ref: ${quotation.quotationNumber}`, 190, y + 12, { align: 'right' });
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...colors.secondary);
  doc.text(`Date: ${new Date(quotation.created).toLocaleDateString()}`, 190, y + 18, { align: 'right' });

  y += 32;
  
  // --- Line Items Table ---
  const tableData = [];
  let subtotal = 0;
  
  let lineItems = [];
  if (quotation.lineItems) {
    if (Array.isArray(quotation.lineItems)) {
      lineItems = quotation.lineItems;
    } else if (quotation.lineItems.groups && Array.isArray(quotation.lineItems.groups)) {
      lineItems = quotation.lineItems.groups;
    }
  }
  
  lineItems.forEach(group => {
    tableData.push([
      { 
        content: (group.groupTitle || 'Items').toUpperCase(), 
        colSpan: 4, 
        styles: { fontStyle: 'bold', fillColor: colors.bgLight, textColor: colors.primary, fontSize: 8, cellPadding: {top: 4, bottom: 4, left: 4} } 
      }
    ]);
    
    if (group.items && Array.isArray(group.items)) {
      group.items.forEach(item => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        subtotal += itemTotal;
        
        const itemName = `${item.quantity || 1}x ${item.itemName || 'Item'}`;
        const hasDesc = !!item.description;
        
        tableData.push([
          { content: itemName, styles: { fontStyle: 'bold', textColor: colors.primary, fontSize: 10, cellPadding: {top: 6, bottom: hasDesc ? 2 : 6, left: 4}, lineWidth: hasDesc ? 0 : { bottom: 0.1 } } },
          { content: (item.quantity || 1).toString(), styles: { halign: 'center', fontSize: 9, cellPadding: {top: 6, bottom: hasDesc ? 2 : 6}, lineWidth: hasDesc ? 0 : { bottom: 0.1 } } },
          { content: safeFormatINR(item.price || 0), styles: { halign: 'right', fontSize: 9, cellPadding: {top: 6, bottom: hasDesc ? 2 : 6}, lineWidth: hasDesc ? 0 : { bottom: 0.1 } } },
          { content: safeFormatINR(itemTotal), styles: { halign: 'right', fontSize: 9, fontStyle: 'bold', cellPadding: {top: 6, bottom: hasDesc ? 2 : 6}, lineWidth: hasDesc ? 0 : { bottom: 0.1 } } }
        ]);

        if (hasDesc) {
           tableData.push([
             { content: item.description, colSpan: 4, styles: { fontStyle: 'normal', textColor: colors.secondary, fontSize: 8, cellPadding: {top: 0, bottom: 6, left: 4}, lineWidth: { bottom: 0.1 } } }
           ]);
        }
      });
    }
  });
  
  doc.autoTable({
    startY: y,
    head: [['ITEM', 'QTY', 'RATE', 'AMOUNT']],
    body: tableData,
    theme: 'plain',
    headStyles: { 
      fillColor: false, 
      textColor: colors.secondary,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: {top: 4, bottom: 4, left: 4, right: 4}
    },
    bodyStyles: {
      fillColor: false,
      textColor: colors.primary,
      lineColor: colors.border
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 15 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 }
    },
    margin: { left: 15, right: 15 }
  });
  
  const finalY = doc.lastAutoTable.finalY + 12;
  const baseAmount = quotation.lineItems?.baseAmount || 0;
  const totalBeforeDiscount = subtotal + baseAmount;
  
  const discount = quotation.lineItems?.discount || { type: 'fixed', value: 0 };
  let discountAmt = 0;
  if (discount.type === 'percentage') {
    discountAmt = totalBeforeDiscount * ((parseFloat(discount.value) || 0) / 100);
  } else {
    discountAmt = parseFloat(discount.value) || 0;
  }
  
  const adjustment = quotation.lineItems?.adjustment?.value || 0;
  const adjustmentHeading = quotation.lineItems?.adjustment?.heading || 'Adjustment';
  
  let currentY = finalY;
  
  doc.setFontSize(9);
  doc.setTextColor(...colors.secondary);
  
  if (baseAmount > 0) {
    doc.text('Base Package:', 140, currentY);
    doc.setTextColor(...colors.primary);
    doc.text(safeFormatINR(baseAmount), 190, currentY, { align: 'right' });
    currentY += 6;
  }
  
  doc.setTextColor(...colors.secondary);
  doc.text('Add-ons Subtotal:', 140, currentY);
  doc.setTextColor(...colors.primary);
  doc.text(safeFormatINR(subtotal), 190, currentY, { align: 'right' });
  currentY += 6;
  
  if (discountAmt > 0) {
    doc.setTextColor(...colors.secondary);
    doc.text(`Discount:`, 140, currentY);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${safeFormatINR(discountAmt)}`, 190, currentY, { align: 'right' });
    currentY += 6;
  }
  
  if (adjustment !== 0) {
    doc.setTextColor(...colors.secondary);
    doc.text(`${adjustmentHeading}:`, 140, currentY);
    doc.setTextColor(...colors.primary);
    doc.text(safeFormatINR(adjustment), 190, currentY, { align: 'right' });
    currentY += 6;
  }
  
  currentY += 4;
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(125, currentY - 6, 70, 12, 2, 2, 'F');
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...colors.primary);
  doc.text('TOTAL:', 140, currentY + 2); 
  doc.text(safeFormatINR(quotation.totalAmount || 0), 190, currentY + 2, { align: 'right' });
  
  currentY = Math.max(currentY + 20, finalY + 40);

  if (quotation.termsAndConditions) {
    doc.autoTable({
      startY: currentY,
      head: [['TERMS & CONDITIONS']],
      body: [[quotation.termsAndConditions]],
      theme: 'plain',
      headStyles: {
        fillColor: false,
        textColor: colors.secondary,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { bottom: 4, left: 0 }
      },
      bodyStyles: {
        fillColor: false,
        textColor: colors.secondary,
        fontSize: 8,
        cellPadding: { top: 2, bottom: 2, left: 0 },
      },
      margin: { left: 15, right: 15 },
      pageBreak: 'auto'
    });
  }
  
  return doc;
};