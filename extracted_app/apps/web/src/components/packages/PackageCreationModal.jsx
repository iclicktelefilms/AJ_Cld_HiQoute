import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import PackageStep1 from './PackageStep1';
import PackageStep2 from './PackageStep2';
import { Check } from 'lucide-react';

const PackageCreationModal = ({ open, onOpenChange, onSuccess, initialData = null, collectionName = 'packages' }) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  const defaultFormState = {
    packageName: '',
    description: '',
    baseAmount: '',
    groups: [],
    discount: { type: 'fixed', value: '' },
    adjustmentHeading: 'Adjustment',
    adjustment: ''
  };

  const [formData, setFormData] = useState(defaultFormState);

  useEffect(() => {
    if (open) {
      if (initialData) {
        let parsedGroups = [];
        try {
          parsedGroups = typeof initialData.groups === 'string' ? JSON.parse(initialData.groups) : (initialData.groups || []);
        } catch (e) {
          parsedGroups = [];
        }

        setFormData({
          packageName: initialData.packageName || '',
          description: initialData.description || '',
          baseAmount: initialData.baseAmount?.toString() || '',
          groups: parsedGroups,
          discount: initialData.discount || { type: 'fixed', value: '' },
          adjustmentHeading: initialData.adjustmentHeading || 'Adjustment',
          adjustment: initialData.adjustment?.toString() || ''
        });
      } else {
        setFormData(defaultFormState);
      }
      setStep(1);
    }
  }, [open, initialData]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const baseAmount = Number(formData.baseAmount) || 0;
      const itemsTotal = formData.groups.reduce((total, group) => {
        return total + group.items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
      }, 0);
      
      const subtotal = baseAmount + itemsTotal;
      const discountValue = Number(formData.discount.value) || 0;
      let discountAmount = 0;
      if (formData.discount.type === 'percentage') {
        discountAmount = subtotal * (discountValue / 100);
      } else {
        discountAmount = discountValue;
      }
      
      const adjustment = Number(formData.adjustment) || 0;
      const finalAmount = subtotal - discountAmount + adjustment;

      const payload = {
        packageName: formData.packageName,
        description: formData.description, // Will be ignored by PB if field doesn't exist on universal_packages schema, but safe to send
        baseAmount: baseAmount,
        groups: JSON.stringify(formData.groups),
        discount: formData.discount,
        adjustmentHeading: formData.adjustmentHeading,
        adjustment: adjustment,
        finalAmount: finalAmount,
        itemsTotal: itemsTotal,
        user_id: pb.authStore.model?.id // Associate creator even for universal packages
      };

      if (initialData?.id) {
        await pb.collection(collectionName).update(initialData.id, payload, { $autoCancel: false });
        toast.success('Package updated successfully');
      } else {
        await pb.collection(collectionName).create(payload, { $autoCancel: false });
        toast.success('Package created successfully');
      }
      
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Failed to save package. Please ensure all required fields are filled correctly.');
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { num: 1, title: 'Basic Details' }, 
    { num: 2, title: 'Groups & Pricing' }
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col rounded-2xl p-0 bg-background shadow-2xl border border-border">
        <DialogHeader className="p-6 pb-5 border-b border-border shrink-0 bg-muted/30">
          <DialogTitle className="text-xl font-extrabold text-foreground">
            {initialData ? 'Edit Package' : 'Create New Package'}
          </DialogTitle>
          
          <div className="flex items-center justify-between mt-6 relative px-4">
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-border rounded-full -z-10"></div>
            <div 
              className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full -z-10 transition-all duration-500 ease-in-out"
              style={{ width: `calc(${((step - 1) / (steps.length - 1)) * 100}% - 32px)` }}
            ></div>
            
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-2 bg-muted/30 px-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step > s.num ? 'bg-primary text-primary-foreground scale-105' : 
                  step === s.num ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110' : 
                  'bg-muted text-muted-foreground border-2 border-border'
                }`}>
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-xs font-semibold hidden sm:block tracking-wide ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {step === 1 && (
            <PackageStep1 
              formData={formData} 
              setFormData={setFormData} 
              onNext={() => setStep(2)} 
              onCancel={handleClose} 
              isUniversal={collectionName === 'universal_packages'}
            />
          )}
          {step === 2 && (
            <PackageStep2 
              formData={formData} 
              setFormData={setFormData} 
              onNext={handleSave} 
              onBack={() => setStep(1)}
              onCancel={handleClose} 
              isSaving={isSaving}
              isUniversal={collectionName === 'universal_packages'}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageCreationModal;