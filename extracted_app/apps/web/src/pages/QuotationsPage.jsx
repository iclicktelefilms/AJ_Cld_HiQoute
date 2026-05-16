import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import AppScaffold from '@/components/m3/AppScaffold';
import QuotationCard from '@/components/m3/QuotationCard';
import ViewQuotationModal from '@/components/m3/ViewQuotationModal';
import ConfirmDialog from '@/components/m3/ConfirmDialog';
import GuidedQuotationFlow from '@/components/onboarding/GuidedQuotationFlow';
import { Plus, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QuotationsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isGuidedFlowOpen, setIsGuidedFlowOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchQuotations();
    }
  }, [currentUser]);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('quotations').getFullList({
        sort: '-created',
        expand: 'customer,selectedPackage',
        $autoCancel: false
      });
      setQuotations(records);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (quotation) => {
    setSelectedQuotation(quotation);
    setViewModalOpen(true);
  };

  const handleEdit = (quotation) => {
    navigate(`/quotations/edit/${quotation.id}`);
  };

  const handleDeleteClick = (quotation) => {
    setQuotationToDelete(quotation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quotationToDelete) return;
    
    try {
      await pb.collection('quotations').delete(quotationToDelete.id, { $autoCancel: false });
      toast.success('Quotation deleted successfully');
      setQuotations(prev => prev.filter(q => q.id !== quotationToDelete.id));
      setDeleteDialogOpen(false);
      setQuotationToDelete(null);
    } catch (error) {
      console.error("Error deleting quotation:", error);
      toast.error('Failed to delete quotation');
    }
  };

  // Centralized status change handler to prevent double updates
  const handleStatusChange = async (id, newStatus) => {
    const originalItem = quotations.find(q => q.id === id);
    
    // Optimistic update
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));
    
    try {
      await pb.collection('quotations').update(id, { status: newStatus }, { $autoCancel: false });
      toast.success(`Quotation marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      // Revert optimistic update
      setQuotations(prev => prev.map(q => q.id === id ? originalItem : q));
      toast.error('Failed to update status. Please check your connection and try again.');
    }
  };

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = 
      q.quotationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.expand?.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.eventName?.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && ['draft', 'sent'].includes(q.status);
    return matchesSearch && q.status === activeTab;
  });

  return (
    <>
      <Helmet>
        <title>Quotations - Pixora Studio</title>
      </Helmet>

      {isGuidedFlowOpen && (
        <GuidedQuotationFlow 
          onSuccess={() => {
            setIsGuidedFlowOpen(false);
            fetchQuotations();
          }} 
          onCancel={() => setIsGuidedFlowOpen(false)} 
        />
      )}

      <AppScaffold title="Quotations">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto overflow-x-auto">
            <TabsList className="w-full flex h-11 p-1 bg-muted/50 rounded-xl hide-scrollbar justify-start">
              <TabsTrigger value="all" className="rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all whitespace-nowrap px-4">All</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all whitespace-nowrap px-4">Pending</TabsTrigger>
              <TabsTrigger value="accepted" className="rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all whitespace-nowrap px-4">Accepted</TabsTrigger>
              <TabsTrigger value="rejected" className="rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all whitespace-nowrap px-4">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
          <button 
            onClick={() => navigate('/quotations/create')} 
            className="hidden sm:flex items-center justify-center gap-2 px-5 h-11 bg-primary text-primary-foreground rounded-xl shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98] font-bold text-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> New Quotation
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by ID, Customer Name, or Event..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card text-foreground border border-border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all shadow-sm"
          />
        </div>

        <div className="flex flex-col gap-3 mb-24 md:mb-12">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
               <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center bg-card border border-border rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-2">No quotations found</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
                {searchQuery ? 'Try adjusting your search or filters.' : 'Create your first quotation to get started.'}
              </p>
              {!searchQuery && (
                <button 
                  onClick={() => setIsGuidedFlowOpen(true)}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Create Quotation
                </button>
              )}
            </div>
          ) : (
            filteredQuotations.map((quotation) => (
              <QuotationCard 
                key={quotation.id} 
                quotation={quotation} 
                onView={() => handleView(quotation)}
                onEdit={() => handleEdit(quotation)}
                onDelete={() => handleDeleteClick(quotation)}
                onStatusChange={(status) => handleStatusChange(quotation.id, status)}
              />
            ))
          )}
        </div>

        <div className="sm:hidden">
          <button 
            onClick={() => navigate('/quotations/create')}
            className="fixed bottom-20 right-6 bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center z-50 active:scale-95"
            aria-label="Create Quotation"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </AppScaffold>

      {selectedQuotation && (
        <ViewQuotationModal
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          quotation={selectedQuotation}
          onUpdate={fetchQuotations}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Quotation"
        description={`Are you sure you want to delete quotation ${quotationToDelete?.quotationNumber}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        isDestructive={true}
      />
    </>
  );
};

export default QuotationsPage;