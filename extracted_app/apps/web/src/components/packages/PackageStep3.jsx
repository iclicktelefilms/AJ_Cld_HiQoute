import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient';

const PackageStep3 = ({ formData, setFormData, onSave, onBack, onCancel, isSaving }) => {
  const [terms, setTerms] = useState([]);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const records = await pb.collection('terms').getFullList({
          sort: 'term_name',
          $autoCancel: false
        });
        setTerms(records);
      } catch (error) {
        console.error('Error fetching terms:', error);
      }
    };
    fetchTerms();
  }, []);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-foreground">Pricing & Terms</h3>
      </div>

      <div className="space-y-4 bg-card border border-gray-200 rounded-xl p-4 shadow-sm">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Base Amount</label>
          <input
            type="number"
            value={formData.baseAmount}
            onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
            className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-primary"
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Discount Type</label>
            <select
              value={formData.discount?.type || 'fixed'}
              onChange={(e) => setFormData({ ...formData, discount: { ...formData.discount, type: e.target.value } })}
              className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-primary bg-white"
            >
              <option value="fixed">Fixed Amount</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Discount Value</label>
            <input
              type="number"
              value={formData.discount?.value || ''}
              onChange={(e) => setFormData({ ...formData, discount: { ...formData.discount, value: e.target.value } })}
              className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-primary"
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Adjustment Heading</label>
            <input
              type="text"
              value={formData.adjustmentHeading || 'Adjustment'}
              onChange={(e) => setFormData({ ...formData, adjustmentHeading: e.target.value })}
              className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Adjustment Amount</label>
            <input
              type="number"
              value={formData.adjustment || ''}
              onChange={(e) => setFormData({ ...formData, adjustment: e.target.value })}
              className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-primary"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Terms & Conditions</label>
          <Select 
            value={formData.terms || ''} 
            onValueChange={(val) => setFormData({ ...formData, terms: val })}
          >
            <SelectTrigger className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-primary bg-white">
              <SelectValue placeholder="Select Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-muted-foreground italic">None</SelectItem>
              {terms.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.term_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
        <Button variant="outline" className="flex-1" onClick={onBack}>Back</Button>
        <Button className="flex-1" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Package'}
        </Button>
      </div>
    </div>
  );
};

export default PackageStep3;