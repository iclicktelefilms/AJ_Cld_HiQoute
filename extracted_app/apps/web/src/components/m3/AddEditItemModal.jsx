import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AppTextField from '@/components/m3/AppTextField';
import AppButton from '@/components/m3/AppButton';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const AddEditItemModal = ({ open, onOpenChange, item, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    price: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item && open) {
      setFormData({
        itemName: item.itemName || '',
        description: item.description || '',
        price: item.price ? item.price.toString() : ''
      });
    } else if (open) {
      setFormData({
        itemName: '',
        description: '',
        price: ''
      });
    }
  }, [item, open]);

  const handleSave = async () => {
    if (!formData.itemName.trim() || !formData.price) {
      toast.error('Item Name and Price are required');
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        itemName: formData.itemName,
        description: formData.description,
        price: parseFloat(formData.price)
      };

      if (item) {
        await pb.collection('items').update(item.id, dataToSave, { $autoCancel: false });
        toast.success('Item updated successfully', { duration: 2000 });
      } else {
        await pb.collection('items').create(dataToSave, { $autoCancel: false });
        toast.success('Item added successfully', { duration: 2000 });
      }
      
      onSaveSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] w-full rounded-[var(--radius-xl)] p-6 bg-white border-[#e0e0e0]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-[20px] font-bold text-black">
            {item ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          <AppTextField
            label="Item Name *"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
          />
          <AppTextField
            label="Description (Optional)"
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="[&_textarea]:h-[80px]"
          />
          <AppTextField
            label="Price (₹) *"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
          
          <div className="flex flex-col gap-[8px] mt-4">
            <AppButton 
              variant="filled" 
              className="w-full rounded-[20px] bg-[#ff3131] hover:bg-[#ff1a1a] text-white" 
              onClick={handleSave} 
              loading={isSaving}
            >
              Save
            </AppButton>
            <AppButton 
              variant="tonal" 
              className="w-full rounded-[12px]" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </AppButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditItemModal;