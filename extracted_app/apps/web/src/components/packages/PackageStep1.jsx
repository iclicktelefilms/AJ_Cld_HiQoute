import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Package, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const PackageStep1 = ({ formData, setFormData, onNext, onCancel, isUniversal }) => {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.packageName || formData.packageName.trim().length < 2) {
      newErrors.packageName = 'Package name must be at least 2 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="packageName" className="text-sm font-semibold text-foreground">Package Name *</Label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="packageName"
              type="text"
              value={formData.packageName}
              onChange={(e) => {
                setFormData({ ...formData, packageName: e.target.value });
                if (errors.packageName) setErrors({ ...errors, packageName: null });
              }}
              placeholder="e.g., Premium Wedding Package"
              className={`flex h-11 w-full rounded-xl border ${errors.packageName ? 'border-destructive focus:ring-destructive' : 'border-input focus:border-primary focus:ring-primary'} bg-background px-3 py-2 pl-10 text-sm outline-none focus:ring-1 transition-all`}
            />
          </div>
          {errors.packageName && <p className="text-xs text-destructive font-medium mt-1">{errors.packageName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-semibold text-foreground">Description (Optional)</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what's included in this package..."
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 pl-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px] resize-y transition-all"
            />
          </div>
          {isUniversal && (
            <p className="text-xs text-muted-foreground">Universal packages are visible to all users as templates.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <Button variant="outline" onClick={onCancel} className="rounded-xl h-11 px-6">
          Cancel
        </Button>
        <Button onClick={handleNext} className="rounded-xl h-11 px-6 font-semibold">
          Next Step
        </Button>
      </div>
    </motion.div>
  );
};

export default PackageStep1;