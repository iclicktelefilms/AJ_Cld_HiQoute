import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { Search, Plus, Edit2, Trash2, ArrowLeft, Copy, Eye, Package as PackageIcon, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/m3/ConfirmDialog';
import PackageCreationModal from '@/components/packages/PackageCreationModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BottomSheetForm from '@/components/m3/BottomSheetForm';
import AppTextField from '@/components/m3/AppTextField';
import { formatINR } from '@/lib/currencyUtils';
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from 'framer-motion';

const AdminUniversalPackagesPage = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Package Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [packageToView, setPackageToView] = useState(null);

  // Term Modal States
  const [termSheetOpen, setTermSheetOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [termFormData, setTermFormData] = useState({ term_name: '', term_description: '' });
  const [termErrors, setTermErrors] = useState({});
  const [isSavingTerm, setIsSavingTerm] = useState(false);
  const [termDeleteDialogOpen, setTermDeleteDialogOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const [packagesRes, termsRes] = await Promise.all([
        pb.collection('universal_packages').getFullList({ sort: '-created', $autoCancel: false }),
        pb.collection('universal_terms').getFullList({ sort: 'term_name', $autoCancel: false })
      ]);
      setPackages(packagesRes);
      setTerms(termsRes);
    } catch (error) {
      console.error('Error fetching universal data:', error);
      setFetchError(true);
      toast.error('Failed to load universal packages and terms.');
    } finally {
      setLoading(false);
    }
  };

  // Package Handlers
  const handleOpenCreatePackage = () => {
    setSelectedPackage(null);
    setModalOpen(true);
  };

  const handleOpenEditPackage = (pkg) => {
    setSelectedPackage(pkg);
    setModalOpen(true);
  };

  const handleOpenViewPackage = (pkg) => {
    setPackageToView(pkg);
    setViewModalOpen(true);
  };

  const handleDuplicatePackage = async (pkg) => {
    try {
      const { id, created, updated, collectionId, collectionName, ...rest } = pkg;
      await pb.collection('universal_packages').create({
        ...rest,
        packageName: `${rest.packageName} (Copy)`
      }, { $autoCancel: false });
      toast.success('Universal package copied successfully');
      fetchData();
    } catch (error) {
      console.error('Error copying package:', error);
      toast.error('Failed to copy package');
    }
  };

  const handleDeletePackage = async () => {
    if (!packageToDelete) return;
    try {
      await pb.collection('universal_packages').delete(packageToDelete.id, { $autoCancel: false });
      toast.success('Package deleted successfully');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
    }
  };

  // Terms Handlers
  const validateTerm = () => {
    const newErrors = {};
    if (!termFormData.term_name.trim()) newErrors.term_name = 'Term name is required';
    if (!termFormData.term_description.trim()) newErrors.term_description = 'Description is required';
    setTermErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveTerm = async () => {
    if (!validateTerm()) return;
    setIsSavingTerm(true);

    try {
      if (selectedTerm) {
        await pb.collection('universal_terms').update(selectedTerm.id, termFormData, { $autoCancel: false });
        toast.success('Universal terms updated');
      } else {
        await pb.collection('universal_terms').create(termFormData, { $autoCancel: false });
        toast.success('Universal terms created');
      }
      setTermSheetOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving terms:', error);
      toast.error('Failed to save terms');
    } finally {
      setIsSavingTerm(false);
    }
  };

  const handleOpenCreateTerm = () => {
    setSelectedTerm(null);
    setTermFormData({ term_name: '', term_description: '' });
    setTermErrors({});
    setTermSheetOpen(true);
  };

  const handleOpenEditTerm = (term) => {
    setSelectedTerm(term);
    setTermFormData({ term_name: term.term_name, term_description: term.term_description });
    setTermErrors({});
    setTermSheetOpen(true);
  };

  const handleDeleteTerm = async () => {
    if (!termToDelete) return;
    try {
      await pb.collection('universal_terms').delete(termToDelete.id, { $autoCancel: false });
      toast.success('Terms deleted successfully');
      setTermDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting terms:', error);
      toast.error('Failed to delete terms');
    }
  };

  const filteredPackages = packages.filter(p => 
    (p.packageName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredTerms = terms.filter(t => 
    (t.term_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderViewModal = () => {
    if (!packageToView) return null;
    
    let parsedGroups = [];
    try {
      parsedGroups = typeof packageToView.groups === 'string' ? JSON.parse(packageToView.groups) : (packageToView.groups || []);
    } catch (e) {
      parsedGroups = [];
    }

    const itemsTotal = parsedGroups.reduce((sum, group) => {
      return sum + (group.items || []).reduce((itemSum, item) => itemSum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
    }, 0);

    const baseAmount = packageToView.baseAmount || 0;
    
    let discountAmt = 0;
    const discount = packageToView.discount || { type: 'fixed', value: 0 };
    if (discount.type === 'percentage') {
      discountAmt = (baseAmount + itemsTotal) * ((parseFloat(discount.value) || 0) / 100);
    } else {
      discountAmt = parseFloat(discount.value) || 0;
    }
    
    const adjustmentAmt = parseFloat(packageToView.adjustment) || 0;
    const totalAmount = baseAmount + itemsTotal - discountAmt + adjustmentAmt;

    return (
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[650px] bg-background border-border rounded-2xl p-0 overflow-hidden flex flex-col shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-muted/20">
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <PackageIcon className="w-5 h-5 text-primary" />
              Package Preview
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 overflow-y-auto flex-1 space-y-8 max-h-[70vh]">
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Package Title</h3>
              <p className="text-2xl font-extrabold text-foreground">{packageToView.packageName}</p>
              {packageToView.description && (
                <p className="text-sm text-muted-foreground mt-2">{packageToView.description}</p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Content & Deliverables</h3>
              {parsedGroups.length === 0 ? (
                <div className="bg-muted/30 border border-dashed border-border rounded-xl p-6 text-center">
                  <p className="text-sm text-muted-foreground">No items in this package.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {parsedGroups.map((group, idx) => (
                    <div key={idx} className="bg-muted/10 rounded-xl p-4 border border-border">
                      <h4 className="font-bold text-foreground mb-3 pb-2 border-b border-border text-base">{group.title || 'Unnamed Group'}</h4>
                      <div className="space-y-2">
                        {(group.items || []).map((item, iIdx) => (
                          <div key={iIdx} className="flex justify-between items-start text-sm bg-background p-3 rounded-lg border border-border shadow-sm">
                            <div className="pr-4">
                              <p className="font-semibold text-foreground">
                                <span className="text-muted-foreground mr-1.5">{item.quantity}x</span> 
                                {item.itemName || item.customName}
                              </p>
                              {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                            </div>
                            <span className="font-bold text-foreground shrink-0">{formatINR((item.price || 0) * (item.quantity || 1))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
               <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Financial Summary</h3>
              <div className="bg-muted/10 rounded-xl p-5 border border-border space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Base Amount</span>
                  <span className="font-bold text-foreground">{formatINR(baseAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Items Subtotal</span>
                  <span className="font-bold text-foreground">{formatINR(itemsTotal)}</span>
                </div>
                {discountAmt > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'Fixed'})</span>
                    <span className="font-bold text-destructive">-{formatINR(discountAmt)}</span>
                  </div>
                )}
                {adjustmentAmt !== 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">{packageToView.adjustmentHeading || 'Adjustment'}</span>
                    <span className="font-bold text-foreground">{formatINR(adjustmentAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-border">
                  <span className="font-extrabold text-foreground text-base">Calculated Total</span>
                  <span className="text-xl font-extrabold text-primary">{formatINR(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-border shrink-0 bg-muted/20 flex justify-end">
            <button 
              onClick={() => setViewModalOpen(false)}
              className="px-6 py-2.5 text-sm font-bold text-foreground bg-background border border-input hover:bg-muted rounded-xl transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-24 md:pb-12">
      <Helmet>
        <title>Universal Packages & Terms - Admin</title>
      </Helmet>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/admin/settings')}
            className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            title="Back to Settings"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Universal Templates</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage global package and terms templates</p>
          </div>
        </div>

        <Tabs defaultValue="packages" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList className="grid w-full sm:w-[400px] grid-cols-2 h-11 p-1 bg-muted/50 rounded-xl border border-border">
              <TabsTrigger value="packages" className="rounded-lg text-[13px] font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Packages</TabsTrigger>
              <TabsTrigger value="terms" className="rounded-lg text-[13px] font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Terms</TabsTrigger>
            </TabsList>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-6 mb-12">
            
            <TabsContent value="packages" className="mt-0 outline-none">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-border">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search packages..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background text-foreground border border-input rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm shadow-sm transition-all"
                  />
                </div>
                <button 
                  onClick={handleOpenCreatePackage}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all w-full sm:w-auto justify-center shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" /> Add Package
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <Skeleton className="h-5 w-1/2" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : fetchError ? (
                <div className="py-16 flex flex-col items-center justify-center text-center bg-destructive/5 rounded-2xl border border-destructive/20 max-w-lg mx-auto">
                  <AlertCircle className="w-12 h-12 text-destructive mb-3" />
                  <h3 className="text-xl font-bold text-foreground mb-1">Failed to load packages</h3>
                  <button onClick={fetchData} className="mt-4 flex items-center gap-2 bg-background text-foreground border border-input px-5 py-2.5 rounded-xl font-semibold shadow-sm">
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </button>
                </div>
              ) : filteredPackages.length === 0 ? (
                <div className="py-16 flex flex-col items-center text-center bg-muted/20 rounded-2xl border border-dashed border-border">
                  <PackageIcon className="w-12 h-12 text-muted-foreground/40 mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-1">No packages found</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPackages.map((pkg, index) => {
                    const discount = pkg.discount || { type: 'fixed', value: 0 };
                    const discountDisplay = discount.type === 'percentage' ? `${discount.value}%` : formatINR(discount.value || 0);
                    
                    let itemsCount = 0;
                    try {
                      const groups = typeof pkg.groups === 'string' ? JSON.parse(pkg.groups) : (pkg.groups || []);
                      itemsCount = groups.reduce((acc, g) => acc + (g.items?.length || 0), 0);
                    } catch(e) {}

                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        key={pkg.id} 
                        className="bg-background border border-border rounded-2xl flex flex-col shadow-sm hover:shadow-md transition-all h-full"
                      >
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
                              <PackageIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-2">{pkg.packageName}</h3>
                              <span className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                {itemsCount} {itemsCount === 1 ? 'Item' : 'Items'} Included
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-auto space-y-2.5 bg-muted/20 p-3 rounded-xl border border-border">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground font-medium">Base Amount</span>
                              <span className="font-bold text-foreground">{formatINR(pkg.baseAmount || 0)}</span>
                            </div>
                            {discount.value > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Discount</span>
                                <span className="font-bold text-destructive">-{discountDisplay}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-1 p-3 border-t border-border bg-muted/10 rounded-b-2xl">
                          <button 
                            onClick={() => handleOpenViewPackage(pkg)}
                            className="flex flex-col items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-[10px] font-semibold">View</span>
                          </button>
                          <button 
                            onClick={() => handleDuplicatePackage(pkg)}
                            className="flex flex-col items-center justify-center p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors gap-1"
                          >
                            <Copy className="w-4 h-4" />
                            <span className="text-[10px] font-semibold">Copy</span>
                          </button>
                          <button 
                            onClick={() => handleOpenEditPackage(pkg)}
                            className="flex flex-col items-center justify-center p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="text-[10px] font-semibold">Edit</span>
                          </button>
                          <button 
                            onClick={() => { setPackageToDelete(pkg); setDeleteDialogOpen(true); }}
                            className="flex flex-col items-center justify-center p-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-[10px] font-semibold">Delete</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="terms" className="mt-0 outline-none">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-border">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search terms..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background text-foreground border border-input rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm shadow-sm transition-all"
                  />
                </div>
                <button 
                  onClick={handleOpenCreateTerm}
                  className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all w-full sm:w-auto justify-center shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" /> Add Term
                </button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-background border border-border rounded-2xl p-5"><Skeleton className="h-6 w-1/3 mb-2" /><Skeleton className="h-4 w-full" /></div>
                  ))}
                </div>
              ) : filteredTerms.length === 0 ? (
                <div className="py-16 flex flex-col items-center text-center bg-muted/20 rounded-2xl border border-dashed border-border">
                  <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-1">No terms found</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredTerms.map((term, index) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      key={term.id} 
                      className="bg-background border border-border rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md transition-all h-full"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2.5 bg-secondary/20 text-secondary-foreground rounded-xl shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-foreground text-lg leading-tight mt-1">{term.term_name}</h3>
                      </div>
                      
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4 flex-1 mb-4">
                        {term.term_description}
                      </p>
                      
                      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-auto">
                        <button 
                          onClick={() => handleOpenEditTerm(term)}
                          className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button 
                          onClick={() => { setTermToDelete(term); setTermDeleteDialogOpen(true); }}
                          className="px-4 py-2 text-sm font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

          </div>
        </Tabs>
      </main>

      <PackageCreationModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        onSuccess={fetchData} 
        initialData={selectedPackage} 
        collectionName="universal_packages"
      />

      <BottomSheetForm
        open={termSheetOpen}
        onOpenChange={setTermSheetOpen}
        title={selectedTerm ? 'Edit Universal Terms' : 'Add Universal Terms'}
        onSave={handleSaveTerm}
        isSaving={isSavingTerm}
      >
        <div className="flex flex-col gap-4">
          <AppTextField
            label="Template Name"
            placeholder="e.g. Standard Wedding Terms"
            value={termFormData.term_name}
            onChange={(e) => setTermFormData({ ...termFormData, term_name: e.target.value })}
            error={termErrors.term_name}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Terms & Conditions</label>
            <textarea
              className={`w-full bg-background border ${termErrors.term_description ? 'border-destructive focus:ring-destructive' : 'border-input focus:border-primary'} rounded-xl p-3 text-sm text-foreground outline-none focus:ring-1 min-h-[150px] resize-y`}
              placeholder="Enter your terms and conditions here..."
              value={termFormData.term_description}
              onChange={(e) => setTermFormData({ ...termFormData, term_description: e.target.value })}
            />
            {termErrors.term_description && <p className="text-xs font-medium text-destructive">{termErrors.term_description}</p>}
          </div>
        </div>
      </BottomSheetForm>

      {renderViewModal()}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Package"
        description={`Are you sure you want to delete "${packageToDelete?.packageName}"? This action cannot be undone.`}
        onConfirm={handleDeletePackage}
        confirmText="Delete Package"
        isDestructive={true}
      />

      <ConfirmDialog
        open={termDeleteDialogOpen}
        onOpenChange={setTermDeleteDialogOpen}
        title="Delete Terms Template"
        description={`Are you sure you want to delete "${termToDelete?.term_name}"? This action cannot be undone.`}
        onConfirm={handleDeleteTerm}
        confirmText="Delete Terms"
        isDestructive={true}
      />
    </div>
  );
};

export default AdminUniversalPackagesPage;