import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { formatINR } from '@/lib/currencyUtils';
import AppButton from '@/components/m3/AppButton';
import ConfirmDialog from '@/components/m3/ConfirmDialog';
import AddEditItemModal from '@/components/m3/AddEditItemModal';
import { Edit2, Trash2, Plus, Search, Package, Copy } from 'lucide-react';
import { toast } from 'sonner';

const ItemsManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const itemsPromise = pb.collection('items').getFullList({
        sort: 'itemName',
        $autoCancel: false
      }).catch(() => []);

      const uniItemsPromise = pb.collection('universal_items').getFullList({
        sort: 'itemName',
        $autoCancel: false
      }).catch(() => []);

      const [itemsRes, uniItemsRes] = await Promise.all([itemsPromise, uniItemsPromise]);

      const combined = [
        ...itemsRes.map(i => ({ ...i, isUniversal: false })),
        ...uniItemsRes.map(i => ({ ...i, isUniversal: true }))
      ].sort((a, b) => a.itemName.localeCompare(b.itemName));

      setItems(combined);
    } catch (error) {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection('items').delete(selectedItem.id, { $autoCancel: false });
      toast.success('Item deleted');
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
        user_id: pb.authStore.model?.id
      }, { $autoCancel: false });
      toast.success('Item copied successfully');
      fetchItems();
    } catch (error) {
      toast.error('Failed to copy item');
    }
  };

  const openAddModal = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const filteredItems = items.filter(i => 
    i.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input 
            type="text" 
            placeholder="Search all items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#e0e0e0] text-black rounded-[12px] py-2 pl-9 pr-4 outline-none focus:border-[#ff3131] text-[14px]"
          />
        </div>
        <AppButton 
          variant="filled" 
          className="w-full sm:w-auto rounded-[20px] bg-[#ff3131] hover:bg-[#ff1a1a] text-white"
          onClick={openAddModal}
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Item
        </AppButton>
      </div>

      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="py-8 text-center text-[#666666] text-[13px]">Loading items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-8 text-center text-[#666666] bg-white border border-[#e0e0e0] rounded-[12px] text-[13px]">
            No items found.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-white border border-[#e0e0e0] rounded-[10px] p-2.5 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-black border border-gray-200">
                  <Package className="w-4 h-4 text-[#666666]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[13px] font-bold text-black truncate">{item.itemName}</h4>
                    {item.isUniversal && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-[#666666] truncate mt-0.5">{item.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[13px] font-bold text-[#ff3131]">{formatINR(item.price)}</span>
                <div className="flex items-center gap-0.5">
                  {item.isUniversal ? (
                    <button 
                      onClick={() => handleDuplicateItem(item)}
                      className="p-1.5 text-black hover:bg-[#f5f5f5] rounded-full transition-colors"
                      title="Make a Copy"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-black hover:bg-[#f5f5f5] rounded-full transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => { setSelectedItem(item); setDeleteDialogOpen(true); }}
                        className="p-1.5 text-black hover:bg-[#f5f5f5] rounded-full transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AddEditItemModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        item={selectedItem} 
        onSaveSuccess={fetchItems} 
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Item"
        description={`Are you sure you want to delete ${selectedItem?.itemName}?`}
        onConfirm={handleDelete}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};

export default ItemsManagement;