import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import AppScaffold from '@/components/m3/AppScaffold';
import { ArrowLeft, Camera, Loader2, Mail, MessageCircle, MapPin, Phone, User, Briefcase, Instagram, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    business_name: '',
    phone: '',
    address: '',
    instagramProfile: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentUser) {
      setFormData({
        full_name: currentUser.full_name || currentUser.name || '',
        email: currentUser.email || '',
        business_name: currentUser.business_name || '',
        phone: currentUser.phone || '',
        address: currentUser.address || currentUser.location || '',
        instagramProfile: currentUser.instagramProfile || ''
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const numericVal = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: numericVal }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateUniquenessAndFormat = async () => {
    let hasError = false;
    const newErrors = { ...errors };

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
      hasError = true;
    }

    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
      hasError = true;
    }

    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return false;
    }

    try {
      if (formData.phone && formData.phone !== currentUser.phone) {
        const phoneRes = await pb.collection('users').getList(1, 1, { 
          filter: `phone="${formData.phone}" && id!="${currentUser.id}"`, 
          $autoCancel: false 
        });
        if (phoneRes.totalItems > 0) {
          newErrors.phone = 'Mobile number already exists';
          toast.error('Mobile number already exists');
          hasError = true;
        }
      }

      if (formData.email && formData.email !== currentUser.email) {
        const emailRes = await pb.collection('users').getList(1, 1, { 
          filter: `email="${formData.email}" && id!="${currentUser.id}"`, 
          $autoCancel: false 
        });
        if (emailRes.totalItems > 0) {
          newErrors.email = 'Email already exists';
          toast.error('Email already exists');
          hasError = true;
        }
      }
    } catch (err) {
      console.error('Validation error:', err);
    }

    if (hasError) setErrors(newErrors);
    return !hasError;
  };

  const handleSave = async () => {
    setLoading(true);
    
    const isValid = await validateUniquenessAndFormat();
    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      await pb.collection('users').update(currentUser.id, formData, { $autoCancel: false });
      await pb.collection('users').authRefresh();
      toast.success('Profile updated successfully');
      navigate('/settings');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Edit Profile - Pixora</title>
      </Helmet>

      <AppScaffold>
        <div className="max-w-2xl mx-auto w-full pb-24 md:pb-12 animate-in fade-in duration-300">
          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Settings
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Update your personal and business information.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-24 h-24 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden mb-3">
                {currentUser?.avatar ? (
                  <img 
                    src={pb.files.getUrl(currentUser, currentUser.avatar)} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
                <button className="absolute bottom-0 left-0 right-0 bg-black/50 text-white py-1 flex justify-center hover:bg-black/70 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Click to change photo</p>
            </div>

            <div className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <User className="w-4 h-4 text-muted-foreground" /> Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`w-full h-12 px-4 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none transition-all ${errors.full_name ? 'border-destructive' : 'border-border'}`}
                />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-muted-foreground" /> Email Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className={`w-full h-12 px-4 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none transition-all ${errors.email ? 'border-destructive' : 'border-border'}`}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

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
                  className={`w-full h-12 px-4 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none transition-all ${errors.phone ? 'border-destructive' : 'border-border'}`}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-muted-foreground" /> Business Name
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  placeholder="Enter your business name"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-muted-foreground" /> Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="City, State"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 text-muted-foreground" /> Instagram Profile
                </label>
                <input
                  type="text"
                  name="instagramProfile"
                  value={formData.instagramProfile || ''}
                  onChange={handleChange}
                  placeholder="@username"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              
              <div className="space-y-1.5 pt-4">
                <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-muted-foreground" /> Your Referral Code
                </label>
                <input
                  type="text"
                  value={currentUser?.referral_code || currentUser?.referralCode || ''}
                  readOnly
                  className="w-full h-12 px-4 rounded-xl border border-border bg-muted/50 text-muted-foreground outline-none cursor-default font-mono tracking-wider"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border flex flex-col gap-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </button>
              
              <button
                onClick={(e) => { e.preventDefault(); window.open('https://wa.me/918878387979', '_blank'); }}
                className="w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" /> Contact Support via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </AppScaffold>
    </>
  );
};

export default ProfilePage;