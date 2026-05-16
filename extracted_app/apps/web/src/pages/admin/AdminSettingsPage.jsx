import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { Package, Box, Settings, MessageSquare, Shield, FileText, ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const AdminSettingsPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'privacy', 'terms', or 'general'
  
  const [formData, setFormData] = useState({
    privacyPolicy: '',
    termsAndConditions: '',
    appVersion: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('settings').getFullList({ $autoCancel: false });
      if (records.length > 0) {
        const currentSettings = records[0];
        setSettings(currentSettings);
        setFormData({
          privacyPolicy: currentSettings.privacyPolicy || '',
          termsAndConditions: currentSettings.termsAndConditions || '',
          appVersion: currentSettings.app_version || ''
        });
      } else {
        const newSettings = await pb.collection('settings').create({
          privacyPolicy: 'Default Privacy Policy',
          termsAndConditions: 'Default Terms and Conditions',
          app_version: '1.0.0'
        }, { $autoCancel: false });
        setSettings(newSettings);
        setFormData({
          privacyPolicy: newSettings.privacyPolicy,
          termsAndConditions: newSettings.termsAndConditions,
          appVersion: newSettings.app_version
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      await pb.collection('settings').update(settings.id, {
        privacyPolicy: formData.privacyPolicy,
        termsAndConditions: formData.termsAndConditions,
        app_version: formData.appVersion
      }, { $autoCancel: false });
      
      toast.success('Settings updated successfully');
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const openModal = (type) => {
    setActiveModal(type);
    setModalOpen(true);
  };

  const settingCards = [
    {
      id: 'universal-items',
      title: 'Universal Items',
      description: 'Manage items available to all users',
      icon: Box,
      onClick: () => navigate('/admin/universal-items'),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      id: 'universal-packages',
      title: 'Universal Packages',
      description: 'Manage packages available to all users',
      icon: Package,
      onClick: () => navigate('/admin/universal-packages'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'general-settings',
      title: 'General Settings',
      description: 'Configure global application settings and version',
      icon: Settings,
      onClick: () => openModal('general'),
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      id: 'user-feedback',
      title: 'User Feedback',
      description: 'View and manage feedback from users',
      icon: MessageSquare,
      onClick: () => navigate('/admin/feedback'),
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      description: 'Update the application privacy policy',
      icon: Shield,
      onClick: () => openModal('privacy'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'terms-conditions',
      title: 'Terms & Conditions',
      description: 'Update the application terms of service',
      icon: FileText,
      onClick: () => openModal('terms'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f9f9f9] pb-24 md:pb-12">
      <Helmet>
        <title>Admin Settings - Pixora</title>
      </Helmet>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {settingCards.map((card) => (
            <button
              key={card.id}
              onClick={card.onClick}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className={`p-3 rounded-xl ${card.bgColor} transition-colors shrink-0`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h4 className="text-base font-bold text-gray-900 mb-1">
                  {card.title}
                </h4>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {card.description}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors mt-1 shrink-0" />
            </button>
          ))}
        </div>
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[800px] bg-white border-gray-200 rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b border-gray-200 shrink-0">
            <DialogTitle className="text-xl font-bold text-gray-900">
              {activeModal === 'privacy' && 'Edit Privacy Policy'}
              {activeModal === 'terms' && 'Edit Terms & Conditions'}
              {activeModal === 'general' && 'General Settings'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 flex-1 overflow-y-auto">
            {activeModal === 'general' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">App Version</Label>
                  <input
                    type="text"
                    value={formData.appVersion}
                    onChange={(e) => setFormData({ ...formData, appVersion: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff3131] focus:ring-1 focus:ring-[#ff3131]"
                    placeholder="e.g., 1.0.0"
                  />
                  <p className="text-xs text-gray-500">This version number will be displayed to users in the app.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 h-full flex flex-col">
                <Label className="text-sm font-medium text-gray-700">
                  {activeModal === 'privacy' ? 'Privacy Policy Content' : 'Terms & Conditions Content'}
                </Label>
                <textarea
                  value={activeModal === 'privacy' ? formData.privacyPolicy : formData.termsAndConditions}
                  onChange={(e) => {
                    if (activeModal === 'privacy') {
                      setFormData({ ...formData, privacyPolicy: e.target.value });
                    } else {
                      setFormData({ ...formData, termsAndConditions: e.target.value });
                    }
                  }}
                  className="flex-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff3131] focus:ring-1 focus:ring-[#ff3131] min-h-[400px] resize-y"
                  placeholder="Enter content here..."
                />
              </div>
            )}
          </div>
          
          <div className="p-6 pt-4 border-t border-gray-200 shrink-0 bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-[#ff3131] hover:bg-[#ff1a1a] text-white">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSettingsPage;