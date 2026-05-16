import React, { useState, useEffect } from 'react';
import AppButton from '@/components/m3/AppButton';
import { User, Phone, MapPin, Briefcase } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';

const Step1BasicDetails = ({ data, updateData, onNext }) => {
  const [customers, setCustomers] = useState([]);
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const records = await pb.collection('customers').getFullList({
          sort: '-created',
          filter: `user_id = "${pb.authStore.model?.id}"`,
          $autoCancel: false
        });
        setCustomers(records);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
    
    if (!data.countryCode) {
      updateData({ countryCode: '91' });
    }
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!data.customerName?.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    
    if (!data.customerPhone?.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(data.customerPhone.trim())) {
      newErrors.customerPhone = 'Must be exactly 10 digits';
    }
    
    if (!data.eventName?.trim()) {
      newErrors.eventName = 'Event name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const handleCustomerSelect = (e) => {
    const val = e.target.value;
    if (val === 'new') {
      setIsNewCustomer(true);
      updateData({ customer: '', customerName: '', customerPhone: '', customerAddress: '' });
    } else {
      setIsNewCustomer(false);
      const selected = customers.find(c => c.id === val);
      if (selected) {
        let phone = selected.phone || '';
        let code = '91';
        if (phone.startsWith('+91')) {
          phone = phone.substring(3);
        } else if (phone.startsWith('91') && phone.length === 12) {
          phone = phone.substring(2);
        }
        
        updateData({ 
          customer: selected.id,
          customerName: selected.name,
          countryCode: code,
          customerPhone: phone,
          customerAddress: selected.address || ''
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="mb-2">
        <h3 className="text-xl font-extrabold text-foreground tracking-tight">Step 1: Basic Details</h3>
        <p className="text-sm text-muted-foreground mt-1">Enter customer and event information.</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Customer Selection</label>
          <select 
            className="w-full h-12 bg-background border border-input rounded-xl px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
            onChange={handleCustomerSelect}
            value={isNewCustomer ? 'new' : data.customer}
          >
            <option value="new">+ Create New Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Customer Name *</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={data.customerName || ''}
                onChange={(e) => {
                  updateData({ customerName: e.target.value });
                  if (errors.customerName) setErrors({...errors, customerName: null});
                }}
                disabled={!isNewCustomer}
                placeholder="e.g. John Doe"
                className={`w-full h-12 bg-background border ${errors.customerName ? 'border-destructive focus:ring-destructive' : 'border-input focus:border-primary focus:ring-primary'} rounded-xl pl-10 pr-4 text-sm text-foreground outline-none focus:ring-1 transition-all disabled:bg-muted disabled:text-muted-foreground shadow-sm`}
              />
            </div>
            {errors.customerName && <p className="text-xs font-medium text-destructive mt-1">{errors.customerName}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Phone Number *</label>
            <div className="flex gap-2">
              <div className="relative w-[90px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+</span>
                <input
                  type="text"
                  maxLength={3}
                  value={data.countryCode || '91'}
                  onChange={(e) => updateData({ countryCode: e.target.value.replace(/\D/g, '') })}
                  disabled={!isNewCustomer}
                  className="w-full h-12 bg-background border border-input rounded-xl pl-7 pr-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:bg-muted disabled:text-muted-foreground shadow-sm"
                />
              </div>
              <div className="relative flex-1">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  maxLength={10}
                  value={data.customerPhone || ''}
                  onChange={(e) => {
                    updateData({ customerPhone: e.target.value.replace(/\D/g, '') });
                    if (errors.customerPhone) setErrors({...errors, customerPhone: null});
                  }}
                  disabled={!isNewCustomer}
                  placeholder="9876543210"
                  className={`w-full h-12 bg-background border ${errors.customerPhone ? 'border-destructive focus:ring-destructive' : 'border-input focus:border-primary focus:ring-primary'} rounded-xl pl-10 pr-4 text-sm text-foreground outline-none focus:ring-1 transition-all disabled:bg-muted disabled:text-muted-foreground shadow-sm`}
                />
              </div>
            </div>
            {errors.customerPhone && <p className="text-xs font-medium text-destructive mt-1">{errors.customerPhone}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Event Name *</label>
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={data.eventName || ''}
              onChange={(e) => {
                updateData({ eventName: e.target.value });
                if (errors.eventName) setErrors({...errors, eventName: null});
              }}
              placeholder="e.g. Wedding Photography"
              className={`w-full h-12 bg-background border ${errors.eventName ? 'border-destructive focus:ring-destructive' : 'border-input focus:border-primary focus:ring-primary'} rounded-xl pl-10 pr-4 text-sm text-foreground outline-none focus:ring-1 transition-all shadow-sm`}
            />
          </div>
          {errors.eventName && <p className="text-xs font-medium text-destructive mt-1">{errors.eventName}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Event Location (Optional)</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={data.location || ''}
              onChange={(e) => updateData({ location: e.target.value })}
              placeholder="e.g. Grand Hotel, Mumbai"
              className="w-full h-12 bg-background border border-input rounded-xl pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end pt-6 border-t border-border">
        <AppButton variant="filled" className="w-full md:w-auto px-8 h-12 text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all" onClick={handleNext}>
          Next Step
        </AppButton>
      </div>
    </div>
  );
};

export default Step1BasicDetails;