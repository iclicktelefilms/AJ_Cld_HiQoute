import React from 'react';
import { Calendar, User, MapPin, MoreVertical, Eye, Edit2, Trash2, Share2, Link as LinkIcon, Send } from 'lucide-react';
import { formatINR } from '@/lib/currencyUtils';
import { formatPhoneNumber, generateWhatsAppURL } from '@/lib/quotationUtils';
import StatusChip from './StatusChip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';

const QuotationCard = ({ quotation, onView, onEdit, onDelete, onStatusChange }) => {
  const customer = quotation.expand?.customer;
  
  const handleWhatsAppShare = async (e) => {
    e.stopPropagation();
    const customerPhone = customer?.phone || quotation.phone;
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
      
      // Track sharing and update status
      if (quotation.status === 'draft') {
        if (onStatusChange) {
          onStatusChange('sent');
        } else {
          // Fallback if callback not provided
          await pb.collection('quotations').update(quotation.id, {
            status: 'sent',
            shared_date: new Date().toISOString().split('T')[0]
          }, { $autoCancel: false });
        }
      } else {
        // Just update shared_date in background
        pb.collection('quotations').update(quotation.id, {
          shared_date: new Date().toISOString().split('T')[0]
        }, { $autoCancel: false }).catch(console.error);
      }
      
      // Redirect popup
      newWindow.location.href = waUrl;
    } catch (err) {
      console.error(err);
      newWindow.close();
      toast.error('Failed to prepare WhatsApp message');
    }
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/q/${quotation.short_id || quotation.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Quotation link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handlePublish = async (e) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange('sent');
    } else {
      // Fallback
      try {
        await pb.collection('quotations').update(quotation.id, { status: 'sent' }, { $autoCancel: false });
        toast.success('Quotation published successfully');
      } catch (err) {
        toast.error('Failed to publish quotation');
      }
    }
  };

  return (
    <div 
      className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 relative"
      onClick={onView}
    >
      <div className="absolute top-3 right-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }} className="cursor-pointer text-xs font-medium">
              <Eye className="w-4 h-4 mr-2 text-muted-foreground" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }} className="cursor-pointer text-xs font-medium">
              <Edit2 className="w-4 h-4 mr-2 text-muted-foreground" /> Edit Quotation
            </DropdownMenuItem>
            
            {quotation.status === 'draft' && (
              <DropdownMenuItem onClick={handlePublish} className="cursor-pointer text-xs font-bold text-primary">
                <Send className="w-4 h-4 mr-2" /> Publish Quotation
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer text-xs font-medium">
              <LinkIcon className="w-4 h-4 mr-2 text-muted-foreground" /> Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleWhatsAppShare} className="cursor-pointer text-xs font-medium text-[#25D366]">
              <Share2 className="w-4 h-4 mr-2" /> Share via WhatsApp
            </DropdownMenuItem>
            
            <div className="h-px bg-border my-1"></div>
            
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange('accepted'); }} className="cursor-pointer text-xs font-bold text-[#10b981]">
              Mark as Accepted
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange('rejected'); }} className="cursor-pointer text-xs font-bold text-destructive">
              Mark as Rejected
            </DropdownMenuItem>
            
            <div className="h-px bg-border my-1"></div>
            
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="cursor-pointer text-destructive focus:text-destructive text-xs font-bold"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Quotation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-start justify-between pr-8">
        <div>
          <h3 className="font-black text-foreground text-base tracking-tight">{quotation.eventName || 'Event Quotation'}</h3>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{quotation.quotationNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <User className="w-3.5 h-3.5" />
          <span className="truncate">{quotation.customer_name || customer?.name || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span className="truncate">
            {quotation.eventDays && quotation.eventDays.length > 0 
              ? new Date(quotation.eventDays[0].date).toLocaleDateString() 
              : (quotation.eventDate ? new Date(quotation.eventDate).toLocaleDateString() : 'N/A')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium col-span-2">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{quotation.location || 'Location not specified'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
        <StatusChip status={quotation.status} />
        <span className="font-black text-primary text-base">{formatINR(quotation.totalAmount || 0)}</span>
      </div>
    </div>
  );
};

export default QuotationCard;