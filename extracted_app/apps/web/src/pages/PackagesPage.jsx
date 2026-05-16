import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { formatINR } from '@/lib/currencyUtils';
import AppScaffold from '@/components/m3/AppScaffold';
import ConfirmDialog from '@/components/m3/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Layers, Search, Trash2, Eye, Edit2, PackagePlus, FileText, MoreVertical, Copy, Plus } from 'lucide-react';
import { toast } from 'sonner';
import PackageCreationModal from '@/components/packages/PackageCreationModal';

const PackagesPage = () => {
  const { currentUser } = useAuth();
  const [packages, setPackages] = useState([]);
  const [universalPackages, setUniversalPackages] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [allUniversalItems, setAllUniversalItems] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pkgRes, itemsRes, quotesRes, uniPkgRes, uniItemsRes] = await Promise.all([
        pb.collection('packages').getFullList({
          sort: 'packageName',
          filter: `user_id = "${currentUser.id}"`,
          $autoCancel: false
        }),
        pb.collection('items').getFullList({
          sort: 'itemName',
          $autoCancel: false
        }),
        pb.collection('quotations').getFullList({
          fields: 'id,selectedPackage',
          $autoCancel: false
        }),
        pb.collection('universal_packages').getFullList({
          sort: 'packageName',
          $autoCancel: false
        }),
        pb.collection('universal_items').getFullList({
          sort: 'itemName',
          $autoCancel: false
        })
      ]);
      setPackages(pkgRes);
      setAllItems(itemsRes);
      setQuotations(quotesRes);
      setUniversalPackages(uniPkgRes);
      setAllUniversalItems(uniItemsRes);
    } catch (error) {
      toast.error('Failed to load packages data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection('packages').delete(selectedPackage.id, { $autoCancel: false });
      toast.success('Package deleted', { duration: 2000 });
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete package');
    }
  };

  const handleDuplicatePackage = async (pkg) => {
    try {
      const isUniversal = pkg.collectionName === 'universal_packages' || !pkg.user_id;
      
      let newPackageData = {
        packageName: `${pkg.packageName} (Copy)`,
        user_id: currentUser?.id,
        groups: pkg.groups || '[]',
        description: pkg.description || '',
        baseAmount: pkg.baseAmount || 0,
        discount: pkg.discount || { type: 'fixed', value: '' },
        adjustmentHeading: pkg.adjustmentHeading || 'Adjustment',
        adjustment: pkg.adjustment || 0,
        finalAmount: pkg.finalAmount || 0,
        itemsTotal: pkg.itemsTotal || 0
      };

      if (isUniversal) {
        // If copying from universal, we need to calculate baseAmount and itemsTotal
        let parsedGroups = [];
        try {
          parsedGroups = JSON.parse(pkg.groups || '[]');
        } catch (e) {}

        let itemsTotal = 0;
        parsedGroups.forEach(group => {
          (group.items || []).forEach(itemObj => {
            const itemId = typeof itemObj === 'string' ? itemObj : itemObj.id;
            const qty = typeof itemObj === 'string' ? 1 : (itemObj.quantity || 1);
            const item = allUniversalItems.find(i => i.id === itemId);
            if (item) {
              itemsTotal += (item.price * qty);
            }
          });
        });

        newPackageData.baseAmount = itemsTotal;
        newPackageData.itemsTotal = itemsTotal;
        newPackageData.finalAmount = itemsTotal;
      }

      await pb.collection('packages').create(newPackageData, { $autoCancel: false });
      toast.success('Package copied successfully');
      fetchData();
    } catch (error) {
      console.error("Copy error:", error);
      toast.error('Failed to copy package');
    }
  };

  const openCreateModal = () => {
    setEditData(null);
    setCreateModalOpen(true);
  };

  const openEditModal = (pkg) => {
    setEditData(pkg);
    setCreateModalOpen(true);
  };

  const openViewModal = (pkg) => {
    setSelectedPackage(pkg);
    setViewModalOpen(true);
  };

  const getGroupCount = (pkg) => {
    if (pkg.groups) {
      try {
        return JSON.parse(pkg.groups).length;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  };

  const getUsageCount = (pkgId) => {
    return quotations.filter(q => q.selectedPackage === pkgId).length;
  };

  const filteredPackages = packages.filter(p => 
    p.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUniversalPackages = universalPackages.filter(p => 
    p.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Packages - Pixora Studio</title>
      </Helmet>

      <AppScaffold title="Packages">
        <Tabs defaultValue="created" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList className="grid w-full sm:w-[400px] grid-cols-2 h-11 p-1 bg-gray-100/80 rounded-xl">
              <TabsTrigger value="created" className="rounded-lg text-[13px] font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Created</TabsTrigger>
              <TabsTrigger value="default" className="rounded-lg text-[13px] font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Default</TabsTrigger>
            </TabsList>
            <button 
              onClick={openCreateModal}
              className="hidden sm:flex items-center justify-center gap-2 px-4 h-11 bg-primary text-primary-foreground rounded-xl shadow-sm hover:bg-primary/90 transition-colors font-semibold text-[13px] shrink-0"
              aria-label="Create New Package"
            >
              <Plus className="w-4 h-4" /> New Package
            </button>
          </div>

          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search packages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-foreground rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-primary transition-all border border-gray-200 text-[13px]"
            />
          </div>

          <TabsContent value="created" className="mt-0 outline-none">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-12">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Package Name</th>
                    <th className="p-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Base Amount</th>
                    <th className="p-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Groups</th>
                    <th className="p-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Usage</th>
                    <th className="p-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-muted-foreground text-[13px]">Loading packages...</td>
                    </tr>
                  ) : filteredPackages.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-muted-foreground text-[13px]">No packages found.</td>
                    </tr>
                  ) : (
                    filteredPackages.map((pkg) => {
                      const usageCount = getUsageCount(pkg.id);
                      return (
                        <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                <Layers className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-foreground text-[13px]">{pkg.packageName}</span>
                            </div>
                          </td>
                          <td className="p-4 font-medium text-foreground text-[13px]">
                            {formatINR(pkg.baseAmount || 0)}
                          </td>
                          <td className="p-4 text-[12px] text-muted-foreground">
                            {getGroupCount(pkg)} groups
                          </td>
                          <td className="p-4">
                            {usageCount > 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium bg-blue-50 text-blue-600">
                                <FileText className="w-3 h-3" /> {usageCount} quotes
                              </span>
                            ) : (
                              <span className="text-[12px] text-muted-foreground italic">Not used</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-lg transition-colors">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => openViewModal(pkg)} className="cursor-pointer text-[12px]">
                                  <Eye className="w-4 h-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditModal(pkg)} className="cursor-pointer text-[12px]">
                                  <Edit2 className="w-4 h-4 mr-2" /> Edit Package
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicatePackage(pkg)} className="cursor-pointer text-[12px]">
                                  <Copy className="w-4 h-4 mr-2" /> Make a Copy
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => { setSelectedPackage(pkg); setDeleteDialogOpen(true); }}
                                  className="cursor-pointer text-destructive focus:text-destructive text-[12px]"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete Package
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4 mb-24">
              {loading ? (
                <div className="py-12 text-center text-muted-foreground text-[13px]">Loading packages...</div>
              ) : filteredPackages.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground bg-white rounded-2xl text-[13px] border border-gray-200">
                  No packages found.
                </div>
              ) : (
                filteredPackages.map((pkg) => {
                  const usageCount = getUsageCount(pkg.id);
                  return (
                    <div key={pkg.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative">
                      <div className="absolute top-3 right-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => openViewModal(pkg)} className="cursor-pointer text-[12px]">
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(pkg)} className="cursor-pointer text-[12px]">
                              <Edit2 className="w-4 h-4 mr-2" /> Edit Package
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicatePackage(pkg)} className="cursor-pointer text-[12px]">
                              <Copy className="w-4 h-4 mr-2" /> Make a Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => { setSelectedPackage(pkg); setDeleteDialogOpen(true); }}
                              className="cursor-pointer text-destructive focus:text-destructive text-[12px]"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete Package
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-start gap-3 pr-8">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-foreground text-[13px] truncate">{pkg.packageName}</h3>
                          <p className="text-[12px] font-medium text-muted-foreground">{formatINR(pkg.baseAmount || 0)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-[12px] text-muted-foreground">{getGroupCount(pkg)} groups</span>
                        <div className="flex-shrink-0">
                          {usageCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600">
                              {usageCount} Used
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
                              0 Used
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="sm:hidden">
              <button 
                onClick={openCreateModal}
                className="fixed bottom-20 right-6 md:bottom-8 md:right-8 bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center z-50"
                aria-label="Add Package"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </TabsContent>

          <TabsContent value="default" className="mt-0 outline-none">
            {/* Desktop Table View for Universal Packages */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-12">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Package Name</th>
                    <th className="p-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Groups</th>
                    <th className="p-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-muted-foreground text-[13px]">Loading packages...</td>
                    </tr>
                  ) : filteredUniversalPackages.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-muted-foreground text-[13px]">No default packages found.</td>
                    </tr>
                  ) : (
                    filteredUniversalPackages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                              <Layers className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-foreground text-[13px]">{pkg.packageName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-[12px] text-muted-foreground">
                          {getGroupCount(pkg)} groups
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-lg transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openViewModal(pkg)} className="cursor-pointer text-[12px]">
                                <Eye className="w-4 h-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicatePackage(pkg)} className="cursor-pointer text-[12px]">
                                <Copy className="w-4 h-4 mr-2" /> Make a Copy
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View for Universal Packages */}
            <div className="md:hidden flex flex-col gap-4 mb-24">
              {loading ? (
                <div className="py-12 text-center text-muted-foreground text-[13px]">Loading packages...</div>
              ) : filteredUniversalPackages.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground bg-white rounded-2xl text-[13px] border border-gray-200">
                  No default packages found.
                </div>
              ) : (
                filteredUniversalPackages.map((pkg) => (
                  <div key={pkg.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative">
                    <div className="absolute top-3 right-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openViewModal(pkg)} className="cursor-pointer text-[12px]">
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicatePackage(pkg)} className="cursor-pointer text-[12px]">
                            <Copy className="w-4 h-4 mr-2" /> Make a Copy
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-start gap-3 pr-8">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground text-[13px] truncate">{pkg.packageName}</h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-[12px] text-muted-foreground">{getGroupCount(pkg)} groups</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </AppScaffold>

      {/* Multi-step Creation/Edit Modal */}
      <PackageCreationModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
        onSuccess={fetchData}
        initialData={editData}
      />

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-2xl p-5 bg-white border-gray-200 shadow-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-[16px] font-bold text-foreground">Package Details</DialogTitle>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="space-y-4">
              <div>
                <h4 className="text-[12px] text-muted-foreground">Package Name</h4>
                <p className="text-[13px] font-bold text-foreground">{selectedPackage.packageName}</p>
              </div>
              
              {selectedPackage.description && (
                <div>
                  <h4 className="text-[12px] text-muted-foreground">Description</h4>
                  <p className="text-[12px] text-foreground">{selectedPackage.description}</p>
                </div>
              )}

              {selectedPackage.baseAmount !== undefined && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div>
                    <h4 className="text-[12px] text-muted-foreground">Base Amount</h4>
                    <p className="text-[12px] font-bold text-foreground">{formatINR(selectedPackage.baseAmount || 0)}</p>
                  </div>
                  <div>
                    <h4 className="text-[12px] text-muted-foreground">Final Amount</h4>
                    <p className="text-[12px] font-bold text-primary">{formatINR(selectedPackage.finalAmount || 0)}</p>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-[12px] text-muted-foreground mb-2">Groups & Items</h4>
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                  {selectedPackage.groups && JSON.parse(selectedPackage.groups).map((group, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <h5 className="font-bold text-[12px] text-foreground mb-2">{group.title}</h5>
                      <ul className="space-y-2">
                        {group.items.map((itemObj, idx) => {
                          const itemId = typeof itemObj === 'string' ? itemObj : itemObj.id;
                          const qty = typeof itemObj === 'string' ? 1 : (itemObj.quantity || 1);
                          const isUniversal = !selectedPackage.user_id;
                          const itemsSource = isUniversal ? allUniversalItems : allItems;
                          const item = itemsSource.find(i => i.id === itemId);
                          return item ? (
                            <li key={idx} className="flex justify-between items-center text-[12px] bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                              <span className="text-foreground truncate pr-2">{item.itemName} <span className="text-muted-foreground text-[12px]">x{qty}</span></span>
                              <span className="font-medium text-primary flex-shrink-0">{formatINR(item.price * qty)}</span>
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <Button variant="outline" className="rounded-xl px-6 text-[13px] font-bold" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Package"
        description={`Are you sure you want to delete ${selectedPackage?.packageName}? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        isDestructive={true}
      />
    </>
  );
};

export default PackagesPage;