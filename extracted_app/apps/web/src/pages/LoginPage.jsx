import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Mail, Lock, FileText, Package, Users, DollarSign, Share2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import FeatureSlider from '@/components/auth/FeatureSlider';
import FooterSection from '@/components/auth/FooterSection';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success('Login successful');
      navigate('/dashboard');
    } else {
      if (result.error?.type === 'auth_failed') {
        setErrors({ 
          email: ' ',
          password: result.error.message 
        });
        toast.error(result.error.message);
      } else {
        toast.error(result.error?.message || 'Invalid email or password');
      }
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
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
        <title>Login - Pixora Studio</title>
        <meta name="description" content="Login to your quotation management account" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <FeatureSlider features={features} />
        
        <div className="flex-1 flex flex-col items-center px-4 -mt-6 relative z-20 pb-2">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Login</h1>
              <p className="text-sm text-muted-foreground mt-2">Welcome back to Pixora Studio</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
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
                {errors.email && errors.email !== ' ' && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <div className={`relative ${errors.password ? 'mb-1' : ''}`}>
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`auth-input pl-10 ${errors.password ? 'border-destructive focus:ring-destructive/20' : ''}`}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
              </div>

              <div className="flex justify-end">
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-primary hover:underline font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button type="submit" className="w-full h-11 rounded-xl text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline font-semibold">
                  Sign Up
                </Link>
              </p>
            </form>
          </div>
        </div>
        
        <FooterSection />
      </div>
    </>
  );
};

export default LoginPage;