import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { Search, Plus, Edit2, Trash2, ArrowLeft, Package as PackageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/m3/ConfirmDialog';
import BottomSheetForm from '@/components/m3/BottomSheetForm';
import AppTextField from '@/components/m3/AppTextField';
import { formatINR } from '@/lib/currencyUtils';
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from 'framer-motion';

const AdminUniversalItemsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ itemName: '', description: '', price: '' });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const records = await pb.collection('universal_items').getFullList({
        sort: 'itemName',
        $autoCancel: false
      });
      setItems(records);
    } catch (error) {
      console.error('Error fetching universal items:', error);
      setFetchError(true);
      toast.error('Failed to load universal items. Ensure you have admin access.');
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
      if (selectedItem) {
        await pb.collection('universal_items').update(selectedItem.id, data, { $autoCancel: false });
        toast.success('Universal item updated successfully');
      } else {
        await pb.collection('universal_items').create(data, { $autoCancel: false });
        toast.success('Universal item added successfully');
      }
      setSheetOpen(false);
      fetchItems();
    } catch (error) {
      console.error('Error saving universal item:', error);
      toast.error('Failed to save universal item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setFormData({ itemName: '', description: '', price: '' });
    setErrors({});
    setSheetOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormData({ itemName: item.itemName, description: item.description || '', price: item.price.toString() });
    setErrors({});
    setSheetOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      await pb.collection('universal_items').delete(itemToDelete.id, { $autoCancel: false });
      toast.success('Universal item deleted successfully');
      setDeleteDialogOpen(false);
      fetchItems();
    } catch (error) {
      console.error('Error deleting universal item:', error);
      toast.error('Failed to delete universal item');
    }
  };

  const filteredItems = items.filter(i => 
    (i.itemName || '').toLowerCase().includes(searchQuery.toLowerCase())
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
            <p className="text-sm text-muted-foreground mt-1">Manage global item templates for all users</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search items by name..." 
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <div className="mt-4 pt-4 border-t border-border flex justify-end gap-2">
                    <Skeleton className="h-9 w-20 rounded-lg" />
                    <Skeleton className="h-9 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : fetchError ? (
            <div className="py-16 flex flex-col items-center justify-center text-center bg-destructive/5 rounded-2xl border border-destructive/20 max-w-lg mx-auto">
              <AlertCircle className="w-12 h-12 text-destructive mb-3" />
              <h3 className="text-xl font-bold text-foreground mb-1">Failed to load items</h3>
              <p className="text-sm text-muted-foreground mb-6">Ensure you have super admin access and your connection is stable.</p>
              <button 
                onClick={fetchItems}
                className="flex items-center gap-2 bg-background text-foreground border border-input px-5 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center bg-muted/20 rounded-2xl border border-dashed border-border">
              <PackageIcon className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-1">No items found</h3>
              <p className="text-sm text-muted-foreground">Create a new universal item to populate the template list.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  key={item.id} 
                  className="bg-background border border-border rounded-2xl flex flex-col shadow-sm hover:shadow-md transition-all h-full"
                >
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
                        <PackageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-2">{item.itemName}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description || 'No description'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                      <span className="text-lg font-extrabold text-primary">{formatINR(item.price)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 p-3 border-t border-border bg-muted/10 rounded-b-2xl">
                    <button 
                      onClick={() => handleOpenEdit(item)}
                      className="flex flex-col items-center justify-center p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors gap-1"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-[10px] font-semibold">Edit</span>
                    </button>
                    <button 
                      onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}
                      className="flex flex-col items-center justify-center p-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors gap-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[10px] font-semibold">Delete</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomSheetForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={selectedItem ? 'Edit Universal Item' : 'Add Universal Item'}
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Universal Item"
        description={`Are you sure you want to delete "${itemToDelete?.itemName}"? This action cannot be undone.`}
        onConfirm={handleDeleteItem}
        confirmText="Delete Item"
        isDestructive={true}
      />
    </div>
  );
};

export default AdminUniversalItemsPage;