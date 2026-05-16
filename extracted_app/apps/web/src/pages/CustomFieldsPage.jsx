import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import BottomSheetForm from '@/components/m3/BottomSheetForm';
import ConfirmDialog from '@/components/m3/ConfirmDialog';
import AppTextField from '@/components/m3/AppTextField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit2, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_WHATSAPP_TEMPLATE = `Hello {CustomerName},
Here is your quotation for {EventName} on {EventDate}.
Quotation Number: {QuotationNumber}
Total Amount: {TotalAmount}

Click here to view and accept: {QuotationLink}`;

const CustomFieldsPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [whatsappTemplate, setWhatsappTemplate] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Terms Modal State
  const [termModalOpen, setTermModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [termForm, setTermForm] = useState({ name: '', text: '' });
  const [isSavingTerm, setIsSavingTerm] = useState(false);
  const [deleteTermDialogOpen, setDeleteTermDialogOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRecords, termsRecords] = await Promise.all([
        pb.collection('settings').getFullList({ $autoCancel: false }),
        pb.collection('terms').getFullList({ sort: '-created', $autoCancel: false })
      ]);

      setTerms(termsRecords);

      if (settingsRecords.length > 0) {
        const currentSettings = settingsRecords[0];
        setSettings(currentSettings);
        setWhatsappTemplate(currentSettings.whatsapp_message_template || currentSettings.whatsappMessageTemplate || DEFAULT_WHATSAPP_TEMPLATE);
      } else {
        const newSettings = await pb.collection('settings').create({ 
          whatsapp_message_template: DEFAULT_WHATSAPP_TEMPLATE,
          whatsappMessageTemplate: DEFAULT_WHATSAPP_TEMPLATE
        }, { $autoCancel: false });
        setSettings(newSettings);
        setWhatsappTemplate(DEFAULT_WHATSAPP_TEMPLATE);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load custom fields data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTerm = async () => {
    if (!termForm.name || !termForm.text) {
      toast.error('Name and description are required');
      return;
    }
    setIsSavingTerm(true);
    try {
      if (editingTerm) {
        await pb.collection('terms').update(editingTerm.id, {
          term_name: termForm.name,
          term_description: termForm.text
        }, { $autoCancel: false });
        toast.success('Term updated successfully');
      } else {
        await pb.collection('terms').create({
          term_name: termForm.name,
          term_description: termForm.text,
          user_id: pb.authStore.model?.id
        }, { $autoCancel: false });
        toast.success('Term created successfully');
      }
      
      const updatedTerms = await pb.collection('terms').getFullList({ sort: '-created', $autoCancel: false });
      setTerms(updatedTerms);
      setTermModalOpen(false);
    } catch (error) {
      console.error('Error saving term:', error);
      toast.error('Failed to save term');
    } finally {
      setIsSavingTerm(false);
    }
  };

  const handleDeleteTerm = async () => {
    try {
      await pb.collection('terms').delete(termToDelete.id, { $autoCancel: false });
      const updatedTerms = await pb.collection('terms').getFullList({ sort: '-created', $autoCancel: false });
      setTerms(updatedTerms);
      setDeleteTermDialogOpen(false);
      toast.success('Term deleted');
    } catch (error) {
      console.error('Error deleting term:', error);
      toast.error('Failed to delete term');
    }
  };

  const openAddTerm = () => {
    setEditingTerm(null);
    setTermForm({ name: '', text: '' });
    setTermModalOpen(true);
  };

  const openEditTerm = (term) => {
    setEditingTerm(term);
    setTermForm({ name: term.term_name, text: term.term_description });
    setTermModalOpen(true);
  };

  const handleSaveWhatsappTemplate = async () => {
    if (!settings) return;
    setIsSavingTemplate(true);
    try {
      await pb.collection('settings').update(settings.id, { 
        whatsapp_message_template: whatsappTemplate,
        whatsappMessageTemplate: whatsappTemplate
      }, { $autoCancel: false });
      toast.success('WhatsApp template updated successfully');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save WhatsApp message template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleResetWhatsappTemplate = () => {
    setWhatsappTemplate(DEFAULT_WHATSAPP_TEMPLATE);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Custom Fields - Pixora</title>
      </Helmet>

      <div className="min-h-screen bg-background pb-24 md:pb-12">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 animate-in fade-in duration-300">
          
          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Settings
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Custom Fields</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your terms and WhatsApp templates.</p>
          </div>

          <Tabs defaultValue="terms" className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-muted rounded-xl p-1 mb-6">
              <TabsTrigger value="terms" className="rounded-lg text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Terms</TabsTrigger>
              <TabsTrigger value="whatsapp" className="rounded-lg text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">WhatsApp</TabsTrigger>
            </TabsList>

            <TabsContent value="terms" className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-foreground">Terms & Conditions</h2>
                <Button onClick={openAddTerm} className="rounded-xl h-10">
                  <Plus className="w-4 h-4 mr-2" /> Add New Term
                </Button>
              </div>

              {terms.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground bg-card border border-border rounded-2xl text-sm shadow-sm">
                  No terms found. Add your first term to include in quotations.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {terms.map(term => (
                    <div key={term.id} className="bg-card border border-border rounded-2xl p-5 flex justify-between items-center shadow-sm">
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="text-sm font-bold text-foreground truncate">{term.term_name}</h4>
                        <p className="text-xs text-muted-foreground truncate mt-1">{term.term_description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => openEditTerm(term)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setTermToDelete(term); setDeleteTermDialogOpen(true); }} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4 animate-in fade-in duration-300">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-foreground">WhatsApp Message</h2>
                <p className="text-sm text-muted-foreground">Customize the message sent when sharing quotations on WhatsApp.</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <textarea
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                  className="w-full h-40 p-4 rounded-xl border border-input bg-background text-sm font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none mb-4"
                  placeholder="Enter your message template here..."
                />
                <div className="bg-muted/50 p-4 rounded-xl border border-border mb-6">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use <span className="font-bold text-foreground">{'{CustomerName}'}</span>, <span className="font-bold text-foreground">{'{EventName}'}</span>, <span className="font-bold text-foreground">{'{EventDate}'}</span>, <span className="font-bold text-foreground">{'{QuotationNumber}'}</span>, <span className="font-bold text-foreground">{'{TotalAmount}'}</span>, <span className="font-bold text-foreground">{'{QuotationLink}'}</span> for dynamic values.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="w-full sm:flex-1 h-11 rounded-xl" onClick={handleResetWhatsappTemplate}>
                    Reset to Default
                  </Button>
                  <Button className="w-full sm:flex-1 h-11 rounded-xl transition-all active:scale-[0.98]" onClick={handleSaveWhatsappTemplate} disabled={isSavingTemplate}>
                    {isSavingTemplate ? 'Saving...' : 'Save Template'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Terms Modal */}
      <BottomSheetForm
        open={termModalOpen}
        onOpenChange={setTermModalOpen}
        title={editingTerm ? 'Edit Term' : 'Add New Term'}
        onSave={handleSaveTerm}
        isSaving={isSavingTerm}
        saveButtonClass="bg-primary text-primary-foreground rounded-xl py-3 text-base font-bold h-auto shadow-md transition-all active:scale-[0.98]"
        cancelButtonClass="bg-muted text-foreground border border-border rounded-xl py-3 text-base font-bold h-auto transition-colors hover:bg-muted/80"
      >
        <div className="flex flex-col gap-4">
          <AppTextField
            label="Term Name *"
            placeholder="e.g., Standard Wedding Terms"
            value={termForm.name}
            onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
            className="[&_input]:rounded-xl"
          />
          <AppTextField
            label="Term Description *"
            type="textarea"
            value={termForm.text}
            onChange={(e) => setTermForm({ ...termForm, text: e.target.value })}
            placeholder="Enter terms and conditions..."
            className="[&_textarea]:rounded-xl [&_textarea]:h-28"
          />
        </div>
      </BottomSheetForm>

      <ConfirmDialog
        open={deleteTermDialogOpen}
        onOpenChange={setDeleteTermDialogOpen}
        title="Delete Term"
        description={`Are you sure you want to delete ${termToDelete?.term_name}?`}
        onConfirm={handleDeleteTerm}
        confirmText="Delete"
        isDestructive={true}
      />
    </>
  );
};

export default CustomFieldsPage;