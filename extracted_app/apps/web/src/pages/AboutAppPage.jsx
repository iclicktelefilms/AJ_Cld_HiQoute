import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Shield, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const AboutAppPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState(null); // 'privacy', 'terms', null
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const records = await pb.collection('settings').getFullList({ $autoCancel: false });
        if (records.length > 0) {
          setSettings(records[0]);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
    
    if (currentUser) {
      setFeedbackForm(prev => ({
        ...prev,
        name: currentUser.name || currentUser.full_name || '',
        email: currentUser.email || ''
      }));
    }
  }, [currentUser]);

  const handleSendFeedback = async () => {
    if (!feedbackForm.name || !feedbackForm.email || !feedbackForm.message) {
      toast.error('All fields are required');
      return;
    }
    
    setIsSending(true);
    try {
      await pb.collection('feedback').create({
        userId: currentUser?.id,
        name: feedbackForm.name,
        email: feedbackForm.email,
        message: feedbackForm.message
      }, { $autoCancel: false });
      
      toast.success('Feedback sent successfully. Thank you!');
      setFeedbackModalOpen(false);
      setFeedbackForm(prev => ({ ...prev, message: '' }));
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (activeSection === 'privacy') {
    return (
      <div className="min-h-screen bg-[#f9f9f9] pb-24 md:pb-12">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 animate-in fade-in duration-300">
          <button 
            onClick={() => setActiveSection(null)}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <div className="bg-card border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-6">Privacy Policy</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
              {settings?.privacyPolicy || 'Privacy policy content is not available at the moment.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSection === 'terms') {
    return (
      <div className="min-h-screen bg-[#f9f9f9] pb-24 md:pb-12">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 animate-in fade-in duration-300">
          <button 
            onClick={() => setActiveSection(null)}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <div className="bg-card border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-6">Terms & Conditions</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
              {settings?.termsAndConditions || 'Terms and conditions content is not available at the moment.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>About App - Pixora</title>
      </Helmet>

      <div className="min-h-screen bg-[#f9f9f9] pb-24 md:pb-12">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 animate-in fade-in duration-300">
          
          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Settings
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">About App</h1>
            <p className="text-sm text-muted-foreground mt-1">Legal information and support.</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setActiveSection('privacy')}
              className="bg-card border border-gray-200 rounded-2xl p-5 text-left hover:shadow-md transition-all duration-200 flex items-center gap-4 group"
            >
              <div className="bg-muted p-3 rounded-xl group-hover:bg-primary/10 transition-colors">
                <Shield className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Privacy Policy</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Read how we handle your data</p>
              </div>
            </button>

            <button 
              onClick={() => setActiveSection('terms')}
              className="bg-card border border-gray-200 rounded-2xl p-5 text-left hover:shadow-md transition-all duration-200 flex items-center gap-4 group"
            >
              <div className="bg-muted p-3 rounded-xl group-hover:bg-primary/10 transition-colors">
                <FileText className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Terms & Conditions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Read our terms of service</p>
              </div>
            </button>

            <button 
              onClick={() => setFeedbackModalOpen(true)}
              className="bg-card border border-gray-200 rounded-2xl p-5 text-left hover:shadow-md transition-all duration-200 flex items-center gap-4 group"
            >
              <div className="bg-muted p-3 rounded-xl group-hover:bg-primary/10 transition-colors">
                <MessageSquare className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Share Feedback</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Help us improve the app</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-6 bg-card border-gray-200">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-foreground">Share Feedback</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Name</Label>
              <input
                id="name"
                type="text"
                value={feedbackForm.name}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <input
                id="email"
                type="email"
                value={feedbackForm.email}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">Message</Label>
              <textarea
                id="message"
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                className="flex w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px] resize-none"
                placeholder="Tell us what you think..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button variant="outline" className="w-full sm:flex-1 h-11 rounded-xl border-gray-200" onClick={() => setFeedbackModalOpen(false)}>
                Cancel
              </Button>
              <Button className="w-full sm:flex-1 h-11 rounded-xl" onClick={handleSendFeedback} disabled={isSending}>
                {isSending ? 'Sending...' : 'Send Feedback'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AboutAppPage;