import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import AppTextField from '@/components/m3/AppTextField';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const PlanForm = ({ initialData, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    duration: '',
    features: '',
    status: 'active',
    is_default: false
  });

  useEffect(() => {
    if (initialData) {
      // Extract duration from description if it exists (format: "...\nDuration: X days")
      let desc = initialData.description || '';
      let dur = '';
      const durationMatch = desc.match(/\nDuration: (\d+) days/);
      if (durationMatch) {
        dur = durationMatch[1];
        desc = desc.replace(/\nDuration: \d+ days/, '').trim();
      }

      setFormData({
        name: initialData.name || '',
        price: initialData.price !== undefined ? initialData.price.toString() : '',
        description: desc,
        duration: dur,
        features: initialData.features || '',
        status: initialData.status || 'active',
        is_default: initialData.is_default || false
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Plan Name is required';
    if (formData.price === '') newErrors.price = 'Plan Pricing is required';
    if (formData.price !== '' && isNaN(formData.price)) newErrors.price = 'Pricing must be a valid number';
    if (!formData.description.trim()) newErrors.description = 'Plan Description is required';
    if (!formData.duration) newErrors.duration = 'Plan Duration is required';
    if (formData.duration && isNaN(formData.duration)) newErrors.duration = 'Duration must be a valid number';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalDescription = `${formData.description.trim()}\nDuration: ${formData.duration} days`;
      
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        description: finalDescription,
        features: formData.features,
        status: formData.status,
        is_default: formData.is_default
      };

      let savedPlanId;

      if (initialData && initialData.id) {
        await pb.collection('plans').update(initialData.id, payload, { $autoCancel: false });
        savedPlanId = initialData.id;
        toast.success('Plan updated successfully');
      } else {
        const newPlan = await pb.collection('plans').create(payload, { $autoCancel: false });
        savedPlanId = newPlan.id;
        toast.success('Plan created successfully');
      }

      // If this plan is set as default, unset all other default plans
      if (formData.is_default) {
        const otherDefaults = await pb.collection('plans').getFullList({
          filter: `is_default=true && id!="${savedPlanId}"`,
          $autoCancel: false
        });
        
        for (const p of otherDefaults) {
          await pb.collection('plans').update(p.id, { is_default: false }, { $autoCancel: false });
        }
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error(error.message || 'Failed to save plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-5">
        <div className="form-group">
          <AppTextField
            label="Plan Name *"
            placeholder="Enter plan name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            className="[&_input]:border-gray-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="form-group">
            <AppTextField
              label="Plan Pricing (₹) *"
              type="number"
              step="0.01"
              placeholder="Enter price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              error={errors.price}
              className="[&_input]:border-gray-200"
            />
          </div>
          
          <div className="form-group">
            <AppTextField
              label="Plan Duration (Days) *"
              type="number"
              placeholder="Enter duration in days"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              error={errors.duration}
              className="[&_input]:border-gray-200"
            />
          </div>
        </div>

        <div className="form-group">
          <AppTextField
            label="Plan Description *"
            type="textarea"
            placeholder="Enter plan description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={errors.description}
            className="h-24 [&_textarea]:border-gray-200"
          />
        </div>

        <div className="form-group">
          <label className="form-label mb-2 block text-sm font-medium text-black">Plan Features (comma-separated)</label>
          <textarea
            placeholder="Unlimited quotations, PDF generation, Analytics dashboard"
            value={formData.features}
            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
            className={`w-full border ${errors.features ? 'border-destructive' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm text-black outline-none focus:border-[#ff3131] min-h-[100px] resize-y bg-white`}
          />
          {errors.features && <p className="text-xs text-destructive mt-1">{errors.features}</p>}
          <p className="text-xs text-muted-foreground mt-1.5">Enter features separated by commas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="form-group">
            <label className="form-label mb-2 block text-sm font-medium text-black">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-black outline-none focus:border-[#ff3131] min-h-[44px] bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="form-group flex items-end pb-1">
            <div className="flex items-center space-x-3 bg-[#f9f9f9] p-3.5 rounded-xl border border-gray-200 w-full">
              <Checkbox
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                className="border-gray-400 data-[state=checked]:bg-[#ff3131] data-[state=checked]:border-[#ff3131]"
              />
              <label htmlFor="is_default" className="text-sm font-medium text-black cursor-pointer select-none">
                Set as default plan for new users
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
          {onCancel && (
            <button 
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-[#666666] hover:bg-[#f5f5f5] border border-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-bold text-white bg-[#ff3131] hover:bg-[#ff1a1a] rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Plan')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlanForm;