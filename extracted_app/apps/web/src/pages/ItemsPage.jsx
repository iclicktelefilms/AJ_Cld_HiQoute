import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { formatINR } from '@/lib/currencyUtils';
import AppScaffold from '@/components/m3/AppScaffold';
import AppTextField from '@/components/m3/AppTextField';
import BottomSheetForm from '@/components/m3/BottomSheetForm';
import ConfirmDialog from '@/components/m3/ConfirmDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Package, Search, Eye, Edit2, Trash2, MoreVertical, Copy } from 'lucide-react';
import { toast } from 'sonner';
import AppButton from '@/components/m3/AppButton';

const ItemsPage = () => {
  const { currentUser } = useAuth();
  const [userItems, setUserItems] = useState([]);
  const [universalItems, setUniversalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ itemName: '', description: '', price: '' });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchItems();
    }
  }, [currentUser]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [itemsRes, uniItemsRes] = await Promise.all([
        pb.collection('items').getFullList({
          filter: `user_id="${currentUser.id}"`,
          sort: 'itemName',
          $autoCancel: false
        }).catch(err => {
          console.error("Error fetching user items:", err);
          return [];
        }),
        pb.collection('universal_items').getFullList({
          sort: 'itemName',
          $autoCancel: false
        }).catch(err => {
          console.error("Error fetching universal items:", err);
          return [];
        })
      ]);

      setUserItems(itemsRes);
      setUniversalItems(uniItemsRes);
    } catch (error) {
      console.error("Unexpected error in fetchItems:", error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.itemName.trim()) newErrors.itemName = 'Item name is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (formData.price && parseFloat(formData.price) < 0) newErrors.price = 'Price must be positive';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);

    try {
      const data = { ...formData, price: parseFloat(formData.price) };
      if (selectedItem && !selectedItem.isUniversal) {
        await pb.collection('items').update(selectedItem.id, data, { $autoCancel: false });
        toast.success('Item updated successfully', { duration: 2000 });
      } else {
        await pb.collection('items').create({ ...data, user_id: currentUser.id }, { $autoCancel: false });
        toast.success('Item added successfully', { duration: 2000 });
      }
      setSheetOpen(false);
      fetchItems();
    } catch (error) {
      toast.error('Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection('items').delete(selectedItem.id, { $autoCancel: false });
      toast.success('Item deleted', { duration: 2000 });
      setDeleteDialogOpen(false);
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleDuplicateItem = async (item) => {
    try {
      const { id, created, updated, collectionId, collectionName, isUniversal, ...rest } = item;
      await pb.collection('items').create({
        ...rest,
        itemName: `${rest.itemName} (Copy)`,
        user_id: currentUser.id
      }, { $autoCancel: false });
      toast.success('Item copied successfully');
      fetchItems();
    } catch (error) {
      toast.error('Failed to copy item');
    }
  };

  const openEditSheet = (item) => {
    setSelectedItem(item);
    setFormData({ itemName: item.itemName, description: item.description || '', price: item.price.toString() });
    setErrors({});
    setSheetOpen(true);
  };

  const openAddSheet = () => {
    setSelectedItem(null);
    setFormData({ itemName: '', description: '', price: '' });
    setErrors({});
    setSheetOpen(true);
  };

  const openViewModal = (item) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  const filteredUserItems = userItems.filter(i => 
    i.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUniversalItems = universalItems.filter(i => 
    i.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Items - Pixora Studio</title>
      </Helmet>

      <AppScaffold title="Items">
        <Tabs defaultValue="created" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList className="grid w-full sm:w-[400px] grid-cols-2 h-11 p-1 bg-gray-100/80 rounded-xl">
              <TabsTrigger value="created" className="rounded-lg text-[13px] font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Created</TabsTrigger>
              <TabsTrigger value="default" className="rounded-lg text-[13px] font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Default</TabsTrigger>
            </TabsList>
            <button 
              onClick={openAddSheet} 
              className="hidden sm:flex items-center justify-center gap-2 px-4 h-11 bg-primary text-primary-foreground rounded-xl shadow-sm hover:bg-primary/90 transition-colors font-semibold text-[13px] shrink-0"
            >
              <Plus className="w-4 h-4" /> New Item
            </button>
          </div>

          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-black border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-[#ff3131] focus:ring-1 focus:ring-[#ff3131] text-[13px] shadow-sm transition-all"
            />
          </div>

          <TabsContent value="created" className="mt-0 outline-none">
            <div className="flex flex-col gap-2 mb-24 md:mb-12">
              {loading ? (
                <div className="py-12 text-center text-[#666666] text-[13px]">Loading items...</div>
              ) : filteredUserItems.length === 0 ? (
                <div className="py-12 text-center text-[#666666] bg-white border border-gray-200 rounded-xl shadow-sm text-[13px]">
                  No items found.
                </div>
              ) : (
                filteredUserItems.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-[12px] p-2.5 flex flex-col w-full shadow-sm hover:shadow-md transition-shadow relative">
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors outline-none">
                            <MoreVertical className="w-3.5 h-3.5 text-[#666666]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white border border-gray-200 rounded-[12px] p-1 shadow-lg z-[100]">
                          <DropdownMenuItem onClick={() => openViewModal(item)} className="text-[12px] text-black px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 rounded-[8px]">
                            <Eye className="w-3.5 h-3.5" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditSheet(item)} className="text-[12px] text-black px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 rounded-[8px]">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => { setSelectedItem(item); setDeleteDialogOpen(true); }}
                            className="text-[12px] text-[#ff3131] px-3 py-2 hover:bg-red-50 cursor-pointer flex items-center gap-2 rounded-[8px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-start gap-2.5 pr-8 cursor-pointer" onClick={() => openViewModal(item)}>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-black border border-gray-200">
                        <Package className="w-4 h-4 text-[#666666]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold text-black leading-tight mb-0.5 truncate">{item.itemName}</h3>
                        <p className="text-[12px] text-[#666666] truncate">{item.description || 'No description'}</p>
                      </div>
                    </div>

                    <div className="flex justify-end items-end mt-2 pt-2 border-t border-gray-100 cursor-pointer" onClick={() => openViewModal(item)}>
                      <span className="text-[13px] font-bold text-[#ff3131]">{formatINR(item.price)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="sm:hidden">
              <button 
                onClick={openAddSheet}
                className="fixed bottom-20 right-6 md:bottom-8 md:right-8 bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center z-50"
                aria-label="Add Item"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </TabsContent>

          <TabsContent value="default" className="mt-0 outline-none">
            <div className="flex flex-col gap-2 mb-24 md:mb-12">
              {loading ? (
                <div className="py-12 text-center text-[#666666] text-[13px]">Loading items...</div>
              ) : filteredUniversalItems.length === 0 ? (
                <div className="py-12 text-center text-[#666666] bg-white border border-gray-200 rounded-xl shadow-sm text-[13px]">
                  No default items found.
                </div>
              ) : (
                filteredUniversalItems.map((item) => {
                  // Attach a pseudo flag for UI rendering
                  const displayItem = { ...item, isUniversal: true };
                  return (
                  <div key={displayItem.id} className="bg-white border border-gray-200 rounded-[12px] p-2.5 flex flex-col w-full shadow-sm hover:shadow-md transition-shadow relative">
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors outline-none">
                            <MoreVertical className="w-3.5 h-3.5 text-[#666666]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white border border-gray-200 rounded-[12px] p-1 shadow-lg z-[100]">
                          <DropdownMenuItem onClick={() => openViewModal(displayItem)} className="text-[12px] text-black px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 rounded-[8px]">
                            <Eye className="w-3.5 h-3.5" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateItem(displayItem)} className="text-[12px] text-black px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 rounded-[8px]">
                            <Copy className="w-3.5 h-3.5" /> Make a Copy
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-start gap-2.5 pr-8 cursor-pointer" onClick={() => openViewModal(displayItem)}>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-black border border-gray-200">
                        <Package className="w-4 h-4 text-[#666666]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[13px] font-bold text-black leading-tight mb-0.5 truncate">{displayItem.itemName}</h3>
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">
                            Default
                          </span>
                        </div>
                        <p className="text-[12px] text-[#666666] truncate">{displayItem.description || 'No description'}</p>
                      </div>
                    </div>

                    <div className="flex justify-end items-end mt-2 pt-2 border-t border-gray-100 cursor-pointer" onClick={() => openViewModal(displayItem)}>
                      <span className="text-[13px] font-bold text-[#ff3131]">{formatINR(displayItem.price)}</span>
                    </div>
                  </div>
                )})
              )}
            </div>
          </TabsContent>
        </Tabs>
      </AppScaffold>

      <BottomSheetForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={selectedItem ? 'Edit Item' : 'Add Item'}
        onSave={handleSave}
        isSaving={isSaving}
      >
        <div className="flex flex-col gap-4">
          <AppTextField
            label="Item Name"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
            error={errors.itemName}
          />
          <AppTextField
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <AppTextField
            label="Price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            error={errors.price}
          />
        </div>
      </BottomSheetForm>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-xl p-6 bg-white border-gray-200">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-[16px] font-bold text-black flex items-center gap-2">
              Item Details
              {selectedItem?.isUniversal && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">
                  Default
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <h4 className="text-[12px] font-medium text-[#666666] uppercase tracking-wider mb-1">Item Name</h4>
                <p className="text-[13px] font-bold text-black">{selectedItem.itemName}</p>
              </div>
              <div>
                <h4 className="text-[12px] font-medium text-[#666666] uppercase tracking-wider mb-1">Description</h4>
                <p className="text-[12px] text-black">{selectedItem.description || 'No description provided.'}</p>
              </div>
              {selectedItem.item_group && (
                <div>
                  <h4 className="text-[12px] font-medium text-[#666666] uppercase tracking-wider mb-1">Item Group</h4>
                  <p className="text-[12px] text-black">{selectedItem.item_group}</p>
                </div>
              )}
              <div>
                <h4 className="text-[12px] font-medium text-[#666666] uppercase tracking-wider mb-1">Price</h4>
                <p className="text-[16px] font-bold text-[#ff3131]">{formatINR(selectedItem.price)}</p>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex gap-3">
            <AppButton variant="tonal" className="flex-1" onClick={() => setViewModalOpen(false)}>
              Close
            </AppButton>
            {selectedItem?.isUniversal && (
              <AppButton variant="filled" className="flex-1 shadow-sm" onClick={() => { handleDuplicateItem(selectedItem); setViewModalOpen(false); }}>
                Make a Copy
              </AppButton>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Item"
        description={`Are you sure you want to delete ${selectedItem?.itemName}? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        isDestructive={true}
      />
    </>
  );
};

export default ItemsPage;