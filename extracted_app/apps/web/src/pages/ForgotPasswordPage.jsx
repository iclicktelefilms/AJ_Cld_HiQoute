import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import FooterSection from '@/components/auth/FooterSection';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { requestOTP, checkEmailForReset } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // 1. Check if user exists
      const checkResult = await checkEmailForReset(email);
      
      if (checkResult.type === 'email_not_found') {
        setErrors({ email: checkResult.message });
        setLoading(false);
        return;
      }
      
      // 2. Send OTP
      const result = await requestOTP(email);
      
      if (result.success) {
        toast.success('OTP sent to your email');
        navigate('/reset-password', { state: { email, otpId: result.otpId } });
      } else {
        toast.error(result.error?.message || 'Failed to send OTP.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors({});
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password - Pixora Studio</title>
        <meta name="description" content="Reset your password" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-20 pb-2">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Reset Password</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Enter your email to receive a 4-digit verification code.
              </p>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <div className={`relative ${errors.email ? 'mb-1' : ''}`}>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={handleEmailChange}
                    className={`auth-input pl-10 ${errors.email ? 'border-destructive focus:ring-destructive/20' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
              </div>

              <Button type="submit" className="w-full h-11 rounded-xl text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
        
        <FooterSection />
      </div>
    </>
  );
};

export default ForgotPasswordPage;