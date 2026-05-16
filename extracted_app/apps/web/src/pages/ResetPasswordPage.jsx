import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Lock, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import FooterSection from '@/components/auth/FooterSection';

const ResetPasswordPage = () => {
  const location = useLocation();
  const { email, otpId } = location.state || {};
  
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { authWithOTP } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!email || !otpId) {
      toast.error('Session expired. Please request a new code.');
      navigate('/forgot-password');
    }
  }, [email, otpId, navigate]);

  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    const maskedName = name.length > 2 ? `${name.substring(0, 2)}${'*'.repeat(name.length - 2)}` : name;
    return `${maskedName}@${domain}`;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!code || code.length !== 4) {
      toast.error('Please enter a valid 4-digit OTP');
      return;
    }
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP
      const authResult = await authWithOTP(otpId, code);
      
      if (!authResult.success) {
        toast.error(authResult.error || 'Invalid OTP code');
        setLoading(false);
        return;
      }

      // 2. Update Password
      await pb.collection('users').update(authResult.record.id, {
        password: password,
        passwordConfirm: confirmPassword
      }, { $autoCancel: false });
      
      toast.success('Password reset successfully!');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      toast.error(error.message || 'Failed to reset password');
      setLoading(false);
    }
  };

  if (!email || !otpId) return null;

  return (
    <>
      <Helmet>
        <title>Set New Password - Pixora Studio</title>
        <meta name="description" content="Set your new password" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-20 pb-2">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Set New Password</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Enter the 4-digit code sent to <br/>
                <span className="font-medium text-foreground">{maskEmail(email)}</span>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="0000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  className="auth-input pl-10 tracking-widest text-center font-mono text-lg"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="New Password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input pl-10"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-input pl-10"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-11 rounded-xl text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading || code.length !== 4}>
                {loading ? 'Updating...' : 'Reset Password'}
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

export default ResetPasswordPage;