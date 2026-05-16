import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { Search, Plus, Edit2, Trash2, ArrowLeft, Copy, Box, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatINR } from '@/lib/currencyUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import ConfirmDialog from '@/components/m3/ConfirmDialog';
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from 'framer-motion';

const AdminItemsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    price: '',
    item_group: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const records = await pb.collection('universal_items').getList(1, 100, {
        sort: '-created',
        $autoCancel: false
      });
      setItems(records.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      setFetchError(true);
      if (error?.status === 403) {
        toast.error('Permission denied: You must be an admin to view universal items.');
      } else {
        toast.error('Failed to load universal items. Please check network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setFormData({
      itemName: '',
      description: '',
      price: '',
      item_group: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      itemName: item.itemName || '',
      description: item.description || '',
      price: item.price || '',
      item_group: item.item_group || ''
    });
    setModalOpen(true);
  };

  const handleDuplicateItem = async (item) => {
    try {
      const { id, created, updated, collectionId, collectionName, ...rest } = item;
      await pb.collection('universal_items').create({
        ...rest,
        itemName: `${rest.itemName} (Copy)`
      }, { $autoCancel: false });
      toast.success('Item copied successfully');
      fetchItems();
    } catch (error) {
      console.error('Error copying item:', error);
      toast.error('Failed to copy item');
    }
  };

  const handleSave = async () => {
    if (!formData.itemName || formData.price === '') {
      toast.error('Item Name and Price are required');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        ...formData,
        price: Number(formData.price)
      };

      if (selectedItem) {
        await pb.collection('universal_items').update(selectedItem.id, data, { $autoCancel: false });
        toast.success('Item updated successfully');
      } else {
        await pb.collection('universal_items').create(data, { $autoCancel: false });
        toast.success('Item created successfully');
      }
      
      setModalOpen(false);
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      await pb.collection('universal_items').delete(itemToDelete.id, { $autoCancel: false });
      toast.success('Item deleted successfully');
      setDeleteDialogOpen(false);
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const filteredItems = items.filter(i => 
    (i.itemName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.item_group || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[100dvh] bg-background pb-24 md:pb-12">
      <Helmet>
        <title>Universal Items - Admin</title>
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
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Universal Items</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage core pricing items available as global templates</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search items by name or group..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background text-foreground border border-input rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm shadow-sm transition-all"
              />
            </div>
            <button 
              onClick={handleOpenCreate}
              className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all w-full sm:w-auto justify-center shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex justify-end gap-2 pt-4 mt-auto border-t border-border">
                    <Skeleton className="h-8 w-16 rounded-lg" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : fetchError ? (
            <div className="py-16 flex flex-col items-center justify-center text-center bg-destructive/5 rounded-2xl border border-destructive/20 mx-auto max-w-lg">
              <AlertCircle className="w-12 h-12 text-destructive mb-3" />
              <h3 className="text-xl font-bold text-foreground mb-1">Failed to load items</h3>
              <p className="text-sm text-muted-foreground mb-6">Ensure you have super admin permissions and check your network connection.</p>
              <button 
                onClick={fetchItems}
                className="flex items-center gap-2 bg-background text-foreground border border-input px-5 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center bg-muted/20 rounded-2xl border border-dashed border-border mx-auto">
              <Box className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-1">No items found</h3>
              <p className="text-sm text-muted-foreground">Create a new item to populate the template list.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  key={item.id} 
                  className="bg-background border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                        <Box className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 pr-2">
                        <h3 className="font-bold text-foreground text-base line-clamp-1" title={item.itemName}>{item.itemName}</h3>
                        {item.item_group && (
                          <span className="inline-block text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-md mt-1 tracking-wide uppercase">
                            {item.item_group}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-extrabold text-primary text-base shrink-0">{formatINR(item.price)}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-5 flex-1">
                    {item.description || 'No description provided.'}
                  </p>
                  
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-auto">
                    <button 
                      onClick={() => handleDuplicateItem(item)}
                      className="flex-1 sm:flex-none justify-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted border border-border sm:border-transparent sm:hover:border-border rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      title="Make a Copy"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(item)}
                      className="flex-1 sm:flex-none justify-center px-3 py-2 text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100 border border-blue-100 sm:border-transparent sm:hover:border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}
                      className="flex-1 sm:flex-none justify-center px-3 py-2 text-destructive hover:text-destructive hover:bg-destructive/10 border border-destructive/20 sm:border-transparent sm:hover:border-destructive/20 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-muted/20">
            <DialogTitle className="text-xl font-extrabold text-foreground">
              {selectedItem ? 'Edit Universal Item' : 'Create Universal Item'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="itemName" className="text-sm font-semibold text-foreground">Item Name *</Label>
              <input
                id="itemName"
                type="text"
                value={formData.itemName}
                onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                className="w-full border border-input rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-background"
                placeholder="e.g. Pre-wedding Shoot"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-semibold text-foreground">Price (INR) *</Label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full border border-input rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-background"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_group" className="text-sm font-semibold text-foreground">Group (Optional)</Label>
                <input
                  id="item_group"
                  type="text"
                  value={formData.item_group}
                  onChange={(e) => setFormData({...formData, item_group: e.target.value})}
                  className="w-full border border-input rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-background"
                  placeholder="e.g. Photography"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-foreground">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border border-input rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-background min-h-[100px] resize-y"
                placeholder="Brief description of the item"
              />
            </div>
          </div>
          
          <div className="p-6 pt-4 border-t border-border shrink-0 bg-muted/20 flex justify-end gap-3">
            <button 
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted bg-background border border-input rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSaving ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Item"
        description={`Are you sure you want to delete ${itemToDelete?.itemName}? This action cannot be undone.`}
        onConfirm={handleDeleteItem}
        confirmText="Delete Item"
        isDestructive={true}
      />
    </div>
  );
};

export default AdminItemsPage;