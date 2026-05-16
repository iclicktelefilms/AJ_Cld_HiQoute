import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import AppScaffold from '@/components/m3/AppScaffold';
import { User, CreditCard, Gift, Shield, ChevronRight, HelpCircle, MessageCircle, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [template, setTemplate] = useState('');
  const [settingsId, setSettingsId] = useState(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'super_admin') {
      pb.collection('settings').getFirstListItem('', { $autoCancel: false })
        .then(res => {
          setTemplate(res.whatsapp_message_template || res.whatsappMessageTemplate || '');
          setSettingsId(res.id);
        })
        .catch(err => console.log('No settings found'));
    }
  }, [currentUser]);

  const handleSaveTemplate = async () => {
    if (!template.trim()) {
      toast.error('Template cannot be empty.');
      return;
    }
    
    if (template.length > 1000) {
      toast.error('Template is too long (maximum 1000 characters).');
      return;
    }

    if (/[<>]/.test(template)) {
      toast.error('Template contains invalid characters like < or >. Please remove them to prevent errors.');
      return;
    }
    
    setSavingTemplate(true);
    try {
      const payload = { 
        whatsapp_message_template: template,
        whatsappMessageTemplate: template
      };

      if (settingsId) {
        await pb.collection('settings').update(settingsId, payload, { $autoCancel: false });
      } else {
        const res = await pb.collection('settings').create(payload, { $autoCancel: false });
        setSettingsId(res.id);
      }
      toast.success('WhatsApp template saved successfully.');
    } catch (error) {
      console.error("Error saving template:", error);
      if (!navigator.onLine) {
        toast.error('Network error: Please check your internet connection.');
      } else {
        toast.error(error.message || 'Failed to save template. Please ensure you have permission.');
      }
    } finally {
      setSavingTemplate(false);
    }
  };

  const settingsLinks = [
    {
      title: 'Account & Profile',
      icon: User,
      path: '/profile',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Subscription Plans',
      icon: CreditCard,
      path: '/subscription-plans',
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Invite & Earn',
      icon: Gift,
      path: '/invite-earn',
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Custom Fields',
      icon: Shield,
      path: '/custom-fields',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'About App',
      icon: HelpCircle,
      path: '/about',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Settings - Pixora Studio</title>
      </Helmet>
      
      <AppScaffold title="Settings">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-300">
          
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Settings</h2>
            <p className="text-muted-foreground mt-1">Manage your studio preferences and app configuration.</p>
          </div>

          <div className="grid gap-3">
            {settingsLinks.map((link, index) => (
              <button
                key={index}
                onClick={() => navigate(link.path)}
                className="w-full bg-card hover:bg-muted/50 border border-border rounded-2xl p-4 flex items-center justify-between transition-all group shadow-sm hover:shadow"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${link.bg}`}>
                    <link.icon className={`w-6 h-6 ${link.color}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{link.title}</h3>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shrink-0 group-hover:border-primary group-hover:bg-primary/5 transition-colors">
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </div>
              </button>
            ))}
            
            {currentUser?.role === 'super_admin' && (
              <>
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full bg-card hover:bg-muted/50 border border-border rounded-2xl p-4 flex items-center justify-between transition-all group shadow-sm mt-4"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground transition-colors">Super Admin Dashboard</h3>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>

                <div className="mt-8 bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-[#25D366]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">WhatsApp Template</h3>
                      <p className="text-sm text-muted-foreground">Default message when sharing quotations</p>
                    </div>
                  </div>
                  <textarea
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="w-full h-32 p-3 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none mb-4"
                    placeholder="Enter default WhatsApp message... Use {CustomerName}, {TotalAmount}, {QuotationLink} as placeholders."
                  />
                  <button
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate}
                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#20bd5a] h-11 rounded-xl font-bold transition-all disabled:opacity-70 active:scale-[0.98]"
                  >
                    {savingTemplate ? 'Saving...' : <><Save className="w-4 h-4" /> Save Template</>}
                  </button>
                </div>
              </>
            )}
          </div>
          
        </div>
      </AppScaffold>
    </>
  );
};

export default SettingsPage;