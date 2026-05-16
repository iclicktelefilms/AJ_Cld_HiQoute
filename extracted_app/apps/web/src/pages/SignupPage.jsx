import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mail, Lock, User, Phone, Briefcase, MapPin, Instagram, FileText, Package, Users, DollarSign, Share2, BarChart3, CheckCircle2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import FeatureSlider from '@/components/auth/FeatureSlider';
import FooterSection from '@/components/auth/FooterSection';

const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, sendOTP, verifyOTP } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [otpId, setOtpId] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    business_name: '',
    address: '',
    instagramProfile: '',
    password: '',
    referrerCode: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setFormData(prev => ({ ...prev, referrerCode: refParam }));
    }
  }, [searchParams]);

  const validate = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Valid 10-digit phone number is required';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      const existingEmail = await pb.collection('users').getFullList(1, {
        filter: `email="${formData.email}"`,
        $autoCancel: false
      });
      if (existingEmail.length > 0) {
        toast.error('Email already registered');
        setErrors(prev => ({ ...prev, email: 'Email already registered' }));
        setLoading(false);
        return;
      }

      const existingPhone = await pb.collection('users').getFullList(1, {
        filter: `phone="${formData.phone}"`,
        $autoCancel: false
      });
      if (existingPhone.length > 0) {
        toast.error('Mobile number already registered');
        setErrors(prev => ({ ...prev, phone: 'Mobile number already registered' }));
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    const result = await signup({
      ...formData,
      referrerCode: formData.referrerCode
    });
    
    if (result.success) {
      const storedRef = sessionStorage.getItem('referralCode');
      if (storedRef && !formData.referrerCode) {
        try {
          const lookupRecord = await pb.collection('referral_lookup').getFirstListItem('referralCode="' + storedRef + '"', {
            $autoCancel: false
          });
          await pb.collection('users').update(result.user.id, { referredBy: lookupRecord.user }, { $autoCancel: false });
        } catch (err) {
          console.error('Error linking referrer:', err);
        }
      }

      const otpResult = await sendOTP(formData.email);
      setLoading(false);
      
      if (otpResult.success) {
        setOtpId(otpResult.otpId);
        setShowOtpModal(true);
        toast.success('Account created! Please check your email for the OTP.');
      } else {
        toast.error('Account created but failed to send OTP. Please try logging in.');
        navigate('/login');
      }
    } else {
      setLoading(false);
      if (result.error?.type === 'invalid_referral') {
        toast.error(result.error.message);
      } else {
        toast.error(result.error?.message || 'Failed to create account');
      }
      
      if (result.error?.type === 'email_exists') {
        setErrors(prev => ({ ...prev, email: result.error.message }));
      }
      if (result.error?.type === 'phone_exists') {
        setErrors(prev => ({ ...prev, phone: result.error.message }));
      }
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 4) {
      toast.error('Please enter a valid 4-digit OTP');
      return;
    }

    setVerifying(true);
    const result = await verifyOTP(otpId, otpCode);
    setVerifying(false);

    if (result.success) {
      setShowOtpModal(false);
      setShowSuccessModal(true);
    } else {
      toast.error(result.error?.message || 'Invalid OTP');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const numericVal = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: numericVal }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const features = [
    { icon: FileText, title: 'Quotation Management', description: 'Create and manage professional quotations' },
    { icon: Package, title: 'Package Creation', description: 'Build custom photography packages' },
    { icon: Users, title: 'Customer Management', description: 'Organize and track customer details' },
    { icon: DollarSign, title: 'Pricing Control', description: 'Set flexible pricing and discounts' },
    { icon: Share2, title: 'Share & Track', description: 'Share quotations and track responses' },
    { icon: BarChart3, title: 'Analytics', description: 'View business insights and metrics' }
  ];

  return (
    <>
      <Helmet>
        <title>Sign Up - Pixora Studio</title>
        <meta name="description" content="Create your Pixora Studio account" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <FeatureSlider features={features} />
        
        <div className="flex-1 flex flex-col items-center px-4 -mt-6 relative z-20 pb-8">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Create an Account for FREE!</h1>
              <p className="text-sm text-muted-foreground mt-2">Create & Share Wedding Quotation Professionally</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <div className={`relative ${errors.full_name ? 'mb-1' : ''}`}>
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Full Name *"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={`auth-input pl-10 ${errors.full_name ? 'border-destructive focus:ring-destructive/20' : ''}`}
                  />
                </div>
                {errors.full_name && <p className="text-sm text-destructive mt-1">{errors.full_name}</p>}
              </div>

              <div>
                <div className={`relative ${errors.email ? 'mb-1' : ''}`}>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address *"
                    value={formData.email}
                    onChange={handleChange}
                    className={`auth-input pl-10 ${errors.email ? 'border-destructive focus:ring-destructive/20' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <div className={`relative ${errors.phone ? 'mb-1' : ''}`}>
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    name="phone"
                    maxLength={10}
                    placeholder="Mobile Number *"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`auth-input pl-10 ${errors.phone ? 'border-destructive focus:ring-destructive/20' : ''}`}
                  />
                </div>
                {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
              </div>

              <div>
                <div className={`relative ${errors.business_name ? 'mb-1' : ''}`}>
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    name="business_name"
                    placeholder="Business Name (Optional)"
                    value={formData.business_name}
                    onChange={handleChange}
                    className={`auth-input pl-10 ${errors.business_name ? 'border-destructive focus:ring-destructive/20' : ''}`}
                  />
                </div>
                {errors.business_name && <p className="text-sm text-destructive mt-1">{errors.business_name}</p>}
              </div>

              <div>
                <div className={`relative ${errors.address ? 'mb-1' : ''}`}>
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    name="address"
                    placeholder="Address / Location (Optional)"
                    value={formData.address}
                    onChange={handleChange}
                    className={`auth-input pl-10 ${errors.address ? 'border-destructive focus:ring-destructive/20' : ''}`}
                  />
                </div>
                {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
              </div>

              <div>
                <div className={`relative ${errors.instagramProfile ? 'mb-1' : ''}`}>
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    name="instagramProfile"
                    placeholder="Instagram Username (Optional)"
                    value={formData.instagramProfile}
                    onChange={handleChange}
                    className={`auth-input pl-10 ${errors.instagramProfile ? 'border-destructive focus:ring-destructive/20' : ''}`}
                  />
                </div>
                {errors.instagramProfile && <p className="text-sm text-destructive mt-1">{errors.instagramProfile}</p>}
              </div>

              <div>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    name="referrerCode"
                    placeholder="Referral Code (Optional)"
                    value={formData.referrerCode}
                    onChange={handleChange}
                    className="auth-input pl-10"
                  />
                </div>
              </div>

              <div>
                <div className={`relative ${errors.password ? 'mb-1' : ''}`}>
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password *"
                    value={formData.password}
                    onChange={handleChange}
                    className={`auth-input pl-10 ${errors.password ? 'border-destructive focus:ring-destructive/20' : ''}`}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 rounded-xl text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 mt-2" 
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Login
                </Link>
              </p>
            </form>
          </div>
        </div>
        
        <FooterSection />
      </div>

      {/* OTP Verification Modal */}
      <Dialog open={showOtpModal} onOpenChange={(open) => !open && setShowOtpModal(false)}>
        <DialogContent className="max-w-sm bg-card rounded-3xl p-6 border-border">
          <DialogTitle className="text-xl font-bold text-center mb-2">Verify Your Email</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mb-6">
            We've sent a 4-digit code to {formData.email}. Please enter it below to verify your account.
          </DialogDescription>
          
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <input
              type="text"
              maxLength={4}
              placeholder="Enter 4-digit OTP"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full h-12 text-center text-2xl tracking-widest font-bold bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl font-bold"
              disabled={verifying || otpCode.length !== 4}
            >
              {verifying ? 'Verifying...' : 'Verify Account'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success / Create First Quotation Modal */}
      <Dialog open={showSuccessModal} onOpenChange={(open) => !open && setShowSuccessModal(false)}>
        <DialogContent className="max-w-sm bg-card rounded-3xl p-6 border-border text-center">
          <DialogTitle className="sr-only">Account Verified</DialogTitle>
          <DialogDescription className="sr-only">Your account has been verified successfully.</DialogDescription>
          
          <div className="w-20 h-20 bg-[#10b981]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#10b981]" />
          </div>
          
          <h2 className="text-2xl font-extrabold text-foreground mb-2">Account Verified!</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Welcome to Pixora Studio. You're all set to start creating professional quotations.
          </p>
          
          <Button 
            onClick={() => {
              setShowSuccessModal(false);
              navigate('/quotations/create');
            }}
            className="w-full h-12 rounded-xl font-bold text-base"
          >
            Create your first quotation
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignupPage;