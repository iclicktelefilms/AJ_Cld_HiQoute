import React, { useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Briefcase, MapPin, Instagram, Shield, Activity } from 'lucide-react';
import { toast } from 'sonner';

const UserForm = ({ initialData, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    business_name: initialData?.business_name || '',
    address: initialData?.address || initialData?.location || '',
    instagramProfile: initialData?.instagramProfile || '',
    role: initialData?.role || 'photographer',
    status: initialData?.status || 'active',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const numericVal = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: numericVal }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Valid 10-digit phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      if (initialData?.id) {
        // Validate uniqueness if changing email or phone
        if (formData.email !== initialData.email) {
          const emailCheck = await pb.collection('users').getList(1, 1, { filter: `email="${formData.email}"`, $autoCancel: false });
          if (emailCheck.totalItems > 0) {
            setErrors(prev => ({ ...prev, email: 'Email already exists' }));
            setLoading(false);
            return;
          }
        }
        if (formData.phone !== initialData.phone) {
          const phoneCheck = await pb.collection('users').getList(1, 1, { filter: `phone="${formData.phone}"`, $autoCancel: false });
          if (phoneCheck.totalItems > 0) {
            setErrors(prev => ({ ...prev, phone: 'Phone number already exists' }));
            setLoading(false);
            return;
          }
        }

        await pb.collection('users').update(initialData.id, formData, { $autoCancel: false });
        toast.success('User updated successfully');
      } else {
        await pb.collection('users').create(formData, { $autoCancel: false });
        toast.success('User created successfully');
      }
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <User className="w-4 h-4 text-muted-foreground" /> Full Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="John Doe"
            className={`w-full h-11 px-4 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none transition-all ${errors.full_name ? 'border-destructive' : 'border-border'}`}
          />
          {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-muted-foreground" /> Email <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            className={`w-full h-11 px-4 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none transition-all ${errors.email ? 'border-destructive' : 'border-border'}`}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-muted-foreground" /> Phone Number <span className="text-destructive">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            maxLength={10}
            value={formData.phone}
            onChange={handleChange}
            placeholder="10-digit number"
            className={`w-full h-11 px-4 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none transition-all ${errors.phone ? 'border-destructive' : 'border-border'}`}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>

        {/* Business Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-muted-foreground" /> Business/Studio Name
          </label>
          <input
            type="text"
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
            placeholder="Pixora Studios"
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        {/* Address */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-muted-foreground" /> Address / Location
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="City, State, Country"
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        {/* Instagram Profile */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Instagram className="w-4 h-4 text-muted-foreground" /> Instagram Profile
          </label>
          <input
            type="text"
            name="instagramProfile"
            value={formData.instagramProfile}
            onChange={handleChange}
            placeholder="@username"
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-muted-foreground" /> Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
          >
            <option value="photographer">Photographer</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-muted-foreground" /> Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-border mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1 rounded-xl h-11"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="flex-1 rounded-xl h-11 font-bold"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;